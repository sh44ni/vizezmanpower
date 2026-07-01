'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/lib/language'
import toast from 'react-hot-toast'

interface User {
  id: string
  fullName: string
  agencyName: string
  email: string
  isActive: boolean
  emailVerified: boolean
  planId: string | null
  plan: { id: string; name: string } | null
  createdAt: string
  submissionsThisMonth: number
}

interface Plan {
  id: string
  name: string
}

export default function AdminUsersPage() {
  const router = useRouter()
  const { t, lang } = useLanguage()
  const [users, setUsers] = useState<User[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (planFilter) params.set('plan', planFilter)
      if (statusFilter) params.set('status', statusFilter)
      const res = await fetch(`/api/admin/users?${params}`)
      const data = await res.json()
      if (res.ok) setUsers(data.users)
    } catch {
      toast.error(t('admin_load_fail'))
    } finally {
      setLoading(false)
    }
  }, [search, planFilter, statusFilter, t])

  useEffect(() => {
    fetch('/api/admin/plans').then(r => r.json()).then(d => setPlans(d.plans ?? []))
  }, [])

  useEffect(() => {
    const timer = setTimeout(fetchUsers, search ? 350 : 0)
    return () => clearTimeout(timer)
  }, [fetchUsers, search, planFilter, statusFilter])

  return (
    <>
      <div className="admin-topbar">
        <div>
          <div className="admin-topbar-title">{t('admin_users_title')}</div>
          <div className="admin-topbar-sub">{users.length} {t('admin_users_found')}</div>
        </div>
      </div>

      <div className="admin-content">
        <div className="admin-table-card">
          <div className="admin-table-header">
            <span className="admin-table-title">{t('admin_all_users')}</span>
            <div className="admin-table-controls">
              <input
                type="search"
                className="admin-search"
                placeholder={t('admin_search_placeholder')}
                value={search}
                onChange={e => setSearch(e.target.value)}
                id="user-search-input"
              />
              <select
                className="admin-select"
                value={planFilter}
                onChange={e => setPlanFilter(e.target.value)}
                id="plan-filter-select"
              >
                <option value="">{t('admin_all_plans')}</option>
                <option value="none">{t('admin_no_plan')}</option>
                {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select
                className="admin-select"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                id="status-filter-select"
              >
                <option value="">{t('admin_all_statuses')}</option>
                <option value="active">{t('badge_active')}</option>
                <option value="inactive">{t('badge_inactive')}</option>
              </select>
            </div>
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
                  <th>{t('table_submissions')}</th>
                  <th>{t('table_joined')}</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40 }}>
                    <div className="spinner" style={{ margin: '0 auto' }} />
                  </td></tr>
                )}
                {!loading && users.length === 0 && (
                  <tr><td colSpan={7}>
                    <div className="empty-state">
                      <div className="empty-state-icon">—</div>
                      <div className="empty-state-text">{t('table_no_users_found')}</div>
                      <div className="empty-state-sub">{t('table_adjust_filters')}</div>
                    </div>
                  </td></tr>
                )}
                {!loading && users.map(u => (
                  <tr key={u.id} data-clickable onClick={() => router.push(`/admin/users/${u.id}`)}>
                    <td>
                      <div className="admin-td-primary">{u.fullName}</div>
                      <div className="admin-td-muted">{u.agencyName}</div>
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
                        : <span className="badge badge--error">{t('badge_inactive')}</span>
                      }
                    </td>
                    <td className="admin-td-primary">{u.submissionsThisMonth}</td>
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
