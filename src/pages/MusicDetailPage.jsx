import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useMusic } from '../context/MusicContext'
import ArtPlayerWrapper from '../components/ArtPlayerWrapper'
import APlayerWrapper from '../components/APlayerWrapper'
import PlaylistDrawer from '../components/PlaylistDrawer'
import Footer from '../components/Footer'
import { generateDetailUrl, parseDetailSlug, encodeId, slugify } from '../services/api'

export default function MusicDetailPage() {
  const navigate = useNavigate()
  const { slug, themeKey } = useParams()
  const {
    nowPlaying,
    mediaType,
    autoplay,
    isMinimized,
    setIsMinimized,
    setMediaType,
    stopPlayback,
    toggleMediaType,
    playNext,
    playPrevious,
    playlist,
    playlistIndex,
    setShowPlaylist,
    showPlaylist,
    playingId,
    setPlayerTarget,
    shuffle,
    loop,
    setShuffle,
    setLoop,
    playTrack,
    isPlaying,
    setIsPlaying,
    togglePlay,
    preferredMediaType,
    generateMusicUrl,
    lastValidRoute,
    addToPlaylist,
    enrichNowPlaying,
  } = useMusic()

  // Verify if the current global track matches this page's URL.
  // This prevents the "Featured Flash" (showing the home page's featured theme briefly).
  const isMatch = useCallback(() => {
    if (!nowPlaying || !slug) return false;
    
    // Most reliable method: check the encoded ID directly from the URL and compare with malId
    const urlMalId = parseDetailSlug(slug);
    const playingMalId = nowPlaying.malId || parseDetailSlug(nowPlaying.slug);
    
    const currentThemeKey = `${(nowPlaying.themeType || 'op').toLowerCase()}${nowPlaying.themeSequence || 1}`;
    
    return String(urlMalId) === String(playingMalId) && currentThemeKey === themeKey?.toLowerCase();
  }, [nowPlaying, slug, themeKey]);

  // Initializing state to false if we ALREADY match what's playing, preventing the flash
  // when expanding from the mini-player
  const [loading, setLoading] = useState(() => {
    if (!nowPlaying || !slug) return true;
    const urlMalId = String(parseDetailSlug(slug));
    const playingMalId = String(nowPlaying.malId || parseDetailSlug(nowPlaying.slug));
    const currentThemeKey = `${(nowPlaying.themeType || 'op').toLowerCase()}${nowPlaying.themeSequence || 1}`;
    return !(urlMalId === playingMalId && currentThemeKey === themeKey?.toLowerCase());
  })
  const [errorVisible, setErrorVisible] = useState(false)
  const playerRef = useRef(null)
  const lastLoadedIdRef = useRef(null)

  // Update document title when track changes
  useEffect(() => {
    if (nowPlaying) {
      document.title = `${nowPlaying.songTitle} — ${nowPlaying.name} — AniEmpire`
    }
  }, [nowPlaying])

  useEffect(() => {
    // Only set the player target if we are in full-page mode (not minimized)
    // and the current track matches the URL.
    if (!loading && !isMinimized && isMatch() && mediaType === 'audio' && playerRef.current) {
      setPlayerTarget(playerRef.current)
    }

    // Cleanup: when unmounting or minimizing, tell the context we are no longer the target.
    return () => {
      setPlayerTarget(prev => prev === playerRef.current ? null : prev)
    }
  }, [isMinimized, mediaType, loading, setPlayerTarget, isMatch])

  const hydrate = useCallback(async () => {
    if (!slug || !themeKey) return
    setErrorVisible(false)
    
    // Only show loading skeleton if we don't already match the URL.
    // This prevents the "flash then skeleton" behavior during track switches.
    const currentlyMatching = isMatch()
    if (!currentlyMatching) {
      setLoading(true)
    }
    
    try {
      const malId = parseDetailSlug(slug)
      if (!malId) throw new Error('Invalid anime ID')

      // Fetch anime details and themes in parallel
      const [anime, themes] = await Promise.all([
        import('../services/api').then(m => m.getAnimeDetail(malId)),
        import('../services/api').then(m => m.getAnimeThemes(malId))
      ])

      if (!themes || themes.length === 0) throw new Error('No themes found')

      // Find theme matching themeKey (e.g. op1, ed2)
      const matchedTheme = themes.find(t => {
        const key = `${(t.type || 'op').toLowerCase()}${t.sequence || 1}`
        return key === themeKey.toLowerCase()
      }) || themes[0]

      // Map theme data
      const mappedTheme = {
        id: matchedTheme.id,
        themeId: matchedTheme.id,
        type: matchedTheme.type,
        sequence: matchedTheme.sequence,
        songTitle: matchedTheme.song?.title || matchedTheme.songTitle || 'Unknown',
        artists: matchedTheme.song?.artists?.map(a => a.name).join(', ') || matchedTheme.artists || 'Unknown Artist',
        artistsData: matchedTheme.song?.artists || matchedTheme.artistsData || null,
        videoLink: matchedTheme.video?.link || null,
        audioLink: matchedTheme.audio?.link || matchedTheme.video?.link || null,
      }

      // Normalized anime data for context
      const normalizedAnime = {
        name: anime.title_english || anime.title,
        coverImage: anime.images?.webp?.large_image_url || anime.images?.jpg?.large_image_url,
        slug: anime.slug || slug,
        malId: anime.mal_id
      }

      // Canonical Redirect: If the current URL uses a raw slug, redirect to the ID-encoded one
      const currentPath = window.location.pathname;
      const resolvedMalId = anime.mal_id || malId;
      const canonicalSlug = anime.title_english ? `${slugify(anime.title_english)}.${encodeId(resolvedMalId)}` : `${slugify(anime.title)}.${encodeId(resolvedMalId)}`
      const canonicalPath = `/music/${canonicalSlug}/${themeKey}`
      
      if (currentPath !== canonicalPath) {
        navigate(canonicalPath, { replace: true })
      }
      
      // Ensure we are in "full page" mode
      setIsMinimized(false);

      // Only initialize track if it doesn't match the current one.
      // This prevents playback loops and allows existing playback to continue undisturbed.
      if (!isMatch()) {
        const targetMediaType = preferredMediaType || 'audio';
        playTrack(normalizedAnime, mappedTheme, targetMediaType, false)
      } else {
        // Enrich existing playing track with full metadata (like artistsData)
        enrichNowPlaying({
          artistsData: mappedTheme.artistsData,
          audioLink: mappedTheme.audioLink,
          videoLink: mappedTheme.videoLink,
        });
      }
    } catch (err) {
      console.error('Hydration failed:', err)
      // Only show error if we aren't already matching something (resilience)
      if (!isMatch()) setErrorVisible(true)
    } finally {
      setLoading(false)
    }
  }, [slug, themeKey, playTrack, preferredMediaType, isMatch, enrichNowPlaying])

  // Hydration logic: Only run when the URL changes.
  // We do NOT use isMatch as a dependency here to prevent global track changes
  // from restarting the hydration of the CURRENT page.
  useEffect(() => {
    hydrate()
  }, [slug, themeKey]) // Strictly URL-based

  const lastPlayingRef = useRef(nowPlaying?.themeId || nowPlaying?.id)

  // Sync logic: Follow the track if it changes globally (via Queue or Next/Prev)
  useEffect(() => {
    if (loading || !nowPlaying) return;

    const currentThemeId = nowPlaying.themeId || nowPlaying.id
    const currentTrackUrl = generateMusicUrl(nowPlaying)
    const expectedPath = `/music/${slug}/${themeKey}`
    
    // 1. Navigation follow: If the player moved to a new track, move the page with it.
    // We only trigger this if the nowPlaying track itself actually changed since last check.
    if (lastPlayingRef.current !== currentThemeId) {
      lastPlayingRef.current = currentThemeId;
      if (!isMatch()) {
        navigate(currentTrackUrl)
        return;
      }
    }

    // 2. Minor URL cleanup (e.g. fixing slug suffix) for the current anime track
    if (isMatch() && currentTrackUrl !== expectedPath) {
      navigate(currentTrackUrl, { replace: true })
    }
  }, [nowPlaying, slug, themeKey, navigate, generateMusicUrl, loading, isMatch])

  // On mount, mark as NOT minimized (full page mode)
  useEffect(() => {
    setIsMinimized(false)
    return () => setIsMinimized(true)
  }, [setIsMinimized])



  const handleMinimize = () => {
    setPlayerTarget(null) 
    setIsMinimized(true)
    // Small delay to ensure state settles before navigation
    setTimeout(() => {
      navigate(lastValidRoute || '/', { replace: true })
    }, 10)
  }

  const handleAddToQueue = () => {
    if (nowPlaying) {
      const animeEntry = {
        name: nowPlaying.name,
        malId: nowPlaying.malId,
        coverImage: nowPlaying.coverImage,
        slug: nowPlaying.slug
      }
      const theme = {
        id: nowPlaying.themeId,
        songTitle: nowPlaying.songTitle,
        artists: nowPlaying.artists,
        artistsData: nowPlaying.artistsData,
        audioLink: nowPlaying.audioLink,
        videoLink: nowPlaying.videoLink,
        type: nowPlaying.themeType,
        sequence: nowPlaying.themeSequence
      }
      addToPlaylist(animeEntry, theme)
    }
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleMinimize()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lastValidRoute, navigate, setIsMinimized, setPlayerTarget])

  // Force geometry refresh once loading is done to fix missing timeline
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        window.dispatchEvent(new Event('resize'))
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [loading])

  if (loading || !isMatch()) {
    return (
      <div className="music-detail-page skeleton-pulse" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1 }}>
          {/* Skeleton Detail Hero */}
          <div style={{ height: '400px', width: '100%', background: 'rgba(255,255,255,0.05)' }} />
          {/* Skeleton Player Section */}
          <div className="container" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', gap: '24px' }}>
                  <div style={{ flex: 1, height: '600px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }} />
                  <div style={{ width: '400px', height: '600px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }} />
              </div>
          </div>
        </div>
      </div>
    )
  }

  if (errorVisible) {
    return (
      <div className="music-detail-empty">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5" style={{ opacity: 0.7, marginBottom: 20 }}>
          <path d="M5 12.55a11 11 0 0 1 14.08 0" /><path d="M1.42 9a16 16 0 0 1 21.16 0" /><path d="M8.58 16.11a7 7 0 0 1 6.84 0" /><line x1="12" y1="20" x2="12.01" y2="20" />
        </svg>
        <h2>Connection Error</h2>
        <p>Our scouts couldn't connect to the library. Please check your network.</p>
        <button className="btn btn-primary" onClick={hydrate} style={{ marginTop: 20 }}>
          Try Reconnecting
        </button>
      </div>
    )
  }

  if (!nowPlaying) {
    return (
      <div className="music-detail-empty">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" style={{ opacity: 0.4 }}>
          <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
        </svg>
        <h2>No track selected</h2>
        <p>Start playing a track from the music browser</p>
        <Link to="/browse/music" className="btn btn-primary" style={{ marginTop: 16 }}>
          Browse Music
        </Link>
      </div>
    )
  }

  const themeType = nowPlaying.themeType || 'OP'
  const themeSeq = nowPlaying.themeSequence || ''

  const inPlaylist = playlist.some(item => item.theme.id === nowPlaying?.themeId)

  return (
    <div className="music-detail">
      {/* Background */}
      <div
        className="music-detail__bg"
        style={{ backgroundImage: nowPlaying.coverImage ? `url(${nowPlaying.coverImage})` : undefined }}
      />
      <div className="music-detail__bg-overlay" />

      {/* Top navigation bar */}
      <div className="music-detail__topbar">
        <div style={{ width: 60 }} /> {/* Spacer to balance center label */}
        <div className="music-detail__topbar-center">
          <span className="music-detail__now-label">Now Playing</span>
          <span className="music-detail__esc-hint">Press <b>Esc</b> to minimize</span>
        </div>
        <div className="music-detail__topbar-actions">
          <button 
            className="music-detail__topbar-btn" 
            onClick={handleAddToQueue} 
            title={inPlaylist ? "In Queue" : "Add to Queue"}
            disabled={inPlaylist}
            style={{ opacity: inPlaylist ? 0.5 : 1, cursor: inPlaylist ? 'default' : 'pointer' }}
          >
            {inPlaylist ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            )}
          </button>
          <button className="music-detail__topbar-btn" onClick={() => setShowPlaylist(true)} title="Queue">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
            {playlist.length > 0 && <span className="music-detail__queue-badge">{playlist.length}</span>}
          </button>
          <button className="music-detail__topbar-btn" onClick={handleMinimize} title="Minimize">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="4 14 10 14 10 20" />
              <polyline points="20 10 14 10 14 4" />
              <line x1="14" y1="10" x2="21" y2="3" />
              <line x1="3" y1="21" x2="10" y2="14" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className="music-detail__content">
        <div className="music-detail__layout">
          {/* Left Side: Visualizer / Record / Video */}
          <div className="music-detail__left">
            <div className="music-detail__visual-box">
              {mediaType === 'video' && nowPlaying.videoLink ? (
                <div className="music-detail__video-container">
                  <ArtPlayerWrapper
                    style={{ width: '100%', height: '100%' }}
                    option={{
                      url: nowPlaying.videoLink,
                      autoplay: true,
                      loop: loop === 'one',
                      volume: 0.7,
                      theme: '#D4A843',
                      setting: true,
                      fullscreen: true,
                      fullscreenWeb: true,
                      playbackRate: true,
                      aspectRatio: true,
                      flip: true,
                      miniProgressBar: true,
                      mutex: false,
                      backdrop: true,
                      autoSize: false,
                    }}
                    key={`detail-video-${nowPlaying.videoLink}`}
                  />
                </div>
              ) : (
                <div className="music-detail__audio-visual">
                  <div className="music-detail__disc-container">
                    <div className={`music-detail__disc ${isPlaying ? 'spinning' : ''}`}>
                      {nowPlaying.coverImage ? (
                        <img src={nowPlaying.coverImage} alt={nowPlaying.name} className="music-detail__disc-img" />
                      ) : (
                        <div className="music-detail__disc-placeholder">
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="var(--gold)"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
                        </div>
                      )}
                      <div className="music-detail__disc-texture" />
                      <div className="music-detail__disc-ring" />
                      <div className="music-detail__disc-hole" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Info & Controls */}
          <div className="music-detail__right">
            <div className="music-detail__info-panel">
              <div className="music-detail__header">
                <div className="music-detail__badge-row">
                  <span className={`music-detail__type-badge type-${themeType.toLowerCase()}`}>
                    {themeType}{themeSeq ? ` ${themeSeq}` : ''}
                  </span>
                  {nowPlaying.audioLink && nowPlaying.videoLink && (
                    <div className="music-detail__media-selector">
                      <button 
                        className={`music-detail__media-tab ${mediaType === 'audio' ? 'active' : ''}`}
                        onClick={() => setMediaType('audio')}
                      >
                        Audio
                      </button>
                      <button 
                        className={`music-detail__media-tab ${mediaType === 'video' ? 'active' : ''}`}
                        onClick={() => setMediaType('video')}
                      >
                        Video
                      </button>
                    </div>
                  )}
                </div>
                
                <h1 className="music-detail__song-title">{nowPlaying.songTitle}</h1>
                <div className="music-detail__meta-row">
                  <div className="music-detail__artists">
                    {nowPlaying.artistsData ? (
                      nowPlaying.artistsData.map((a, i) => (
                        <React.Fragment key={a.id || i}>
                          <Link to={generateDetailUrl('artist', a.name, a)} className="music-detail__artist-link">{a.name}</Link>
                          {i < nowPlaying.artistsData.length - 1 ? <span className="separator">, </span> : ''}
                        </React.Fragment>
                      ))
                    ) : (
                      <span className="music-detail__artist-text">{nowPlaying.artists}</span>
                    )}
                  </div>
                </div>
              </div>
              
              {nowPlaying.malId && (
                <Link
                  to={generateDetailUrl('anime', nowPlaying.name, nowPlaying.malId)}
                  className="music-detail__anime-link"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" /><line x1="7" y1="2" x2="7" y2="22" /><line x1="17" y1="2" x2="17" y2="22" /><line x1="2" y1="12" x2="22" y2="12" /><line x1="2" y1="7" x2="7" y2="7" /><line x1="2" y1="17" x2="7" y2="17" /><line x1="17" y1="7" x2="22" y2="7" /><line x1="17" y1="17" x2="22" y2="17" />
                  </svg>
                  {nowPlaying.name}
                </Link>
              )}

              {/* Player Integration */}
              <div className="music-detail__player-wrapper music-detail__aplayer" ref={playerRef}>
                {/* Portal target for global persistent player */}
              </div>

              {/* Playback Settings (Loop / Shuffle) & Track Navigation */}
              <div className="music-detail__controls-row">
                <div className="music-detail__navigation">
                  <button className="music-detail__nav-btn" onClick={playPrevious} disabled={playlist.length <= 1}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="19 20 9 12 19 4 19 20" /><line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" strokeWidth="3" /></svg>
                  </button>
                  
                  {/* Custom Play/Pause Button */}
                  <button className="music-detail__play-btn" onClick={togglePlay} title={isPlaying ? 'Pause' : 'Play'}>
                    {isPlaying ? (
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                    ) : (
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    )}
                  </button>

                  <button className="music-detail__nav-btn" onClick={playNext} disabled={playlist.length <= 1}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 4 15 12 5 20 5 4" /><line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="3" /></svg>
                  </button>
                </div>

                <div className="music-detail__settings">
                  <button 
                    className={`music-detail__setting-btn ${shuffle ? 'active' : ''}`} 
                    onClick={() => setShuffle(!shuffle)}
                    title="Shuffle"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" /><polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" /><line x1="4" y1="4" x2="9" y2="9" /></svg>
                  </button>
                  <button 
                    className={`music-detail__setting-btn ${loop !== 'none' ? 'active' : ''}`}
                    onClick={() => {
                      const modes = ['none', 'all', 'one']
                      const next = modes[(modes.indexOf(loop) + 1) % modes.length]
                      setLoop(next)
                    }}
                    title={`Loop: ${loop}`}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
                      {loop === 'one' && <text x="10" y="16" fontSize="10" fontWeight="bold" fill="currentColor">1</text>}
                    </svg>
                  </button>
                </div>
              </div>

              {playlist.length > 0 && (
                <div className="music-detail__queue-info">
                  <p>Next up: <strong>{playlist[(playlistIndex + 1) % playlist.length]?.theme.songTitle}</strong></p>
                  <button className="music-detail__view-queue" onClick={() => setShowPlaylist(true)}>
                    View Queue ({playlist.length})
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <PlaylistDrawer />
    </div>
  )
}
