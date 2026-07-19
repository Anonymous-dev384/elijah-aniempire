import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { getRandomAnime, generateDetailUrl } from '../services/api'
import { CrownIcon, IconSearch, IconLock, IconUser, IconShuffle, IconBell } from './Icons'
import { NAV, NAV_COMMUNITY } from './navConfig'
import { useTheme } from '../context/ThemeContext'
import { useRPGStore } from '../store/rpgStore'

export default function Navbar({ collapsed, setCollapsed, onOpenSearch }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [isRandomizing, setIsRandomizing] = useState(false)
  const { theme, cycleTheme } = useTheme()
  const { level, faction } = useRPGStore()

  const themeIcons = { dark: '🌙', light: '☀️', oled: '⬛' }

  const handleRandomPick = async () => {
    if (isRandomizing) return
    setIsRandomizing(true)
    try {
      const item = await getRandomAnime()
      if (item) {
        navigate(generateDetailUrl('anime', item.title, item.id))
      }
    } catch (err) {
      console.error('Failed to get random anime:', err)
    } finally {
      setIsRandomizing(false)
    }
  }

  const checkActive = (to) => {
    const fullPath = location.pathname + location.search
    if (to === '/') return location.pathname === '/'
    if (to.includes('?')) return fullPath === to
    const isAnimeRoute = location.pathname === '/browse' || location.pathname.startsWith('/browse/anime')
    if (to === '/browse/anime') return isAnimeRoute && !location.search.includes('cat=') && !location.search.includes('q=')
    if (to === '/browse/manga') return location.pathname === '/browse/manga'
    return location.pathname.startsWith(to)
  }

  return (
    <>
      <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
        <div className="sidebar-accent" />

        <div className="sidebar-logo">
          <Link to="/" className="sidebar-brand">
            <img src="/assets/aniempire logo tranparent.svg" alt="AniEmpire" className="brand-logo-img" />
            {!collapsed && <span className="brand-text">AniEmpire</span>}
          </Link>
          <button className="sidebar-toggle" onClick={() => setCollapsed(c => !c)} title={collapsed ? 'Expand' : 'Collapse'}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              {collapsed ? <polyline points="9 6 15 12 9 18" /> : <polyline points="15 6 9 12 15 18" />}
            </svg>
          </button>
        </div>

        <div className="sidebar-search">
          <button className="sidebar-search-btn" onClick={onOpenSearch} title={collapsed ? 'Quick Search' : undefined}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <IconSearch size={18} />
              <span className="search-text-content">Search...</span>
            </div>
            <span className="search-shortcut">⌘K</span>
          </button>
        </div>

        {!collapsed && <div className="sidebar-label">NAVIGATE</div>}

        <nav className="sidebar-nav">
          {NAV.map(item => {
            const Icon = item.icon
            const isActive = checkActive(item.to)
            return (
              <Link
                key={item.label}
                to={item.to}
                className={`nav-link${isActive ? ' active' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={18} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )
          })}

          <button
            className={`nav-link random-nav-btn ${isRandomizing ? 'randomizing' : ''}`}
            onClick={handleRandomPick}
            disabled={isRandomizing}
            title={collapsed ? "Random Anime" : undefined}
          >
            <IconShuffle size={18} />
            {!collapsed && <span>Random</span>}
          </button>
        </nav>

        {!collapsed && <div className="sidebar-label" style={{ marginTop: 10 }}>COMMUNITY</div>}
        {collapsed && <div className="sidebar-bottom-sep" style={{ margin: '6px 8px' }} />}

        <nav className="sidebar-nav">
          {NAV_COMMUNITY.map(item => {
            const Icon = item.icon
            const isActive = checkActive(item.to)
            return (
              <Link
                key={item.label}
                to={item.to}
                className={`nav-link${isActive ? ' active' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <Icon size={18} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
          <Link
            to="/notifications"
            className={`nav-link${location.pathname === '/notifications' ? ' active' : ''}`}
            title={collapsed ? 'Notifications' : undefined}
          >
            <IconBell size={18} />
            {!collapsed && <span>Notifications</span>}
            {!collapsed && <span className="nav-badge">3</span>}
          </Link>
        </nav>

        <div style={{ flex: 1 }} />
        <div className="sidebar-bottom-sep" />

        <div className="sidebar-auth">
          {/* Theme toggle */}
          <button
            className="sidebar-theme-btn"
            onClick={cycleTheme}
            title={`Theme: ${theme} (click to cycle)`}
          >
            <span className="theme-icon">{themeIcons[theme]}</span>
            {!collapsed && <span className="theme-label">{theme.toUpperCase()} MODE</span>}
          </button>

          {collapsed ? (
            <>
              <Link to="/login" className="nav-link" title="Login" style={{ justifyContent: 'center' }}><IconLock size={18} /></Link>
              <Link to="/signup" className="nav-link" title="Sign Up" style={{ justifyContent: 'center' }}><IconUser size={18} /></Link>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
                <IconLock size={14} /> Login
              </Link>
              <Link to="/signup" className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
                <CrownIcon size={14} /> Sign Up Free
              </Link>
            </>
          )}
        </div>
      </aside>

      <style>{`
        .sidebar {
          position: fixed; top: 0; left: 0; height: 100vh;
          width: var(--sidebar-width);
          background: rgba(10, 9, 8, 0.85);
          border-right: 1px solid var(--border-subtle);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          display: flex; flex-direction: column;
          transition: width 0.3s cubic-bezier(0.4,0,0.2,1);
          overflow: hidden; z-index: 100;
        }
        .sidebar.collapsed { width: var(--sidebar-collapsed); }
        .sidebar-accent {
          height: 2px;
          background: linear-gradient(to right, transparent, var(--gold), transparent);
          opacity: 0.5;
        }
        .sidebar-logo {
          display: flex; 
          align-items: center; 
          justify-content: space-between;
          padding: 18px 14px 14px; 
          min-height: 60px; overflow: hidden;
        }
        .sidebar-brand {
          display: flex; align-items: center; gap: 10px; text-decoration: none;
        }
        .brand-text {
          font-family: var(--font-brand); font-size: 1.05rem;
          font-weight: 700; color: var(--gold); letter-spacing: 0.02em;
          white-space: nowrap;
        }
        .brand-logo-img {
          width: 40px; 
          height: 40px; 
          object-fit: contain;
          border-radius: 6px; flex-shrink: 0;
          transition: width 0.3s ease, height 0.3s ease;
        }
        .sidebar.collapsed .brand-logo-img {
          width: 40px;
          height: 40px;
        }
        .sidebar-toggle {
          background: var(--bg-elevated); border: 1px solid var(--border-subtle);
          color: var(--text-muted); width: 28px; height: 28px;
          border-radius: 6px; display: flex; align-items: center; justify-content: center;
          cursor: pointer; flex-shrink: 0; transition: all 0.2s ease;
        }
        .sidebar-toggle:hover { color: var(--gold); border-color: var(--gold-dark); background: var(--gold-glow-soft); transform: scale(1.05); }
        .sidebar-search { padding: 0 12px 12px; }
        .sidebar-search-btn {
          width: 100%; display: flex; align-items: center; justify-content: space-between;
          background: var(--bg-card); border: 1px solid var(--border-default);
          padding: 10px 14px; border-radius: var(--radius-md); color: var(--text-muted);
          transition: all 0.2s; font-size: 0.88rem; font-weight: 600;
        }
        .sidebar-search-btn:hover { border-color: var(--gold); color: var(--gold); background: var(--bg-elevated); }
        .search-shortcut { font-size: 0.65rem; background: var(--bg-surface); padding: 3px 6px; border-radius: 4px; font-weight: 700; color: var(--text-muted); }
        
        .sidebar-label {
          padding: 6px 14px 4px; font-size: 0.65rem; font-weight: 700;
          color: var(--text-muted); letter-spacing: 0.1em; opacity: 0.7;
          white-space: nowrap; overflow: hidden;
        }
        .sidebar-nav { padding: 0 8px; display: flex; flex-direction: column; gap: 2px; }
        .sidebar-bottom-sep {
          height: 1px; margin: 8px 14px;
          background: linear-gradient(to right, transparent, var(--border-default), transparent);
        }
        .sidebar-auth { padding: 0 10px 16px; display: flex; flex-direction: column; gap: 6px; }

        /* Icon-only collapsed state */
        .sidebar.collapsed .sidebar-logo {
          padding: 18px 0 14px; justify-content: center; flex-direction: column; gap: 16px;
        }
        .sidebar.collapsed .brand-text,
        .sidebar.collapsed .sidebar-label,
        .sidebar.collapsed .sidebar-bottom-sep,
        .sidebar.collapsed .search-text-content,
        .sidebar.collapsed .search-shortcut { display: none; }
        
        .sidebar.collapsed .sidebar-search { padding: 4px; margin-bottom: 8px; }
        .sidebar.collapsed .sidebar-search-btn { 
          justify-content: center; padding: 12px; border-radius: 12px; border: none; background: transparent; 
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .sidebar.collapsed .sidebar-search-btn:hover { transform: scale(1.15); background: var(--gold-glow-soft); }

        .sidebar.collapsed .nav-link { justify-content: center; padding: 12px; margin: 0 4px; border-radius: 12px; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
        .sidebar.collapsed .nav-link:hover { transform: scale(1.15); background: var(--gold-glow-soft); color: var(--gold); }
        .sidebar.collapsed .nav-link.active { border-left: none; background: var(--gold-glow); box-shadow: inset 3px 0 0 var(--gold); }
        .sidebar.collapsed .sidebar-auth { padding: 0 6px 16px; gap: 10px; }
        
        .random-nav-btn {
          width: 100%;
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-muted);
          margin-top: 8px;
          border-top: 1px solid rgba(255,255,255,0.05);
          padding-top: 12px !important;
          transition: all 0.2s ease;
        }
        .random-nav-btn:hover { color: var(--gold) !important; background: rgba(var(--gold-rgb), 0.05); }
        .random-nav-btn.randomizing svg { animation: spin 1s linear infinite; color: var(--gold); }
        
        @keyframes spin { 100% { transform: rotate(360deg); } }

        /* Theme toggle */
        .sidebar-theme-btn {
          display: flex; align-items: center; gap: 8px;
          width: 100%; padding: 8px 12px; border-radius: var(--radius-md);
          background: var(--bg-elevated); border: 1px solid var(--border-subtle);
          color: var(--text-muted); cursor: pointer; font-size: 0.72rem;
          font-weight: 700; letter-spacing: 0.06em; transition: all 0.2s;
          margin-bottom: 6px;
        }
        .sidebar-theme-btn:hover { border-color: var(--gold); color: var(--gold); }
        .theme-icon { font-size: 0.9rem; }
        .theme-label { white-space: nowrap; overflow: hidden; }
        .sidebar.collapsed .sidebar-theme-btn { justify-content: center; padding: 10px; }
        .sidebar.collapsed .theme-label { display: none; }

        .nav-badge {
          margin-left: auto;
          background: var(--red);
          color: #fff;
          font-size: 0.6rem;
          font-weight: 800;
          padding: 1px 5px;
          border-radius: var(--radius-full);
          min-width: 16px;
          text-align: center;
          line-height: 1.4;
        }
        .sidebar.collapsed .nav-badge { display: none; }

        @media (max-width: 768px) {
          .sidebar { display: none; }
        }
      `}</style>
    </>
  )
}
