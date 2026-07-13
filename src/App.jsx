import { useState, useEffect, useRef, useCallback } from 'react'
import { BrowserRouter, Routes, Route, Outlet, useLocation, Link, Navigate, useMatch, useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { useMusic } from './context/MusicContext'
import Navbar from './components/Navbar'
import { NAV } from './components/navConfig'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import BrowsePage from './pages/BrowsePage'
import AnimeDetailPage from './pages/AnimeDetailPage'
import MangaDetailPage from './pages/MangaDetailPage'
import MangaReadPage from './pages/MangaReadPage'
import MusicPage from './pages/MusicPage'
import MusicDetailPage from './pages/MusicDetailPage'
import ProducerPage from './pages/ProducerPage'
import PersonPage from './pages/PersonPage'
import CharacterPage from './pages/CharacterPage'
import ArtistPage from './pages/ArtistPage'
import NotFoundPage from './pages/NotFoundPage'
import WatchPage from './pages/WatchPage'
import SearchModal from './components/SearchModal'
import RouteProgressBar from './components/RouteProgressBar'
import { CrownIcon, IconSearch } from './components/Icons'
import { MusicProvider } from './context/MusicContext'
import NowPlayingBar from './components/NowPlayingBar'
import APlayerWrapper from './components/APlayerWrapper'
import ArtPlayerWrapper from './components/ArtPlayerWrapper'
import FloatingVideoPlayer from './components/FloatingVideoPlayer'
import PlaylistDrawer from './components/PlaylistDrawer'

/**
 * Technical: This component hosts the actual media player instances.
 * Using Portals, it moves the DOM elements to wherever they are needed
 * (NowPlayingBar or MusicDetailPage) without unmounting them,
 * thus preserving playback position.
 */
function GlobalPersistentPlayer() {
  const { nowPlaying, mediaType, isPlaying, playerTarget, hiddenBufferTarget, setIsPlaying, handleEnded } = useMusic()
  const aplayerRef = useRef(null)

  if (!nowPlaying || !hiddenBufferTarget) return null

  // Use the specific page target if available, otherwise stay in the hidden buffer
  const activeTarget = playerTarget || hiddenBufferTarget

  const portalContent = (
    <div className="persistent-player-source" style={{ width: '100%', height: '100%' }}>
      {mediaType === 'audio' && (
        <APlayerWrapper
          ref={aplayerRef}
          audio={{
            name: nowPlaying.songTitle,
            artist: nowPlaying.artist || 'Unknown Artist',
            url: nowPlaying.audioLink || nowPlaying.videoLink,
            cover: nowPlaying.coverImage || 'https://images.unsplash.com/photo-1618331835717-801e976710b2?q=80&w=200&auto=format&fit=crop'
          }}
          autoplay={isPlaying}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={handleEnded}
          key={`persistent-audio-${nowPlaying.themeId || nowPlaying.audioLink}`}
        />
      )}
    </div>
  )

  return createPortal(portalContent, activeTarget)
}

function GlobalWatchWrapper() {
  const location = useLocation()
  const navigate = useNavigate()
  const { lastValidRoute } = useMusic()
  const match = useMatch("/watch/:slug")
  
  const containerRef = useRef(null)
  const dragRef = useRef({ isDragging: false, startX: 0, startY: 0, offsetX: 0, offsetY: 0 })
  const [activeSession, setActiveSession] = useState(null)
  const [activeMetadata, setActiveMetadata] = useState({ title: '', subtitle: '' })
  const [position, setPosition] = useState({ x: -1, y: -1 })
  // YouTube-style: only show miniplayer when user explicitly triggers it
  const userMinimized = useRef(false)
  const isMinimized = !match && !!activeSession && userMinimized.current

  useEffect(() => {
    if (match) {
      // Entering a watch page — set/update the active session, exit miniplayer mode
      userMinimized.current = false
      setActiveSession({
        slug: match.params.slug,
        search: location.search,
      })
      if (position.x === -1) {
        setPosition({
          x: window.innerWidth > 768 ? window.innerWidth - 400 : 20,
          y: window.innerWidth > 768 ? window.innerHeight - 300 : window.innerHeight - 250,
        })
      }
    } else if (activeSession && !userMinimized.current) {
      // Navigated away WITHOUT explicitly minimizing — close the player (YouTube behavior)
      setActiveSession(null)
    }
  }, [match, location.search])

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!dragRef.current.isDragging) return
      const x = Math.max(0, Math.min(window.innerWidth - 380, e.clientX - dragRef.current.offsetX))
      const y = Math.max(0, Math.min(window.innerHeight - 100, e.clientY - dragRef.current.offsetY))
      setPosition({ x, y })
    }
    const handleTouchMove = (e) => {
      if (!dragRef.current.isDragging) return
      const touch = e.touches[0]
      const x = Math.max(0, Math.min(window.innerWidth - 380, touch.clientX - dragRef.current.offsetX))
      const y = Math.max(0, Math.min(window.innerHeight - 100, touch.clientY - dragRef.current.offsetY))
      setPosition({ x, y })
    }
    const handleEnd = () => {
      dragRef.current.isDragging = false
      document.body.style.userSelect = ''
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleEnd)
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend', handleEnd)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleEnd)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleEnd)
    }
  }, [])

  const handleMetadataChange = useCallback((meta) => {
    setActiveMetadata(meta)
  }, [])

  if (!activeSession) return null

  const handleClose = () => {
    userMinimized.current = false
    setActiveSession(null)
    if (match) navigate(-1)
  }
  const handleExpand = () => {
    userMinimized.current = false
    navigate(`/watch/${activeSession.slug}${activeSession.search}`)
  }
  const handleMinimize = () => {
    // Explicitly enter miniplayer mode, THEN navigate away
    userMinimized.current = true
    if (lastValidRoute && lastValidRoute !== location.pathname + location.search) {
      navigate(lastValidRoute)
    } else {
      navigate('/')
    }
  }

  const handleMouseDown = (e) => {
    if (e.target.closest('.floating-player__controls') || e.target.closest('.watch-theater__player') || e.target.closest('.art-video-player')) return
    e.preventDefault()
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    dragRef.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    }
    document.body.style.userSelect = 'none'
  }

  const handleTouchStart = (e) => {
    if (e.target.closest('.floating-player__controls') || e.target.closest('.watch-theater__player') || e.target.closest('.art-video-player')) return
    const touch = e.touches[0]
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    dragRef.current = {
      isDragging: true,
      startX: touch.clientX,
      startY: touch.clientY,
      offsetX: touch.clientX - rect.left,
      offsetY: touch.clientY - rect.top,
    }
  }

  return (
    <div 
      ref={containerRef}
      className={`global-watch-wrapper ${isMinimized ? 'floating-player' : (match ? 'is-full' : 'is-hidden')}`}
      style={isMinimized ? { left: position.x, top: position.y } : {}}
      onMouseDown={isMinimized ? handleMouseDown : undefined}
      onTouchStart={isMinimized ? handleTouchStart : undefined}
    >
      {isMinimized && (
        <div className="floating-player__header">
           <div className="floating-player__handle">
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
               <circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/>
               <circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/>
             </svg>
           </div>
           <div className="floating-player__title-area">
              <p className="floating-player__song">{activeMetadata.title || 'Watch Player'}</p>
              <p className="floating-player__artist">{activeMetadata.subtitle || 'Anime Episode'}</p>
           </div>
           <div className="floating-player__controls">
             <button className="floating-player__btn" onClick={handleExpand} title="Expand">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="15 3 21 3 21 9" />
                  <polyline points="9 21 3 21 3 15" />
                  <line x1="21" y1="3" x2="14" y2="10" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </svg>
             </button>
             <button className="floating-player__btn floating-player__btn--close" onClick={handleClose} title="Close">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
             </button>
           </div>
        </div>
      )}
      <WatchPage 
        slugProp={activeSession.slug} 
        initialSearch={activeSession.search} 
        isMinimized={isMinimized} 
        onClose={handleClose}
        onMinimize={handleMinimize}
        onMetadataChange={handleMetadataChange}
      />
    </div>
  )
}

function MainLayout() {
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true'
  })
  const [searchOpen, setSearchOpen] = useState(false)
  const { setLastValidRoute } = useMusic()
  const location = useLocation()
  
  const [navVisible, setNavVisible] = useState(true)
  const lastScrollY = useRef(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      if (currentScrollY > 60) {
        if (currentScrollY > lastScrollY.current) {
          setNavVisible(false)
        } else {
          setNavVisible(true)
        }
      } else {
        setNavVisible(true)
      }
      lastScrollY.current = currentScrollY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Track the last "normal" page so minimizing from music/watch detail pages can return there
  useEffect(() => {
    if (!location.pathname.startsWith('/music/') && !location.pathname.startsWith('/watch/')) {
        setLastValidRoute(location.pathname + location.search)
    }
  }, [location, setLastValidRoute])

  // Sync collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', collapsed)
  }, [collapsed])

  const checkActive = (to) => {
    if (to === '/') return location.pathname === '/'
    if (to.includes('?')) return location.pathname + location.search === to
    const isAnimeRoute = location.pathname === '/browse' || location.pathname.startsWith('/browse/anime')
    if (to === '/browse/anime') return isAnimeRoute
    if (to === '/browse/manga') return location.pathname === '/browse/manga'
    return location.pathname.startsWith(to)
  }
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className={`app-layout ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <Navbar collapsed={collapsed} setCollapsed={setCollapsed} onOpenSearch={() => setSearchOpen(true)} />
      <main className={`main-content${collapsed ? ' sidebar-collapsed' : ''}`}>

        {/* Mobile Header */}
        <header className={`mobile-header ${navVisible ? '' : 'nav-hidden'}`}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="/assets/aniempire logo tranparent.svg" alt="AniEmpire" style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 6 }} />
            <span style={{ fontFamily: 'var(--font-brand)', color: 'var(--gold)', fontWeight: 700 }}>AniEmpire</span>
          </Link>
          <button onClick={() => setSearchOpen(true)} style={{ color: 'var(--text-primary)', padding: 8 }}>
            <IconSearch size={22} />
          </button>
        </header>

        {/* Mobile Bottom Navigation */}
        <nav className={`mobile-bottom-nav ${navVisible ? '' : 'nav-hidden'}`}>
          {NAV.slice(0, 4).map(item => {
            const Icon = item.icon
            const isActive = checkActive(item.to)
            return (
              <Link key={item.to} to={item.to} className={`mobile-nav-item ${isActive ? 'active' : ''}`}>
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            )
          })}
          <Link to="/login" className="mobile-nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
            <span>Login</span>
          </Link>
        </nav>

        <Outlet />
        {!location.pathname.startsWith('/music/') && <Footer />}
        <NowPlayingBar />
        <FloatingVideoPlayer />
        <PlaylistDrawer />
        <GlobalPersistentPlayer />
        <GlobalWatchWrapper />
      </main>
    </div>
  )
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function BrowseRedirect() {
  const location = useLocation()
  return <Navigate to={`/browse/anime${location.search}`} replace />
}

export default function App() {
  return (
    <MusicProvider>
      <BrowserRouter>
        <ScrollToTop />
        <RouteProgressBar />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/manga/:slug/read/:chapterId" element={<MangaReadPage />} />
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/browse" element={<BrowseRedirect />} />
            <Route path="/browse/music" element={<MusicPage />} />
            <Route path="/browse/:type" element={<BrowsePage />} />
            <Route path="/music/:slug/:themeKey" element={<MusicDetailPage />} />
            <Route path="/watch/:slug" element={<div className="watch-page-placeholder" style={{minHeight: '100vh'}}></div>} />
            <Route path="/anime/:slug" element={<AnimeDetailPage />} />
            <Route path="/manga/:slug" element={<MangaDetailPage />} />
            <Route path="/producer/:id" element={<ProducerPage />} />
            <Route path="/person/:id" element={<PersonPage />} />
            <Route path="/character/:id" element={<CharacterPage />} />
            <Route path="/artist/:id" element={<ArtistPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </MusicProvider>
  )
}
