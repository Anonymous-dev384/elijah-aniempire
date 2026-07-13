import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMusic } from '../context/MusicContext'
import { generateDetailUrl } from '../services/api'

export default function NowPlayingBar() {
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const {
    nowPlaying,
    mediaType,
    stopPlayback,
    autoplay,
    setIsMinimized,
    generateMusicUrl,
    playNext,
    playPrevious,
    playlist,
    setShowPlaylist,
    isMinimized,
    setPlayerTarget,
    isPlaying,
    togglePlay,
    lastValidRoute
  } = useMusic()
  const playerRef = useRef(null)
  const fabRef = useRef(null)

  // Drag state for FAB
  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem('aniempire_fab_pos')
    return saved ? JSON.parse(saved) : { right: 24, bottom: 24 }
  })
  const dragRef = useRef({ isDragging: false, startX: 0, startY: 0, startRight: 0, startBottom: 0 })

  // Drag handlers for FAB
  const handleMouseDown = (e) => {
    if (e.button !== 0) return // Only left click
    if (e.target.closest('.now-playing-fab__close-mini') || e.target.closest('.now-playing-fab__info-mini') || e.target.closest('.now-playing-fab__expand')) {
      return
    }
    const rect = fabRef.current.getBoundingClientRect()
    dragRef.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      startRight: window.innerWidth - rect.right,
      startBottom: window.innerHeight - rect.bottom
    }
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const handleMouseMove = (e) => {
    if (!dragRef.current.isDragging) return
    const deltaX = e.clientX - dragRef.current.startX
    const deltaY = e.clientY - dragRef.current.startY
    const newPos = {
      right: Math.max(0, Math.min(window.innerWidth - 60, dragRef.current.startRight - deltaX)),
      bottom: Math.max(0, Math.min(window.innerHeight - 60, dragRef.current.startBottom - deltaY))
    }
    setPosition(newPos)
  }

  const handleMouseUp = () => {
    dragRef.current.isDragging = false
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
    localStorage.setItem('aniempire_fab_pos', JSON.stringify(position))
  }

  // Set the portal target for the global persistent player.
  useEffect(() => {
    if (isMinimized && mediaType === 'audio' && playerRef.current) {
      // Use a small delay to ensure the previous target (detail page) has unmounted
      const claimTimer = setTimeout(() => {
        setPlayerTarget(playerRef.current);

        // Hide "ugly" initial state for a split second
        setTimeout(() => setIsReady(true), 100);

        const timers = [50, 200, 500, 1000].map(delay =>
          setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
            const ap = playerRef.current?.querySelector?.('.aplayer');
            if (ap) ap.classList.remove('aplayer-narrow', 'aplayer-mini');
          }, delay)
        );
        return () => {
          timers.forEach(t => clearTimeout(t));
          setPlayerTarget(prev => prev === playerRef.current ? null : prev);
        };
      }, 50);

      return () => {
        clearTimeout(claimTimer);
        setPlayerTarget(prev => prev === playerRef.current ? null : prev);
        setIsReady(false);
      }
    } else {
      setIsReady(false);
    }
  }, [isMinimized, mediaType, setPlayerTarget, !!nowPlaying]);

  useEffect(() => {
    if (expanded) {
      const timers = [50, 150, 400].map(delay =>
        setTimeout(() => window.dispatchEvent(new Event('resize')), delay)
      )
      return () => timers.forEach(t => clearTimeout(t))
    }
  }, [expanded])

  if (!nowPlaying) return null
  if (mediaType !== 'audio') return null
  if (!isMinimized) return null

  const musicUrl = generateMusicUrl(nowPlaying)

  const handleTransition = (e) => {
    if (e.target.closest('.now-playing-bar__right') || e.target.closest('.custom-audio-player')) {
      return;
    }
    setPlayerTarget(null);
    setIsMinimized(false);
    navigate(musicUrl);
  }

  return (
    <>
      {/* ──────── Compact FAB: Spinning record + expand chevron ──────── */}
      <div 
        ref={fabRef}
        className={`now-playing-fab ${expanded ? 'now-playing-fab--hidden' : ''}`}
        title={`${nowPlaying.songTitle} - ${nowPlaying.name}`}
        style={{ 
          right: position.right, 
          bottom: position.bottom,
          cursor: dragRef.current.isDragging ? 'grabbing' : 'grab'
        }}
        onMouseDown={handleMouseDown}
      >
        <button 
          className="now-playing-fab__close-mini" 
          onClick={(e) => { e.stopPropagation(); stopPlayback(); }}
          title="Close Player"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>

        <button 
          className="now-playing-fab__info-mini" 
          onClick={(e) => { 
            e.stopPropagation(); 
            setPlayerTarget(null);
            setIsMinimized(false);
            navigate(musicUrl);
          }}
          title="View Info"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        </button>

        <button className="now-playing-fab__expand" onClick={() => setExpanded(true)} title="Expand player">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <button className="now-playing-fab__disc" onClick={(e) => { e.stopPropagation(); togglePlay(); }} title={isPlaying ? 'Pause' : 'Play'}>
          {nowPlaying.coverImage ? (
            <img src={nowPlaying.coverImage} alt={nowPlaying.name} className={`now-playing-fab__img ${isPlaying ? 'spin' : ''}`} />
          ) : (
            <div className={`now-playing-fab__placeholder ${isPlaying ? 'spin' : ''}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--gold)"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
            </div>
          )}
          <div className="now-playing-fab__play-overlay">
            {isPlaying ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><polygon points="5 3 19 12 5 21 5 3" /></svg>
            )}
          </div>
          <div className="now-playing-fab__ring" />
          <div className="now-playing-fab__hole" />
        </button>
      </div>

      {/* ──────── Full Pill Player ──────── */}
      <div className={`now-playing-bar ${!expanded ? 'now-playing-bar--collapsed' : ''}`}>
        {nowPlaying.coverImage && (
          <div className="now-playing-bar__bg" style={{ backgroundImage: `url(${nowPlaying.coverImage})` }} />
        )}
        <div className="now-playing-bar__overlay" />

        <div className="now-playing-bar__info">
          {nowPlaying.coverImage && (
            <Link
              to={musicUrl}
              onClick={() => { setPlayerTarget(null); setIsMinimized(false); }}
            >
              <img src={nowPlaying.coverImage} alt={nowPlaying.name} className={`now-playing-bar__thumb ${isPlaying ? 'spin' : ''}`} />
            </Link>
          )}
          <div className="now-playing-bar__text">
            <Link
              to={musicUrl}
              className="now-playing-bar__song"
              onClick={(e) => {
                setPlayerTarget(null);
                setIsMinimized(false);
              }}
            >
              {nowPlaying.songTitle}
            </Link>
            <p className="now-playing-bar__meta">
              {nowPlaying.artistsData ? (
                nowPlaying.artistsData.map((a, i) => (
                  <React.Fragment key={a.id || i}>
                    <Link to={generateDetailUrl('artist', a.name, a)} className="now-playing-bar__anime-link-inline">{a.name}</Link>
                    {i < nowPlaying.artistsData.length - 1 ? ', ' : ''}
                  </React.Fragment>
                ))
              ) : (
                <span title={`Performed by: ${nowPlaying.artists}`}>{nowPlaying.artists}</span>
              )}
              <span className="now-playing-bar__dot"> · </span>
              <Link
                to={generateDetailUrl('anime', nowPlaying.name, nowPlaying.malId)}
                className="now-playing-bar__anime-link-inline"
              >
                {nowPlaying.name}
              </Link>
            </p>
          </div>
        </div>
        <div className={`now-playing-bar__player ${isReady ? 'is-ready' : 'is-loading'}`} ref={playerRef}>
          {/* Portal target */}
        </div>
        <div className="now-playing-bar__right" onClick={(e) => e.stopPropagation()}>
          {playlist.length > 1 && (
            <div className="now-playing-bar__skip-controls">
              <button className="now-playing-bar__icon-btn now-playing-bar__icon-btn--prev" onClick={playPrevious} title="Previous">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="19 20 9 12 19 4 19 20" /><line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" strokeWidth="3" /></svg>
              </button>
              <button className="now-playing-bar__icon-btn now-playing-bar__icon-btn--next" onClick={playNext} title="Next">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 4 15 12 5 20 5 4" /><line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="3" /></svg>
              </button>
            </div>
          )}

          <button className="now-playing-bar__icon-btn now-playing-bar__icon-btn--play" onClick={togglePlay} title={isPlaying ? 'Pause' : 'Play'}>
            {isPlaying ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
            )}
          </button>

          <button 
            className={`now-playing-bar__icon-btn now-playing-bar__icon-btn--queue ${playlist.length > 0 ? 'has-items' : ''}`} 
            onClick={() => setShowPlaylist(true)} 
            title="Open Queue"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
            {playlist.length > 0 && <span className="now-playing-bar__queue-count">{playlist.length}</span>}
          </button>

          <button className="now-playing-bar__icon-btn now-playing-bar__icon-btn--minimize" onClick={(e) => { e.stopPropagation(); setExpanded(false); }} title="Minimize to disc">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
          </button>

          <button className="now-playing-bar__close" onClick={(e) => { e.stopPropagation(); stopPlayback(); }} title="Close player">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
      </div>
    </>
  )
}
