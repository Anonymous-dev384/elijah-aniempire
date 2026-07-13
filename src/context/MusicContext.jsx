import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { 
  getFeaturedAnimeTheme, 
  getNewAnimeThemes, 
  getPopularAnimeThemes,
  getSeasonalAnime, 
  getAnimeDetail,
  slugify,
  encodeId
} from '../services/api'

const MusicContext = createContext()

const MAX_PLAYLIST_SIZE = 50

export function MusicProvider({ children }) {
  const [nowPlaying, setNowPlaying] = useState(null)
  const [mediaType, setMediaType] = useState('audio') // 'audio' or 'video'
  const [playingId, setPlayingId] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [autoplay, setAutoplay] = useState(false)
  const [loadingFeatured, setLoadingFeatured] = useState(true)
  const [playlist, setPlaylist] = useState(() => {
    const saved = localStorage.getItem('aniempire_playlist')
    return saved ? JSON.parse(saved) : []
  })
  const [playlistIndex, setPlaylistIndex] = useState(-1)
  const [showPlaylist, setShowPlaylist] = useState(false)
  const [preferredMediaType, setPreferredMediaType] = useState('audio')
  const [isMinimized, setIsMinimized] = useState(true)
  const [lastValidRoute, setLastValidRoute] = useState('/')
  
  // Refs for stable callbacks
  const playingIdRef = useRef(playingId)
  const mediaTypeRef = useRef(mediaType)
  const playlistRef = useRef(playlist)

  useEffect(() => { playingIdRef.current = playingId }, [playingId])
  useEffect(() => { mediaTypeRef.current = mediaType }, [mediaType])
  useEffect(() => { playlistRef.current = playlist }, [playlist])
  
  // Portal targets for the APlayer instance
  const [playerTarget, setPlayerTarget] = useState(null)
  const [hiddenBufferTarget, setHiddenBufferTarget] = useState(null)
  
  // Global Audio Engine Ref
  const audioRef = useRef(null)
  const hiddenBufferRef = useRef(null)
  const [audioCurrentTime, setAudioCurrentTime] = useState(0)
  const [audioDuration, setAudioDuration] = useState(0)
  const [audioProgress, setAudioProgress] = useState(0)
  const [isAudioLoading, setIsAudioLoading] = useState(false)

  // Initialize the hidden buffer target once the ref is available
  useEffect(() => {
    if (hiddenBufferRef.current) {
      setHiddenBufferTarget(hiddenBufferRef.current)
    }
  }, [])

  // Consolidated Global Audio Engine Sync
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !nowPlaying) return

    // 1. Sync Source
    const source = nowPlaying.audioLink || nowPlaying.videoLink
    if (source && audio.src !== source) {
      console.log('[MusicContext] Source changing to:', source.substring(0, 50))
      audio.src = source
      audio.load()
    }

    // 2. Sync Playback State
    // If we're in video mode, ensure audio is paused
    if (mediaType === 'video') {
      if (!audio.paused) audio.pause()
      return
    }

    if (isPlaying) {
      // Only call play() if not already playing or starting
      if (audio.paused) {
        audio.play().catch(err => {
          if (err.name === 'AbortError') return
          console.warn('[MusicContext] Playback failed:', err)
          setIsPlaying(false)
        })
      }
    } else {
      // Only call pause() if not already paused
      if (!audio.paused) {
        audio.pause()
      }
    }
  }, [isPlaying, nowPlaying, mediaType])

  const lastSeekTimestamp = useRef(0)

  const lastUpdateRef = useRef(0)
  const handleAudioTimeUpdate = () => {
    const audio = audioRef.current
    if (!audio) return
    
    const now = Date.now()
    // Throttling: Only update state if 250ms has passed or it's a critical update
    if (now - lastUpdateRef.current < 250 && !audio.paused) return
    lastUpdateRef.current = now
    
    // Ignore updates for 500ms after a seek to prevent "rubber banding"
    if (now - lastSeekTimestamp.current < 500) return

    setAudioCurrentTime(audio.currentTime)
    if (audio.duration) {
      setAudioDuration(audio.duration)
      setAudioProgress((audio.currentTime / audio.duration) * 100)
    }
  }



  const seekAudio = (time) => {
    if (audioRef.current) {
      lastSeekTimestamp.current = Date.now()
      console.log('[MusicContext] Seeking to:', time);
      audioRef.current.currentTime = time;
      // Optimistically update state
      setAudioCurrentTime(time)
      if (audioRef.current.duration) {
        setAudioProgress((time / audioRef.current.duration) * 100)
      }
    }
  }
  
  // Persistent settings
  const [loop, setLoop] = useState(() => localStorage.getItem('aniempire_music_loop') || 'none') 
  const [shuffle, setShuffle] = useState(() => localStorage.getItem('aniempire_music_shuffle') === 'true')

  // Persist settings
  useEffect(() => {
    localStorage.setItem('aniempire_music_loop', loop)
  }, [loop])

  useEffect(() => {
    localStorage.setItem('aniempire_music_shuffle', shuffle ? 'true' : 'false')
  }, [shuffle])

  useEffect(() => {
    localStorage.setItem('aniempire_music_pref', preferredMediaType)
  }, [preferredMediaType])

  // Persist playlist to localStorage on change
  useEffect(() => {
    localStorage.setItem('aniempire_playlist', JSON.stringify(playlist))
  }, [playlist])

  // Load featured theme once on initial mount
  useEffect(() => {
    async function loadFeatured() {
      try {
        let featuredData = null;
        let theme = null;

        console.log('[MusicContext] Starting featured theme discovery...');

        // 1. Try Featured Endpoint
        try {
          const res = await getFeaturedAnimeTheme();
          if (res && res.themes) {
            theme = res.themes.find(t => t.audioLink || t.videoLink);
            if (theme) {
              console.log('[MusicContext] Found track from Featured endpoint');
              featuredData = res;
            }
          }
        } catch (e) {
          console.warn('[MusicContext] Featured endpoint failed');
        }

        // 2. Fallback: Recently Added Themes
        if (!theme) {
          try {
            console.log('[MusicContext] Trying Recently Added Themes...');
            const newThemesRes = await getNewAnimeThemes(20, 1);
            if (newThemesRes?.data?.length > 0) {
              // Find the FIRST one that has both audio and video links
              const winner = newThemesRes.data.find(entry => 
                entry.themes?.some(t => t.audioLink && t.videoLink)
              ) || newThemesRes.data.find(entry => 
                entry.themes?.some(t => t.audioLink || t.videoLink)
              );
              
              if (winner) {
                const playableTheme = winner.themes.find(t => t.audioLink || t.videoLink);
                theme = playableTheme;
                featuredData = winner;
                console.log('[MusicContext] Found the latest playable track from Recently Added');
              }
            }
          } catch (e) {
            console.warn('[MusicContext] Recently Added Themes fallback failed');
          }
        }

        // 3. Try Popular Themes fallback
        if (!theme) {
          try {
            console.log('[MusicContext] Trying Popular Themes fallback...');
            const popRes = await getPopularAnimeThemes(20, 1);
            if (popRes?.data?.length > 0) {
              const winner = popRes.data[Math.floor(Math.random() * Math.min(10, popRes.data.length))];
              const playableTheme = winner.themes.find(t => t.audioLink || t.videoLink);
              if (playableTheme) {
                theme = playableTheme;
                featuredData = winner;
                console.log('[MusicContext] Found track from Popular Themes fallback');
              }
            }
          } catch (e) {
             console.warn('[MusicContext] Popular Themes fallback failed');
          }
        }

        // 4. Final Safety Net: Death Note
        if (!theme) {
          console.log('[MusicContext] All fallbacks failed, using Death Note safety net');
          theme = {
            id: 15351,
            songTitle: 'the WORLD',
            artists: 'Nightmare',
            audioLink: 'https://a.animethemes.moe/DeathNote-OP1.ogg',
            videoLink: 'https://v.animethemes.moe/DeathNote-OP1.webm',
            type: 'OP',
            sequence: 1
          };
          featuredData = {
            name: 'Death Note',
            coverImage: 'https://cdn.myanimelist.net/images/anime/9/9453l.jpg',
            slug: 'death-note.T',
            malId: 1535
          };
        }

        if (theme && featuredData) {
          setNowPlaying(prev => {
            if (prev) return prev;
            setPlayingId(theme.id);
            setMediaType('audio');
            setAutoplay(false);
            return {
              songTitle: theme.songTitle,
              artists: theme.artists,
              artistsData: theme.artistsData || null,
              name: featuredData.name,
              audioLink: theme.audioLink,
              videoLink: theme.videoLink,
              coverImage: featuredData.coverImage,
              slug: featuredData.slug,
              malId: featuredData.malId || featuredData.mal_id,
              themeType: theme.type,
              themeSequence: theme.sequence,
              themeId: theme.id,
            };
          });
        }
      } catch (err) {
        console.error('Critical failure in featured discovery:', err);
      } finally {
        setLoadingFeatured(false);
      }
    }
    loadFeatured()
  }, [])

  const generateMusicUrl = useCallback((track) => {
    if (!track) return '/browse/music'
    const slug = slugify(track.name)
    const encoded = encodeId(track.malId)
    const themeKey = `${(track.themeType || 'op').toLowerCase()}${track.themeSequence || 1}`
    return `/music/${slug}.${encoded}/${themeKey}`
  }, [])

  const playTrack = useCallback((animeEntry, theme, type = 'audio', autoplayOpt = true) => {
    const track = {
      songTitle: theme.song?.title || theme.songTitle || 'Unknown Title',
      artists: theme.song?.artists?.map(a => a.name).join(', ') || theme.artists || 'Unknown Artist',
      artistsData: theme.song?.artists || theme.artistsData || null,
      name: animeEntry.name,
      audioLink: theme.audio?.link || theme.audioLink || null,
      videoLink: theme.video?.link || theme.videoLink || null,
      coverImage: animeEntry.coverImage,
      slug: animeEntry.slug,
      malId: animeEntry.malId,
      themeType: theme.type,
      themeSequence: theme.sequence,
      themeId: theme.id,
    }
    
    if (playingIdRef.current !== theme.id) {
      setNowPlaying(track)
      setPlayingId(theme.id)
      setMediaType(type)
      setAutoplay(autoplayOpt)
      setIsPlaying(autoplayOpt)
    } else {
      setNowPlaying(prev => {
        if (prev?.slug !== track.slug || prev?.name !== track.name || prev?.coverImage !== track.coverImage) {
          return { ...prev, ...track }
        }
        return prev;
      })
      if (mediaTypeRef.current !== type) {
        setMediaType(type)
        setAutoplay(autoplayOpt)
        setIsPlaying(autoplayOpt)
      }
    }

    const existingIdx = playlistRef.current.findIndex(item => item.theme.id === theme.id)
    if (existingIdx >= 0) {
      setPlaylistIndex(existingIdx)
    } else {
      setPlaylist(prev => {
        const next = [...prev, { animeEntry, theme }]
        setPlaylistIndex(next.length - 1)
        return next
      })
    }
  }, []) // Stable reference to prevent re-render loops

  const enrichNowPlaying = useCallback((additionalData) => {
    setNowPlaying(prev => {
      if (!prev) return prev;
      let changed = false;
      const updated = { ...prev };
      for (const key in additionalData) {
        if (additionalData[key] !== undefined && additionalData[key] !== null && JSON.stringify(prev[key]) !== JSON.stringify(additionalData[key])) {
          updated[key] = additionalData[key];
          changed = true;
        }
      }
      return changed ? updated : prev;
    });
  }, []);

  const stopPlayback = useCallback(() => {
    setIsPlaying(false)
    setNowPlaying(null)
    setPlayingId(null)
    setAutoplay(false)
    setIsMinimized(true)
    // Full clean stop
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
      audioRef.current.load()
    }
  }, [])

  const lastToggleTime = useRef(0)
  const togglePlay = useCallback(() => {
    const now = Date.now()
    if (now - lastToggleTime.current < 200) return // Debounce rapid clicks
    lastToggleTime.current = now
    setIsPlaying(prev => !prev)
  }, [])

  const toggleMediaType = useCallback(() => {
    const next = mediaType === 'audio' ? 'video' : 'audio'
    setMediaType(next)
    setPreferredMediaType(next)
  }, [mediaType])

  const addToPlaylist = useCallback((animeEntry, theme) => {
    setPlaylist((prev) => {
      if (prev.some((item) => item.theme.id === theme.id)) return prev
      if (prev.length >= MAX_PLAYLIST_SIZE) return prev
      return [...prev, { animeEntry, theme }]
    })
  }, [])

  const removeFromPlaylist = useCallback((index) => {
    setPlaylist((prev) => prev.filter((_, i) => i !== index))
    setPlaylistIndex((prev) => {
      if (index < prev) return prev - 1
      if (index === prev) return -1
      return prev
    })
  }, [])

  const clearPlaylist = useCallback(() => {
    setPlaylist([])
    setPlaylistIndex(-1)
  }, [])

  const moveInPlaylist = useCallback((fromIndex, toIndex) => {
    setPlaylist((prev) => {
      const next = [...prev]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      return next
    })
  }, [])

  const playNext = useCallback(() => {
    if (playlist.length === 0) return
    let nextIdx
    if (shuffle) {
      nextIdx = Math.floor(Math.random() * playlist.length)
      if (nextIdx === playlistIndex && playlist.length > 1) {
        nextIdx = (nextIdx + 1) % playlist.length
      }
    } else {
      nextIdx = playlistIndex + 1 < playlist.length ? playlistIndex + 1 : 0
    }
    const { animeEntry, theme } = playlist[nextIdx]
    setPlaylistIndex(nextIdx)
    playTrack(animeEntry, theme, mediaType, true)
  }, [playlist, playlistIndex, shuffle, mediaType, playTrack])

  const playPrevious = useCallback(() => {
    if (playlist.length === 0) return
    const prevIdx = playlistIndex - 1 >= 0 ? playlistIndex - 1 : playlist.length - 1
    const { animeEntry, theme } = playlist[prevIdx]
    playTrack(animeEntry, theme, mediaType, true)
  }, [playlist, playlistIndex, mediaType, playTrack])

  const handleEnded = useCallback(() => {
    if (loop === 'one') {
      if (audioRef.current) {
        audioRef.current.currentTime = 0
        audioRef.current.play()
      }
      return
    }
    
    if (playlist.length > 1 || loop === 'all') {
      playNext()
    } else {
      setIsPlaying(false)
    }
  }, [playlist, playNext, loop])

  const playFromPlaylist = useCallback((index) => {
    if (index < 0 || index >= playlist.length) return
    const { animeEntry, theme } = playlist[index]
    setPlaylistIndex(index)
    playTrack(animeEntry, theme, mediaType, true)
  }, [playlist, mediaType, playTrack])



  return (
    <MusicContext.Provider value={{
      nowPlaying,
      mediaType,
      playingId,
      autoplay,
      isPlaying,
      preferredMediaType,
      loadingFeatured,
      isMinimized,
      lastValidRoute,
      setLastValidRoute,
      playlist,
      playlistIndex,
      showPlaylist,
      loop,
      shuffle,
      playerTarget,
      setPlayerTarget,
      setLoop,
      setShuffle,
      setIsPlaying,
      togglePlay,
      playTrack,
      stopPlayback,
      toggleMediaType,
      setMediaType,
      setPreferredMediaType,
      setIsMinimized,
      setShowPlaylist,
      setPlaylistIndex,
      addToPlaylist,
      removeFromPlaylist,
      clearPlaylist,
      moveInPlaylist,
      playNext,
      playPrevious,
      handleEnded,
      playFromPlaylist,
      generateMusicUrl,
      enrichNowPlaying,
      audioCurrentTime,
      audioDuration,
      audioProgress,
      isAudioLoading,
      seekAudio,
      hiddenBufferTarget,
      setHiddenBufferTarget,
    }}>
      {children}
      <div 
        ref={hiddenBufferRef} 
        id="music-buffer" 
        style={{ position: 'fixed', width: '1px', height: '1px', opacity: 0, pointerEvents: 'none', top: '-10px', left: '-10px', overflow: 'hidden', zIndex: -1 }} 
      >
        <audio
          ref={audioRef}
          onTimeUpdate={handleAudioTimeUpdate}
          onEnded={handleEnded}
          onLoadStart={() => setIsAudioLoading(true)}
          onCanPlay={() => setIsAudioLoading(false)}
          onLoadedMetadata={handleAudioTimeUpdate}
          onPlay={() => { if (!isPlaying) setIsPlaying(true) }}
          onPause={() => { if (isPlaying) setIsPlaying(false) }}
        />
      </div>
    </MusicContext.Provider>
  )
}

export function useMusic() {
  const context = useContext(MusicContext)
  if (!context) throw new Error('useMusic must be used within a MusicProvider')
  return context
}
