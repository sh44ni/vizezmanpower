'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/lib/language'

// ─── Feature card data (icon + key pair) ───────────────────────────────────
const FEATURES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <rect x="5" y="2" width="14" height="20" rx="2" />
        <line x1="12" y1="18" x2="12.01" y2="18" />
      </svg>
    ),
    titleKey: 'landing_feature_mobile_title' as const,
    descKey: 'landing_feature_mobile_desc' as const,
    gradient: 'from-violet-500 to-purple-600',
    glow: 'rgba(139,92,246,0.25)',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
    titleKey: 'landing_feature_multilingual_title' as const,
    descKey: 'landing_feature_multilingual_desc' as const,
    gradient: 'from-cyan-500 to-blue-600',
    glow: 'rgba(6,182,212,0.25)',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="9" y1="15" x2="15" y2="15" />
        <line x1="9" y1="11" x2="15" y2="11" />
      </svg>
    ),
    titleKey: 'landing_feature_visa_title' as const,
    descKey: 'landing_feature_visa_desc' as const,
    gradient: 'from-indigo-500 to-violet-600',
    glow: 'rgba(99,102,241,0.25)',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
    titleKey: 'landing_feature_secure_title' as const,
    descKey: 'landing_feature_secure_desc' as const,
    gradient: 'from-emerald-500 to-teal-600',
    glow: 'rgba(16,185,129,0.25)',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
    ),
    titleKey: 'landing_feature_pdf_title' as const,
    descKey: 'landing_feature_pdf_desc' as const,
    gradient: 'from-orange-500 to-amber-600',
    glow: 'rgba(245,158,11,0.25)',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    titleKey: 'landing_feature_tracking_title' as const,
    descKey: 'landing_feature_tracking_desc' as const,
    gradient: 'from-pink-500 to-rose-600',
    glow: 'rgba(236,72,153,0.25)',
  },
]

// ─── Animated floating orb ─────────────────────────────────────────────────
function Orb({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`absolute rounded-full blur-3xl pointer-events-none ${className}`}
      style={style}
    />
  )
}

// ─── Feature Card ─────────────────────────────────────────────────────────
function FeatureCard({
  icon,
  title,
  desc,
  gradient,
  glow,
  index,
}: {
  icon: React.ReactNode
  title: string
  desc: string
  gradient: string
  glow: string
  index: number
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className="relative group rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm p-6 transition-all duration-500 cursor-default"
      style={{
        animationDelay: `${index * 80}ms`,
        boxShadow: hovered ? `0 0 40px ${glow}` : '0 0 0px transparent',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'transform 0.35s ease, box-shadow 0.35s ease, border-color 0.35s ease',
        borderColor: hovered ? 'rgba(255,255,255,0.15)' : undefined,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Icon circle */}
      <div
        className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} mb-4 text-white shadow-lg`}
      >
        {icon}
      </div>

      <h3 className="font-semibold text-white text-base mb-2 leading-snug">{title}</h3>
      <p className="text-sm text-white/50 leading-relaxed">{desc}</p>

      {/* Shine on hover */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 0%, ${glow} 0%, transparent 70%)`,
        }}
      />
    </div>
  )
}

// ─── Step card ────────────────────────────────────────────────────────────
function StepCard({
  num,
  title,
  desc,
  isLast,
}: {
  num: string
  title: string
  desc: string
  isLast: boolean
}) {
  return (
    <div className="relative flex flex-col items-center text-center px-4">
      {/* Number badge */}
      <div className="relative mb-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/30 flex items-center justify-center">
          <span className="font-bold text-2xl bg-gradient-to-br from-indigo-400 to-violet-400 bg-clip-text text-transparent">
            {num}
          </span>
        </div>
        {/* Connector line (hidden on last) */}
        {!isLast && (
          <div className="hidden md:block absolute top-8 left-[calc(100%+1rem)] w-[calc(100%-2rem)] h-px bg-gradient-to-r from-indigo-500/40 to-transparent" style={{ width: '100%', left: '4rem' }} />
        )}
      </div>
      <h3 className="font-semibold text-white text-base mb-2">{title}</h3>
      <p className="text-sm text-white/50 leading-relaxed max-w-[220px]">{desc}</p>
    </div>
  )
}

// ─── Main Landing Page ────────────────────────────────────────────────────
export default function LandingPage() {
  const { t, lang, setLang, isRTL } = useLanguage()
  const [scrolled, setScrolled] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const steps = [
    { num: t('landing_step1_num'), title: t('landing_step1_title'), desc: t('landing_step1_desc') },
    { num: t('landing_step2_num'), title: t('landing_step2_title'), desc: t('landing_step2_desc') },
    { num: t('landing_step3_num'), title: t('landing_step3_title'), desc: t('landing_step3_desc') },
  ]

  return (
    <div
      className="relative min-h-screen bg-[#050507] text-white overflow-x-hidden font-[var(--font-outfit)]"
      dir={isRTL ? 'rtl' : 'ltr'}
      style={{ fontFamily: isRTL ? 'var(--font-arabic)' : 'var(--font-outfit)' }}
    >
      {/* ── Ambient background orbs ── */}
      <Orb
        className="w-[600px] h-[600px] -top-48 -left-32 opacity-30 animate-[pulse_8s_ease-in-out_infinite]"
        style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)' }}
      />
      <Orb
        className="w-[500px] h-[500px] top-1/3 -right-24 opacity-20 animate-[pulse_10s_ease-in-out_infinite_2s]"
        style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)' }}
      />
      <Orb
        className="w-[400px] h-[400px] bottom-1/4 left-1/4 opacity-15 animate-[pulse_12s_ease-in-out_infinite_4s]"
        style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)' }}
      />

      {/* Grid overlay */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* ─────────────── NAVBAR ─────────────── */}
      <header
        className="fixed top-0 inset-x-0 z-50 transition-all duration-300"
        style={{
          background: scrolled
            ? 'rgba(5,5,7,0.85)'
            : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo — compact inline lockup for navbar */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Compact bolt icon extracted from VizezManpowerLogo SVG */}
            <svg
              viewBox="0 0 210 234"
              width="28"
              height="28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path fill="#fff" d="M52.71,124,137.8,0c-3.37,0-6.17,0-9,0-35,.27-70.1.21-105.14.13-2.2,0-4.4,0-6.59.13A16.34,16.34,0,0,0,7.9,3.47C3.34,7.09.34,11.63.07,17.64,0,19.28,0,20.93,0,22.58Q0,79.82,0,137.06c0,14.27-.1,28.55,0,42.83a18.84,18.84,0,0,0,12.27,17.55,25.87,25.87,0,0,0,10,1.42L89,198.77l3,0c2.55,0,2.27.27,3.18-2.39.8-2.34,1.46-4.71,2.26-7.05q5.61-16.47,11.25-32.94,4.32-12.7,8.57-25.45a35.94,35.94,0,0,0,2-6.93Z"/>
              <path fill="#fff" d="M92.5,232.7l.62.42L209,81.38a3.35,3.35,0,0,0-2.53-.42c-8.51.24-17-.36-25.51-.12-9.69.27-19.39-.08-29.09-.17-2.44,0-2.45,0-2.51-2.41,0-.46,0-.92,0-1.37q0-37.2,0-74.4c0-.57.34-1.25-.29-1.75C146.69,3,71.15,112.91,70.51,114.92a3.59,3.59,0,0,0,2.12.23q8.22.07,16.45.09,19.5,0,39,0c3.37,0,4.58-1,2.87,4q-10.71,31.41-21.31,62.85-6.77,20-13.48,40C95,225.66,93.71,229.18,92.5,232.7Z"/>
              <path fill="#d7ac4e" d="M92.5,232.7c1.21-3.52,2.45-7,3.64-10.57q6.75-20,13.48-40,10.62-31.43,21.31-62.85c1.71-5,.5-4-2.87-4q-19.49,0-39,0-8.22,0-16.45-.09a3.59,3.59,0,0,1-2.12-.23C71.15,112.91,146.69,3,149,.74c.63.5.29,1.18.29,1.75q0,37.2,0,74.4c0,.45,0,.91,0,1.37.06,2.37.07,2.38,2.51,2.41,9.7.09,19.4.44,29.09.17,8.51-.24,17,.36,25.51.12a3.35,3.35,0,0,1,2.53.42L93.12,233.12Z"/>
            </svg>
            <div className="flex flex-col leading-none">
              <span className="text-sm font-extrabold tracking-widest text-white">VIZEZ</span>
              <span className="text-[9px] tracking-widest text-[#d7ac4e]/80 uppercase font-medium">Manpower</span>
            </div>
          </div>

          {/* Nav actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language toggle */}
            <button
              onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
              className="relative h-8 px-3 rounded-lg border border-white/10 bg-white/5 text-xs font-semibold text-white/70 hover:text-white hover:border-white/20 hover:bg-white/10 transition-all duration-200 flex items-center gap-1.5"
              aria-label="Toggle language"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 opacity-70">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.328A6.022 6.022 0 014.332 8.027z" clipRule="evenodd" />
              </svg>
              {lang === 'en' ? 'العربية' : 'English'}
            </button>

            {/* Login */}
            <Link
              href="/login"
              className="h-8 px-4 rounded-lg border border-white/15 bg-white/5 text-xs font-semibold text-white/80 hover:text-white hover:bg-white/10 hover:border-white/25 transition-all duration-200 flex items-center"
            >
              {t('landing_nav_login')}
            </Link>

            {/* Sign up */}
            <Link
              href="/signup"
              className="h-8 px-4 rounded-lg text-xs font-bold text-white flex items-center transition-all duration-200 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%)',
                boxShadow: '0 0 20px rgba(99,102,241,0.4)',
              }}
            >
              {t('landing_nav_signup')}
            </Link>
          </div>
        </div>
      </header>

      {/* ─────────────── HERO ─────────────── */}
      <section
        ref={heroRef}
        className="relative pt-32 pb-24 px-4 sm:px-6 flex flex-col items-center text-center"
      >
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-xs font-semibold text-indigo-300 mb-8 animate-[fadeInUp_0.6s_ease_forwards]"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          {t('landing_hero_tag')}
        </div>

        {/* Headline */}
        <h1
          className="max-w-3xl mx-auto text-4xl sm:text-5xl md:text-6xl font-extrabold leading-[1.1] tracking-tight mb-6 animate-[fadeInUp_0.7s_ease_forwards_0.1s] opacity-0"
          style={{ animationFillMode: 'forwards' }}
        >
          <span
            style={{
              background: 'linear-gradient(135deg, #fff 30%, #a78bfa 60%, #67e8f9 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {t('landing_hero_title')}
          </span>
        </h1>

        {/* Sub */}
        <p
          className="max-w-xl mx-auto text-base sm:text-lg text-white/55 leading-relaxed mb-10 animate-[fadeInUp_0.7s_ease_forwards_0.2s] opacity-0"
          style={{ animationFillMode: 'forwards' }}
        >
          {t('landing_hero_sub')}
        </p>

        {/* CTAs */}
        <div
          className="flex flex-col sm:flex-row items-center gap-3 animate-[fadeInUp_0.7s_ease_forwards_0.3s] opacity-0"
          style={{ animationFillMode: 'forwards' }}
        >
          <Link
            href="/signup"
            className="group relative inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm text-white transition-all duration-300 hover:scale-[1.03] active:scale-[0.97]"
            style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)',
              boxShadow: '0 0 30px rgba(99,102,241,0.5), 0 4px 24px rgba(0,0,0,0.4)',
            }}
          >
            {t('landing_cta_signup')}
            <svg viewBox="0 0 20 20" fill="currentColor" className={`w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5 ${isRTL ? 'rotate-180' : ''}`}>
              <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Link>

          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm text-white/70 border border-white/10 bg-white/5 hover:text-white hover:border-white/20 hover:bg-white/10 transition-all duration-300"
          >
            {t('landing_cta_login')}
          </Link>
        </div>

        {/* Floating dashboard mockup glow */}
        <div className="relative mt-20 w-full max-w-4xl mx-auto">
          {/* Glow plate */}
          <div
            className="absolute inset-x-8 top-0 h-32 blur-2xl opacity-40 rounded-full"
            style={{ background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #06b6d4)' }}
          />
          {/* Mock UI card */}
          <div
            className="relative rounded-2xl border border-white/[0.08] overflow-hidden"
            style={{
              background: 'linear-gradient(160deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)',
            }}
          >
            {/* Fake browser bar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
              </div>
              <div className="flex-1 mx-4 h-5 rounded-md bg-white/[0.05] flex items-center px-3">
                <span className="text-[10px] text-white/30">manpower.vizez.com/dashboard</span>
              </div>
            </div>

            {/* Fake dashboard content */}
            <div className="p-6 grid grid-cols-3 gap-3 sm:grid-cols-3">
              {[
                { label: 'Submissions', value: '247', color: 'from-indigo-500 to-violet-600' },
                { label: 'Remaining', value: '53', color: 'from-cyan-500 to-blue-600' },
                { label: 'Plan', value: 'Pro', color: 'from-emerald-500 to-teal-600' },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
                  <div className={`text-lg sm:text-2xl font-bold bg-gradient-to-br ${stat.color} bg-clip-text text-transparent`}>
                    {stat.value}
                  </div>
                  <div className="text-[10px] sm:text-xs text-white/40 mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="px-6 pb-6 grid grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 rounded-lg bg-white/[0.03] border border-white/[0.05] flex items-center px-3 gap-2">
                  <div className="w-4 h-4 rounded bg-white/10 shrink-0" />
                  <div className="h-2 rounded bg-white/[0.08] flex-1" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────── FEATURES ─────────────── */}
      <section className="relative py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 tracking-tight">
              {t('landing_features_title')}
            </h2>
            <p className="text-white/50 text-base max-w-xl mx-auto leading-relaxed">
              {t('landing_features_sub')}
            </p>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <FeatureCard
                key={f.titleKey}
                icon={f.icon}
                title={t(f.titleKey)}
                desc={t(f.descKey)}
                gradient={f.gradient}
                glow={f.glow}
                index={i}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────── HOW IT WORKS ─────────────── */}
      <section className="relative py-24 px-4 sm:px-6">
        {/* Horizontal gradient separator */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 tracking-tight">
              {t('landing_how_title')}
            </h2>
            <p className="text-white/50 text-base max-w-md mx-auto leading-relaxed">
              {t('landing_how_sub')}
            </p>
          </div>

          {/* Steps */}
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-4">
            {/* Connecting line (desktop) */}
            <div className="hidden md:block absolute top-8 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-px bg-gradient-to-r from-indigo-500/30 via-violet-500/30 to-indigo-500/30" />

            {steps.map((step, i) => (
              <StepCard
                key={step.num}
                num={step.num}
                title={step.title}
                desc={step.desc}
                isLast={i === steps.length - 1}
              />
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="flex justify-center mt-16">
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-sm text-white transition-all duration-300 hover:scale-[1.03] active:scale-[0.97]"
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)',
                boxShadow: '0 0 30px rgba(99,102,241,0.4), 0 4px 24px rgba(0,0,0,0.4)',
              }}
            >
              {t('landing_cta_signup')}
              <svg viewBox="0 0 20 20" fill="currentColor" className={`w-4 h-4 group-hover:translate-x-0.5 transition-transform ${isRTL ? 'rotate-180' : ''}`}>
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ─────────────── FOOTER ─────────────── */}
      <footer className="relative py-10 px-4 sm:px-6 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <svg viewBox="0 0 210 234" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path fill="#fff" d="M52.71,124,137.8,0c-3.37,0-6.17,0-9,0-35,.27-70.1.21-105.14.13-2.2,0-4.4,0-6.59.13A16.34,16.34,0,0,0,7.9,3.47C3.34,7.09.34,11.63.07,17.64,0,19.28,0,20.93,0,22.58Q0,79.82,0,137.06c0,14.27-.1,28.55,0,42.83a18.84,18.84,0,0,0,12.27,17.55,25.87,25.87,0,0,0,10,1.42L89,198.77l3,0c2.55,0,2.27.27,3.18-2.39.8-2.34,1.46-4.71,2.26-7.05q5.61-16.47,11.25-32.94,4.32-12.7,8.57-25.45a35.94,35.94,0,0,0,2-6.93Z"/>
              <path fill="#fff" d="M92.5,232.7l.62.42L209,81.38a3.35,3.35,0,0,0-2.53-.42c-8.51.24-17-.36-25.51-.12-9.69.27-19.39-.08-29.09-.17-2.44,0-2.45,0-2.51-2.41,0-.46,0-.92,0-1.37q0-37.2,0-74.4c0-.57.34-1.25-.29-1.75C146.69,3,71.15,112.91,70.51,114.92a3.59,3.59,0,0,0,2.12.23q8.22.07,16.45.09,19.5,0,39,0c3.37,0,4.58-1,2.87,4q-10.71,31.41-21.31,62.85-6.77,20-13.48,40C95,225.66,93.71,229.18,92.5,232.7Z"/>
              <path fill="#d7ac4e" d="M92.5,232.7c1.21-3.52,2.45-7,3.64-10.57q6.75-20,13.48-40,10.62-31.43,21.31-62.85c1.71-5,.5-4-2.87-4q-19.49,0-39,0-8.22,0-16.45-.09a3.59,3.59,0,0,1-2.12-.23C71.15,112.91,146.69,3,149,.74c.63.5.29,1.18.29,1.75q0,37.2,0,74.4c0,.45,0,.91,0,1.37.06,2.37.07,2.38,2.51,2.41,9.7.09,19.4.44,29.09.17,8.51-.24,17,.36,25.51.12a3.35,3.35,0,0,1,2.53.42L93.12,233.12Z"/>
            </svg>
            <div className="flex flex-col leading-none">
              <span className="text-xs font-extrabold tracking-widest text-white">VIZEZ</span>
              <span className="text-[9px] text-[#d7ac4e]/70 tracking-widest uppercase font-medium">Manpower</span>
            </div>
          </div>

          <p className="text-xs text-white/30 text-center">{t('landing_footer_tagline')}</p>

          <p className="text-xs text-white/25">{t('landing_footer_copy')}</p>
        </div>
      </footer>

      {/* ── Keyframe animations (injected once) ── */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
