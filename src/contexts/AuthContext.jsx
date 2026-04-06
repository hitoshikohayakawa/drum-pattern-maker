import { createContext, useContext, useEffect, useMemo, useState } from 'react'

import { isSupabaseConfigured, supabase } from '../utils/supabaseClient'
import { normalizeUsername } from '../utils/profileUtils'

const AuthContext = createContext(null)

async function fetchProfile(userId) {
  if (!supabase || !userId) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [isAuthLoading, setIsAuthLoading] = useState(isSupabaseConfigured)
  const [isProfileLoading, setIsProfileLoading] = useState(false)
  const [authError, setAuthError] = useState('')

  const persistProfile = async (payload) => {
    const { error } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'id' })

    if (!error) return

    // Graceful fallback while environments are catching up with the language migration.
    if (String(error.message || '').includes('preferred_language')) {
      const fallbackPayload = { ...payload }
      delete fallbackPayload.preferred_language
      const retry = await supabase
        .from('profiles')
        .upsert(fallbackPayload, { onConflict: 'id' })
      if (retry.error) throw retry.error
      return
    }

    throw error
  }

  const loadProfile = async (userId) => {
    if (!supabase || !userId) {
      setProfile(null)
      return null
    }

    setIsProfileLoading(true)
    setAuthError('')

    try {
      const nextProfile = await fetchProfile(userId)
      setProfile(nextProfile)
      return nextProfile
    } catch (error) {
      setProfile(null)
      setAuthError(error.message || 'プロフィールの取得に失敗しました。')
      return null
    } finally {
      setIsProfileLoading(false)
    }
  }

  useEffect(() => {
    let isMounted = true

    if (!isSupabaseConfigured || !supabase) {
      setIsAuthLoading(false)
      return undefined
    }

    async function initializeAuth() {
      setIsAuthLoading(true)
      setAuthError('')

      const { data, error } = await supabase.auth.getSession()

      if (!isMounted) return

      if (error) {
        setAuthError(error.message || '認証セッションの取得に失敗しました。')
        setSession(null)
        setProfile(null)
        setIsAuthLoading(false)
        return
      }

      setSession(data.session)

      if (data.session?.user?.id) {
        await loadProfile(data.session.user.id)
      } else {
        setProfile(null)
      }

      if (isMounted) {
        setIsAuthLoading(false)
      }
    }

    initializeAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setIsAuthLoading(false)

      if (nextSession?.user?.id) {
        loadProfile(nextSession.user.id)
      } else {
        setProfile(null)
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const value = useMemo(() => {
    const user = session?.user ?? null
    const needsOnboarding = Boolean(user) && !profile?.username

    return {
      isSupabaseConfigured,
      session,
      user,
      profile,
      needsOnboarding,
      isAuthLoading,
      isProfileLoading,
      authError,
      refreshProfile: () => loadProfile(user?.id),
      saveProfile: async (payload) => {
        if (!supabase || !user?.id) {
          throw new Error('ログイン状態を確認できません。')
        }

        const username = normalizeUsername(payload?.username || profile?.username || '')
        if (!username) {
          throw new Error('ユーザー名が未設定です。')
        }

        const nextPayload = {
          id: user.id,
          username,
          display_name: (payload?.display_name || username).trim(),
          avatar_url: payload?.avatar_url || '',
          preferred_language: payload?.preferred_language || profile?.preferred_language || 'ja',
        }

        await persistProfile(nextPayload)

        await loadProfile(user.id)
      },
      signInWithGoogle: async () => {
        if (!supabase) {
          throw new Error('Supabase が未設定です。')
        }

        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/onboarding`,
          },
        })

        if (error) throw error
      },
      signOut: async () => {
        if (!supabase) return
        const { error } = await supabase.auth.signOut()
        if (error) throw error
      },
      deleteAccount: async () => {
        if (!supabase || !user?.id) {
          throw new Error('ログイン状態を確認できません。')
        }

        const { error } = await supabase.rpc('delete_my_account')
        if (error) {
          throw error
        }

        setProfile(null)
        setSession(null)
      },
    }
  }, [session, profile, isAuthLoading, isProfileLoading, authError])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
