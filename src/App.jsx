import { useEffect, useMemo, useState } from 'react'

import AccountSettingsModal from './components/AccountSettingsModal.jsx'
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx'
import { I18nProvider, useI18n } from './contexts/I18nContext.jsx'
import FillEditorPage from './pages/FillEditorPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import OnboardingPage from './pages/OnboardingPage.jsx'
import PracticePage from './pages/PracticePage.jsx'
import PrivacyPage from './pages/PrivacyPage.jsx'
import PublicFillsPage from './pages/PublicFillsPage.jsx'
import TermsPage from './pages/TermsPage.jsx'
import { formatProfileName, getProfileInitial } from './utils/profileUtils'

const DEFAULT_ROUTE = '/'
const LEGAL_ROUTES = new Set(['/privacy', '/terms'])
const KNOWN_ROUTES = new Set([
  '/',
  '/login',
  '/onboarding',
  '/fills',
  '/community',
  '/privacy',
  '/terms',
])

function normalizePathname(pathname) {
  if (!pathname || pathname === '/') return DEFAULT_ROUTE
  const trimmed = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname
  return KNOWN_ROUTES.has(trimmed) ? trimmed : DEFAULT_ROUTE
}

function AppShell() {
  const [pathname, setPathname] = useState(() => normalizePathname(window.location.pathname))
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const { authError, isAuthLoading, isProfileLoading, needsOnboarding, profile, signOut, user } = useAuth()
  const { language, languages, setLanguage, t } = useI18n()
  const canUseAppNavigation = Boolean(user && !needsOnboarding)

  const applyRoute = (nextPath, replace = false) => {
    const normalized = normalizePathname(nextPath)
    const current = normalizePathname(window.location.pathname)

    if (normalized !== current) {
      const method = replace ? 'replaceState' : 'pushState'
      window.history[method]({}, '', normalized)
    }

    setPathname(normalized)
    setIsMenuOpen(false)
  }

  const navigate = (nextPath) => {
    applyRoute(nextPath, false)
  }

  useEffect(() => {
    const syncFromLocation = () => {
      setPathname(normalizePathname(window.location.pathname))
      setIsMenuOpen(false)
    }

    window.addEventListener('popstate', syncFromLocation)
    return () => window.removeEventListener('popstate', syncFromLocation)
  }, [])

  useEffect(() => {
    const normalized = normalizePathname(pathname)
    if (normalized !== pathname) {
      applyRoute(normalized, true)
    }
  }, [pathname])

  useEffect(() => {
    if (isAuthLoading || isProfileLoading) return

    if (!user && pathname !== '/login' && !LEGAL_ROUTES.has(pathname)) {
      applyRoute('/login', true)
      return
    }

    if (user && needsOnboarding && pathname !== '/onboarding' && !LEGAL_ROUTES.has(pathname)) {
      applyRoute('/onboarding', true)
      return
    }

    if (user && !needsOnboarding && (pathname === '/login' || pathname === '/onboarding')) {
      applyRoute('/', true)
    }
  }, [isAuthLoading, isProfileLoading, needsOnboarding, pathname, user])

  const routeItems = useMemo(() => ([
    { path: '/', label: t('app.route.practice') },
    { path: '/fills', label: t('app.route.editor') },
    { path: '/community', label: t('app.route.community') },
  ]), [t])

  const handleAuthAction = async () => {
    if (!user) {
      navigate('/login')
      return
    }

    try {
      await signOut()
      setIsSettingsOpen(false)
      applyRoute('/login', true)
    } catch (error) {
      console.error('Sign out failed:', error)
    }
  }

  const page = useMemo(() => {
    if (pathname === '/login') return <LoginPage />
    if (pathname === '/onboarding') return <OnboardingPage navigate={navigate} />
    if (pathname === '/fills') return <FillEditorPage navigate={navigate} />
    if (pathname === '/community') return <PublicFillsPage navigate={navigate} />
    if (pathname === '/privacy') return <PrivacyPage />
    if (pathname === '/terms') return <TermsPage />
    return <PracticePage isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
  }, [isMenuOpen, pathname])

  const currentUserName = formatProfileName(profile) || user?.email || 'Drummer'
  const currentUserInitial = getProfileInitial(profile, user)

  return (
    <div className="app">
      <header className="site-header no-print">
        <div className="brand-lockup">
          <div className="brand-text">
            <p className="brand-eyebrow">Drum Practice Platform</p>
            <h1>drum pattern maker</h1>
          </div>
        </div>

        {canUseAppNavigation ? (
          <>
            <button
              type="button"
              className={`menu-toggle ${isMenuOpen ? 'is-open' : ''}`}
              onClick={() => setIsMenuOpen((current) => !current)}
              aria-label="Toggle menu"
            >
              <span />
              <span />
              <span />
            </button>

            <nav className="practice-nav route-nav">
              {routeItems.map((item) => (
                <button
                  key={item.path}
                  type="button"
                  className={`practice-tab ${pathname === item.path ? 'is-active' : ''}`}
                  onClick={() => navigate(item.path)}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </>
        ) : null}

        <div className="header-actions">
          <div className="header-language-shell">
            <label className="header-language-select">
              <span>Language</span>
              <select value={language} onChange={(event) => setLanguage(event.target.value)}>
                {languages.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          </div>

          {user ? (
            <button
              type="button"
              className="auth-chip auth-chip-button"
              onClick={() => setIsSettingsOpen(true)}
            >
              <div className="auth-chip-avatar">
                {profile?.avatar_url ? <img src={profile.avatar_url} alt={currentUserName} /> : <span>{currentUserInitial}</span>}
              </div>
              <div className="auth-chip-copy">
                <span className="auth-chip-label">{t('app.auth.signedIn')}</span>
                <strong>{currentUserName}</strong>
              </div>
            </button>
          ) : null}

          {user ? (
            <>
              <button
                type="button"
                className="settings-gear-button"
                onClick={() => setIsSettingsOpen(true)}
                aria-label={t('app.auth.settings')}
              >
                ⚙
              </button>
              <button type="button" className="auth-link-button" onClick={handleAuthAction}>
                {t('app.auth.logout')}
              </button>
            </>
          ) : (
            <button type="button" className="auth-link-button" onClick={handleAuthAction}>
              {t('app.auth.login')}
            </button>
          )}
        </div>
      </header>

      {authError ? (
        <div className="editor-error no-print" style={{ maxWidth: '1880px', margin: '0 auto 16px' }}>
          {authError}
        </div>
      ) : null}

      {isAuthLoading ? (
        <main className="auth-shell">
          <section className="auth-card">
            <p className="panel-kicker">Loading</p>
            <h2>Loading Drum Pattern Maker...</h2>
          </section>
        </main>
      ) : page}

      <AccountSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <I18nProvider>
        <AppShell />
      </I18nProvider>
    </AuthProvider>
  )
}
