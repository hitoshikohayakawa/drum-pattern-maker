import { useState } from 'react'

import CTASection from '../components/login/CTASection.jsx'
import FeatureSection from '../components/login/FeatureSection.jsx'
import HeroSection from '../components/login/HeroSection.jsx'
import LoginShowcaseSection from '../components/login/LoginShowcaseSection.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useI18n } from '../contexts/I18nContext.jsx'

export default function LoginPage() {
  const { authError, isSupabaseConfigured, signInWithGoogle } = useAuth()
  const { t } = useI18n()
  const [pendingAction, setPendingAction] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const startGoogleFlow = async (actionLabel) => {
    setPendingAction(actionLabel)
    setErrorMessage('')

    try {
      await signInWithGoogle()
    } catch (error) {
      setErrorMessage(error.message || 'Google login failed.')
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
            <p className="panel-kicker">{t('login.kicker')}</p>
            <h2>{t('login.title')}</h2>
          </div>

          <div className="auth-action-stack">
            <button
              type="button"
              className="auth-primary-button"
              onClick={() => startGoogleFlow('login')}
              disabled={isDisabled}
            >
              {pendingAction === 'login' ? t('login.button.loggingIn') : t('login.button.login')}
            </button>

            <button
              type="button"
              className="auth-secondary-button"
              onClick={() => startGoogleFlow('signup')}
              disabled={isDisabled}
            >
              {pendingAction === 'signup' ? t('login.button.signingUp') : t('login.button.signup')}
            </button>
          </div>

          <p className="auth-footnote">
            {t('login.footnote')}
          </p>

          <div className="auth-legal-links">
            <p>{t('login.legal')}</p>
            <div className="auth-legal-link-row">
              <a href="/terms">{t('login.terms')}</a>
              <span aria-hidden="true">｜</span>
              <a href="/privacy">{t('login.privacy')}</a>
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
          <a href="/terms">{t('login.terms')}</a>
          <span aria-hidden="true">｜</span>
          <a href="/privacy">{t('login.privacy')}</a>
        </footer>
      </div>
    </main>
  )
}
