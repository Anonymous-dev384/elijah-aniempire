import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { IconBook } from './Icons'
import { getMangaChapters, getFromMemoryCache, proxied } from '../services/api'

export default function ChapterSection({ malId, totalChapters, status }) {
  const navigate = useNavigate()
  const { slug } = useParams()
  const [currentPage, setCurrentPage] = useState(1)
  const [chaptersList, setChaptersList] = useState([])
  const [provider, setProvider] = useState(() => {
    return localStorage.getItem('aniempire_manga_provider') || 'mangapill'
  })
  const [mangaId, setMangaId] = useState('')
  const [loading, setLoading] = useState(true)

  // Sync state if malId changes
  useEffect(() => {
    setProvider(localStorage.getItem('aniempire_manga_provider') || 'mangapill')
    setMangaId('')
  }, [malId])

  useEffect(() => {
    if (!malId) return
    
    if (provider === 'mock') {
      setChaptersList([])
      setLoading(false)
      return
    }

    const cacheUrl = proxied(`/manga/${malId}/chapters?provider=${provider}`)
    const cached = getFromMemoryCache(cacheUrl)
    if (cached) {
      const actualChapters = cached.chapters || []
      const sorted = [...actualChapters].sort((a, b) => {
        const numA = parseFloat(a.number) || 0
        const numB = parseFloat(b.number) || 0
        return numA - numB
      })
      setChaptersList(sorted)
      setMangaId(cached.mangaId || '')
      setLoading(false)
    } else {
      setLoading(true)
    }

    let active = true
    const fetchChapters = async () => {
      try {
        const res = await getMangaChapters(malId, provider)
        const actualChapters = res?.chapters || []
        if (active) {
          // If backend resolved a different provider (fallback), update state
          if (res?.provider && res.provider !== provider) {
            setProvider(res.provider)
          }
          setMangaId(res?.mangaId || '')
          
          // Sort ascending by chapter number
          const sorted = [...actualChapters].sort((a, b) => {
            const numA = parseFloat(a.number) || 0
            const numB = parseFloat(b.number) || 0
            return numA - numB
          })
          setChaptersList(sorted)
          setCurrentPage(1) // Reset to page 1 when provider changes
        }
      } catch (err) {
        console.warn('[ChapterSection] Failed to fetch real chapters:', err)
        if (active) {
          setChaptersList([])
          setMangaId('')
        }
      } finally {
        if (active) setLoading(false)
      }
    }
    fetchChapters()
    return () => { active = false }
  }, [malId, provider])

  const itemsPerPage = 100
  const hasRealChapters = chaptersList.length > 0

  // Fallback to original mock count if API returned empty
  const displayTotalChapters = hasRealChapters ? chaptersList.length : totalChapters
  
  // Ongoing condition
  const isOngoing = !displayTotalChapters || (status === 'Publishing' && !hasRealChapters)
  const totalPages = isOngoing ? Infinity : Math.ceil(displayTotalChapters / itemsPerPage)

  const showOngoingQuestion = status === 'Publishing' || status === 'Releasing' || isOngoing

  // We only generate tabs if we know the exact length, else we use standard Next/Prev arrows
  const rangeTabs = []
  if (!isOngoing && totalPages > 1) {
    for (let p = 1; p <= totalPages; p++) {
      const start = (p - 1) * itemsPerPage + 1
      const end = Math.min(p * itemsPerPage, displayTotalChapters)
      rangeTabs.push({ page: p, label: `CH ${start}–${end}` })
    }
  }

  // Get current slice
  const chapters = []
  if (hasRealChapters) {
    const startIdx = (currentPage - 1) * itemsPerPage
    const endIdx = currentPage * itemsPerPage
    chapters.push(...chaptersList.slice(startIdx, endIdx))
  } else {
    // Original mock fallback
    const startCh = (currentPage - 1) * itemsPerPage + 1
    const endCh = isOngoing ? currentPage * itemsPerPage : Math.min(currentPage * itemsPerPage, displayTotalChapters)
    for (let i = startCh; i <= endCh; i++) {
      chapters.push(i)
    }
  }

  const providersList = [
    { value: 'mock', label: 'Default' },
    { value: 'mangapill', label: 'Pill' },
    { value: 'mangafire', label: 'Fire' },
    { value: 'flamecomics', label: 'Flame' },
    { value: 'mangadex', label: 'Dex' }
  ]

  // Scroll to header on page change
  useEffect(() => {
    const el = document.getElementById('chapters-section-header')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [currentPage])

  const renderHeader = () => (
    <div id="chapters-section-header" className="ep-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', scrollMarginTop: '80px' }}>
      <h3 className="detail-section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
        Chapters
        <span 
          className="ep-count" 
          style={{ 
            letterSpacing: '1px', 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '4px 10px',
            fontSize: '0.85rem'
          }}
        >
          {displayTotalChapters || '?'}
          {showOngoingQuestion && (
            <span style={{ marginLeft: '4px', color: 'var(--gold)', fontWeight: '700' }}>?</span>
          )}
        </span>
      </h3>

      {/* Source Selector Dropdown */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Source:</span>
        <select
          value={provider}
          onChange={(e) => {
            const newProv = e.target.value
            setProvider(newProv)
            localStorage.setItem('aniempire_manga_provider', newProv)
          }}
          style={{
            padding: '6px 30px 6px 14px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: 'var(--text-color, #fff)',
            fontSize: '0.85rem',
            fontWeight: '500',
            borderRadius: '20px',
            cursor: 'pointer',
            outline: 'none',
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.6)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 10px center',
            backgroundSize: '14px',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => {
            e.target.style.border = '1px solid var(--gold)'
            e.target.style.boxShadow = '0 0 8px rgba(212, 175, 55, 0.2)'
          }}
          onMouseOut={(e) => {
            e.target.style.border = '1px solid rgba(255, 255, 255, 0.12)'
            e.target.style.boxShadow = 'none'
          }}
        >
          {providersList.map(prov => (
            <option key={prov.value} value={prov.value} style={{ background: '#121212', color: '#fff' }}>
              {prov.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )

  if (loading) {
    return (
      <section className="detail-section ep-section">
        {renderHeader()}
        <div className="ep-grid" style={{ marginTop: '20px' }}>
          {[...Array(8)].map((_, idx) => (
            <div key={idx} className="ep-card skeleton" style={{ height: '70px', opacity: 0.6, background: 'var(--bg-card)', borderRadius: '8px' }}>
              <div style={{ padding: '15px' }}>
                <div className="skeleton-line" style={{ width: '40px', height: '14px', marginBottom: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }} />
                <div className="skeleton-line" style={{ width: '120px', height: '14px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }} />
              </div>
            </div>
          ))}
        </div>
      </section>
    )
  }

  return (
    <section className="detail-section ep-section">
      {renderHeader()}

      {!isOngoing && totalPages > 1 && (
        <div className="ep-range-tabs" style={{ marginTop: '20px' }}>
          {rangeTabs.map(tab => (
            <button
              key={tab.page}
              className={`ep-range-tab ${currentPage === tab.page ? 'active' : ''}`}
              onClick={() => setCurrentPage(tab.page)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      <div className="ep-grid" style={{ marginTop: '20px' }}>
        {chapters.map((ch, idx) => {
          const isReal = typeof ch === 'object'
          const num = isReal ? (ch.number !== undefined && ch.number !== null ? ch.number : idx + 1) : ch
          const title = isReal ? (ch.title || `Chapter ${num}`) : `Chapter ${ch}`
          const dateStr = isReal && ch.date ? new Date(ch.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Read Now'

          const handleCardClick = () => {
            let targetProvider = provider

            if (provider === 'mock') {
              // If click mock chapter, default to a real provider
              targetProvider = 'mangapill'
            }

            // Save provider to localStorage so reader page knows which provider to fetch from
            localStorage.setItem('aniempire_manga_provider', targetProvider)
            
            // Navigate to reader using chapter number
            navigate(`/manga/${slug || malId}/read/${encodeURIComponent(num)}`)
          }

          return (
            <div 
              key={isReal ? (ch.id || num) : num} 
              className="ep-card" 
              onClick={handleCardClick}
              style={{ cursor: 'pointer' }}
            >
              <span className="ep-num">{String(num !== undefined && num !== null ? num : '').padStart(3, '0')}</span>
              <div className="ep-details">
                <p className="ep-title">{title}</p>
                <div className="ep-meta">
                  <span className="ep-date">{dateStr}</span>
                </div>
              </div>
              <div className="ep-play-btn">
                <IconBook size={16} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Navigation */}
      <div className="ep-nav" style={{ marginTop: '25px' }}>
        <button
          className="btn btn-ghost btn-sm"
          disabled={currentPage <= 1}
          style={{ opacity: currentPage <= 1 ? 0.35 : 1, pointerEvents: currentPage <= 1 ? 'none' : 'auto' }}
          onClick={() => setCurrentPage(p => p - 1)}
        >
          ← Previous
        </button>
        <span className="ep-page-info">
          Page {currentPage} {isOngoing ? '' : `of ${totalPages}`}
        </span>
        <button
          className="btn btn-ghost btn-sm"
          disabled={currentPage >= totalPages}
          style={{ 
            opacity: (currentPage >= totalPages) ? 0.35 : 1,
            pointerEvents: (currentPage >= totalPages) ? 'none' : 'auto'
          }}
          onClick={() => setCurrentPage(p => p + 1)}
        >
          Next →
        </button>
      </div>
    </section>
  )
}
