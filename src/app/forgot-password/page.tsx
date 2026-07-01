'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AuthCard } from '@/components/auth/AuthCard'
import { FormField } from '@/components/auth/FormField'
import { useLanguage } from '@/lib/language'

export default function ForgotPasswordPage() {
  const { t } = useLanguage()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(t('val_email_valid'))
      return
    }

    setLoading(true)
    setError('')

    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setSent(true)
    } catch {
      setError(t('err_connection'))
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <AuthCard title={t('forgot_sent_title')} subtitle="">
        <div className="auth-message auth-message--success" style={{ marginBottom: 20 }}>
          <span className="auth-message-icon auth-message-icon--mail">@</span>
          <div>
            <strong>{t('forgot_sent_label')}</strong>
            <p style={{ margin: '4px 0 0', fontSize: 13, opacity: 0.9 }}>
              {t('forgot_sent_msg')} <strong>{email}</strong> — {t('forgot_sent_msg2')}
            </p>
          </div>
        </div>
        <div className="auth-footer">
          <Link href="/login">← {t('forgot_back')}</Link>
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard title={t('forgot_title')} subtitle={t('forgot_subtitle')}>
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {error && (
          <div className="auth-message auth-message--error" role="alert">
            <span className="auth-message-icon">!</span><span>{error}</span>
          </div>
        )}

        <FormField
          id="email"
          label={t('field_email')}
          type="email"
          placeholder={t('field_email_placeholder')}
          value={email}
          onChange={e => { setEmail(e.target.value); setError('') }}
          error={error && !email ? error : ''}
          required
          autoComplete="email"
        />

        <button type="submit" className="auth-btn" disabled={loading} id="forgot-submit-btn">
          {loading ? <><span className="spinner" />{t('forgot_sending')}</> : t('forgot_btn')}
        </button>
      </form>

      <div className="auth-footer">
        <Link href="/login">← {t('forgot_back')}</Link>
      </div>
    </AuthCard>
  )
}
