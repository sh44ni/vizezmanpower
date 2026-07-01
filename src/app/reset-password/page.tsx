'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AuthCard } from '@/components/auth/AuthCard'
import { FormField } from '@/components/auth/FormField'
import { useLanguage } from '@/lib/language'
import toast from 'react-hot-toast'

function ResetForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useLanguage()
  const token = searchParams.get('token') ?? ''

  const [form, setForm] = useState({ password: '', confirmPassword: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.password) e.password = t('val_password_required')
    else if (form.password.length < 8) e.password = t('val_password_length')
    else if (!/[A-Z]/.test(form.password)) e.password = t('val_password_uppercase')
    else if (!/[0-9]/.test(form.password)) e.password = t('val_password_number')
    if (form.password !== form.confirmPassword) e.confirmPassword = t('val_confirm_mismatch')
    return e
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) { setErrors({ form: t('err_reset_link') }); return }
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    setErrors({})

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, ...form }),
      })
      const data = await res.json()

      if (!res.ok) {
        setErrors({ form: data.error ?? t('err_reset_failed') })
        return
      }

      toast.success(t('reset_success'))
      router.push('/login')
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

  if (!token) {
    return (
      <AuthCard title={t('reset_invalid_title')} subtitle="">
        <div className="auth-message auth-message--error">
          <span className="auth-message-icon">!</span>
          <span>{t('reset_invalid_msg')}</span>
        </div>
        <div className="auth-footer" style={{ marginTop: 20 }}>
          <Link href="/forgot-password">{t('reset_request_new')}</Link>
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard title={t('reset_title')} subtitle={t('reset_subtitle')}>
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {errors.form && (
          <div className="auth-message auth-message--error" role="alert">
            <span className="auth-message-icon">!</span><span>{errors.form}</span>
          </div>
        )}

        <FormField id="password" label={t('field_new_password')} type={showPass ? 'text' : 'password'}
          placeholder={t('field_password_placeholder')}
          value={form.password} onChange={set('password')} error={errors.password} required
          autoComplete="new-password"
          rightElement={
            <button type="button" onClick={() => setShowPass(s => !s)}
              className="form-toggle-pass"
              aria-label={showPass ? t('field_password_hide') : t('field_password_show')}>
              {showPass ? t('field_password_hide') : t('field_password_show')}
            </button>
          }
        />

        <FormField id="confirmPassword" label={t('field_confirm_new_password')}
          type={showPass ? 'text' : 'password'} placeholder="••••••••"
          value={form.confirmPassword} onChange={set('confirmPassword')}
          error={errors.confirmPassword} required autoComplete="new-password" />

        <button type="submit" className="auth-btn" disabled={loading} id="reset-submit-btn">
          {loading ? <><span className="spinner" />{t('reset_resetting')}</> : t('reset_btn')}
        </button>
      </form>

      <div className="auth-footer">
        <Link href="/login">← {t('reset_back')}</Link>
      </div>
    </AuthCard>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<AuthCard title="..." subtitle=""><div className="spinner" /></AuthCard>}>
      <ResetForm />
    </Suspense>
  )
}
