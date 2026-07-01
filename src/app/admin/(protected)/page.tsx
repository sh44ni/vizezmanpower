import { db } from '@/lib/db'
import { AdminDashboardClient } from '@/components/admin/AdminDashboardClient'

async function getAnalytics() {
  const currentMonth = new Date().toISOString().slice(0, 7)
  const [totalUsers, activeUsers, usersWithPlans, submissionsAgg, recentSignups] = await Promise.all([
    db.user.count({ where: { role: 'USER' } }),
    db.user.count({ where: { role: 'USER', isActive: true } }),
    db.user.count({ where: { role: 'USER', planId: { not: null } } }),
    db.submissionUsage.aggregate({ where: { month: currentMonth }, _sum: { count: true } }),
    db.user.findMany({
      where: { role: 'USER' },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true, fullName: true, agencyName: true, email: true,
        isActive: true, emailVerified: true, createdAt: true,
        plan: { select: { name: true } }
      },
    }),
  ])
  return {
    totalUsers,
    activeUsers,
    usersWithPlans,
    submissionsThisMonth: submissionsAgg._sum.count ?? 0,
    recentSignups,
  }
}

export default async function AdminDashboardPage() {
  const data = await getAnalytics()
  return <AdminDashboardClient data={data} />
}
