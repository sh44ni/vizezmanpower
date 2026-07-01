'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useLanguage } from '@/lib/language'
import { LangSwitcher } from '@/components/ui/LangSwitcher'
import toast from 'react-hot-toast'

interface AdminSidebarProps {
  adminName: string
  adminEmail: string
}

export function AdminSidebar({ adminName, adminEmail }: AdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useLanguage()

  const isActive = (path: string) =>
    path === '/admin' ? pathname === '/admin' : pathname.startsWith(path)

  const navItems = [
    { href: '/admin', label: t('admin_nav_dashboard'), marker: 'D' },
    { href: '/admin/users', label: t('admin_nav_users'), marker: 'U' },
    { href: '/admin/plans', label: t('admin_nav_plans'), marker: 'P' },
  ]

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      toast.success(t('admin_logout_ok'))
      router.push('/login')
      router.refresh()
    } catch {
      toast.error(t('admin_logout_fail'))
    }
  }

  const initials = adminName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-logo">
        <div className="admin-sidebar-logo-text">{t('brand_name')}</div>
        <div className="admin-sidebar-logo-sub">{t('brand_sub')}</div>
        <div className="admin-sidebar-badge">{t('admin_portal').split(' ')[0]}</div>
      </div>

      <nav className="admin-nav">
        <div className="admin-nav-section">
          <div className="admin-nav-label">{t('admin_nav')}</div>
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`admin-nav-item ${isActive(item.href) ? 'admin-nav-item--active' : ''}`}
            >
              <span className="admin-nav-marker">{item.marker}</span>
              {item.label}
            </Link>
          ))}
        </div>

        <div className="admin-nav-section" style={{ marginTop: 24 }}>
          <div className="admin-nav-label">{t('admin_quick_links')}</div>
          <Link href="/" className="admin-nav-item" target="_blank">
            <span className="admin-nav-marker">A</span>
            {t('admin_open_app')} &#8599;
          </Link>
        </div>
      </nav>

      <div className="admin-sidebar-footer">
        <div className="admin-sidebar-lang">
          <LangSwitcher />
        </div>
        <div className="admin-user-info">
          <div className="admin-avatar">{initials}</div>
          <div>
            <div className="admin-user-name">{adminName}</div>
            <div className="admin-user-role">{adminEmail}</div>
          </div>
        </div>
        <button className="admin-logout-btn" onClick={handleLogout} id="admin-logout-btn">
          &#8617; {t('admin_sign_out')}
        </button>
      </div>
    </aside>
  )
}
