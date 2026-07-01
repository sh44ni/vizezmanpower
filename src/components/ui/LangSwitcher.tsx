'use client'

import { useLanguage } from '@/lib/language'

export function LangSwitcher({ className = '' }: { className?: string }) {
  const { lang, setLang } = useLanguage()

  return (
    <div className={`lang-switcher ${className}`} role="group" aria-label="Language selector">
      <button
        className={`lang-switcher-btn${lang === 'en' ? ' lang-switcher-btn--active' : ''}`}
        onClick={() => setLang('en')}
        aria-pressed={lang === 'en'}
        id="lang-en-btn"
      >
        EN
      </button>
      <span className="lang-switcher-sep" aria-hidden="true" />
      <button
        className={`lang-switcher-btn${lang === 'ar' ? ' lang-switcher-btn--active' : ''}`}
        onClick={() => setLang('ar')}
        aria-pressed={lang === 'ar'}
        id="lang-ar-btn"
      >
        عر
      </button>
    </div>
  )
}
