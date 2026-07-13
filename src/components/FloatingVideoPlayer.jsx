import { useState, useRef, useEffect, useCallback, Fragment } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useMusic } from '../context/MusicContext'
import { generateDetailUrl } from '../services/api'
import ArtPlayerWrapper from './ArtPlayerWrapper'

export default function FloatingVideoPlayer() {
  const navigate = useNavigate()
  const {
    nowPlaying,
    mediaType,
    isMinimized,
    autoplay,
    stopPlayback,
    toggleMediaType,
    setIsMinimized,
    generateMusicUrl,
    playNext,
    playPrevious,
    playlist,
    setShowPlaylist,
  } = useMusic()

  const containerRef = useRef(null)
  const dragRef = useRef({ isDragging: false, startX: 0, startY: 0, offsetX: 0, offsetY: 0 })
  const [position, setPosition] = useState({ x: -1, y: -1 })
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [artInstance, setArtInstance] = useState(null)

  // Initialize position to bottom-right on mount
  useEffect(() => {
    if (position.x === -1) {
      setPosition({
        x: window.innerWidth - 400,
        y: window.innerHeight - 340,
      })
    }
  }, [])

  // Drag handlers
  const handleMouseDown = useCallback((e) => {
    if (e.target.closest('.floating-player__controls') || e.target.closest('.art-video-player')) return
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
  }, [])

  const handleTouchStart = useCallback((e) => {
    if (e.target.closest('.floating-player__controls') || e.target.closest('.art-video-player')) return
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
  }, [])

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

  // Don't render if no video playing or not minimized
  if (!nowPlaying || mediaType !== 'video' || !isMinimized || !nowPlaying.videoLink) return null

  const handleEnlarge = () => {
    setIsMinimized(false)
    navigate(generateMusicUrl(nowPlaying))
  }

  const handleClose = () => {
    stopPlayback()
  }

  const handleSwitchToAudio = () => {
    toggleMediaType()
  }

  return (
    <div
      ref={containerRef}
      className={`floating-player ${isCollapsed ? 'floating-player--collapsed' : ''}`}
      style={{
        left: position.x,
        top: position.y,
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {/* Drag handle header */}
      <div className="floating-player__header">
        <div className="floating-player__handle">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/>
            <circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/>
          </svg>
        </div>
        <div className="floating-player__title-area">
          <p className="floating-player__song">{nowPlaying.songTitle}</p>
          <p className="floating-player__artist">
            {nowPlaying.artistsData ? (
              nowPlaying.artistsData.map((a, i) => (
                <Fragment key={a.id || i}>
                  <Link to={generateDetailUrl('artist', a.name, a)} className="hover-link">{a.name}</Link>
                  {i < nowPlaying.artistsData.length - 1 ? ', ' : ''}
                </Fragment>
              ))
            ) : nowPlaying.artists}
          </p>
        </div>
        <div className="floating-player__controls">
          <button
            className="floating-player__btn"
            onClick={() => setIsCollapsed(c => !c)}
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              {isCollapsed ? (
                <polyline points="17 11 12 6 7 11" />
              ) : (
                <polyline points="7 13 12 18 17 13" />
              )}
            </svg>
          </button>
          <button className="floating-player__btn" onClick={handleEnlarge} title="Enlarge">
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

      {/* Video area */}
      {!isCollapsed && (
        <div className="floating-player__video">
          <ArtPlayerWrapper
            style={{ width: '100%', height: '100%' }}
            option={{
              url: nowPlaying.videoLink,
              autoplay: autoplay,
              volume: 0.7,
              theme: '#D4A843',
              setting: true,
              fullscreen: true,
              miniProgressBar: true,
              mutex: false,
              flip: true,
              playbackRate: true,
              aspectRatio: true,
            }}
            getInstance={(art) => setArtInstance(art)}
            key={`floating-${nowPlaying.videoLink}-${autoplay}`}
          />
        </div>
      )}

      {/* Bottom control strip removed for cleaner look as requested */}
    </div>
  )
}
