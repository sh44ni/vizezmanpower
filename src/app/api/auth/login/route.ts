import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { comparePassword, signToken, COOKIE_NAME } from '@/lib/auth'
import { loginSchema } from '@/lib/validations'
import { checkRateLimit, resetRateLimit } from '@/lib/ratelimit'

export async function POST(req: NextRequest) {
  try {
    // Rate limiting by IP
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? req.headers.get('x-real-ip') ?? 'unknown'
    const rl = checkRateLimit(`login:${ip}`)
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Too many login attempts. Try again in ${Math.ceil((rl.resetAt - Date.now()) / 60000)} minutes.` },
        { status: 429, headers: { 'X-RateLimit-Remaining': '0', 'X-RateLimit-Reset': String(rl.resetAt) } }
      )
    }

    const body = await req.json()
    const result = loginSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 400 })
    }

    const { email, password, rememberMe } = result.data

    const user = await db.user.findUnique({ where: { email } })

    // Generic error to prevent user enumeration
    if (!user || !(await comparePassword(password, user.passwordHash))) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    if (!user.emailVerified) {
      return NextResponse.json(
        { error: 'Email not verified', needsVerification: true, email: user.email },
        { status: 403 }
      )
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Your account is pending activation. You will be notified when it\'s ready.' },
        { status: 403 }
      )
    }

    // Successful login — reset rate limit
    resetRateLimit(`login:${ip}`)

    const token = await signToken(
      { sub: user.id, email: user.email, role: user.role, isActive: user.isActive },
      rememberMe
    )

    const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60

    const response = NextResponse.json({
      user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
    })

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge,
      path: '/',
    })

    return response
  } catch (err) {
    console.error('[login]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
