import { createContext, useContext, useEffect, useMemo, useState } from 'react'

import { DEFAULT_LANGUAGE, LANGUAGE_OPTIONS, TRANSLATIONS } from '../constants/i18n.js'
import { useAuth } from './AuthContext.jsx'

export const APP_LANGUAGE_STORAGE_KEY = 'app_language'
const LEGACY_STORAGE_KEY = 'dpm-language'
const I18nContext = createContext(null)

function normalizeLanguage(value) {
  return LANGUAGE_OPTIONS.some((option) => option.value === value) ? value : DEFAULT_LANGUAGE
}

function getStoredLanguage() {
  if (typeof window === 'undefined') return null
  const stored = window.localStorage.getItem(APP_LANGUAGE_STORAGE_KEY)
  if (stored) return normalizeLanguage(stored)

  const legacyStored = window.localStorage.getItem(LEGACY_STORAGE_KEY)
  return legacyStored ? normalizeLanguage(legacyStored) : null
}

function persistLanguage(value) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(APP_LANGUAGE_STORAGE_KEY, value)
  window.localStorage.removeItem(LEGACY_STORAGE_KEY)
}

function resolveLanguageFromCountry(countryCode) {
  return String(countryCode || '').toUpperCase() === 'JP' ? 'ja' : 'en'
}

export function I18nProvider({ children }) {
  const { profile } = useAuth()
  const [language, setLanguageState] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_LANGUAGE
    return getStoredLanguage() || DEFAULT_LANGUAGE
  })

  useEffect(() => {
    let cancelled = false

    if (typeof window === 'undefined') return undefined
    if (profile?.preferred_language) return undefined

    const storedLanguage = getStoredLanguage()
    if (storedLanguage) {
      if (storedLanguage !== language) {
        setLanguageState(storedLanguage)
      }
      persistLanguage(storedLanguage)
      return undefined
    }

    async function detectLanguageFromCountry() {
      try {
        const response = await fetch('/api/locale')
        if (!response.ok) return
        const payload = await response.json().catch(() => null)
        if (cancelled) return

        const detectedLanguage = normalizeLanguage(resolveLanguageFromCountry(payload?.country))
        setLanguageState(detectedLanguage)
        persistLanguage(detectedLanguage)
      } catch {
        // Keep the default language when the country lookup fails.
      }
    }

    detectLanguageFromCountry()

    return () => {
      cancelled = true
    }
  }, [profile?.preferred_language])

  useEffect(() => {
    if (!profile) return
    const nextLanguage = normalizeLanguage(profile.preferred_language || language)
    setLanguageState(nextLanguage)
    persistLanguage(nextLanguage)
  }, [profile?.preferred_language])

  useEffect(() => {
    if (typeof document === 'undefined') return
    document.documentElement.lang = language
  }, [language])

  const value = useMemo(() => ({
    language,
    languages: LANGUAGE_OPTIONS,
    setLanguage: (nextLanguage) => {
      const normalized = normalizeLanguage(nextLanguage)
      setLanguageState(normalized)
      persistLanguage(normalized)
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
