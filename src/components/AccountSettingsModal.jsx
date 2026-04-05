import { useEffect, useState } from 'react'

import { useAuth } from '../contexts/AuthContext.jsx'
import { fileToDataUrl, getProfileDisplayName, getProfileInitial } from '../utils/profileUtils'

export default function AccountSettingsModal({ isOpen, onClose }) {
  const { deleteAccount, profile, saveProfile, user } = useAuth()
  const [displayName, setDisplayName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!isOpen) return
    setDisplayName(profile?.display_name || profile?.username || '')
    setAvatarUrl(profile?.avatar_url || '')
    setShowDeleteConfirm(false)
    setErrorMessage('')
  }, [isOpen, profile])

  if (!isOpen) return null

  const previewInitial = getProfileInitial(
    { ...profile, display_name: displayName, avatar_url: avatarUrl },
    user
  )

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
    setIsSaving(true)
    setErrorMessage('')

    try {
      await saveProfile({
        username: profile?.username,
        display_name: displayName.trim() || profile?.username || getProfileDisplayName(profile, user),
        avatar_url: avatarUrl,
      })
      onClose()
    } catch (error) {
      setErrorMessage(error.message || 'アカウント設定の保存に失敗しました。')
    } finally {
      setIsSaving(false)
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
      setErrorMessage(error.message || '退会処理に失敗しました。')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="modal-overlay no-print" onClick={onClose}>
      <section className="modal-card account-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <p className="panel-kicker">Account</p>
            <h2>アカウント設定</h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="閉じる">
            ×
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="avatar-editor">
            <div className="avatar-preview avatar-preview-large">
              {avatarUrl ? <img src={avatarUrl} alt="アバタープレビュー" /> : <span>{previewInitial}</span>}
            </div>
            <div className="avatar-editor-actions">
              <label className="file-upload-button">
                画像を選択
                <input type="file" accept="image/*" onChange={handleAvatarChange} />
              </label>
              {avatarUrl ? (
                <button type="button" className="ghost-button" onClick={() => setAvatarUrl('')}>
                  画像を外す
                </button>
              ) : null}
            </div>
          </div>

          <label htmlFor="account-display-name">表示名</label>
          <input
            id="account-display-name"
            type="text"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="表示名"
          />

          <label htmlFor="account-username">ユーザー名</label>
          <input
            id="account-username"
            type="text"
            value={profile?.username || ''}
            readOnly
          />
          <p className="editor-hint">ユーザー名は現時点ではオンボーディング時にのみ設定できます。</p>

          <button type="submit" disabled={isSaving}>
            {isSaving ? '保存中...' : '変更を保存'}
          </button>
        </form>

        <button
          type="button"
          className="text-link-button account-danger-link"
          onClick={() => setShowDeleteConfirm(true)}
        >
          サービスを退会する
        </button>

        {errorMessage ? <p className="editor-error">{errorMessage}</p> : null}

        {showDeleteConfirm ? (
          <div className="inline-confirm-card">
            <h3>本当に退会しますか？</h3>
            <p>退会すると過去に作成・保存したデータはすべて消えてしまいます。</p>
            <div className="inline-confirm-actions">
              <button type="button" className="ghost-button" onClick={() => setShowDeleteConfirm(false)}>
                キャンセル
              </button>
              <button type="button" className="danger-button" onClick={handleDeleteAccount} disabled={isDeleting}>
                {isDeleting ? '退会処理中...' : '退会する'}
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  )
}
