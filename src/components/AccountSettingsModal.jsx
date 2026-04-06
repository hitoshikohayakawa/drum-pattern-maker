import { useEffect, useMemo, useState } from 'react'

import { useAuth } from '../contexts/AuthContext.jsx'
import { useI18n } from '../contexts/I18nContext.jsx'
import { fileToDataUrl, getProfileDisplayName, getProfileInitial } from '../utils/profileUtils'

export default function AccountSettingsModal({ isOpen, onClose }) {
  const { deleteAccount, profile, saveProfile, user } = useAuth()
  const { language, languages, setLanguage, t } = useI18n()
  const localize = (ja, en) => (language === 'ja' ? ja : en)
  const [activeTab, setActiveTab] = useState('profile')
  const [displayName, setDisplayName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState(language)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isSavingLanguage, setIsSavingLanguage] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSendingFeedback, setIsSendingFeedback] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showFeedbackForm, setShowFeedbackForm] = useState(false)
  const [feedbackEmail, setFeedbackEmail] = useState('')
  const [feedbackName, setFeedbackName] = useState('')
  const [feedbackBody, setFeedbackBody] = useState('')
  const [copyLabel, setCopyLabel] = useState('')
  const [feedbackSuccessMessage, setFeedbackSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!isOpen) return
    setActiveTab('profile')
    setDisplayName(profile?.display_name || profile?.username || '')
    setAvatarUrl(profile?.avatar_url || '')
    setSelectedLanguage(profile?.preferred_language || language)
    setShowDeleteConfirm(false)
    setShowFeedbackForm(false)
    setFeedbackEmail(user?.email || '')
    setFeedbackName(profile?.display_name || profile?.username || '')
    setFeedbackBody('')
    setCopyLabel('')
    setFeedbackSuccessMessage('')
    setErrorMessage('')
  }, [isOpen, profile, language, user?.email])

  const shareMessage = useMemo(() => t('share.message'), [t])

  if (!isOpen) return null

  const previewInitial = getProfileInitial(
    { ...profile, display_name: displayName, avatar_url: avatarUrl },
    user
  )

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setErrorMessage(localize('画像ファイルを選択してください。', 'Please choose an image file.'))
      return
    }

    if (file.size > 1024 * 1024 * 2) {
      setErrorMessage(localize('画像は 2MB 以下にしてください。', 'Please keep the image under 2MB.'))
      return
    }

    try {
      const dataUrl = await fileToDataUrl(file)
      setAvatarUrl(dataUrl)
      setErrorMessage('')
    } catch (error) {
      setErrorMessage(error.message || localize('画像の読み込みに失敗しました。', 'Failed to load the image.'))
    }
  }

  const handleSaveProfile = async (event) => {
    event.preventDefault()
    setIsSavingProfile(true)
    setErrorMessage('')

    try {
      await saveProfile({
        username: profile?.username,
        display_name: displayName.trim() || profile?.username || getProfileDisplayName(profile, user),
        avatar_url: avatarUrl,
        preferred_language: selectedLanguage,
      })
      onClose()
    } catch (error) {
      setErrorMessage(error.message || localize('アカウント設定の保存に失敗しました。', 'Failed to save account settings.'))
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleSaveLanguage = async () => {
    setIsSavingLanguage(true)
    setErrorMessage('')

    try {
      setLanguage(selectedLanguage)
      await saveProfile({
        username: profile?.username,
        display_name: profile?.display_name || profile?.username || getProfileDisplayName(profile, user),
        avatar_url: profile?.avatar_url || '',
        preferred_language: selectedLanguage,
      })
    } catch (error) {
      setErrorMessage(error.message || localize('言語設定の保存に失敗しました。', 'Failed to save language settings.'))
    } finally {
      setIsSavingLanguage(false)
    }
  }

  const handleCopyShare = async () => {
    try {
      await navigator.clipboard.writeText(shareMessage)
      setCopyLabel(t('settings.share.copied'))
      window.setTimeout(() => setCopyLabel(''), 1800)
    } catch {
      setErrorMessage(localize('コピーに失敗しました。', 'Failed to copy the text.'))
    }
  }

  const handleDeleteAccount = async () => {
    setIsDeleting(true)
    setErrorMessage('')

    try {
      await deleteAccount()
      setShowDeleteConfirm(false)
      onClose()
      window.history.pushState({}, '', '/login')
      window.dispatchEvent(new PopStateEvent('popstate'))
    } catch (error) {
      setErrorMessage(error.message || localize('退会処理に失敗しました。', 'Failed to delete the account.'))
    } finally {
      setIsDeleting(false)
    }
  }

  const handleFeedbackSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')
    setFeedbackSuccessMessage('')

    if (!feedbackEmail.trim() || !feedbackName.trim() || !feedbackBody.trim()) {
      setErrorMessage(localize('問い合わせフォームの必須項目を入力してください。', 'Please fill in all feedback form fields.'))
      return
    }

    setIsSendingFeedback(true)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: feedbackEmail.trim(),
          name: feedbackName.trim(),
          message: feedbackBody.trim(),
          language,
        }),
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(result?.error || localize('問い合わせの送信に失敗しました。', 'Failed to send your inquiry.'))
      }

      setFeedbackBody('')
      setFeedbackSuccessMessage(localize('問い合わせを送信しました。ありがとうございます。', 'Your inquiry has been sent. Thank you.'))
    } catch (error) {
      setErrorMessage(error.message || localize('問い合わせの送信に失敗しました。', 'Failed to send your inquiry.'))
    } finally {
      setIsSendingFeedback(false)
    }
  }

  return (
    <div className="modal-overlay no-print" onClick={onClose}>
      <section className="modal-card account-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <p className="panel-kicker">{t('settings.kicker')}</p>
            <h2>{t('settings.title')}</h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label={localize('閉じる', 'Close')}>
            ×
          </button>
        </div>

        <div className="settings-tab-row">
          <button
            type="button"
            className={`settings-tab-button ${activeTab === 'profile' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            {t('settings.tab.profile')}
          </button>
          <button
            type="button"
            className={`settings-tab-button ${activeTab === 'language' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('language')}
          >
            {t('settings.tab.language')}
          </button>
        </div>

        {activeTab === 'profile' ? (
          <form className="auth-form" onSubmit={handleSaveProfile}>
            <div className="avatar-editor">
              <div className="avatar-preview avatar-preview-large">
                {avatarUrl ? <img src={avatarUrl} alt={localize('アバタープレビュー', 'Avatar preview')} /> : <span>{previewInitial}</span>}
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

            <label htmlFor="account-display-name">{t('settings.profile.displayName')}</label>
            <input
              id="account-display-name"
              type="text"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder={t('settings.profile.displayName')}
            />

            <label htmlFor="account-username">{t('settings.profile.username')}</label>
            <input
              id="account-username"
              type="text"
              value={profile?.username || ''}
              readOnly
            />
            <p className="editor-hint">{t('settings.profile.usernameHint')}</p>

            <button type="submit" disabled={isSavingProfile}>
              {isSavingProfile ? t('settings.profile.saving') : t('settings.profile.save')}
            </button>
          </form>
        ) : (
          <div className="settings-language-panel">
            <div className="settings-language-copy">
              <h3>{t('settings.language.title')}</h3>
              <p>{t('settings.language.description')}</p>
            </div>

            <label htmlFor="preferred-language">{t('settings.language.label')}</label>
            <select
              id="preferred-language"
              className="settings-select"
              value={selectedLanguage}
              onChange={(event) => {
                setSelectedLanguage(event.target.value)
                setLanguage(event.target.value)
              }}
            >
              {languages.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <button type="button" onClick={handleSaveLanguage} disabled={isSavingLanguage}>
              {isSavingLanguage ? t('settings.language.saving') : t('settings.language.save')}
            </button>
          </div>
        )}

        <div className="share-card">
          <p className="panel-kicker">{t('settings.share.kicker')}</p>
          <h3>{t('settings.share.title')}</h3>
          <p>{t('settings.share.description')}</p>
          <textarea className="share-copy-box" readOnly rows={4} value={shareMessage} />
          <button type="button" className="share-copy-button" onClick={handleCopyShare}>
            {copyLabel || t('settings.share.copy')}
          </button>
        </div>

        <button
          type="button"
          className="ghost-button feedback-toggle-button"
          onClick={() => setShowFeedbackForm((prev) => !prev)}
        >
          {showFeedbackForm
            ? localize('問い合わせフォームを閉じる', 'Close feedback form')
            : localize('問い合わせ・フィードバック', 'Inquiry / Feedback')}
        </button>

        {showFeedbackForm ? (
          <form className="feedback-card auth-form" onSubmit={handleFeedbackSubmit}>
            <label htmlFor="feedback-email">{localize('メールアドレス', 'Email')}</label>
            <input
              id="feedback-email"
              type="email"
              value={feedbackEmail}
              onChange={(event) => setFeedbackEmail(event.target.value)}
              placeholder={localize('メールアドレス', 'Email')}
            />

            <label htmlFor="feedback-name">{localize('氏名', 'Name')}</label>
            <input
              id="feedback-name"
              type="text"
              value={feedbackName}
              onChange={(event) => setFeedbackName(event.target.value)}
              placeholder={localize('氏名', 'Name')}
            />

            <label htmlFor="feedback-body">{localize('内容', 'Message')}</label>
            <textarea
              id="feedback-body"
              className="feedback-textarea"
              rows={6}
              value={feedbackBody}
              onChange={(event) => setFeedbackBody(event.target.value)}
              placeholder={localize('問い合わせ内容やフィードバックを入力してください', 'Write your inquiry or feedback')}
            />

            <p className="editor-hint">
              {localize('送信すると、運営チームにSlack通知を送信します。', 'Submitting will send a Slack notification to the team.')}
            </p>

            <button type="submit" disabled={isSendingFeedback}>
              {isSendingFeedback
                ? localize('送信中...', 'Sending...')
                : localize('問い合わせを送信する', 'Send inquiry')}
            </button>
          </form>
        ) : null}

        {feedbackSuccessMessage ? <p className="editor-success">{feedbackSuccessMessage}</p> : null}

        <button
          type="button"
          className="text-link-button account-danger-link"
          onClick={() => setShowDeleteConfirm(true)}
        >
          {t('settings.delete.link')}
        </button>

        {errorMessage ? <p className="editor-error">{errorMessage}</p> : null}

        {showDeleteConfirm ? (
          <div className="inline-confirm-card">
            <h3>{t('settings.delete.title')}</h3>
            <p>{t('settings.delete.body')}</p>
            <div className="inline-confirm-actions">
              <button type="button" className="ghost-button" onClick={() => setShowDeleteConfirm(false)}>
                {t('settings.delete.cancel')}
              </button>
              <button type="button" className="danger-button" onClick={handleDeleteAccount} disabled={isDeleting}>
                {isDeleting ? t('settings.delete.deleting') : t('settings.delete.confirm')}
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  )
}
