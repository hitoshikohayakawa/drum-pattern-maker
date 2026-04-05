import { useEffect, useState } from 'react'

import FillEditorPage from './pages/FillEditorPage.jsx'
import PracticePage from './pages/PracticePage.jsx'

const ROUTES = [
  { path: '/', label: '練習メニュー' },
  { path: '/fill-editor', label: 'フィルインパターン作成' },
]

function normalizePathname(pathname) {
  if (!pathname || pathname === '') return '/'
  return pathname === '/' ? pathname : pathname.replace(/\/+$/, '')
}

export default function App() {
  const [pathname, setPathname] = useState(() => normalizePathname(window.location.pathname))
  const [practiceMenuOpen, setPracticeMenuOpen] = useState(false)

  useEffect(() => {
    const handlePopState = () => {
      setPathname(normalizePathname(window.location.pathname))
      setPracticeMenuOpen(false)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigate = (nextPath) => {
    const normalized = normalizePathname(nextPath)
    if (normalized === pathname) return
    window.history.pushState({}, '', normalized)
    setPathname(normalized)
    setPracticeMenuOpen(false)
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
      </header>

      <div className="app-backdrop" />

      {pathname === '/fill-editor' ? (
        <FillEditorPage />
      ) : (
        <PracticePage isMenuOpen={practiceMenuOpen} setIsMenuOpen={setPracticeMenuOpen} />
      )}
    </div>
  )
}
