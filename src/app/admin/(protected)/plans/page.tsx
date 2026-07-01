'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/lib/language'
import toast from 'react-hot-toast'

interface Plan {
  id: string
  name: string
  description: string
  features: string[]
  maxSubmissionsPerMonth: number | null
  isActive: boolean
  createdAt: string
  _count: { users: number }
}

interface PlanForm {
  name: string
  description: string
  features: string[]
  maxSubmissionsPerMonth: string
  unlimited: boolean
  isActive: boolean
}

const emptyForm: PlanForm = {
  name: '', description: '', features: [''], maxSubmissionsPerMonth: '', unlimited: true, isActive: true,
}

function PlanModal({
  plan,
  onClose,
  onSaved,
}: {
  plan: Plan | null
  onClose: () => void
  onSaved: () => void
}) {
  const { t } = useLanguage()
  const [form, setForm] = useState<PlanForm>(
    plan
      ? {
          name: plan.name,
          description: plan.description,
          features: plan.features.length ? plan.features : [''],
          maxSubmissionsPerMonth: plan.maxSubmissionsPerMonth ? String(plan.maxSubmissionsPerMonth) : '',
          unlimited: plan.maxSubmissionsPerMonth === null,
          isActive: plan.isActive,
        }
      : emptyForm
  )
  const [saving, setSaving] = useState(false)

  const setFeature = (i: number, val: string) => {
    setForm(f => { const arr = [...f.features]; arr[i] = val; return { ...f, features: arr } })
  }
  const addFeature = () => setForm(f => ({ ...f, features: [...f.features, ''] }))
  const removeFeature = (i: number) => setForm(f => ({ ...f, features: f.features.filter((_, idx) => idx !== i) }))

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error(t('plan_name_label') + ' is required'); return }
    setSaving(true)
    try {
      const body = {
        name: form.name.trim(),
        description: form.description.trim(),
        features: form.features.filter(f => f.trim()),
        maxSubmissionsPerMonth: form.unlimited ? null : Number(form.maxSubmissionsPerMonth) || null,
        isActive: form.isActive,
      }
      const url = plan ? `/api/admin/plans/${plan.id}` : '/api/admin/plans'
      const method = plan ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (res.ok) {
        toast.success(plan ? t('plan_update') : t('plan_create_modal'))
        onSaved()
        onClose()
      } else if (res.status === 403) {
        toast.error(t('admin_session_expired'))
        window.location.href = '/admin/login'
      } else {
        toast.error(data.error ?? t('plan_save_fail'))
      }
    } catch {
      toast.error(t('plan_network_err'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{plan ? t('plan_edit_title') : t('plan_create_title')}</div>
          <button className="modal-close" onClick={onClose} aria-label="Close">&#10005;</button>
        </div>

        <div className="admin-form-group">
          <label className="admin-label">{t('plan_name_label')} *</label>
          <input className="admin-input" placeholder="e.g. Standard, Premium" value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))} id="plan-name-input" />
        </div>

        <div className="admin-form-group">
          <label className="admin-label">{t('plan_description_label')}</label>
          <textarea className="admin-input admin-textarea" placeholder="..."
            value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        </div>

        <div className="admin-form-group">
          <label className="admin-label">{t('plan_limit_label')}</label>
          <div className="toggle-wrap" style={{ marginBottom: 10 }}>
            <label className="toggle">
              <input type="checkbox" checked={form.unlimited}
                onChange={e => setForm(f => ({ ...f, unlimited: e.target.checked }))} id="unlimited-toggle" />
              <span className="toggle-slider" />
            </label>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t('plan_unlimited_label')}</span>
          </div>
          {!form.unlimited && (
            <input type="number" className="admin-input" placeholder="e.g. 100"
              value={form.maxSubmissionsPerMonth} min={1}
              onChange={e => setForm(f => ({ ...f, maxSubmissionsPerMonth: e.target.value }))} id="limit-input" />
          )}
        </div>

        <div className="admin-form-group">
          <label className="admin-label">{t('plan_features_label')}</label>
          <div className="feature-list">
            {form.features.map((f, i) => (
              <div key={i} className="feature-item">
                <input
                  placeholder={`${t('plan_feature_placeholder')} ${i + 1}`}
                  value={f}
                  onChange={e => setFeature(i, e.target.value)}
                />
                {form.features.length > 1 && (
                  <button className="feature-remove-btn" onClick={() => removeFeature(i)} aria-label="Remove">
                    &#10005;
                  </button>
                )}
              </div>
            ))}
            <button type="button" className="feature-add-btn" onClick={addFeature}>
              {t('plan_add_feature')}
            </button>
          </div>
        </div>

        <div className="admin-form-group">
          <label className="admin-label">{t('plan_status_label')}</label>
          <div className="toggle-wrap">
            <label className="toggle">
              <input type="checkbox" checked={form.isActive}
                onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} id="active-toggle" />
              <span className="toggle-slider" />
            </label>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {form.isActive ? t('badge_active') : t('badge_inactive')}
            </span>
          </div>
        </div>

        <div className="modal-footer">
          <button className="admin-btn admin-btn--secondary" onClick={onClose}>{t('plan_cancel')}</button>
          <button className="admin-btn admin-btn--primary" onClick={handleSave} disabled={saving} id="save-plan-btn">
            {saving ? <><span className="spinner spinner--sm" /> {t('plan_save')}</> : (plan ? t('plan_update') : t('plan_create_modal'))}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminPlansPage() {
  const { t } = useLanguage()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [modalPlan, setModalPlan] = useState<Plan | null | undefined>(undefined)
  const [toggling, setToggling] = useState<string | null>(null)

  const fetchPlans = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/plans')
      const data = await res.json()
      if (res.ok) setPlans(data.plans)
    } catch {
      toast.error(t('plan_load_fail'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPlans() }, [])

  const handleToggleActive = async (plan: Plan) => {
    setToggling(plan.id)
    try {
      const res = await fetch(`/api/admin/plans/${plan.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !plan.isActive }),
      })
      if (res.ok) {
        toast.success(plan.isActive ? t('plan_deactivated') : t('plan_activated'))
        fetchPlans()
      } else if (res.status === 403) {
        toast.error(t('admin_session_expired'))
        window.location.href = '/admin/login'
      } else {
        toast.error(t('plan_update_fail'))
      }
    } catch {
      toast.error(t('plan_network_err'))
    } finally {
      setToggling(null)
    }
  }

  return (
    <>
      <div className="admin-topbar">
        <div>
          <div className="admin-topbar-title">{t('admin_plans_title')}</div>
          <div className="admin-topbar-sub">
            {plans.length} {plans.length !== 1 ? t('admin_plans_configured_plural') : t('admin_plans_configured')}
          </div>
        </div>
        <button className="admin-btn admin-btn--primary" onClick={() => setModalPlan(null)} id="create-plan-btn">
          {t('admin_create_plan')}
        </button>
      </div>

      <div className="admin-content">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
            <div className="spinner" style={{ width: 32, height: 32 }} />
          </div>
        ) : plans.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">—</div>
            <div className="empty-state-text">{t('admin_no_plans')}</div>
            <div className="empty-state-sub">{t('admin_no_plans_sub')}</div>
            <button className="admin-btn admin-btn--primary" style={{ marginTop: 16 }} onClick={() => setModalPlan(null)}>
              {t('admin_create_first')}
            </button>
          </div>
        ) : (
          <div className="plan-cards">
            {plans.map(plan => (
              <div key={plan.id} className={`plan-card${plan.isActive ? '' : ' plan-card--inactive'}`}>
                <div className="plan-card-header">
                  <div>
                    <div className="plan-card-name">{plan.name}</div>
                    <div style={{ marginTop: 6 }}>
                      {plan.isActive
                        ? <span className="badge badge--success">{t('badge_active')}</span>
                        : <span className="badge badge--muted">{t('badge_inactive')}</span>
                      }
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>
                      {plan._count.users}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>{t('plan_users')}</div>
                  </div>
                </div>

                <div className="plan-card-desc">
                  {plan.description || <em style={{ color: 'var(--text-faint)' }}>{t('plan_no_desc')}</em>}
                </div>

                <div className="plan-card-meta">
                  {t('plan_limit')}: {plan.maxSubmissionsPerMonth ?? t('dash_unlimited')} {t('plan_submissions_month')}
                </div>

                {(plan.features as string[]).length > 0 && (
                  <ul className="plan-features" style={{ marginBottom: 12 }}>
                    {(plan.features as string[]).map((f, i) => (
                      <li key={i} className="plan-feature-item">
                        <span className="plan-feature-check">&#10003;</span>{f}
                      </li>
                    ))}
                  </ul>
                )}

                <div className="plan-card-actions">
                  <button
                    className="admin-btn admin-btn--secondary admin-btn--sm"
                    onClick={() => setModalPlan(plan)}
                    id={`edit-plan-${plan.id}`}
                  >
                    {t('plan_edit')}
                  </button>
                  <button
                    className={`admin-btn admin-btn--sm ${plan.isActive ? 'admin-btn--danger' : 'admin-btn--success'}`}
                    onClick={() => handleToggleActive(plan)}
                    disabled={toggling === plan.id}
                    id={`toggle-plan-${plan.id}`}
                  >
                    {toggling === plan.id ? <span className="spinner spinner--sm" /> : null}
                    {plan.isActive ? t('plan_deactivate') : t('plan_activate')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalPlan !== undefined && (
        <PlanModal
          plan={modalPlan}
          onClose={() => setModalPlan(undefined)}
          onSaved={fetchPlans}
        />
      )}
    </>
  )
}
