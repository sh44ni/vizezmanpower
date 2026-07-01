import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'
import ManpowerApp from '@/components/ManpowerApp'

/**
 * /app — The main manpower processing application.
 * Requires an active session AND an active plan.
 * If no session → redirect to login.
 * If session but no active plan → redirect to dashboard to upgrade.
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

  return <ManpowerApp />
}
