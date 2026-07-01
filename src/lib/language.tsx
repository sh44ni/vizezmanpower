'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { translations, type Lang, type TranslationKey } from './translations'

interface LanguageContextValue {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: TranslationKey) => string
  dir: 'ltr' | 'rtl'
  isRTL: boolean
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'en',
  setLang: () => {},
  t: (key) => translations.en[key],
  dir: 'ltr',
  isRTL: false,
})

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en')

  // Hydrate from localStorage or browser language on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('vizez-lang') as Lang | null
      if (stored === 'ar' || stored === 'en') {
        setLangState(stored)
      } else {
        const browserLang = navigator.language || (navigator as any).userLanguage
        if (browserLang.startsWith('ar')) {
          setLangState('ar')
        }
      }
    } catch {}
  }, [])

  // Keep <html lang> and <html dir> in sync
  useEffect(() => {
    const html = document.documentElement
    html.setAttribute('lang', lang)
    html.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr')
  }, [lang])

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    try { localStorage.setItem('vizez-lang', l) } catch {}
  }, [])

  const t = useCallback(
    (key: TranslationKey): string => translations[lang][key] as string,
    [lang],
  )

  const isRTL = lang === 'ar'
  const dir: 'ltr' | 'rtl' = isRTL ? 'rtl' : 'ltr'

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, dir, isRTL }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
