import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkRateLimit } from '@/lib/ratelimit'

const STANDARD_PLAN_ID = 'plan_standard'

export async function POST(req: NextRequest) {
  try {
    // Rate limit by IP — prevents distributed brute-force
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? req.headers.get('x-real-ip') ?? 'unknown'
    const ipRl = checkRateLimit(`verify-otp-ip:${ip}`)
    if (!ipRl.allowed) {
      return NextResponse.json(
        { error: `Too many attempts. Try again in ${Math.ceil((ipRl.resetAt - Date.now()) / 60000)} minutes.` },
        { status: 429 }
      )
    }

    const { email, otp } = await req.json()

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and code are required' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { email: email.toLowerCase().trim() } })

    if (!user) {
      return NextResponse.json({ error: 'No account found with this email' }, { status: 404 })
    }

    if (user.emailVerified) {
      return NextResponse.json({ error: 'Email already verified. You can log in.' }, { status: 400 })
    }

    if (!user.verificationToken || user.verificationToken !== otp.trim()) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 })
    }

    if (user.verificationExpires && new Date() > user.verificationExpires) {
      return NextResponse.json({ error: 'Code expired. Please request a new one.' }, { status: 400 })
    }

    // ── Activate account instantly, assign Standard plan ──
    await db.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        isActive: true,
        planId: STANDARD_PLAN_ID,
        verificationToken: null,
        verificationExpires: null,
      },
    })

    return NextResponse.json({ message: 'Email verified! Your account is now active.' })
  } catch (err) {
    console.error('[verify-otp]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
