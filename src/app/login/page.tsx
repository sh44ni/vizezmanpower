'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AuthCard } from '@/components/auth/AuthCard'
import { FormField } from '@/components/auth/FormField'
import { useLanguage } from '@/lib/language'
import toast from 'react-hot-toast'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useLanguage()

  const [form, setForm] = useState({ email: '', password: '', rememberMe: false })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    const msg = searchParams.get('msg')
    const err = searchParams.get('error')
    if (msg === 'email-verified') toast.success(t('toast_email_verified'))
    if (msg === 'already-verified') toast(t('toast_already_verified'))
    if (err === 'inactive') toast.error(t('err_inactive'))
    if (err === 'invalid-token') toast.error(t('err_invalid_token'))
    if (err === 'server-error') toast.error(t('err_server'))
  }, [searchParams, t])

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.email) e.email = t('val_email_required')
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = t('val_email_invalid')
    if (!form.password) e.password = t('val_password_required')
    return e
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

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
        if (data.needsVerification && data.email) {
          toast.loading(t('login_resending'), { id: 'otp-resend' })
          await fetch('/api/auth/resend-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: data.email }),
          })
          toast.success(t('login_otp_sent'), { id: 'otp-resend' })
          router.push(`/verify-email?email=${encodeURIComponent(data.email)}`)
          return
        }
        setErrors({ form: data.error ?? t('err_login_failed') })
        return
      }

      toast.success(t('login_success'))
      if (data.user.role === 'ADMIN') {
        router.push('/admin')
      } else {
        const redirect = searchParams.get('redirect') ?? '/dashboard'
        router.push(redirect)
      }
      router.refresh()
    } catch {
      setErrors({ form: t('err_connection') })
    } finally {
      setLoading(false)
    }
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))
    if (errors[k]) setErrors(er => { const n = { ...er }; delete n[k]; return n })
  }

  return (
    <AuthCard title={t('login_title')} subtitle={t('login_subtitle')}>
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {errors.form && (
          <div className="auth-message auth-message--error" role="alert">
            <span className="auth-message-icon">!</span>
            <span>{errors.form}</span>
          </div>
        )}

        <FormField
          id="email"
          label={t('field_email')}
          type="email"
          placeholder={t('field_email_placeholder')}
          value={form.email}
          onChange={set('email')}
          error={errors.email}
          required
          autoComplete="email"
        />

        <FormField
          id="password"
          label={t('field_password')}
          type={showPassword ? 'text' : 'password'}
          placeholder="••••••••"
          value={form.password}
          onChange={set('password')}
          error={errors.password}
          required
          autoComplete="current-password"
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword(s => !s)}
              className="form-toggle-pass"
              aria-label={showPassword ? t('field_password_hide') : t('field_password_show')}
            >
              {showPassword ? t('field_password_hide') : t('field_password_show')}
            </button>
          }
        />

        <div className="auth-links">
          <label className="auth-checkbox-label">
            <input
              type="checkbox"
              id="rememberMe"
              checked={form.rememberMe}
              onChange={set('rememberMe')}
            />
            {t('login_remember_me')}
          </label>
          <Link href="/forgot-password" className="auth-link">{t('login_forgot')}</Link>
        </div>

        <button type="submit" className="auth-btn" disabled={loading} id="login-submit-btn">
          {loading ? <><span className="spinner" />{t('login_signing_in')}</> : t('login_btn')}
        </button>
      </form>

      <div className="auth-footer">
        {t('login_no_account')} <Link href="/signup">{t('login_create')}</Link>
      </div>
    </AuthCard>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
