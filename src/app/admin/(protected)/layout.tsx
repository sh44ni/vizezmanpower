import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { db } from '@/lib/db'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { ToastProvider } from '@/components/ui/ToastProvider'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()

  if (!session || session.role !== 'ADMIN') {
    redirect('/admin/login')
  }

  const admin = await db.user.findUnique({
    where: { id: session.sub },
    select: { fullName: true, email: true },
  })

  return (
    <div className="admin-layout">
      <ToastProvider />
      <AdminSidebar
        adminName={admin?.fullName ?? 'Admin'}
        adminEmail={admin?.email ?? ''}
      />
      <main className="admin-main">
        {children}
      </main>
    </div>
  )
}
