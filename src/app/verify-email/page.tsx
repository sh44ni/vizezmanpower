'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { useLanguage } from '@/lib/language'
import { LangSwitcher } from '@/components/ui/LangSwitcher'
import toast from 'react-hot-toast'
import Link from 'next/link'

const OTP_LENGTH = 6
const RESEND_COOLDOWN = 60

/** Map Arabic-Indic (\u0660-\u0669) and Extended Arabic-Indic (\u06f0-\u06f9) digits to Western 0-9 */
function normalizeDigits(s: string): string {
  return s
    .replace(/[\u0660-\u0669]/g, d => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\u06f0-\u06f9]/g, d => String(d.charCodeAt(0) - 0x06f0))
}

function OtpVerifyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useLanguage()
  const email = searchParams.get('email') ?? ''

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [loading, setLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [success, setSuccess] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => { setCooldown(RESEND_COOLDOWN) }, [])

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  useEffect(() => { inputRefs.current[0]?.focus() }, [])

  const handleDigitChange = (index: number, value: string) => {
    const sanitized = normalizeDigits(value).replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[index] = sanitized
    setDigits(next)
    if (sanitized && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus()
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = normalizeDigits(e.clipboardData.getData('text')).replace(/\D/g, '').slice(0, OTP_LENGTH)
    if (!text) return
    const next = [...digits]
    for (let i = 0; i < OTP_LENGTH; i++) next[i] = text[i] ?? ''
    setDigits(next)
    const lastFilled = Math.min(text.length, OTP_LENGTH - 1)
    inputRefs.current[lastFilled]?.focus()
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) inputRefs.current[index - 1]?.focus()
    if (e.key === 'ArrowLeft' && index > 0) inputRefs.current[index - 1]?.focus()
    if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus()
  }

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault()
    const otp = digits.join('')
    if (otp.length < OTP_LENGTH) { toast.error(t('verify_enter_digits')); return }
    if (!email) { toast.error(t('verify_missing_email')); return }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? t('err_invalid_code'))
        setDigits(Array(OTP_LENGTH).fill(''))
        inputRefs.current[0]?.focus()
        return
      }
      setSuccess(true)
      toast.success(t('verify_success'))
      // Auto-login: API sets session cookie; go straight to dashboard
      setTimeout(() => router.push(
        data.redirectTo ?? '/dashboard'
      ), 1200)
    } finally {
      setLoading(false)
    }
  }, [digits, email, router, t])

  useEffect(() => {
    if (digits.every(d => d !== '') && !loading && !success) handleSubmit()
  }, [digits, loading, success, handleSubmit])

  const handleResend = async () => {
    if (cooldown > 0) return
    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      toast.success(t('verify_new_sent'))
      setCooldown(RESEND_COOLDOWN)
      setDigits(Array(OTP_LENGTH).fill(''))
      inputRefs.current[0]?.focus()
    } catch {
      toast.error(t('verify_resend_fail'))
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.18) 0%, transparent 70%), #050507',
      fontFamily: 'var(--font-sans, system-ui, sans-serif)',
      padding: '20px',
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 24,
        padding: '48px 40px',
        width: '100%',
        maxWidth: 440,
        boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
        position: 'relative',
      }}>
        {/* Language Switcher */}
        <div style={{ position: 'absolute', top: 20, right: 20 }}>
          <LangSwitcher />
        </div>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5, color: '#6366f1' }}>{t('brand_name')}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', letterSpacing: 2, marginTop: 3 }}>{t('brand_sub')}</div>
        </div>

        {/* Mail indicator */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 60, height: 60, borderRadius: '50%',
            background: 'rgba(99,102,241,0.15)',
            border: '1.5px solid rgba(99,102,241,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto',
          }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: '#818cf8', fontFamily: 'monospace' }}>@</span>
          </div>
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', textAlign: 'center', margin: '0 0 8px' }}>
          {t('verify_title')}
        </h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', textAlign: 'center', margin: '0 0 32px', lineHeight: 1.6 }}>
          {t('verify_subtitle_1')}<br />
          <span style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>{email || t('verify_subtitle_2')}</span>
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 28 }}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={el => { inputRefs.current[i] = el }}
                type="text"
                inputMode="numeric"
                pattern="\d*"
                maxLength={1}
                value={d}
                onChange={e => handleDigitChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                onPaste={i === 0 ? handlePaste : undefined}
                disabled={loading || success}
                style={{
                  width: 52, height: 60,
                  borderRadius: 12,
                  border: d ? '2px solid rgba(99,102,241,0.7)' : '1.5px solid rgba(255,255,255,0.1)',
                  background: d ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.04)',
                  color: '#fff',
                  fontSize: 26,
                  fontWeight: 700,
                  textAlign: 'center',
                  outline: 'none',
                  transition: 'all 0.15s ease',
                  caretColor: '#6366f1',
                }}
                onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.2)' }}
                onBlur={e => { e.target.style.borderColor = d ? 'rgba(99,102,241,0.7)' : 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none' }}
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading || success || digits.some(d => !d)}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 12,
              border: 'none',
              background: 'linear-gradient(135deg, #6366f1, #818cf8)',
              color: '#fff',
              fontSize: 15,
              fontWeight: 700,
              cursor: loading || success ? 'not-allowed' : 'pointer',
              opacity: digits.some(d => !d) ? 0.5 : 1,
              transition: 'all 0.2s',
              marginBottom: 16,
              letterSpacing: 0.3,
            }}
          >
            {loading ? t('verify_verifying') : success ? `\u2713 ${t('verify_verified')}` : t('verify_btn')}
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
          {t('verify_no_code')}{' '}
          <button
            onClick={handleResend}
            disabled={cooldown > 0}
            style={{
              background: 'none', border: 'none', padding: 0,
              cursor: cooldown > 0 ? 'not-allowed' : 'pointer',
              color: cooldown > 0 ? 'rgba(255,255,255,0.3)' : '#a5b4fc',
              fontWeight: 600, fontSize: 13,
              textDecoration: cooldown > 0 ? 'none' : 'underline',
            }}
          >
            {cooldown > 0 ? `${t('verify_resend_in')} ${cooldown}s` : t('verify_resend')}
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
          <Link href="/signup" style={{ color: 'rgba(255,255,255,0.4)' }}>← {t('verify_back')}</Link>
        </div>
      </div>

      <style>{`
        input[type="text"]::-webkit-inner-spin-button,
        input[type="text"]::-webkit-outer-spin-button { -webkit-appearance: none; }
      `}</style>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#050507', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 36, border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <OtpVerifyContent />
    </Suspense>
  )
}
