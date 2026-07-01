import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendActivationEmail } from '@/lib/email'

const STANDARD_PLAN_ID = 'plan_standard'

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token')
    if (!token) {
      return NextResponse.redirect(new URL('/login?error=invalid-token', req.url))
    }

    const user = await db.user.findUnique({ where: { verificationToken: token } })

    if (!user) {
      return NextResponse.redirect(new URL('/login?error=invalid-token', req.url))
    }

    if (user.emailVerified) {
      return NextResponse.redirect(new URL('/login?msg=already-verified', req.url))
    }

    // ── Auto-activate: verify email, activate account, assign Standard plan ──
    await db.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null,
        isActive: true,
        planId: STANDARD_PLAN_ID,
      },
    })

    // Send activation confirmation email (non-blocking)
    sendActivationEmail(user.email, user.agencyName).catch(err =>
      console.error('[verify-email] Activation email failed:', err)
    )

    return NextResponse.redirect(new URL('/login?msg=email-verified', req.url))
  } catch (err) {
    console.error('[verify-email]', err)
    return NextResponse.redirect(new URL('/login?error=server-error', req.url))
  }
}
