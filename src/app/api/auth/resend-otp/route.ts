import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendOtpEmail } from '@/lib/email'
import { checkRateLimit } from '@/lib/ratelimit'

const RESEND_COOLDOWN_MS = 60 * 1000 // 1 minute between resends

function generateOtp(): string {
  const array = new Uint32Array(1)
  crypto.getRandomValues(array)
  return String(100000 + (array[0] % 900000)).padStart(6, '0')
}

export async function POST(req: NextRequest) {
  try {
    // Rate limit by IP to prevent resend abuse
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? req.headers.get('x-real-ip') ?? 'unknown'
    const rl = checkRateLimit(`resend-otp:${ip}`)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Too many requests. Try again in ${Math.ceil((rl.resetAt - Date.now()) / 60000)} minutes.` },
        { status: 429 }
      )
    }

    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 })

    const user = await db.user.findUnique({ where: { email: email.toLowerCase().trim() } })

    if (!user) return NextResponse.json({ error: 'No account found with this email' }, { status: 404 })
    if (user.emailVerified) return NextResponse.json({ error: 'Email already verified' }, { status: 400 })

    // Rate limit: don't allow resend if last OTP was sent less than 1 min ago
    if (user.verificationExpires) {
      const originalSentAt = new Date(user.verificationExpires.getTime() - 10 * 60 * 1000)
      if (Date.now() - originalSentAt.getTime() < RESEND_COOLDOWN_MS) {
        const secondsLeft = Math.ceil((RESEND_COOLDOWN_MS - (Date.now() - originalSentAt.getTime())) / 1000)
        return NextResponse.json({ error: `Please wait ${secondsLeft}s before requesting a new code` }, { status: 429 })
      }
    }

    const otp = generateOtp()
    const expires = new Date(Date.now() + 10 * 60 * 1000)

    await db.user.update({
      where: { id: user.id },
      data: { verificationToken: otp, verificationExpires: expires },
    })

    if (process.env.NODE_ENV !== 'production') console.log(`\n🔑 [resend-otp] New OTP for ${email}: ${otp}\n`)

    sendOtpEmail(email, otp, user.fullName)
      .then(() => console.log(`[email] ✅ Resent OTP to ${email}`))
      .catch(err => console.error('[email] ❌ Resend OTP failed:', err?.message ?? err))

    return NextResponse.json({ message: 'New verification code sent.' })
  } catch (err) {
    console.error('[resend-otp]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
