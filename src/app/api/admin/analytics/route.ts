import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAdmin } from '@/lib/session'

export async function GET() {
  try {
    await requireAdmin()

    const currentMonth = new Date().toISOString().slice(0, 7)

    const [
      totalUsers,
      activeUsers,
      usersWithPlans,
      submissionsThisMonth,
      recentSignups,
    ] = await Promise.all([
      db.user.count({ where: { role: 'USER' } }),
      db.user.count({ where: { role: 'USER', isActive: true } }),
      db.user.count({ where: { role: 'USER', planId: { not: null } } }),
      db.submissionUsage.aggregate({
        where: { month: currentMonth },
        _sum: { count: true },
      }),
      db.user.findMany({
        where: { role: 'USER' },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          fullName: true,
          agencyName: true,
          email: true,
          isActive: true,
          emailVerified: true,
          createdAt: true,
          plan: { select: { name: true } },
        },
      }),
    ])

    return NextResponse.json({
      totalUsers,
      activeUsers,
      usersWithPlans,
      submissionsThisMonth: submissionsThisMonth._sum.count ?? 0,
      recentSignups,
    })
  } catch (err: unknown) {
    if (err instanceof Error && (err.message === 'Unauthorized' || err.message === 'Forbidden')) {
      return NextResponse.json({ error: err.message }, { status: 403 })
    }
    console.error('[admin/analytics]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
