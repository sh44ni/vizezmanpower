import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/session'
import { assignPlanSchema } from '@/lib/validations'
import { sendActivationEmail } from '@/lib/email'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params
    const body = await req.json()

    const result = assignPlanSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: 'Validation failed', details: result.error.flatten() }, { status: 400 })
    }

    const { planId, planExpiresAt } = result.data

    const existingUser = await db.user.findUnique({ where: { id }, select: { isActive: true, email: true, agencyName: true } })
    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const wasInactive = !existingUser.isActive

    const user = await db.user.update({
      where: { id },
      data: {
        planId: planId ?? null,
        planAssignedAt: planId ? new Date() : null,
        planExpiresAt: planExpiresAt ? new Date(planExpiresAt) : null,
        // Auto-activate when plan is assigned
        ...(planId && wasInactive && { isActive: true }),
      },
      select: { id: true, planId: true, planAssignedAt: true, planExpiresAt: true, isActive: true },
    })

    // Send activation email if user was just activated
    if (planId && wasInactive) {
      sendActivationEmail(existingUser.email, existingUser.agencyName).catch(err =>
        console.error('[email] Failed to send activation email:', err)
      )
    }

    return NextResponse.json({ user })
  } catch (err: unknown) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Forbidden')) {
      return NextResponse.json({ error: err.message }, { status: 403 })
    }
    console.error('[admin/users/:id/plan]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
