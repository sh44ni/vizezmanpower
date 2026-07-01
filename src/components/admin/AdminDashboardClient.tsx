'use client'

import Link from 'next/link'
import { useLanguage } from '@/lib/language'

interface Stat {
  key: string
  labelKey: string
  color: string
  bg: string
  marker: string
}

const stats: Stat[] = [
  { key: 'totalUsers',          labelKey: 'stat_total_users',   color: '#6366f1', bg: 'rgba(99,102,241,0.1)',  marker: 'U' },
  { key: 'activeUsers',         labelKey: 'stat_active_users',  color: '#10b981', bg: 'rgba(16,185,129,0.1)',  marker: 'A' },
  { key: 'usersWithPlans',      labelKey: 'stat_with_plans',    color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',  marker: 'P' },
  { key: 'submissionsThisMonth',labelKey: 'stat_submissions',   color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  marker: 'S' },
]

interface AdminDashboardClientProps {
  data: {
    totalUsers: number
    activeUsers: number
    usersWithPlans: number
    submissionsThisMonth: number
    recentSignups: Array<{
      id: string
      fullName: string
      agencyName: string
      email: string
      isActive: boolean
      emailVerified: boolean
      createdAt: Date
      plan: { name: string } | null
    }>
  }
}

export function AdminDashboardClient({ data }: AdminDashboardClientProps) {
  const { t, lang } = useLanguage()

  return (
    <>
      <div className="admin-topbar">
        <div>
          <div className="admin-topbar-title">{t('admin_dash_title')}</div>
          <div className="admin-topbar-sub">{t('admin_dash_sub')}</div>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-faint)' }}>
          {new Date().toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
          })}
        </div>
      </div>

      <div className="admin-content">
        {/* Stat Cards */}
        <div className="stat-cards">
          {stats.map(s => (
            <div
              key={s.key}
              className="stat-card"
              style={{ '--stat-color': s.color, '--stat-bg': s.bg } as React.CSSProperties}
            >
              <div className="stat-card-icon">
                <span className="stat-card-marker" style={{ color: s.color }}>{s.marker}</span>
              </div>
              <div className="stat-card-value">{data[s.key as keyof typeof data] as number}</div>
              <div className="stat-card-label">{t(s.labelKey as Parameters<typeof t>[0])}</div>
            </div>
          ))}
        </div>

        {/* Recent Signups */}
        <div className="admin-table-card">
          <div className="admin-table-header">
            <span className="admin-table-title">{t('admin_recent_signups')}</span>
            <Link href="/admin/users" className="admin-btn admin-btn--secondary admin-btn--sm">
              {t('admin_view_all')} &rarr;
            </Link>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t('table_name_agency')}</th>
                  <th>{t('table_email')}</th>
                  <th>{t('table_plan')}</th>
                  <th>{t('table_email_status')}</th>
                  <th>{t('table_status')}</th>
                  <th>{t('table_joined')}</th>
                </tr>
              </thead>
              <tbody>
                {data.recentSignups.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '40px' }}>
                      {t('table_no_users')}
                    </td>
                  </tr>
                )}
                {data.recentSignups.map(u => (
                  <tr key={u.id} data-clickable>
                    <td>
                      <Link href={`/admin/users/${u.id}`} style={{ textDecoration: 'none' }}>
                        <div className="admin-td-primary">{u.fullName}</div>
                        <div className="admin-td-muted">{u.agencyName}</div>
                      </Link>
                    </td>
                    <td>{u.email}</td>
                    <td>
                      {u.plan
                        ? <span className="badge badge--accent">{u.plan.name}</span>
                        : <span className="badge badge--muted">{t('badge_no_plan')}</span>
                      }
                    </td>
                    <td>
                      {u.emailVerified
                        ? <span className="badge badge--success">{t('badge_verified')}</span>
                        : <span className="badge badge--warn">{t('badge_pending')}</span>
                      }
                    </td>
                    <td>
                      {u.isActive
                        ? <span className="badge badge--success">{t('badge_active')}</span>
                        : <span className="badge badge--muted">{t('badge_inactive')}</span>
                      }
                    </td>
                    <td className="admin-td-muted">
                      {new Date(u.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
