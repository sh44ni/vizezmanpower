import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'
import ManpowerApp from '@/components/ManpowerApp'

/**
 * /app — The main manpower processing application.
 * Passes quota info (usedCount, limit) down to the client so it can
 * enforce limits without an extra API round-trip.
 */
export default async function AppPage() {
  const session = await getSession()
  if (!session) redirect('/login?redirect=/app')

  const user = await db.user.findUnique({
    where: { id: session.sub },
    include: { plan: true },
  })

  if (!user) redirect('/login?redirect=/app')
  if (!user.isActive || !user.plan) redirect('/dashboard')

  const currentMonth = new Date().toISOString().slice(0, 7)
  const usage = await db.submissionUsage.findUnique({
    where: { userId_month: { userId: user.id, month: currentMonth } },
  })

  const usedCount = usage?.count ?? 0
  const limit = user.plan.maxSubmissionsPerMonth ?? null   // null = unlimited

  return <ManpowerApp usedCount={usedCount} limit={limit} />
}
