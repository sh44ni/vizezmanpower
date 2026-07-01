import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/session'

export async function GET(req: NextRequest) {
  try {
    await requireAdmin()

    const { searchParams } = req.nextUrl
    const search = searchParams.get('search') ?? ''
    const planFilter = searchParams.get('plan') ?? ''
    const statusFilter = searchParams.get('status') ?? ''

    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM

    const users = await db.user.findMany({
      where: {
        AND: [
          search
            ? {
                OR: [
                  { fullName: { contains: search, mode: 'insensitive' } },
                  { email: { contains: search, mode: 'insensitive' } },
                  { agencyName: { contains: search, mode: 'insensitive' } },
                ],
              }
            : {},
          planFilter === 'none' ? { planId: null } : planFilter ? { planId: planFilter } : {},
          statusFilter === 'active' ? { isActive: true } : statusFilter === 'inactive' ? { isActive: false } : {},
        ],
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        agencyName: true,
        phone: true,
        role: true,
        isActive: true,
        emailVerified: true,
        planId: true,
        planAssignedAt: true,
        planExpiresAt: true,
        createdAt: true,
        plan: { select: { id: true, name: true } },
        submissionUsage: {
          where: { month: currentMonth },
          select: { count: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    type UserRow = (typeof users)[number]
    const formatted = users.map((u: UserRow) => ({
      ...u,
      submissionsThisMonth: u.submissionUsage[0]?.count ?? 0,
      submissionUsage: undefined,
    }))

    return NextResponse.json({ users: formatted })
  } catch (err: unknown) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Forbidden')) {
      return NextResponse.json({ error: err.message }, { status: 403 })
    }
    console.error('[admin/users]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
