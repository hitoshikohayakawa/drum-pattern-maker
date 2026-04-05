import { useEffect, useState } from 'react'

import AccountSettingsModal from './components/AccountSettingsModal.jsx'
import { useAuth } from './contexts/AuthContext.jsx'
import FillEditorPage from './pages/FillEditorPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import OnboardingPage from './pages/OnboardingPage.jsx'
import PrivacyPage from './pages/PrivacyPage.jsx'
import PracticePage from './pages/PracticePage.jsx'
import PublicFillsPage from './pages/PublicFillsPage.jsx'
import TermsPage from './pages/TermsPage.jsx'
import { getProfileInitial } from './utils/profileUtils'

const ROUTES = [
  { path: '/', label: '練習メニュー' },
  { path: '/fill-editor', label: 'フィルインパターン作成' },
  { path: '/community-fills', label: 'みんなのフィルイン' },
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
                {route.label}
              </button>
            ))}
          </nav>
        )}

        <div className="header-actions">
          {user ? (
            <>
              <button
                type="button"
                className="auth-chip auth-chip-button"
                onClick={() => setAccountSettingsOpen(true)}
              >
                <span className="auth-chip-avatar">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="プロフィールアイコン" />
                  ) : (
                    <span>{getProfileInitial(profile, user)}</span>
                  )}
                </span>
                <span className="auth-chip-copy">
                  <span className="auth-chip-label">Signed in</span>
                  <strong>{profile?.display_name || profile?.username || user.email}</strong>
                </span>
              </button>
              <button
                type="button"
                className="auth-link-button"
                onClick={async () => {
                  await signOut()
                  navigate('/login', { force: true })
                }}
              >
                ログアウト
              </button>
            </>
          ) : (
            pathname === '/login' ? null : (
              <button
                type="button"
                className="auth-link-button"
                onClick={() => navigate('/login')}
              >
                ログイン
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
