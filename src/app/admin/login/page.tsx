'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { useLanguage } from '@/lib/language'
import { LangSwitcher } from '@/components/ui/LangSwitcher'
import toast from 'react-hot-toast'
import { ToastProvider } from '@/components/ui/ToastProvider'

function AdminLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useLanguage()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.email || !form.password) {
      setErrors({ form: t('val_both_required') })
      return
    }
    setLoading(true)
    setErrors({})
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()

      if (!res.ok) {
        setErrors({ form: data.error ?? t('err_login_failed') })
        return
      }

      if (data.user?.role !== 'ADMIN') {
        setErrors({ form: t('admin_login_admin_only') })
        await fetch('/api/auth/logout', { method: 'POST' })
        return
      }

      toast.success(t('admin_login_success'))
      const redirect = searchParams.get('redirect') ?? '/admin'
      router.push(redirect)
      router.refresh()
    } catch {
      setErrors({ form: t('err_connection') })
    } finally {
      setLoading(false)
    }
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [k]: e.target.value }))
    if (errors[k] || errors.form) setErrors({})
  }

  return (
    <div className="admin-login-page">
      <ToastProvider />

      {/* Animated background */}
      <div className="admin-login-bg">
        <div className="admin-login-orb admin-login-orb-1" />
        <div className="admin-login-orb admin-login-orb-2" />
        <div className="admin-login-orb admin-login-orb-3" />
      </div>

      <div className="admin-login-card">
        {/* Language switcher */}
        <div className="admin-login-lang">
          <LangSwitcher />
        </div>

        {/* Logo / Brand */}
        <div className="admin-login-brand">
          <div className="admin-login-logo">{t('brand_name').charAt(0)}</div>
          <div className="admin-login-brand-text">
            <div className="admin-login-brand-name">{t('brand_name')}</div>
            <div className="admin-login-brand-sub">{t('admin_portal')}</div>
          </div>
        </div>

        <div className="admin-login-divider" />

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {errors.form && (
            <div className="auth-message auth-message--error" role="alert">
              <span className="auth-message-icon">!</span>
              <span>{errors.form}</span>
            </div>
          )}

          <div className="form-field">
            <label className="form-label" htmlFor="admin-email">{t('admin_login_email')}</label>
            <input
              id="admin-email"
              type="email"
              className={`form-input${errors.email ? ' form-input--error' : ''}`}
              placeholder={t('field_admin_email_placeholder')}
              value={form.email}
              onChange={set('email')}
              autoComplete="email"
              required
            />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="admin-password">{t('field_password')}</label>
            <div style={{ position: 'relative' }}>
              <input
                id="admin-password"
                type={showPass ? 'text' : 'password'}
                className="form-input"
                placeholder="••••••••"
                value={form.password}
                onChange={set('password')}
                autoComplete="current-password"
                required
                style={{ paddingRight: 72 }}
              />
              <button
                type="button"
                onClick={() => setShowPass(s => !s)}
                className="form-toggle-pass form-toggle-pass--abs"
                aria-label={showPass ? t('field_password_hide') : t('field_password_show')}
              >
                {showPass ? t('field_password_hide') : t('field_password_show')}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="auth-btn"
            disabled={loading}
            id="admin-login-submit-btn"
            style={{ marginTop: 8, background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
          >
            {loading
              ? <><span className="spinner" />{t('admin_login_btn_loading')}</>
              : t('admin_login_btn')}
          </button>
        </form>

        <div className="admin-login-footer">
          <Link href="/login" style={{ fontSize: 12, color: 'var(--text-faint)', textDecoration: 'none' }}>
            &#8592; {t('admin_login_back')}
          </Link>
          <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>
            {t('admin_login_only')}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="admin-login-page"><div className="spinner" /></div>}>
      <AdminLoginForm />
    </Suspense>
  )
}
