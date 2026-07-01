import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/session'
import { db } from '@/lib/db'

/**
 * GET /api/usage
 * Returns current month's submission count + limit for the logged-in user
 */
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.user.findUnique({
    where: { id: session.sub },
    include: { plan: { select: { maxSubmissionsPerMonth: true, name: true } } },
  })

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const currentMonth = new Date().toISOString().slice(0, 7)
  const usage = await db.submissionUsage.findUnique({
    where: { userId_month: { userId: user.id, month: currentMonth } },
  })

  const used = usage?.count ?? 0
  const limit = user.plan?.maxSubmissionsPerMonth ?? null
  const remaining = limit !== null ? Math.max(0, limit - used) : null
  const blocked = limit !== null && used >= limit

  return NextResponse.json({
    used,
    limit,
    remaining,
    blocked,
    planName: user.plan?.name ?? null,
    month: currentMonth,
  })
}

/**
 * POST /api/usage/increment
 * Called after a successful submission to increment the counter
 */
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.user.findUnique({
    where: { id: session.sub },
    include: { plan: { select: { maxSubmissionsPerMonth: true } } },
  })

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const currentMonth = new Date().toISOString().slice(0, 7)
  const limit = user.plan?.maxSubmissionsPerMonth ?? null

  // Check limit before incrementing
  if (limit !== null) {
    const current = await db.submissionUsage.findUnique({
      where: { userId_month: { userId: user.id, month: currentMonth } },
    })
    if ((current?.count ?? 0) >= limit) {
      return NextResponse.json(
        { error: 'Monthly submission limit reached', limit, used: current?.count ?? 0 },
        { status: 429 }
      )
    }
  }

  // Upsert usage record
  const updated = await db.submissionUsage.upsert({
    where: { userId_month: { userId: user.id, month: currentMonth } },
    create: { userId: user.id, month: currentMonth, count: 1 },
    update: { count: { increment: 1 } },
  })

  return NextResponse.json({ used: updated.count, limit })
}
