import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkRateLimit } from '@/lib/ratelimit'
import { signToken, COOKIE_NAME, TOKEN_EXPIRY } from '@/lib/auth'

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
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        isActive: true,
        planId: STANDARD_PLAN_ID,
        verificationToken: null,
        verificationExpires: null,
      },
    })

    // ── Create session cookie so the user lands on /dashboard directly ──
    const token = await signToken({
      sub: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role as 'USER' | 'ADMIN',
      isActive: true,
    })

    const res = NextResponse.json({
      message: 'Email verified! Your account is now active.',
      redirectTo: '/dashboard',
    })

    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days (matches TOKEN_EXPIRY)
    })

    return res
  } catch (err) {
    console.error('[verify-otp]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
