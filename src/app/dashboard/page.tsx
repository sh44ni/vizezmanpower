import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'
import { ToastProvider } from '@/components/ui/ToastProvider'
import { DashboardClient } from '@/components/DashboardClient'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const user = await db.user.findUnique({
    where: { id: session.sub },
    include: { plan: true },
  })

  if (!user) redirect('/login')

  const currentMonth = new Date().toISOString().slice(0, 7)
  const usage = await db.submissionUsage.findUnique({
    where: { userId_month: { userId: user.id, month: currentMonth } },
  })

  const usedCount = usage?.count ?? 0
  const limit = user.plan?.maxSubmissionsPerMonth ?? null
  const pct = limit ? Math.min((usedCount / limit) * 100, 100) : 0
  const features = (user.plan?.features as string[]) ?? []

  const initials = user.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <>
      <ToastProvider />
      <DashboardClient
        user={{
          fullName: user.fullName,
          agencyName: user.agencyName,
          email: user.email,
          phone: user.phone,
          isActive: user.isActive,
          plan: user.plan
            ? {
                name: user.plan.name,
                description: user.plan.description,
                maxSubmissionsPerMonth: user.plan.maxSubmissionsPerMonth,
                features,
              }
            : null,
          planExpiresAt: user.planExpiresAt,
          createdAt: user.createdAt,
        }}
        usedCount={usedCount}
        limit={limit}
        pct={pct}
        initials={initials}
      />
    </>
  )
}
