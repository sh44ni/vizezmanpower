import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { signupSchema } from '@/lib/validations'
import { sendOtpEmail } from '@/lib/email'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3006'

function generateOtp(): string {
  const array = new Uint32Array(1)
  crypto.getRandomValues(array)
  return String(100000 + (array[0] % 900000)).padStart(6, '0')
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = signupSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { fullName, agencyName, email, phone, password } = result.data

    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
    }

    const passwordHash = await hashPassword(password)
    const otp = generateOtp()
    const expires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    await db.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        agencyName,
        phone,
        role: 'USER',
        isActive: false,
        emailVerified: false,
        verificationToken: otp,
        verificationExpires: expires,
      },
    })

    if (process.env.NODE_ENV !== 'production') console.log(`\n🔑 [signup] OTP for ${email}: ${otp}\n`)

    sendOtpEmail(email, otp, fullName)
      .then(() => console.log(`[email] ✅ OTP email sent to ${email}`))
      .catch(err => console.error('[email] ❌ OTP email failed:', err?.message ?? err))

    return NextResponse.json({ message: 'Account created. Check your email for the verification code.' }, { status: 201 })
  } catch (err) {
    console.error('[signup]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
