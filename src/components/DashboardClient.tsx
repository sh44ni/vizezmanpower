'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useLanguage } from '@/lib/language'
import { LangSwitcher } from '@/components/ui/LangSwitcher'
import { LogoutButton } from '@/components/ui/LogoutButton'

interface Plan {
  name: string
  description?: string | null
  maxSubmissionsPerMonth?: number | null
  features: string[]
}

interface DashboardClientProps {
  user: {
    fullName: string
    agencyName: string
    email: string
    phone?: string | null
    isActive: boolean
    plan: Plan | null
    planExpiresAt?: Date | null
    createdAt: Date
  }
  usedCount: number
  limit: number | null
  pct: number
  initials: string
}

function UpgradeModal({ onClose, t }: { onClose: () => void; t: (k: string) => string }) {
  return (
    <div className="upgrade-modal-overlay" onClick={onClose}>
      <div className="upgrade-modal" onClick={e => e.stopPropagation()}>
        <button className="upgrade-modal-close" onClick={onClose} aria-label="Close">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
        <div className="upgrade-modal-icon-wrap">
          <div className="upgrade-modal-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
          </div>
        </div>
        <h2 className="upgrade-modal-title">{t('upgrade_title')}</h2>
        <p className="upgrade-modal-desc">{t('upgrade_desc')}</p>
        <div className="upgrade-modal-features">
          {[t('upgrade_f1'), t('upgrade_f2'), t('upgrade_f3'), t('upgrade_f4')].map((f, i) => (
            <div key={i} className="upgrade-feature-item">
              <span className="upgrade-feature-check">✓</span>
              <span>{f}</span>
            </div>
          ))}
        </div>
        <a
          href="https://wa.me/923178328164?text=Hi%2C%20I%20want%20to%20upgrade%20my%20Vizez%20Manpower%20plan"
          target="_blank"
          rel="noopener noreferrer"
          className="upgrade-whatsapp-btn"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          {t('upgrade_whatsapp')}
        </a>
        <p className="upgrade-modal-note">{t('upgrade_note')}</p>
      </div>
    </div>
  )
}

export function DashboardClient({ user, usedCount, limit, pct, initials }: DashboardClientProps) {
  const { t, lang, isRTL } = useLanguage()
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const features = user.plan?.features ?? []
  const tr = (key: string) => { try { return t(key as any) } catch { return key } }

  return (
    <div
      className="dashboard-page"
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{ fontFamily: isRTL ? 'var(--font-arabic), sans-serif' : undefined }}
    >
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} t={tr} />}

      {/* ── Nav ── */}
      <nav className="dashboard-nav">
        {/* Logo */}
        <div className="dashboard-nav-logo-wrap">
          <svg viewBox="0 0 730 234" className="dashboard-nav-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill="currentColor" className="dash-logo-white" d="M52.71,124,137.8,0c-3.37,0-6.17,0-9,0-35,.27-70.1.21-105.14.13-2.2,0-4.4,0-6.59.13A16.34,16.34,0,0,0,7.9,3.47C3.34,7.09.34,11.63.07,17.64,0,19.28,0,20.93,0,22.58Q0,79.82,0,137.06c0,14.27-.1,28.55,0,42.83a18.84,18.84,0,0,0,12.27,17.55,25.87,25.87,0,0,0,10,1.42L89,198.77l3,0c2.55,0,2.27.27,3.18-2.39.8-2.34,1.46-4.71,2.26-7.05q5.61-16.47,11.25-32.94,4.32-12.7,8.57-25.45a35.94,35.94,0,0,0,2-6.93Z"/>
            <path fill="currentColor" className="dash-logo-white" d="M92.5,232.7l.62.42L209,81.38a3.35,3.35,0,0,0-2.53-.42c-8.51.24-17-.36-25.51-.12-9.69.27-19.39-.08-29.09-.17-2.44,0-2.45,0-2.51-2.41,0-.46,0-.92,0-1.37q0-37.2,0-74.4c0-.57.34-1.25-.29-1.75C146.69,3,71.15,112.91,70.51,114.92a3.59,3.59,0,0,0,2.12.23q8.22.07,16.45.09,19.5,0,39,0c3.37,0,4.58-1,2.87,4q-10.71,31.41-21.31,62.85-6.77,20-13.48,40C95,225.66,93.71,229.18,92.5,232.7Z"/>
            <path fill="currentColor" className="dash-logo-white" d="M52.71,124h66.55a35.94,35.94,0,0,1-2,6.93q-4.26,12.74-8.57,25.45-5.61,16.49-11.25,32.94c-.8,2.34-1.46,4.71-2.26,7.05-.91,2.66-.63,2.36-3.18,2.39l-3,0-66.72.09a25.87,25.87,0,0,1-10-1.42A18.84,18.84,0,0,1,0,179.89c-.1-14.28,0-28.56,0-42.83Q0,79.82,0,22.58c0-1.65,0-3.3.08-4.94.27-6,3.27-10.55,7.83-14.17A16.34,16.34,0,0,1,17.09.27C19.28.11,21.48.13,23.68.14,58.72.22,93.77.28,128.82,0c2.81,0,5.61,0,9,0Z"/>
            <path fill="#d7ac4e" d="M92.5,232.7c1.21-3.52,2.45-7,3.64-10.57q6.75-20,13.48-40,10.62-31.43,21.31-62.85c1.71-5,.5-4-2.87-4q-19.49,0-39,0-8.22,0-16.45-.09a3.59,3.59,0,0,1-2.12-.23C71.15,112.91,146.69,3,149,.74c.63.5.29,1.18.29,1.75q0,37.2,0,74.4c0,.45,0,.91,0,1.37.06,2.37.07,2.38,2.51,2.41,9.7.09,19.4.44,29.09.17,8.51-.24,17,.36,25.51.12a3.35,3.35,0,0,1,2.53.42L93.12,233.12Z"/>
            <path fill="currentColor" className="dash-logo-white" d="M330,123.23q-2.75,7.13-4.66,12.61t-3.39,10.33c-.1.36-.21.72-.32,1.09-.56-1.88-1.19-3.79-1.87-5.75-.85-2.44-1.83-5.15-2.92-8.14S314.44,127,313,123.23L284.45,49.91h-26l51.19,128h21.58l51.56-128H356.67Z"/>
            <rect fill="currentColor" className="dash-logo-white" x="401.65" y="81.54" width="22.49" height="96.36"/>
            <path fill="currentColor" className="dash-logo-white" d="M423.32,38.3q-3.75-3.37-10.7-3.38-6.58,0-10.42,3.65a12.54,12.54,0,0,0-3.84,9.51q0,6.22,3.75,9.6t10.51,3.38q6.76,0,10.6-3.65a12.33,12.33,0,0,0,3.84-9.33Q427.06,41.69,423.32,38.3Z"/>
            <polygon fill="currentColor" className="dash-logo-white" points="476.12 159.06 522.32 97.63 522.32 81.54 448.64 81.54 448.64 100.37 495.31 100.37 448.64 161.81 448.64 177.9 523.6 177.9 523.6 159.06 476.12 159.06"/>
            <polygon fill="#d7ac4e" points="572.78 123.04 623.79 123.04 623.79 101.83 572.78 101.83 572.78 71.48 633.12 71.48 633.12 49.91 549.38 49.91 549.38 177.9 633.85 177.9 633.85 156.32 572.78 156.32 572.78 123.04"/>
            <polygon fill="#d7ac4e" points="683.09 159.06 729.29 97.63 729.29 81.54 655.61 81.54 655.61 100.37 702.28 100.37 655.61 161.81 655.61 177.9 730.57 177.9 730.57 159.06 683.09 159.06"/>
          </svg>
          <span className="dashboard-nav-manpower">MANPOWER</span>
        </div>

        {/* ── Desktop nav (hidden ≤640px) ── */}
        <div className="dashboard-nav-user" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <LangSwitcher />
          <button
            className="upgrade-btn"
            onClick={() => setShowUpgrade(true)}
            id="btn-upgrade-plan"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
            {tr('upgrade_btn_label')}
          </button>
          <span className="dashboard-nav-agency">{user.agencyName}</span>
          <div className="dashboard-avatar">{initials}</div>
          <LogoutButton />
        </div>

        {/* ── Mobile nav (visible ≤640px) ── */}
        <div className="dash-mobile-actions">
          <LangSwitcher />
          <div className="dashboard-avatar">{initials}</div>
          <button
            className="dash-hamburger"
            onClick={() => setMobileMenuOpen(v => !v)}
            aria-label="Menu"
          >
            {mobileMenuOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            )}
          </button>
        </div>
      </nav>

      {/* ── Mobile dropdown ── */}
      {mobileMenuOpen && (
        <div className="dash-mobile-menu" dir={isRTL ? 'rtl' : 'ltr'}>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{user.agencyName}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: -4 }}>{user.email}</div>
          <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
          <button
            className="upgrade-btn"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => { setShowUpgrade(true); setMobileMenuOpen(false) }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            {tr('upgrade_btn_label')}
          </button>
          <LogoutButton />
        </div>
      )}

      {/* ── Content ── */}
      <div className="dashboard-content">
        {/* Welcome */}
        <div className="dashboard-welcome">
          <div className="dashboard-welcome-hi">{t('dash_welcome_hi')}</div>
          <div className="dashboard-welcome-name">{user.agencyName}</div>
          <div className="dashboard-welcome-sub">{user.fullName} · {user.email}</div>
        </div>

        {/* Cards grid */}
        <div className="dashboard-cards">
          {/* Plan card */}
          <div className="dashboard-card" style={{ gridColumn: user.plan ? 'auto' : '1 / -1' }}>
            <div className="dashboard-card-title">
              <span className="card-icon-dot card-icon-dot--plan" />
              {t('dash_plan')}
            </div>
            {user.plan ? (
              <>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
                  {user.plan.name}
                </div>
                {user.plan.description && (
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.5 }}>
                    {user.plan.description}
                  </p>
                )}
                {user.planExpiresAt && (
                  <div style={{ marginBottom: 12 }}>
                    <span className="badge badge--warn">
                      {t('dash_expires')} {new Date(user.planExpiresAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {features.length > 0 && (
                  <ul className="plan-features">
                    {features.map((f, i) => (
                      <li key={i} className="plan-feature-item">
                        <span className="plan-feature-check">&#10003;</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                )}
                <button
                  className="plan-upgrade-nudge"
                  onClick={() => setShowUpgrade(true)}
                  id="btn-upgrade-in-plan"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                  {tr('upgrade_plan_nudge')}
                </button>
              </>
            ) : (
              <>
                <div className="auth-message auth-message--warn" style={{ margin: '0 0 16px 0' }}>
                  <span className="auth-message-icon">!</span>
                  <span>{t('dash_pending_plan')}</span>
                </div>
                <button
                  className="upgrade-btn upgrade-btn--lg"
                  onClick={() => setShowUpgrade(true)}
                  id="btn-upgrade-no-plan"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                  {tr('upgrade_get_plan')}
                </button>
              </>
            )}
          </div>

          {/* Usage card */}
          {user.plan && (
            <div className="dashboard-card">
              <div className="dashboard-card-title">
                <span className="card-icon-dot card-icon-dot--usage" />
                {t('dash_usage')}
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
                {usedCount}
                <span style={{ fontSize: 16, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 6 }}>
                  / {limit ?? '∞'}
                </span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 4, marginBottom: 4 }}>
                {t('dash_submissions')}
              </div>
              {limit && (
                <>
                  <div className="usage-bar-wrap">
                    <div
                      className={`usage-bar-fill${pct > 90 ? ' usage-bar-fill--full' : pct > 70 ? ' usage-bar-fill--warn' : ''}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>
                    {limit - usedCount} {t('dash_remaining')}
                  </div>
                </>
              )}
              {!limit && (
                <div style={{ marginTop: 8 }}>
                  <span className="badge badge--success">{t('dash_unlimited')}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick access */}
        <div className="dashboard-card" style={{ marginBottom: 20 }}>
          <div className="dashboard-card-title">
            <span className="card-icon-dot card-icon-dot--access" />
            {t('dash_quick_access')}
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {user.isActive && user.plan ? (
              <Link href="/app" className="admin-btn admin-btn--primary" style={{ textDecoration: 'none' }}>
                {t('dash_open_app')} &rarr;
              </Link>
            ) : (
              <div className="auth-message auth-message--info" style={{ margin: 0, flex: 1 }}>
                <span className="auth-message-icon">i</span>
                <span>{t('dash_no_access')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Account info */}
        <div className="detail-section">
          <div className="detail-section-title">{t('dash_account')}</div>
          <div className="detail-row">
            <span className="detail-key">{t('dash_field_name')}</span>
            <span className="detail-val">{user.fullName}</span>
          </div>
          <div className="detail-row">
            <span className="detail-key">{t('dash_field_agency')}</span>
            <span className="detail-val">{user.agencyName}</span>
          </div>
          <div className="detail-row">
            <span className="detail-key">{t('dash_field_email')}</span>
            <span className="detail-val">{user.email}</span>
          </div>
          {user.phone && (
            <div className="detail-row">
              <span className="detail-key">{t('dash_field_phone')}</span>
              <span className="detail-val">{user.phone}</span>
            </div>
          )}
          <div className="detail-row">
            <span className="detail-key">{t('dash_field_status')}</span>
            <span className="detail-val">
              {user.isActive
                ? <span className="badge badge--success">{t('dash_status_active')}</span>
                : <span className="badge badge--warn">{t('dash_status_pending')}</span>}
            </span>
          </div>
          <div className="detail-row">
            <span className="detail-key">{t('dash_field_since')}</span>
            <span className="detail-val">
              {new Date(user.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', {
                year: 'numeric', month: 'long', day: 'numeric'
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
