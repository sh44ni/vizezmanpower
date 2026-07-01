'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AuthCard } from '@/components/auth/AuthCard'
import { FormField } from '@/components/auth/FormField'
import { useLanguage } from '@/lib/language'

export default function SignupPage() {
  const router = useRouter()
  const { t } = useLanguage()

  const [form, setForm] = useState({
    fullName: '', agencyName: '', email: '', phone: '', password: '', confirmPassword: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.fullName.trim() || form.fullName.trim().length < 2) e.fullName = t('val_fullname_short')
    if (!form.agencyName.trim() || form.agencyName.trim().length < 2) e.agencyName = t('val_agencyname_short')
    if (!form.email) e.email = t('val_email_required')
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = t('val_email_invalid')
    if (!form.password) e.password = t('val_password_required')
    else if (form.password.length < 8) e.password = t('val_password_length')
    else if (!/[A-Z]/.test(form.password)) e.password = t('val_password_uppercase')
    else if (!/[0-9]/.test(form.password)) e.password = t('val_password_number')
    if (!form.confirmPassword) e.confirmPassword = t('val_confirm_required')
    else if (form.password !== form.confirmPassword) e.confirmPassword = t('val_confirm_mismatch')
    return e
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    setErrors({})

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()

      if (!res.ok) {
        if (data.details) {
          const fieldErrors: Record<string, string> = {}
          for (const [k, v] of Object.entries(data.details)) {
            fieldErrors[k] = Array.isArray(v) ? (v as string[])[0] : String(v)
          }
          setErrors(fieldErrors)
        } else {
          setErrors({ form: data.error ?? t('err_signup_failed') })
        }
        return
      }

      router.push(`/verify-email?email=${encodeURIComponent(form.email)}`)
    } catch {
      setErrors({ form: t('err_connection') })
    } finally {
      setLoading(false)
    }
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [k]: e.target.value }))
    if (errors[k]) setErrors(er => { const n = { ...er }; delete n[k]; return n })
  }

  return (
    <AuthCard title={t('signup_title')} subtitle={t('signup_subtitle')}>
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {errors.form && (
          <div className="auth-message auth-message--error" role="alert">
            <span className="auth-message-icon">!</span>
            <span>{errors.form}</span>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FormField id="fullName" label={t('field_full_name')} placeholder={t('field_full_name_placeholder')}
            value={form.fullName} onChange={set('fullName')} error={errors.fullName} required autoComplete="name" />
          <FormField id="agencyName" label={t('field_agency_name')} placeholder={t('field_agency_placeholder')}
            value={form.agencyName} onChange={set('agencyName')} error={errors.agencyName} required />
        </div>

        <FormField id="email" label={t('field_email')} type="email" placeholder={t('field_email_placeholder')}
          value={form.email} onChange={set('email')} error={errors.email} required autoComplete="email" />

        <FormField id="phone" label={t('field_phone')} type="tel" placeholder="+966 5x xxx xxxx"
          value={form.phone} onChange={set('phone')} autoComplete="tel" />

        <FormField id="password" label={t('field_password')} type={showPass ? 'text' : 'password'}
          placeholder={t('field_password_placeholder')}
          value={form.password} onChange={set('password')} error={errors.password} required autoComplete="new-password"
          rightElement={
            <button type="button" onClick={() => setShowPass(s => !s)}
              className="form-toggle-pass"
              aria-label={showPass ? t('field_password_hide') : t('field_password_show')}>
              {showPass ? t('field_password_hide') : t('field_password_show')}
            </button>
          }
        />

        <FormField id="confirmPassword" label={t('field_confirm_password')}
          type={showPass ? 'text' : 'password'} placeholder="••••••••"
          value={form.confirmPassword} onChange={set('confirmPassword')}
          error={errors.confirmPassword} required autoComplete="new-password" />

        <button type="submit" className="auth-btn" disabled={loading} id="signup-submit-btn">
          {loading ? <><span className="spinner" />{t('signup_creating')}</> : t('signup_btn')}
        </button>
      </form>

      <div className="auth-footer">
        {t('signup_have_account')} <Link href="/login">{t('signup_sign_in')}</Link>
      </div>
    </AuthCard>
  )
}
