import { useEffect, useMemo, useState } from 'react'

import { LANGUAGE_OPTIONS } from '../constants/i18n.js'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useI18n } from '../contexts/I18nContext.jsx'
import { fileToDataUrl, getProfileInitial, normalizeUsername } from '../utils/profileUtils'

export default function OnboardingPage({ navigate }) {
  const { profile, saveProfile, user } = useAuth()
  const { language, setLanguage, t } = useI18n()
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [preferredLanguage, setPreferredLanguage] = useState(language)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const suggestedUsername = useMemo(() => {
    const emailPrefix = user?.email?.split('@')[0] || ''
    const metadataName = user?.user_metadata?.full_name || user?.user_metadata?.name || ''
    return normalizeUsername(emailPrefix || metadataName || 'drummer')
  }, [user])

  const suggestedDisplayName = useMemo(() => {
    return user?.user_metadata?.full_name || user?.user_metadata?.name || suggestedUsername
  }, [user, suggestedUsername])

  useEffect(() => {
    if (profile?.username) {
      navigate('/')
      return
    }

    setUsername((current) => current || suggestedUsername)
    setDisplayName((current) => current || suggestedDisplayName)
    setAvatarUrl((current) => current || user?.user_metadata?.avatar_url || user?.user_metadata?.picture || '')
    setPreferredLanguage((current) => current || profile?.preferred_language || language)
  }, [profile, suggestedUsername, suggestedDisplayName, user, navigate])

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setErrorMessage('画像ファイルを選択してください。')
      return
    }

    if (file.size > 1024 * 1024 * 2) {
      setErrorMessage('画像は 2MB 以下にしてください。')
      return
    }

    try {
      const dataUrl = await fileToDataUrl(file)
      setAvatarUrl(dataUrl)
      setErrorMessage('')
    } catch (error) {
      setErrorMessage(error.message || '画像の読み込みに失敗しました。')
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!user?.id) {
      setErrorMessage('ログイン状態を確認できません。')
      return
    }

    const normalizedUsername = normalizeUsername(username)
    if (!normalizedUsername) {
      setErrorMessage('ユーザー名は英数字とアンダースコアで入力してください。')
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')

    try {
      await saveProfile({
        username: normalizedUsername,
        display_name: displayName.trim() || normalizedUsername,
        avatar_url: avatarUrl,
        preferred_language: preferredLanguage,
      })
      setLanguage(preferredLanguage)
      navigate('/')
    } catch (error) {
      setErrorMessage(
        error.code === '23505'
          ? 'そのユーザー名はすでに使われています。'
          : (error.message || 'プロフィール保存に失敗しました。')
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const previewInitial = getProfileInitial(
    { username, display_name: displayName, avatar_url: avatarUrl },
    user
  )

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <p className="panel-kicker">{t('onboarding.kicker')}</p>
        <h2>{t('onboarding.title')}</h2>
        <p>{t('onboarding.body')}</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="avatar-editor">
            <div className="avatar-preview avatar-preview-large">
              {avatarUrl ? <img src={avatarUrl} alt="アバタープレビュー" /> : <span>{previewInitial}</span>}
            </div>
            <div className="avatar-editor-actions">
              <label className="file-upload-button">
                {t('settings.profile.avatarSelect')}
                <input type="file" accept="image/*" onChange={handleAvatarChange} />
              </label>
              {avatarUrl ? (
                <button type="button" className="ghost-button" onClick={() => setAvatarUrl('')}>
                  {t('settings.profile.avatarRemove')}
                </button>
              ) : null}
            </div>
          </div>

          <label htmlFor="username">{t('onboarding.username')}</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="your_name"
            autoComplete="username"
          />
          <p className="editor-hint">{t('onboarding.usernameHint')}</p>

          <label htmlFor="display-name">{t('onboarding.displayName')}</label>
          <input
            id="display-name"
            type="text"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="表示名"
          />

          <label htmlFor="preferred-language">{t('onboarding.language')}</label>
          <select
            id="preferred-language"
            value={preferredLanguage}
            onChange={(event) => {
              setPreferredLanguage(event.target.value)
              setLanguage(event.target.value)
            }}
          >
            {LANGUAGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t('onboarding.saving') : t('onboarding.save')}
          </button>
        </form>

        {errorMessage ? <p className="editor-error">{errorMessage}</p> : null}
      </section>
    </main>
  )
}
