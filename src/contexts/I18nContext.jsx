import { createContext, useContext, useEffect, useMemo, useState } from 'react'

import { DEFAULT_LANGUAGE, LANGUAGE_OPTIONS, TRANSLATIONS } from '../constants/i18n.js'
import { useAuth } from './AuthContext.jsx'

const STORAGE_KEY = 'dpm-language'
const I18nContext = createContext(null)

function normalizeLanguage(value) {
  return LANGUAGE_OPTIONS.some((option) => option.value === value) ? value : DEFAULT_LANGUAGE
}

export function I18nProvider({ children }) {
  const { profile } = useAuth()
  const [language, setLanguageState] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_LANGUAGE
    return normalizeLanguage(window.localStorage.getItem(STORAGE_KEY) || DEFAULT_LANGUAGE)
  })

  useEffect(() => {
    if (!profile) return
    const nextLanguage = normalizeLanguage(profile.preferred_language || language)
    setLanguageState(nextLanguage)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, nextLanguage)
    }
  }, [profile?.preferred_language])

  const value = useMemo(() => ({
    language,
    languages: LANGUAGE_OPTIONS,
    setLanguage: (nextLanguage) => {
      const normalized = normalizeLanguage(nextLanguage)
      setLanguageState(normalized)
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, normalized)
      }
    },
    t: (key) => TRANSLATIONS[language]?.[key] ?? TRANSLATIONS.en?.[key] ?? TRANSLATIONS[DEFAULT_LANGUAGE]?.[key] ?? key,
  }), [language])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}
