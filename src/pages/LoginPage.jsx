import { useState } from 'react'

import CTASection from '../components/login/CTASection.jsx'
import FeatureSection from '../components/login/FeatureSection.jsx'
import HeroSection from '../components/login/HeroSection.jsx'
import LoginShowcaseSection from '../components/login/LoginShowcaseSection.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'

export default function LoginPage() {
  const { authError, isSupabaseConfigured, signInWithGoogle } = useAuth()
  const [pendingAction, setPendingAction] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const startGoogleFlow = async (actionLabel) => {
    setPendingAction(actionLabel)
    setErrorMessage('')

    try {
      await signInWithGoogle()
    } catch (error) {
      setErrorMessage(error.message || 'Google ログインに失敗しました。')
      setPendingAction('')
    }
  }

  const isBusy = Boolean(pendingAction)
  const isDisabled = !isSupabaseConfigured || isBusy

  return (
    <main className="auth-shell auth-shell-login">
      <div className="auth-page-stack">
        <section className="auth-card auth-card-login">
          <div className="auth-card-hero">
            <p className="panel-kicker">Drum Practice Platform</p>
            <h2>drum pattern maker</h2>
          </div>

          <div className="auth-action-stack">
            <button
              type="button"
              className="auth-primary-button"
              onClick={() => startGoogleFlow('login')}
              disabled={isDisabled}
            >
              {pendingAction === 'login' ? 'ログイン中...' : 'ログイン'}
            </button>

            <button
              type="button"
              className="auth-secondary-button"
              onClick={() => startGoogleFlow('signup')}
              disabled={isDisabled}
            >
              {pendingAction === 'signup' ? '登録処理へ移動中...' : '新規会員登録'}
            </button>
          </div>

          <p className="auth-footnote">
            Google アカウントで認証します。登録済みのアカウントならそのままログインされます。
          </p>

          <div className="auth-legal-links">
            <p>利用規約・プライバシーポリシーに同意の上ご利用ください</p>
            <div className="auth-legal-link-row">
              <a href="/terms">利用規約</a>
              <span aria-hidden="true">｜</span>
              <a href="/privacy">プライバシーポリシー</a>
            </div>
          </div>

          {!isSupabaseConfigured ? (
            <p className="editor-hint">Supabase 環境変数が未設定のため、認証を開始できません。</p>
          ) : null}
          {authError ? <p className="editor-error">{authError}</p> : null}
          {errorMessage ? <p className="editor-error">{errorMessage}</p> : null}
        </section>

        <div className="login-lp-stack">
          <LoginShowcaseSection />
          <HeroSection />
          <FeatureSection />
          <CTASection
            isDisabled={isDisabled}
            isLoading={pendingAction === 'login' || pendingAction === 'signup'}
            onStart={() => startGoogleFlow('signup')}
          />
        </div>

        <footer className="auth-footer-links">
          <a href="/terms">利用規約</a>
          <span aria-hidden="true">｜</span>
          <a href="/privacy">プライバシーポリシー</a>
        </footer>
      </div>
    </main>
  )
}
