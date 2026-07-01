import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateToken } from '@/lib/auth'
import { forgotPasswordSchema } from '@/lib/validations'
import { sendPasswordResetEmail } from '@/lib/email'
import { checkRateLimit } from '@/lib/ratelimit'

export async function POST(req: NextRequest) {
  try {
    // Rate limit by IP to prevent email-flooding / quota exhaustion
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? req.headers.get('x-real-ip') ?? 'unknown'
    const rl = checkRateLimit(`forgot-pw:${ip}`)
    if (!rl.allowed) {
      // Return success-looking response to prevent enumeration
      return NextResponse.json({ message: 'If an account exists, a reset link has been sent.' })
    }

    const body = await req.json()
    const result = forgotPasswordSchema.safeParse(body)
    if (!result.success) {
      // Always return success to prevent user enumeration
      return NextResponse.json({ message: 'If an account exists, a reset link has been sent.' })
    }

    const { email } = result.data
    const user = await db.user.findUnique({ where: { email } })

    if (user) {
      const token = generateToken()
      const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

      await db.user.update({
        where: { id: user.id },
        data: { resetPasswordToken: token, resetPasswordExpires: expires },
      })

      sendPasswordResetEmail(email, token).catch(err =>
        console.error('[email] Failed to send reset email:', err)
      )
    }

    // Always same response — no user enumeration
    return NextResponse.json({ message: 'If an account exists, a reset link has been sent.' })
  } catch (err) {
    console.error('[forgot-password]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
