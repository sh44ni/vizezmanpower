'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface SubmissionUsage {
  month: string
  count: number
}

interface Plan {
  id: string
  name: string
  description: string
  features: string[]
  maxSubmissionsPerMonth: number | null
}

interface User {
  id: string
  email: string
  fullName: string
  agencyName: string
  phone: string | null
  role: string
  isActive: boolean
  emailVerified: boolean
  planId: string | null
  planAssignedAt: string | null
  planExpiresAt: string | null
  createdAt: string
  updatedAt: string
  plan: Plan | null
  submissionUsage: SubmissionUsage[]
}

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [allPlans, setAllPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toggling, setToggling] = useState(false)

  const [selectedPlanId, setSelectedPlanId] = useState<string>('')
  const [expiresAt, setExpiresAt] = useState('')

  const [userId, setUserId] = useState<string>('')

  useEffect(() => {
    params.then(p => setUserId(p.id))
  }, [params])

  const fetchUser = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const [userRes, plansRes] = await Promise.all([
        fetch(`/api/admin/users/${userId}`),
        fetch('/api/admin/plans'),
      ])
      const userData = await userRes.json()
      const plansData = await plansRes.json()
      if (userRes.ok) {
        setUser(userData.user)
        setSelectedPlanId(userData.user.planId ?? '')
        setExpiresAt(userData.user.planExpiresAt ? new Date(userData.user.planExpiresAt).toISOString().split('T')[0] : '')
      }
      if (plansRes.ok) setAllPlans(plansData.plans.filter((p: Plan & { isActive: boolean }) => p.isActive))
    } catch {
      toast.error('Failed to load user')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => { fetchUser() }, [fetchUser])

  const handleAssignPlan = async () => {
    if (!user) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/users/${user.id}/plan`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlanId || null,
          planExpiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Plan updated successfully')
        fetchUser()
      } else {
        toast.error(data.error ?? 'Failed to update plan')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleStatus = async () => {
    if (!user) return
    setToggling(true)
    try {
      const res = await fetch(`/api/admin/users/${user.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !user.isActive }),
      })
      if (res.ok) {
        toast.success(`Account ${user.isActive ? 'deactivated' : 'activated'}`)
        fetchUser()
      } else {
        toast.error('Failed to update status')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setToggling(false)
    }
  }

  if (loading) {
    return (
      <>
        <div className="admin-topbar"><div className="admin-topbar-title">User Detail</div></div>
        <div className="admin-content" style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
          <div className="spinner" style={{ width: 32, height: 32 }} />
        </div>
      </>
    )
  }

  if (!user) {
    return (
      <>
        <div className="admin-topbar"><div className="admin-topbar-title">User Not Found</div></div>
        <div className="admin-content">
          <Link href="/admin/users" className="admin-btn admin-btn--secondary">← Back to Users</Link>
        </div>
      </>
    )
  }

  const initials = user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <>
      <div className="admin-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/admin/users" className="admin-btn admin-btn--secondary admin-btn--sm">← Back</Link>
          <div>
            <div className="admin-topbar-title">{user.fullName}</div>
            <div className="admin-topbar-sub">{user.agencyName}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {user.isActive ? <span className="badge badge--success">Active</span> : <span className="badge badge--error">Inactive</span>}
          {user.emailVerified ? <span className="badge badge--info">Email Verified</span> : <span className="badge badge--warn">Unverified</span>}
        </div>
      </div>

      <div className="admin-content">
        {/* Header card */}
        <div className="detail-section" style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 20 }}>
          <div className="admin-avatar" style={{ width: 56, height: 56, fontSize: 20, flexShrink: 0 }}>{initials}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{user.fullName}</div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>{user.agencyName} · {user.email}</div>
            {user.phone && <div style={{ fontSize: 13, color: 'var(--text-faint)', marginTop: 2 }}>{user.phone}</div>}
          </div>
          <button
            className={`admin-btn ${user.isActive ? 'admin-btn--danger' : 'admin-btn--success'}`}
            onClick={handleToggleStatus}
            disabled={toggling}
            id="toggle-status-btn"
          >
            {toggling ? <span className="spinner spinner--sm" /> : null}
            {user.isActive ? '⊘ Deactivate Account' : '✓ Activate Account'}
          </button>
        </div>

        <div className="user-detail-grid">
          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Info */}
            <div className="detail-section">
              <div className="detail-section-title">Account Information</div>
              {[
                ['Email', user.email],
                ['Phone', user.phone ?? '—'],
                ['Role', user.role],
                ['Email Verified', user.emailVerified ? 'Yes ✓' : 'No ✗'],
                ['Account Status', user.isActive ? 'Active' : 'Inactive'],
                ['Member Since', new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })],
                ['Last Updated', new Date(user.updatedAt).toLocaleDateString()],
              ].map(([k, v]) => (
                <div key={k} className="detail-row">
                  <span className="detail-key">{k}</span>
                  <span className="detail-val">{v}</span>
                </div>
              ))}
            </div>

            {/* Submission history */}
            <div className="detail-section">
              <div className="detail-section-title">Submission History (Last 12 Months)</div>
              {user.submissionUsage.length === 0
                ? <div style={{ color: 'var(--text-faint)', fontSize: 13 }}>No submissions yet</div>
                : user.submissionUsage.map(s => (
                  <div key={s.month} className="detail-row">
                    <span className="detail-key">{s.month}</span>
                    <span className="detail-val">{s.count} submission{s.count !== 1 ? 's' : ''}</span>
                  </div>
                ))
              }
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Assign Plan */}
            <div className="detail-section">
              <div className="detail-section-title">Plan Assignment</div>

              {user.plan && (
                <div style={{ marginBottom: 16, padding: '10px 14px', background: 'var(--accent-subtle)', borderRadius: 10, border: '1px solid rgba(99,102,241,0.25)' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', marginBottom: 4 }}>Current: {user.plan.name}</div>
                  {user.planAssignedAt && <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>Assigned {new Date(user.planAssignedAt).toLocaleDateString()}</div>}
                  {user.planExpiresAt && <div style={{ fontSize: 12, color: 'var(--warn)' }}>Expires {new Date(user.planExpiresAt).toLocaleDateString()}</div>}
                </div>
              )}

              <div className="admin-form-group">
                <label className="admin-label">Select Plan</label>
                <select
                  className="admin-input"
                  value={selectedPlanId}
                  onChange={e => setSelectedPlanId(e.target.value)}
                  id="plan-select"
                >
                  <option value="">— No plan —</option>
                  {allPlans.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}{p.maxSubmissionsPerMonth ? ` (${p.maxSubmissionsPerMonth}/mo)` : ' (Unlimited)'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-form-group">
                <label className="admin-label">Expiry Date (optional)</label>
                <input
                  type="date"
                  className="admin-input"
                  value={expiresAt}
                  onChange={e => setExpiresAt(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  id="expiry-date-input"
                />
              </div>

              <button
                className="admin-btn admin-btn--primary"
                onClick={handleAssignPlan}
                disabled={saving}
                id="save-plan-btn"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {saving ? <><span className="spinner spinner--sm" /> Saving…</> : '✓ Save Plan Assignment'}
              </button>

              <p style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 10 }}>
                Assigning a plan will also activate the account if it was inactive.
              </p>
            </div>

            {/* Current plan features */}
            {user.plan && (
              <div className="detail-section">
                <div className="detail-section-title">Plan Features — {user.plan.name}</div>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>{user.plan.description}</p>
                <ul className="plan-features">
                  {(user.plan.features as string[]).map((f, i) => (
                    <li key={i} className="plan-feature-item">
                      <span className="plan-feature-check">✓</span>{f}
                    </li>
                  ))}
                </ul>
                <div style={{ marginTop: 12, fontSize: 13, color: 'var(--text-faint)' }}>
                  Limit: {user.plan.maxSubmissionsPerMonth ?? 'Unlimited'} submissions/month
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
