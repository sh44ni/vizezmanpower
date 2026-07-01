'use client'

import React from 'react'
import { useLanguage } from '@/lib/language'
import { LangSwitcher } from '@/components/ui/LangSwitcher'

interface AuthCardProps {
  children: React.ReactNode
  title: string
  subtitle?: string
}

export function AuthCard({ children, title, subtitle }: AuthCardProps) {
  const { t } = useLanguage()

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card">
        {/* Language Switcher */}
        <div className="auth-card-lang">
          <LangSwitcher />
        </div>

        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-text">{t('brand_name')}</div>
          <div className="auth-logo-sub">{t('brand_sub')}</div>
        </div>

        <div className="auth-header">
          <h1 className="auth-title">{title}</h1>
          {subtitle && <p className="auth-subtitle">{subtitle}</p>}
        </div>

        {children}
      </div>
    </div>
  )
}
