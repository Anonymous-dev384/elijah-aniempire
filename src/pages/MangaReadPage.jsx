import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  parseDetailSlug, 
  getMangaDetail, 
  getMangaCharacters, 
  getMangaDetailRecommendations,
  getMangaChapters,
  getMangaChapterPages,
  getProxiedImageUrl,
  generateDetailUrl,
  getFromMemoryCache,
  proxied
} from '../services/api'
import { IconChevronLeft, IconChevronRight, IconX, IconMenu, IconSettings, IconInfo, IconEye } from '../components/Icons'
import AnimeCard from '../components/AnimeCard'
import Lightbox from '../components/Lightbox'
import './MangaReadPage.css'

// Helper to extract chapter number from various chapter ID formats
const extractChapterNumber = (idStr) => {
  if (!idStr) return null;
  // If it's just a number, return it
  if (!isNaN(parseFloat(idStr)) && isFinite(idStr)) return parseFloat(idStr);
  
  const decoded = decodeURIComponent(idStr);
  // Match patterns like "chapter-383", "ch-383", "c383", "chapter/383", or "-383" at the end
  const regexes = [
    /chapter[-/](\d+(?:\.\d+)?)/i,
    /ch[-.](\d+(?:\.\d+)?)/i,
    /c(\d+(?:\.\d+)?)/i,
    /[-/](\d+(?:\.\d+)?)(?:[?#]|$)/,
    /(\d+(?:\.\d+)?)$/
  ];

  for (const regex of regexes) {
    const match = decoded.match(regex);
    if (match && match[1]) {
      const num = parseFloat(match[1]);
      if (!isNaN(num)) return num;
    }
  }
  return null;
}

const formatProviderName = (name) => {
  if (!name) return ''
  return name.toLowerCase().replace('manga', '')
}

const loadedUrls = new Set()

// Component to render individual manga page with a loading skeleton
function MangaPage({ src, alt, className, style }) {
  const [loaded, setLoaded] = useState(() => loadedUrls.has(src))
  const imgRef = useRef(null)

  useEffect(() => {
    if (loadedUrls.has(src)) {
      setLoaded(true)
    } else if (imgRef.current && imgRef.current.complete) {
      loadedUrls.add(src)
      setLoaded(true)
    } else {
      setLoaded(false)
    }
  }, [src])

  return (
    <div className="manga-page-img-wrapper" style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
      {!loaded && (
        <div 
          className="skeleton-poster" 
          style={{ 
            position: 'absolute',
            inset: 0,
            borderRadius: '4px', 
            opacity: 0.6,
            zIndex: 1
          }} 
        />
      )}
      <img 
        ref={imgRef}
        className={className} 
        src={src} 
        alt={alt} 
        style={{ 
          ...style, 
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.2s ease-in-out'
        }}
        onLoad={() => {
          loadedUrls.add(src)
          setLoaded(true)
        }}
      />
    </div>
  )
}

export default function MangaReadPage() {
  const { slug, chapterId } = useParams()
  const navigate = useNavigate()

  const malId = parseDetailSlug(slug)

  // Core configurations
  const [provider, setProvider] = useState(() => {
    return localStorage.getItem('aniempire_manga_provider') || 'mangapill'
  })

  // Synchronously resolve cached metadata and chapters to prevent page loading flicker
  const cachedMangaRes = malId ? getFromMemoryCache(proxied(`/manga/${malId}/full`)) : null
  const cachedManga = cachedMangaRes ? (cachedMangaRes.data || cachedMangaRes) : null
  const cachedChaptersRes = malId ? getFromMemoryCache(proxied(`/manga/${malId}/chapters?provider=${provider}`)) : null

  let initialPages = []
  let initialLoadingPages = true
  let resolvedCh = null

  if (cachedChaptersRes && chapterId) {
    const chaptersList = cachedChaptersRes.chapters || []
    resolvedCh = chaptersList.find(c => c.id === chapterId || c.number.toString() === chapterId.toString())
    if (resolvedCh) {
      const pageParams = new URLSearchParams({ provider })
      const mId = cachedChaptersRes.mangaId || ''
      if (mId) pageParams.append('mangaId', mId)
      const pUrl = proxied(`/manga/read/${resolvedCh.id}?${pageParams.toString()}`)
      const cachedPagesData = getFromMemoryCache(pUrl)
      if (cachedPagesData) {
        const rawPages = cachedPagesData.pages || cachedPagesData
        initialPages = rawPages.map(page => {
          const url = typeof page === 'string' ? page : (page.img || page.url || '')
          return getProxiedImageUrl(url, provider)
        })
        initialLoadingPages = false
      }
    }
  }

  const [providerMangaId, setProviderMangaId] = useState(() => {
    return cachedChaptersRes?.mangaId || ''
  })

  // Manga information states
  const [manga, setManga] = useState(cachedManga)
  const [chapters, setChapters] = useState(() => {
    if (cachedChaptersRes) {
      const sorted = [...(cachedChaptersRes.chapters || [])].sort((a, b) => {
        const numA = parseFloat(a.number) || 0
        const numB = parseFloat(b.number) || 0
        return numA - numB
      })
      return sorted
    }
    return []
  })
  const [chaptersProvider, setChaptersProvider] = useState(() => {
    return cachedChaptersRes ? (cachedChaptersRes.provider || provider) : ''
  })
  const [characters, setCharacters] = useState([])
  const [recommendations, setRecommendations] = useState([])
  
  // Chapter page states
  const [pages, setPages] = useState(initialPages)
  const [currentChapter, setCurrentChapter] = useState(resolvedCh)
  const [loading, setLoading] = useState(!cachedManga || !cachedChaptersRes)
  const [loadingPages, setLoadingPages] = useState(initialLoadingPages)
  const [error, setError] = useState(null)

  // Reader Settings States (persisted in localStorage)
  const [readingMode, setReadingMode] = useState(() => {
    return localStorage.getItem('aniempire_manga_reading_mode') || 'vertical'
  })
  const [readingDirection, setReadingDirection] = useState(() => {
    return localStorage.getItem('aniempire_manga_reading_direction') || 'ltr'
  })
  const [fitMode, setFitMode] = useState(() => {
    return localStorage.getItem('aniempire_manga_fit_mode') || 'width'
  })
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('aniempire_manga_theme') || 'dark'
  })

  // Navigation and zoom states
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const [zoom, setZoom] = useState(1.0)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    return localStorage.getItem('aniempire_manga_sidebar') !== 'false'
  })
  const [isMobileInfoOpen, setIsMobileInfoOpen] = useState(false)
  const [showAllCharacters, setShowAllCharacters] = useState(false)
  const [isUIHidden, setIsUIHidden] = useState(() => {
    return localStorage.getItem('aniempire_manga_ui_hidden') === 'true'
  })
  const [lbState, setLbState] = useState({ open: false, images: [], index: 0 })
  const [toastMessage, setToastMessage] = useState(null)
  
  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const readerWindowRef = useRef(null)
  const settingsDrawerRef = useRef(null)
  const mobileInfoDrawerRef = useRef(null)
  const sidebarRef = useRef(null)
  const lastScrollY = useRef(0)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)

  const handleScroll = (e) => {
    const currentScrollY = e.target.scrollTop
    // Hide UI when scrolling down
    if (currentScrollY > lastScrollY.current + 20) {
      setIsUIHidden(true)
      lastScrollY.current = currentScrollY
    } 
    // Show UI when scrolling up significantly
    else if (currentScrollY < lastScrollY.current - 50) {
      setIsUIHidden(false)
      lastScrollY.current = currentScrollY
    }
    // Update lastScrollY without threshold if direction reverses slightly to keep track accurately
    else if (Math.abs(currentScrollY - lastScrollY.current) > 20) {
      lastScrollY.current = currentScrollY
    }
  }

  const openLightbox = (images, index = 0) => {
    setLbState({ open: true, images, index })
  }

  // Save settings helpers
  const updateSetting = (key, val, setter) => {
    setter(val)
    localStorage.setItem(`aniempire_manga_${key}`, val)
  }

  // Load Manga details and Chapters list
  useEffect(() => {
    if (!malId) {
      setError('Invalid Manga Slug')
      setLoading(false)
      return
    }

    const loadMangaMeta = async () => {
      const cacheM = getFromMemoryCache(proxied(`/manga/${malId}/full`))
      const cacheC = getFromMemoryCache(proxied(`/manga/${malId}/chapters?provider=${provider}`))
      if (!cacheM || !cacheC) {
        setLoading(true)
      }
      setError(null)
      try {
        if (!manga) {
          const detail = await getMangaDetail(malId)
          setManga(detail)
          document.title = `Read ${detail?.title || 'Manga'} — AniEmpire`

          // Load supplementary sidebar data parallelly
          const [charsRes, recsRes] = await Promise.allSettled([
            getMangaCharacters(malId),
            getMangaDetailRecommendations(malId)
          ])

          if (charsRes.status === 'fulfilled') setCharacters(charsRes.value || [])
          if (recsRes.status === 'fulfilled') setRecommendations(recsRes.value || [])
        }
        
        // Fetch chapters list
        const chaptersRes = await getMangaChapters(malId, provider)
        if (chaptersRes) {
          const sorted = [...(chaptersRes.chapters || [])].sort((a, b) => {
            const numA = parseFloat(a.number) || 0
            const numB = parseFloat(b.number) || 0
            return numA - numB
          })

          setChaptersProvider(chaptersRes.provider || provider)
          setProviderMangaId(chaptersRes.mangaId || '')
          setChapters(sorted)

          // Sync provider state if backend redirected/fell back to a different provider
          if (chaptersRes.provider && chaptersRes.provider !== provider) {
            showToast(`Failed to load '${formatProviderName(provider)}', switching to '${formatProviderName(chaptersRes.provider)}'`)
            setProvider(chaptersRes.provider)
            localStorage.setItem('aniempire_manga_provider', chaptersRes.provider)
          }
        }
      } catch (err) {
        console.error('Failed to load manga metadata:', err)
        setError('Failed to fetch manga chapters and details.')
      } finally {
        setLoading(false)
      }
    }

    loadMangaMeta()
  }, [malId, provider])

  // Sync chapters transition (switch provider or resolve initial route chapter number)
  useEffect(() => {
    if (chapters.length === 0 || !chaptersProvider || chaptersProvider !== provider) return

    // Check if the current route's chapterId can be resolved in our chapters list
    const resolvedByParam = chapters.find(c => c.id === chapterId || c.number.toString() === chapterId.toString())

    if (resolvedByParam) {
      // Clean up the URL to use the chapter number instead of a long ID
      if (chapterId !== resolvedByParam.number.toString()) {
        navigate(`/manga/${slug}/read/${encodeURIComponent(resolvedByParam.number)}`, { replace: true })
      }
      return
    }

    // Otherwise, we need to transition to the current chapter on the new provider
    let targetNum = null
    if (currentChapter && currentChapter.number !== undefined) {
      targetNum = parseFloat(currentChapter.number)
    } else {
      targetNum = extractChapterNumber(chapterId)
    }

    if (targetNum !== null && !isNaN(targetNum)) {
      const matched = chapters.find(c => parseFloat(c.number) === targetNum)
      if (matched) {
        navigate(`/manga/${slug}/read/${encodeURIComponent(matched.number)}`, { replace: true })
        return
      }
    }

    // Fallback: If we couldn't match the chapter number, default to the first chapter in the list
    if (chapters.length > 0) {
      const firstCh = chapters[0]
      navigate(`/manga/${slug}/read/${encodeURIComponent(firstCh.number)}`, { replace: true })
    }
  }, [chapters, chaptersProvider, provider, chapterId, slug, navigate])

  // Resolve active chapter and fetch pages
  useEffect(() => {
    // Prevent fetching pages with a mismatched provider list
    if (chapters.length === 0 || !chaptersProvider || chaptersProvider !== provider) return

    const resolveAndLoadPages = async () => {
      const resolvedChapter = chapters.find(c => c.id === chapterId || c.number.toString() === chapterId.toString())
      if (!resolvedChapter) {
        // Mismatch or invalid route state: transition effect will handle redirecting shortly
        setLoadingPages(false)
        return
      }

      // Check if page data is already in cache
      const pageParams = new URLSearchParams({ provider })
      if (providerMangaId) pageParams.append('mangaId', providerMangaId)
      const cacheUrl = proxied(`/manga/read/${resolvedChapter.id}?${pageParams.toString()}`)
      const cached = getFromMemoryCache(cacheUrl)

      if (cached) {
        const rawPages = cached.pages || cached
        const proxiedPages = rawPages.map(page => {
          const url = typeof page === 'string' ? page : (page.img || page.url || '')
          return getProxiedImageUrl(url, provider)
        })
        setPages(proxiedPages)
        setLoadingPages(false)
      } else {
        setLoadingPages(true)
        setPages([])
      }
      
      setCurrentPageIndex(0)
      setCurrentChapter(resolvedChapter)
      setError(null)

      try {
        const rawPages = await getMangaChapterPages(resolvedChapter.id, provider, providerMangaId)
        if (!rawPages || rawPages.length === 0) {
          throw new Error('No pages returned by scraper.')
        }

        // Map and proxy page images
        const proxiedPages = rawPages.map(page => {
          const url = typeof page === 'string' ? page : (page.img || page.url || '')
          return getProxiedImageUrl(url, provider)
        })

        setPages(proxiedPages)
      } catch (err) {
        console.error('Failed loading chapter pages:', err)
        setError('Failed to fetch pages for this chapter. Try switching providers.')
      } finally {
        setLoadingPages(false)
      }
    }

    resolveAndLoadPages()
  }, [chapters, chaptersProvider, chapterId, provider, providerMangaId])

  // Navigate to adjacent chapter
  const navigateToChapter = useCallback((targetCh) => {
    if (!targetCh) return
    navigate(`/manga/${slug}/read/${encodeURIComponent(targetCh.number)}`)
  }, [navigate, slug])

  const nextChapter = useCallback(() => {
    if (!currentChapter || chapters.length === 0) return
    const idx = chapters.findIndex(c => c.id === currentChapter.id)
    if (idx < chapters.length - 1) {
      navigateToChapter(chapters[idx + 1])
    }
  }, [currentChapter, chapters, navigateToChapter])

  const prevChapter = useCallback(() => {
    if (!currentChapter || chapters.length === 0) return
    const idx = chapters.findIndex(c => c.id === currentChapter.id)
    if (idx > 0) {
      navigateToChapter(chapters[idx - 1])
    }
  }, [currentChapter, chapters, navigateToChapter])

  // Single/Double Page Flipping Controls
  const handlePageStep = useCallback((dir) => {
    const step = readingMode === 'double' ? 2 : 1
    const factor = readingDirection === 'rtl' ? -1 : 1
    const actualDir = dir * factor // invert if right-to-left

    if (actualDir > 0) {
      // Advance forward
      if (currentPageIndex + step < pages.length) {
        setCurrentPageIndex(prev => prev + step)
        // Scroll to top of read window
        if (readerWindowRef.current) readerWindowRef.current.scrollTop = 0
      } else {
        // Last page: auto-advance to next chapter if exists
        nextChapter()
      }
    } else {
      // Step backward
      if (currentPageIndex - step >= 0) {
        setCurrentPageIndex(prev => prev - step)
        if (readerWindowRef.current) readerWindowRef.current.scrollTop = 0
      } else {
        // First page: step backward to previous chapter
        prevChapter()
      }
    }
  }, [readingMode, readingDirection, currentPageIndex, pages.length, nextChapter, prevChapter])

  const handleTouchStart = useCallback((e) => {
    if (readingMode === 'vertical') return
    if (e.touches.length !== 1) return
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }, [readingMode])

  const handleTouchEnd = useCallback((e) => {
    if (readingMode === 'vertical') return
    if (e.changedTouches.length !== 1) return

    const touchEndX = e.changedTouches[0].clientX
    const touchEndY = e.changedTouches[0].clientY

    const diffX = touchEndX - touchStartX.current
    const diffY = touchEndY - touchStartY.current

    // Only process horizontal swipes
    if (Math.abs(diffX) > Math.abs(diffY)) {
      const threshold = 75 // not too sensitive
      if (Math.abs(diffX) > threshold) {
        if (diffX > 0) {
          // Swipe Right (Go backward in LTR, forward in RTL)
          handlePageStep(-1)
        } else {
          // Swipe Left (Go forward in LTR, backward in RTL)
          handlePageStep(1)
        }
      }
    }
  }, [readingMode, handlePageStep])

  // Sidebar & UI toggles with persistence
  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => {
      const next = !prev
      localStorage.setItem('aniempire_manga_sidebar', next)
      return next
    })
  }, [])

  const toggleUI = useCallback(() => {
    setIsUIHidden(prev => {
      const next = !prev
      localStorage.setItem('aniempire_manga_ui_hidden', next)
      return next
    })
  }, [])

  // Keyboard Shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT' || lbState.open) return

      if (e.key === 'ArrowRight') {
        handlePageStep(1)
      } else if (e.key === 'ArrowLeft') {
        handlePageStep(-1)
      } else if (e.key === 'Escape') {
        setIsSettingsOpen(false)
        setIsMobileInfoOpen(false)
      } else if (e.key === 'f' || e.key === 'F' || e.key === 'h' || e.key === 'H') {
        toggleUI()
      } else if (e.key === 'i' || e.key === 'I') {
        if (window.innerWidth <= 992) {
          setIsMobileInfoOpen(prev => !prev)
        } else {
          toggleSidebar()
        }
      } else if (e.key === 's' || e.key === 'S' || e.key === 'o' || e.key === 'O') {
        setIsSettingsOpen(prev => !prev)
      }
    }

    const handleClickOutside = (e) => {
      // Close settings if click is outside
      if (isSettingsOpen && settingsDrawerRef.current && !settingsDrawerRef.current.contains(e.target)) {
        // Also check if the click was on the settings toggle button itself to avoid double-toggle
        const isToggleBtn = e.target.closest('.setting-option-btn') || e.target.closest('.drawer-close-btn');
        if (!isToggleBtn) {
          setIsSettingsOpen(false);
        }
      }
      
      // Close mobile info if click is outside
      if (isMobileInfoOpen && mobileInfoDrawerRef.current && !mobileInfoDrawerRef.current.contains(e.target)) {
        const isToggleBtn = e.target.closest('.reader-manga-title') || e.target.closest('.drawer-close-btn');
        if (!isToggleBtn) {
          setIsMobileInfoOpen(false);
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('mousedown', handleClickOutside)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('mousedown', handleClickOutside)
    }
  }, [handlePageStep, isSettingsOpen, isMobileInfoOpen, toggleSidebar, lbState.open])

  // Handle Provider / Source select change
  const handleProviderChange = (newProv) => {
    updateSetting('provider', newProv, setProvider)
    setProviderMangaId('') // Clear provider-specific ID so it re-resolves
  }

  // Zoom control helpers
  const handleZoom = (factor) => {
    setZoom(prev => Math.min(Math.max(prev + factor, 0.8), 3.0))
  }

  const resetZoom = () => setZoom(1.0)

  // Preload adjacent/next pages for a smoother reading experience
  useEffect(() => {
    if (pages.length === 0) return

    const timer = setTimeout(() => {
      const preloadCount = readingMode === 'double' ? 4 : 2
      const startIndex = currentPageIndex + (readingMode === 'double' ? 2 : 1)

      for (let i = 0; i < preloadCount; i++) {
        const targetIdx = startIndex + i
        if (targetIdx < pages.length) {
          const url = pages[targetIdx]
          if (!loadedUrls.has(url)) {
            const img = new Image()
            img.onload = () => loadedUrls.add(url)
            img.src = url
          }
        }
      }
    }, 800) // Delay preloading to prioritize rendering of current pages

    return () => clearTimeout(timer)
  }, [currentPageIndex, pages, readingMode])

  if (loading) {
    return (
      <div className="manga-reader-container">
        <header className="manga-reader-header">
          <div className="reader-header-left">
            <div className="skeleton-line" style={{ width: '30px', height: '30px', borderRadius: '50%' }} />
            <div className="reader-manga-info">
              <div className="skeleton-line" style={{ width: '120px', height: '18px', marginBottom: '4px' }} />
              <div className="skeleton-line" style={{ width: '80px', height: '12px' }} />
            </div>
          </div>
        </header>
        <div className="reader-workspace">
          <aside className={`reader-sidebar no-scrollbar ${isSidebarOpen ? '' : 'collapsed'}`}>
            <div className="reader-sidebar-content">
              <div className="skeleton-poster" style={{ height: '300px', width: '100%', marginBottom: '16px' }} />
              <div className="skeleton-line" style={{ width: '100%', height: '14px', marginBottom: '8px' }} />
              <div className="skeleton-line" style={{ width: '90%', height: '14px', marginBottom: '8px' }} />
              <div className="skeleton-line" style={{ width: '80%', height: '14px' }} />
            </div>
          </aside>
          <main className="reader-content-window" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
            <div className="skeleton-poster" style={{ width: '60%', height: '80vh', maxWidth: '600px', margin: '0 auto' }} />
          </main>
        </div>
      </div>
    )
  }

  // Find index of current chapter
  const currentChapterIndex = currentChapter ? chapters.findIndex(c => c.id === currentChapter.id) : -1
  const hasNext = currentChapterIndex < chapters.length - 1
  const hasPrev = currentChapterIndex > 0

  return (
    <div className={`manga-reader-container theme-${theme} ${isUIHidden ? 'ui-hidden' : ''}`}>
      {/* Top Header Navigation Panel */}
      <header className="manga-reader-header">
        <div className="reader-header-left">
          <button 
            className="reader-back-btn" 
            onClick={() => navigate(`/manga/${slug}`)}
            title="Return to details page"
          >
            <IconChevronLeft size={22} />
          </button>
          
          <div className="reader-manga-info">
            <h1 className="reader-manga-title">{manga?.title || 'Manga'}</h1>
            <p className="reader-chapter-title">
              {currentChapter ? (currentChapter.title || `Chapter ${currentChapter.number}`) : 'Loading Chapter...'}
            </p>
          </div>
        </div>

        <div className="reader-header-right">
          {/* Info Button — toggles sidebar on desktop, opens mobile drawer on mobile */}
          <button 
            className="setting-option-btn" 
            style={{ width: '40px', height: '40px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => {
              if (window.innerWidth <= 992) {
                setIsMobileInfoOpen(true)
              } else {
                toggleSidebar()
              }
            }}
            title="Toggle details info"
          >
            <IconInfo size={20} />
          </button>

          {/* Quick settings gear */}
          <button 
            className="setting-option-btn" 
            style={{ width: '40px', height: '40px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setIsSettingsOpen(true)}
            title="Reader Settings (S / O)"
          >
            <IconSettings size={20} />
          </button>

          {/* UI Toggle (Fullscreen-style) */}
          <button 
            className={`floating-ui-toggle ${isUIHidden ? 'hidden-ui' : ''}`}
            onClick={toggleUI}
            title="Clean View (H)"
          >
            <IconEye size={18} />
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="reader-workspace">
        
        {/* Desktop Sidebar (Collapsible) */}
        <aside className={`reader-sidebar ${isSidebarOpen ? '' : 'collapsed'}`}>
          <div className="reader-sidebar-content">
            <div className="sidebar-header">
              <h2 className="sidebar-header-title">Manga Info</h2>
              <button className="sidebar-close-btn" onClick={toggleSidebar} title="Close Sidebar (I)">
                <IconX size={18} />
              </button>
            </div>

            <img 
              className="sidebar-manga-cover" 
              src={manga?.images?.jpg?.large_image_url || manga?.images?.webp?.large_image_url} 
              alt={manga?.title} 
            />
            
            <div>
              <h2 className="sidebar-title">Synopsis</h2>
              <p className="sidebar-synopsis">{manga?.synopsis || 'No description available.'}</p>
            </div>

            {characters.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <h2 className="sidebar-title detail-section-title" style={{ marginBottom: '16px' }}>Characters</h2>

                <div className="sidebar-section-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px 8px' }}>
                  {(showAllCharacters ? characters : characters.slice(0, 8)).map((char, idx) => (
                    <div 
                      key={idx} 
                      style={{ textAlign: 'center' }}
                    >
                      <div style={{ width: '100%', paddingBottom: '100%', position: 'relative', marginBottom: '6px' }}>
                        <img 
                          src={char.character?.images?.jpg?.image_url} 
                          alt={char.character?.name} 
                          onClick={() => {
                            const imgs = characters.map(c => c.character?.images?.webp?.image_url || c.character?.images?.jpg?.image_url).filter(Boolean);
                            openLightbox(imgs, idx);
                          }}
                          style={{ 
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%', 
                            height: '100%', 
                            borderRadius: '50%', 
                            objectFit: 'cover', 
                            border: '1px solid rgba(212, 168, 67, 0.15)', 
                            cursor: 'zoom-in',
                            transition: 'border-color 0.2s'
                          }} 
                          onMouseOver={e => e.currentTarget.style.borderColor = 'var(--gold)'}
                          onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(212, 168, 67, 0.15)'}
                        />
                      </div>
                      <Link 
                        to={generateDetailUrl('character', char.character?.name, char.character?.mal_id)}
                        className="hover-link"
                        style={{ fontSize: '0.65rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', color: 'var(--text-primary)' }}
                      >
                        {char.character?.name?.split(',')[0]}
                      </Link>
                    </div>
                  ))}
                </div>

                {characters.length > 8 && (
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => setShowAllCharacters(!showAllCharacters)}
                    style={{ width: '100%', marginTop: '16px', justifyContent: 'center', padding: '8px 0', fontSize: '0.8rem' }}
                  >
                    {showAllCharacters ? 'Show Less' : `View All Characters (${characters.length})`}
                  </button>
                )}
              </div>
            )}

            {recommendations.length > 0 && (
              <div>
                <h2 className="sidebar-title detail-section-title">Recommendations</h2>
                <div className="sidebar-section-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  {recommendations.slice(0, 4).map((rec) => (
                    <AnimeCard key={rec.id} item={{ ...rec, type: 'manga' }} type="manga" />
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Main Reading Viewport */}
        <main 
          ref={readerWindowRef}
          className={`reader-content-window mode-${readingMode}`}
          tabIndex={0}
          onScroll={handleScroll}
          onDoubleClick={toggleUI}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {loadingPages ? (
            <div className="reader-loading-panel">
              <div 
                className="skeleton-poster" 
                style={{ 
                  width: '100%', 
                  height: '85vh', 
                  maxWidth: fitMode === 'height' ? '80vh' : fitMode === 'original' ? '700px' : '900px', 
                  borderRadius: '8px' 
                }} 
              />
            </div>
          ) : error ? (
            <div className="reader-error-panel">
              <p style={{ color: 'var(--red)', fontWeight: 600 }}>{error}</p>
              <button 
                className="btn btn-sm btn-ghost" 
                style={{ border: '1px solid var(--gold)', color: 'var(--gold)', marginTop: '8px' }}
                onClick={() => {
                  setError(null)
                  // Force a re-fetch of pages
                  setChapters([...chapters])
                }}
              >
                Retry Load
              </button>
            </div>
          ) : pages.length === 0 ? (
            <div className="reader-error-panel">
              <p>No pages found for this chapter.</p>
              <p style={{ fontSize: '0.85rem', opacity: 0.7 }}>Try switching providers in settings.</p>
            </div>
          ) : (
            <div 
              className={`reader-canvas fit-${fitMode}`}
              style={{ 
                transform: `scale(${zoom})`, 
                transformOrigin: readingMode === 'vertical' ? 'top center' : 'center center' 
              }}
            >
              {/* VERTICAL MODE (Long Strip) */}
              {readingMode === 'vertical' && (
                <div className="layout-vertical">
                  {pages.map((imgUrl, idx) => (
                    <div key={idx} className="reader-page-container">
                      <img 
                        className="reader-page-img" 
                        src={imgUrl} 
                        alt={`Page ${idx + 1}`} 
                        loading="lazy"
                      />
                      <span className="page-divider-label">Page {idx + 1} / {pages.length}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* SINGLE PAGE MODE */}
              {readingMode === 'single' && (
                <div className="layout-single">
                  <div className="single-page-wrapper">
                    {/* Left Hotspot */}
                    <div className="nav-hotspot nav-hotspot-left" onClick={() => handlePageStep(-1)}>
                      <span className="hotspot-arrow"><IconChevronLeft size={16} /></span>
                    </div>

                    <MangaPage 
                      key={pages[currentPageIndex]}
                      className="reader-page-img" 
                      src={pages[currentPageIndex]} 
                      alt={`Page ${currentPageIndex + 1}`} 
                    />

                    {/* Right Hotspot */}
                    <div className="nav-hotspot nav-hotspot-right" onClick={() => handlePageStep(1)}>
                      <span className="hotspot-arrow"><IconChevronRight size={16} /></span>
                    </div>
                  </div>
                  <span className="page-divider-label" style={{ marginTop: '16px' }}>
                    Page {currentPageIndex + 1} of {pages.length}
                  </span>
                </div>
              )}

              {/* DOUBLE PAGE MODE (Side-by-Side) */}
              {readingMode === 'double' && (
                <div className="layout-single">
                  <div className="layout-double">
                    <div className="double-page-container">
                      {/* Left page hotspot (depends on reading direction) */}
                      <div className="nav-hotspot nav-hotspot-left" onClick={() => handlePageStep(readingDirection === 'rtl' ? 1 : -1)}>
                        <span className="hotspot-arrow"><IconChevronLeft size={16} /></span>
                      </div>

                      <MangaPage 
                        key={readingDirection === 'rtl' ? (pages[currentPageIndex + 1] || pages[currentPageIndex]) : pages[currentPageIndex]}
                        className="reader-page-img" 
                        src={readingDirection === 'rtl' ? (pages[currentPageIndex + 1] || pages[currentPageIndex]) : pages[currentPageIndex]} 
                        alt={`Page ${currentPageIndex + 1}`} 
                      />
                    </div>

                    {/* Second page if available */}
                    {currentPageIndex + 1 < pages.length && (
                      <div className="double-page-container">
                        <MangaPage 
                          key={readingDirection === 'rtl' ? pages[currentPageIndex] : pages[currentPageIndex + 1]}
                          className="reader-page-img" 
                          src={readingDirection === 'rtl' ? pages[currentPageIndex] : pages[currentPageIndex + 1]} 
                          alt={`Page ${currentPageIndex + 2}`} 
                        />

                        {/* Right page hotspot */}
                        <div className="nav-hotspot nav-hotspot-right" onClick={() => handlePageStep(readingDirection === 'rtl' ? -1 : 1)}>
                          <span className="hotspot-arrow"><IconChevronRight size={16} /></span>
                        </div>
                      </div>
                    )}
                  </div>
                  <span className="page-divider-label" style={{ marginTop: '16px' }}>
                    Pages {currentPageIndex + 1} - {Math.min(currentPageIndex + 2, pages.length)} of {pages.length}
                  </span>
                </div>
              )}
            </div>
          )}
        </main>
      </div>


      {/* Settings Drawer overlay */}
      <div ref={settingsDrawerRef} className={`settings-drawer ${isSettingsOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <span className="drawer-title">Reader Options</span>
          <button className="drawer-close-btn" onClick={() => setIsSettingsOpen(false)}>
            <IconX size={18} />
          </button>
        </div>

        <div className="drawer-body">
          {/* Source Scraper Dropdown */}
          <div className="setting-item">
            <span className="setting-label">Source Scraper</span>
            <select 
              value={provider} 
              onChange={(e) => handleProviderChange(e.target.value)}
              className="reader-dropdown-select"
              style={{ width: '100%' }}
            >
              <option value="mangapill">Pill</option>
              <option value="mangafire">Fire</option>
              <option value="flamecomics">Flame</option>
              <option value="mangadex">Dex</option>
            </select>
          </div>

          {/* Reading Mode */}
          <div className="setting-item">
            <span className="setting-label">Reading Mode</span>
            <div className="setting-options-grid">
              <button 
                className={`setting-option-btn ${readingMode === 'vertical' ? 'active' : ''}`}
                onClick={() => updateSetting('reading_mode', 'vertical', setReadingMode)}
              >
                Vertical
              </button>
              <button 
                className={`setting-option-btn ${readingMode === 'single' ? 'active' : ''}`}
                onClick={() => updateSetting('reading_mode', 'single', setReadingMode)}
              >
                Single
              </button>
              <button 
                className={`setting-option-btn ${readingMode === 'double' ? 'active' : ''}`}
                onClick={() => updateSetting('reading_mode', 'double', setReadingMode)}
              >
                Double
              </button>
            </div>
          </div>

          {/* Reading Direction */}
          <div className="setting-item">
            <span className="setting-label">Reading Direction</span>
            <div className="setting-options-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <button 
                className={`setting-option-btn ${readingDirection === 'ltr' ? 'active' : ''}`}
                onClick={() => updateSetting('reading_direction', 'ltr', setReadingDirection)}
              >
                Left-to-Right
              </button>
              <button 
                className={`setting-option-btn ${readingDirection === 'rtl' ? 'active' : ''}`}
                onClick={() => updateSetting('reading_direction', 'rtl', setReadingDirection)}
              >
                Right-to-Left
              </button>
            </div>
          </div>

          {/* Fit Mode */}
          <div className="setting-item">
            <span className="setting-label">Fit Mode</span>
            <div className="setting-options-grid">
              <button 
                className={`setting-option-btn ${fitMode === 'width' ? 'active' : ''}`}
                onClick={() => updateSetting('fit_mode', 'width', setFitMode)}
              >
                Width
              </button>
              <button 
                className={`setting-option-btn ${fitMode === 'height' ? 'active' : ''}`}
                onClick={() => updateSetting('fit_mode', 'height', setFitMode)}
              >
                Height
              </button>
              <button 
                className={`setting-option-btn ${fitMode === 'original' ? 'active' : ''}`}
                onClick={() => updateSetting('fit_mode', 'original', setFitMode)}
              >
                Original
              </button>
            </div>
          </div>

          {/* Theme background Selector */}
          <div className="setting-item">
            <span className="setting-label">Theme Background</span>
            <div className="setting-options-grid">
              <button 
                className={`setting-option-btn ${theme === 'dark' ? 'active' : ''}`}
                onClick={() => updateSetting('theme', 'dark', setTheme)}
              >
                Dark
              </button>
              <button 
                className={`setting-option-btn ${theme === 'sepia' ? 'active' : ''}`}
                onClick={() => updateSetting('theme', 'sepia', setTheme)}
              >
                Sepia
              </button>
              <button 
                className={`setting-option-btn ${theme === 'light' ? 'active' : ''}`}
                onClick={() => updateSetting('theme', 'light', setTheme)}
              >
                Light
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Details Drawer overlay */}
      <div ref={mobileInfoDrawerRef} className={`mobile-info-drawer ${isMobileInfoOpen ? 'open' : ''}`}>
        <div className="mobile-info-handle" onClick={() => setIsMobileInfoOpen(false)}></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 className="drawer-title" style={{ margin: 0 }}>Manga Synopsis</h3>
          <button className="drawer-close-btn" onClick={() => setIsMobileInfoOpen(false)}>
            <IconX size={18} />
          </button>
        </div>
        
        <p className="sidebar-synopsis" style={{ marginBottom: '24px' }}>{manga?.synopsis || 'No description available.'}</p>

        {characters.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 className="sidebar-title detail-section-title" style={{ margin: 0 }}>Characters</h3>
              {characters.length > 4 && (
                <button 
                  className="btn btn-ghost btn-sm" 
                  onClick={() => setShowAllCharacters(!showAllCharacters)}
                  style={{ fontSize: '0.7rem', color: 'var(--gold)' }}
                >
                  {showAllCharacters ? 'Show Less' : `View All (${characters.length})`}
                </button>
              )}
            </div>

            <div className={showAllCharacters ? "sidebar-section-grid" : "no-scrollbar"} style={showAllCharacters ? { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' } : { display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
              {(showAllCharacters ? characters : characters.slice(0, 8)).map((char, idx) => (
                <div 
                  key={idx} 
                  style={{ flexShrink: 0, textAlign: 'center', width: showAllCharacters ? 'auto' : '60px' }}
                >
                  <img 
                    src={char.character?.images?.jpg?.image_url} 
                    alt={char.character?.name} 
                    onClick={() => {
                      const imgs = characters.map(c => c.character?.images?.webp?.image_url || c.character?.images?.jpg?.image_url).filter(Boolean);
                      openLightbox(imgs, idx);
                    }}
                    style={{ 
                      width: showAllCharacters ? '100%' : '50px', 
                      height: showAllCharacters ? '70px' : '50px', 
                      borderRadius: showAllCharacters ? '4px' : '50%', 
                      objectFit: 'cover', 
                      border: '1px solid var(--reader-border)', 
                      margin: '0 auto 4px',
                      cursor: 'zoom-in'
                    }} 
                  />
                  <Link 
                    to={generateDetailUrl('character', char.character?.name, char.character?.mal_id)}
                    className="hover-link"
                    style={{ fontSize: '0.65rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}
                  >
                    {char.character?.name?.split(',')[0]}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {recommendations.length > 0 && (
          <div>
            <h3 className="sidebar-title detail-section-title">Recommendations</h3>
            <div className="no-scrollbar" style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '16px' }}>
              {recommendations.slice(0, 6).map((rec) => (
                <div key={rec.id} style={{ minWidth: '140px', maxWidth: '140px', flexShrink: 0 }}>
                  <AnimeCard item={{ ...rec, type: 'manga' }} type="manga" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Reader Bottom Navigation Bar */}
      <footer className="reader-bottom-nav">
        {/* Previous Button */}
        <button 
          className="setting-option-btn" 
          disabled={!hasPrev} 
          onClick={prevChapter}
          style={{ opacity: hasPrev ? 1 : 0.4, cursor: hasPrev ? 'pointer' : 'not-allowed' }}
        >
          Prev Chapter
        </button>

        {/* Chapter Selection Dropdown */}
        <select 
          value={currentChapter?.id || currentChapter?.number || ''}
          onChange={(e) => {
            const ch = chapters.find(c => (c.id || c.number).toString() === e.target.value)
            if (ch) navigateToChapter(ch)
          }}
          className="reader-dropdown-select"
          style={{ maxWidth: '180px' }}
        >
          {chapters.map((ch) => (
            <option key={ch.id || ch.number} value={ch.id || ch.number}>
              Ch {ch.number} {ch.title ? `- ${ch.title.substring(0, 16)}...` : ''}
            </option>
          ))}
        </select>

        {/* Page progress slide bar (Single / Double mode only) */}
        {readingMode !== 'vertical' && pages.length > 0 && (
          <div className="nav-pages-slider">
            <input 
              type="range" 
              min={0} 
              max={pages.length - 1} 
              value={currentPageIndex} 
              onChange={(e) => setCurrentPageIndex(parseInt(e.target.value))}
              className="slider-input" 
            />
            <span style={{ fontSize: '0.8rem', minWidth: '40px', textAlign: 'right' }}>
              {currentPageIndex + 1} / {pages.length}
            </span>
          </div>
        )}

        {/* Zoom Controls inline in footer */}
        <div className="footer-zoom-controls">
          <button className="footer-zoom-btn" onClick={() => handleZoom(-0.1)}>-</button>
          <span className="footer-zoom-text">{Math.round(zoom * 100)}%</span>
          <button className="footer-zoom-btn" onClick={() => handleZoom(0.1)}>+</button>
          <button className="footer-zoom-btn reset-btn" onClick={resetZoom}>Reset</button>
        </div>

        {/* Next Button */}
        <button 
          className="setting-option-btn" 
          disabled={!hasNext} 
          onClick={nextChapter}
          style={{ opacity: hasNext ? 1 : 0.4, cursor: hasNext ? 'pointer' : 'not-allowed' }}
        >
          Next Chapter
        </button>
      </footer>

      <Lightbox
        isOpen={lbState.open}
        images={lbState.images}
        initialIndex={lbState.index}
        onClose={() => setLbState(prev => ({ ...prev, open: false }))}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '80px',
          right: '24px',
          background: 'rgba(10, 9, 8, 0.95)',
          borderLeft: '4px solid var(--red)',
          color: 'var(--text-primary)',
          padding: '12px 20px',
          borderRadius: '4px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          zIndex: 1000,
          fontWeight: '500',
          fontSize: '0.9rem',
          pointerEvents: 'none',
          backdropFilter: 'blur(8px)',
          animation: 'fade-in-up 0.3s ease'
        }}>
          {toastMessage}
        </div>
      )}
    </div>
  )
}
