import { useEffect, useState } from 'react'

import AccountSettingsModal from './components/AccountSettingsModal.jsx'
import { useAuth } from './contexts/AuthContext.jsx'
import { useI18n } from './contexts/I18nContext.jsx'
import FillEditorPage from './pages/FillEditorPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import OnboardingPage from './pages/OnboardingPage.jsx'
import PrivacyPage from './pages/PrivacyPage.jsx'
import PracticePage from './pages/PracticePage.jsx'
import PublicFillsPage from './pages/PublicFillsPage.jsx'
import TermsPage from './pages/TermsPage.jsx'
import { getProfileInitial } from './utils/profileUtils'

const ROUTES = [
  { path: '/', labelKey: 'app.route.practice' },
  { path: '/fill-editor', labelKey: 'app.route.editor' },
  { path: '/community-fills', labelKey: 'app.route.community' },
]

function normalizePathname(pathname) {
  if (!pathname || pathname === '') return '/'
  return pathname === '/' ? pathname : pathname.replace(/\/+$/, '')
}

export default function App() {
  const [pathname, setPathname] = useState(() => normalizePathname(window.location.pathname))
  const [practiceMenuOpen, setPracticeMenuOpen] = useState(false)
  const [accountSettingsOpen, setAccountSettingsOpen] = useState(false)
  const {
    isAuthLoading,
    isProfileLoading,
    needsOnboarding,
    profile,
    signOut,
    user,
  } = useAuth()
  const { t, language, languages, setLanguage } = useI18n()
  const isAuthBypassRoute = pathname === '/login' || pathname === '/privacy' || pathname === '/terms'

  useEffect(() => {
    const handlePopState = () => {
      setPathname(normalizePathname(window.location.pathname))
      setPracticeMenuOpen(false)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigate = (nextPath, options = {}) => {
    const normalized = normalizePathname(nextPath)
    if (normalized === pathname && !options.force) return
    window.history.pushState({}, '', normalized)
    setPathname(normalized)
    setPracticeMenuOpen(false)
  }

  useEffect(() => {
    if (isAuthLoading || isProfileLoading) return

    if (!user && !isAuthBypassRoute) {
      navigate('/login', { force: true })
      return
    }

    if (user && needsOnboarding && pathname !== '/onboarding') {
      navigate('/onboarding', { force: true })
      return
    }

    if (user && !needsOnboarding && (pathname === '/login' || pathname === '/onboarding')) {
      navigate('/', { force: true })
    }
  }, [isAuthBypassRoute, isAuthLoading, isProfileLoading, needsOnboarding, pathname, user])

  useEffect(() => {
    if (!user) {
      setAccountSettingsOpen(false)
    }
  }, [user])

  const renderRoute = () => {
    if (isAuthLoading || (user && isProfileLoading && pathname !== '/login')) {
      return (
        <main className="auth-shell">
          <section className="auth-card">
            <p className="panel-kicker">Session</p>
            <h2>読み込み中</h2>
            <p>ログイン状態を確認しています。</p>
          </section>
        </main>
      )
    }

    if (pathname === '/login') {
      return <LoginPage />
    }

    if (pathname === '/privacy') {
      return <PrivacyPage />
    }

    if (pathname === '/terms') {
      return <TermsPage />
    }

    if (pathname === '/onboarding') {
      return <OnboardingPage navigate={navigate} />
    }

    if (pathname === '/fill-editor') {
      return <FillEditorPage navigate={navigate} />
    }

    if (pathname === '/community-fills') {
      return <PublicFillsPage navigate={navigate} />
    }

    return <PracticePage isMenuOpen={practiceMenuOpen} setIsMenuOpen={setPracticeMenuOpen} />
  }

  return (
    <div className="app">
      <header className="site-header no-print">
        <div className="brand-lockup">
          <img src="/drumpattern_logo.svg" alt="Drum Pattern Maker" className="brand-logo" />
          <div className="brand-text">
            <p className="brand-eyebrow">Digital Practice Studio</p>
            <h1>Drum Pattern Maker</h1>
          </div>
        </div>

        {pathname === '/login' || pathname === '/onboarding' || pathname === '/privacy' || pathname === '/terms' ? null : (
          <nav className="practice-nav route-nav">
            {ROUTES.map((route) => (
              <button
                key={route.path}
                className={`practice-tab ${pathname === route.path ? 'is-active' : ''}`}
                onClick={() => navigate(route.path)}
              >
                {t(route.labelKey)}
              </button>
            ))}
          </nav>
        )}

        <div className="header-actions">
          {isAuthBypassRoute ? (
            <div className="header-language-shell">
              <label className="header-language-select">
                <span>{language === 'ja' ? '言語' : 'Language'}</span>
                <select value={language} onChange={(event) => setLanguage(event.target.value)}>
                  {languages.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ) : null}
          {user ? (
            <>
              <div className="auth-chip">
                <span className="auth-chip-avatar">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="プロフィールアイコン" />
                  ) : (
                    <span>{getProfileInitial(profile, user)}</span>
                  )}
                </span>
                <span className="auth-chip-copy">
                  <span className="auth-chip-label">{t('app.auth.signedIn')}</span>
                  <strong>{profile?.display_name || profile?.username || user.email}</strong>
                </span>
              </div>
              <button
                type="button"
                className="settings-gear-button"
                aria-label={t('app.auth.settings')}
                onClick={() => setAccountSettingsOpen(true)}
              >
                ⚙
              </button>
              <button
                type="button"
                className="auth-link-button"
                onClick={async () => {
                  await signOut()
                  navigate('/login', { force: true })
                }}
              >
                {t('app.auth.logout')}
              </button>
            </>
          ) : (
            pathname === '/login' ? null : (
              <button
                type="button"
                className="auth-link-button"
                onClick={() => navigate('/login')}
              >
                {t('app.auth.login')}
              </button>
            )
          )}

          {pathname === '/' ? (
            <button
              className={`menu-toggle ${practiceMenuOpen ? 'is-open' : ''}`}
              onClick={() => setPracticeMenuOpen((prev) => !prev)}
              aria-label="設定メニューを開く"
              aria-expanded={practiceMenuOpen}
            >
              <span />
              <span />
              <span />
            </button>
          ) : null}
        </div>
      </header>

      <div className="app-backdrop" />
      {renderRoute()}
      <AccountSettingsModal
        isOpen={accountSettingsOpen}
        onClose={() => setAccountSettingsOpen(false)}
      />
    </div>
  )
}
