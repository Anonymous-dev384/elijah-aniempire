import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import SectionHeader from '../components/SectionHeader'
import { IconMusic, IconSearch, IconFire, IconStar, IconPlay, IconWifiOff, IconChevronLeft, IconChevronRight } from '../components/Icons'
import {
  getFeaturedAnimeTheme,
  getNewAnimeThemes,
  getPopularAnimeThemes,
  searchAnimeThemes,
  getSeasonalAnimeThemes,
  generateDetailUrl,
} from '../services/api'
import ThemeCard from '../components/ThemeCard'
import { useMusic } from '../context/MusicContext'


// ─── Skeleton ─────────────────────────────────────────────────
function MusicSkeleton({ count = 10 }) {
  return (
    <div className="music-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-card" style={{ width: '100%' }}>
          <div className="skeleton-poster" style={{ aspectRatio: '16/10' }} />
          <div className="skeleton-info">
            <div className="skeleton-line skeleton-title" style={{ width: '80%' }} />
            <div className="skeleton-line" style={{ width: '60%', height: '10px', marginTop: '6px' }} />
            <div className="skeleton-line" style={{ width: '40%', height: '10px', marginTop: '6px' }} />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Categories ───────────────────────────────────────────────
const CATEGORIES = [
  { key: 'new', label: 'Recently Added', icon: IconStar },
  { key: 'popular', label: 'Popular', icon: IconFire },
  { key: 'seasonal', label: 'Seasonal', icon: IconMusic },
]

const SEASONS_LIST = ['Winter', 'Spring', 'Summer', 'Fall']
const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 10 }, (_, i) => CURRENT_YEAR - i)
const ITEMS_PER_PAGE = 24

// ─── MusicPage ────────────────────────────────────────────────
export default function MusicPage() {
  const { playTrack, nowPlaying } = useMusic()
  const [searchParams, setSearchParams] = useSearchParams()

  const catParam = searchParams.get('cat') || 'new'
  const pageParam = parseInt(searchParams.get('page')) || 1
  const qParam = searchParams.get('q') || ''

  const [activeCategory, setActiveCategory] = useState(catParam)
  const [searchQuery, setSearchQuery] = useState(qParam)
  const [liveSearch, setLiveSearch] = useState(qParam)
  const [items, setItems] = useState([])
  const [featured, setFeatured] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [seasonYear, setSeasonYear] = useState(CURRENT_YEAR)
  const [seasonName, setSeasonName] = useState('Winter')
  const [page, setPage] = useState(pageParam)
  const [pagination, setPagination] = useState({ current_page: pageParam, has_next_page: false, last_visible_page: 1 })

  // Sync state from searchParams changes
  useEffect(() => {
    const cat = searchParams.get('cat') || 'new'
    const pageNum = parseInt(searchParams.get('page')) || 1
    const q = searchParams.get('q') || ''
    setActiveCategory(cat)
    setPage(pageNum)
    setLiveSearch(q)
    setSearchQuery(q)
  }, [searchParams])

  // Load featured theme once
  useEffect(() => {
    getFeaturedAnimeTheme().then(setFeatured).catch(() => {})
  }, [])

  // Load items based on category + page (also handles search when liveSearch is active)
  const loadItems = useCallback(async () => {
    setLoading(true)
    setError(null)
    setItems([])
    try {
      let result = { data: [], pagination: { current_page: page, has_next_page: false, last_visible_page: 1 } }
      if (liveSearch.trim()) {
        result = await searchAnimeThemes(liveSearch, ITEMS_PER_PAGE, page)
      } else if (activeCategory === 'new') {
        result = await getNewAnimeThemes(ITEMS_PER_PAGE, page)
      } else if (activeCategory === 'popular') {
        result = await getPopularAnimeThemes(ITEMS_PER_PAGE, page)
      } else if (activeCategory === 'seasonal') {
        result = await getSeasonalAnimeThemes(seasonYear, seasonName.toLowerCase(), page)
      }
      setItems(result.data || [])
      setPagination(result.pagination || { current_page: page, has_next_page: false, last_visible_page: 1 })
    } catch (err) {
      console.error('[Music Load Error]:', err)
      setError(liveSearch.trim() ? 'unreachable' : true)
    } finally {
      setLoading(false)
    }
  }, [activeCategory, seasonYear, seasonName, page, liveSearch])

  useEffect(() => { loadItems() }, [loadItems])

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams()
    if (searchQuery.trim()) {
      params.set('q', searchQuery.trim())
    } else {
      params.set('cat', activeCategory)
    }
    setSearchParams(params)
  };

  const handleCategoryChange = (key) => {
    const params = new URLSearchParams()
    params.set('cat', key)
    setSearchParams(params)
  }

  const isSearching = !!liveSearch.trim();

  return (
    <div className="music-page">
      {/* Hero / Featured */}
      {featured && (
        <div className="music-hero">
          <div
            className="music-hero__bg"
            style={{ backgroundImage: featured.coverImage ? `url(${featured.coverImage})` : undefined }}
          />
          <div className="music-hero__overlay" />
          <div className="music-hero__content section">
            <span className="music-hero__eyebrow">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--gold)" style={{ marginRight: 6 }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              Featured Theme
            </span>
            <h1 className="music-hero__title">{featured.themes?.[0]?.songTitle || 'Now Playing'}</h1>
            <p className="music-hero__meta">
              {featured.themes?.[0]?.artists} &mdash; <Link to={generateDetailUrl('anime', featured.name, featured.malId)} className="music-hero__link">{featured.name}</Link>
            </p>
            <div className="music-hero__actions">
              {featured.themes?.[0]?.audioLink && (
                <button
                  className="btn btn-primary"
                  onClick={() => playTrack(featured, featured.themes[0], 'audio')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  Play Audio
                </button>
              )}
              {featured.themes?.[0]?.videoLink && (
                <button
                  className="btn btn-secondary"
                  onClick={() => playTrack(featured, featured.themes[0], 'video')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                  Watch Video
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="section" style={{ paddingTop: 32, paddingBottom: 0 }}>
        <SectionHeader
          title={isSearching ? `Results for "${liveSearch}"` : CATEGORIES.find(c => c.key === activeCategory)?.label || 'Music'}
          icon={<IconMusic size={24} color="var(--gold)" />}
          subtitle={isSearching ? 'Live search across anime themes' : 'Discover the soundtracks of the empire'}
        />
      </div>

      {/* Controls */}
      <div className="section" style={{ paddingTop: 16, paddingBottom: 8 }}>
        <div className="search-bar-row">
          {/* Category pills */}
          <div className="discovery-pill-group">
            {CATEGORIES.map(cat => {
              const params = new URLSearchParams()
              params.set('cat', cat.key)
              return (
                <Link
                  key={cat.key}
                  className={`tag ${activeCategory === cat.key && !isSearching ? 'active' : ''}`}
                  to={`?${params.toString()}`}
                  onClick={() => {
                    window.scrollTo({ top: 300, behavior: 'smooth' })
                  }}
                >
                  {cat.label}
                </Link>
              )
            })}
          </div>

          {/* Seasonal selectors (only visible for 'seasonal' category) */}
          {activeCategory === 'seasonal' && !isSearching && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <select
                className="input"
                style={{ height: 42, width: 120 }}
                value={seasonYear}
                onChange={e => { setSeasonYear(Number(e.target.value)); setPage(1); }}
              >
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <select
                className="input"
                style={{ height: 42, width: 110 }}
                value={seasonName}
                onChange={e => { setSeasonName(e.target.value); setPage(1); }}
              >
                {SEASONS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}

          <div className="search-spacer" />

          {/* Search bar */}
          <form className="browse-search-wrapper" style={{ flex: 1.5 }} onSubmit={handleSearchSubmit}>
            <IconSearch size={20} color="var(--text-muted)" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input
              className="input"
              style={{ paddingLeft: 52, paddingRight: 40, fontSize: '0.8rem', height: '100%', minHeight: 46 }}
              placeholder="Search themes, songs, artists..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); }}
            />
            {liveSearch ? (
              <button
                type="button"
                className="search-confirm-btn"
                title="Clear Search"
                onClick={() => { setSearchQuery(''); setLiveSearch(''); setPage(1); }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            ) : (
              <button type="submit" className="search-confirm-btn" title="Execute Search">
                <IconChevronRight size={20} />
              </button>
            )}
          </form>
        </div>

        <div className="sort-bar" style={{ marginTop: 12 }}>
          <span className="result-count">
            Showing <strong>{items.length}</strong> {items.length === 1 ? 'theme' : 'themes'}
            {pagination.last_visible_page > 1 && ` · Page ${page} of ${pagination.last_visible_page}`}
          </span>
        </div>
      </div>

      {/* Grid */}
      <div className="section" style={{ paddingTop: 0 }}>
        {loading ? (
          <MusicSkeleton count={12} />
        ) : error ? (
          <div className="imperial-feedback-zone">
            <IconWifiOff size={80} color="var(--gold)" style={{ marginBottom: 24, opacity: 0.7 }} />
            <h2>{error === 'unreachable' ? 'Connection Error' : 'Could not load themes'}</h2>
            <p>{error === 'unreachable' ? 'Our scouts couldn\'t connect to the library. Please check your network.' : 'The AnimeThemes service may be temporarily unavailable. Please try again.'}</p>
            <button className="btn btn-primary" onClick={loadItems} style={{ marginTop: 20 }}>
              Try Reconnecting
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="imperial-feedback-zone">
            <img src="/cartoon_lost_corner_crates_1775592227188-removebg-preview.png" alt="No results" className="hero-img" style={{ width: 200, marginBottom: 24 }} />
            <h2>Library archive empty</h2>
            <p>{isSearching ? `No records found for "${liveSearch}".` : 'No themes available for this selection.'}</p>
            {isSearching && (
              <button className="btn btn-ghost" onClick={() => { setSearchQuery(''); setLiveSearch(''); setPage(1); }} style={{ marginTop: 16 }}>
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="music-grid">
              {items.map((entry, idx) => {
                let themesToDisplay = entry?.themes || [];
                
                // Prevent spamming 10+ themes from the same anime unless specifically searching
                if (!isSearching) {
                  const ops = themesToDisplay.filter(t => t.type?.toUpperCase().includes('OP'));
                  const eds = themesToDisplay.filter(t => t.type?.toUpperCase().includes('ED'));
                  themesToDisplay = [];
                  if (ops.length > 0) themesToDisplay.push(ops[0]);
                  if (eds.length > 0) themesToDisplay.push(eds[0]);
                  if (themesToDisplay.length === 0 && entry?.themes?.length > 0) {
                     themesToDisplay.push(entry.themes[0]);
                  }
                }

                return themesToDisplay.map((theme, ti) => (
                  <ThemeCard
                    key={`${entry.slug}-${theme.id}-${idx}-${ti}`}
                    animeEntry={{ ...entry, themes: [theme] }}
                  />
                ))
              })}
            </div>

            {/* Pagination */}
            {pagination.last_visible_page > 1 && (
              <div className="music-pagination">
                <Link
                  className={`music-pagination__btn ${page <= 1 ? 'disabled' : ''}`}
                  to={`?${(() => {
                    const params = new URLSearchParams(searchParams)
                    const prev = Math.max(1, page - 1)
                    if (prev > 1) params.set('page', prev)
                    else params.delete('page')
                    return params.toString()
                  })()}`}
                  onClick={(e) => {
                    if (page <= 1) e.preventDefault()
                    else window.scrollTo({ top: 300, behavior: 'smooth' })
                  }}
                >
                  <IconChevronLeft size={18} />
                  <span>Previous</span>
                </Link>

                <div className="music-pagination__pages">
                  {generatePageNumbers(page, pagination.last_visible_page).map((p, i) => (
                    p === '...' ? (
                      <span key={`dots-${i}`} className="music-pagination__dots">…</span>
                    ) : (
                      <Link
                        key={p}
                        className={`music-pagination__page ${p === page ? 'active' : ''}`}
                        to={`?${(() => {
                          const params = new URLSearchParams(searchParams)
                          if (p > 1) params.set('page', p)
                          else params.delete('page')
                          return params.toString()
                        })()}`}
                        onClick={() => { window.scrollTo({ top: 300, behavior: 'smooth' }) }}
                      >
                        {p}
                      </Link>
                    )
                  ))}
                </div>

                <Link
                  className={`music-pagination__btn ${!pagination.has_next_page ? 'disabled' : ''}`}
                  to={`?${(() => {
                    const params = new URLSearchParams(searchParams)
                    params.set('page', page + 1)
                    return params.toString()
                  })()}`}
                  onClick={(e) => {
                    if (!pagination.has_next_page) e.preventDefault()
                    else window.scrollTo({ top: 300, behavior: 'smooth' })
                  }}
                >
                  <span>Next</span>
                  <IconChevronRight size={18} />
                </Link>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        /* ── Layout ── */
        .music-page { padding-bottom: 120px; }

        /* ── Hero ── */
        .music-hero {
          position: relative; height: 340px; overflow: hidden;
          display: flex; align-items: flex-end;
        }
        .music-hero__bg {
          position: absolute; inset: 0; background-size: cover; background-position: center;
          filter: brightness(0.4); transform: scale(1.05);
          transition: background-image 0.5s ease;
        }
        .music-hero__overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to top, var(--bg-primary) 0%, transparent 60%);
        }
        .music-hero__content {
          position: relative; z-index: 1; padding-bottom: 40px; width: 100%;
        }
        .music-hero__eyebrow {
          display: inline-flex; align-items: center;
          font-size: 0.7rem; font-weight: 800; letter-spacing: 0.12em;
          text-transform: uppercase; color: var(--gold); margin-bottom: 12px;
        }
        .music-hero__title {
          font-size: clamp(1.8rem, 4vw, 3rem); font-weight: 900; letter-spacing: -0.03em;
          color: var(--text-primary); line-height: 1.1; margin-bottom: 10px;
        }
        .music-hero__meta { font-size: 0.95rem; color: var(--gold); margin-bottom: 20px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
        .music-hero__link { color: var(--text-secondary); transition: all 0.2s; }
        .music-hero__link:hover { color: var(--gold); text-decoration: underline; }
        .music-hero__actions { display: flex; gap: 12px; flex-wrap: wrap; }

        /* ── Controls ── */
        .search-bar-row { display: flex; gap: 12px; margin-bottom: 20px; align-items: stretch; }
        .discovery-pill-group { display: flex; gap: 8px; flex-wrap: wrap; }
        .browse-search-wrapper { position: relative; display: flex; align-items: center; }
        .search-spacer { flex: 1; }
        
        .search-confirm-btn {
          position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
          width: 32px; height: 32px; border-radius: 6px; background: var(--bg-surface);
          border: 1px solid var(--border-default); color: var(--gold);
          display: flex; align-items: center; justify-content: center; cursor: pointer;
          transition: all 0.2s;
        }
        .search-confirm-btn:hover { background: var(--gold); color: #000; }

        /* ── Skeleton ── */
        .music-card--skeleton { pointer-events: none; }
        .skeleton-block {
          background: var(--bg-card);
          animation: skeleton-pulse 1.4s infinite;
        }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .music-hero { height: 260px; }
          .search-bar-row { flex-direction: column; }
          .browse-search-wrapper { width: 100%; flex: none !important; }
        }

        /* ── Feedback zones ── */
        .imperial-feedback-zone {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          min-height: 400px; text-align: center; padding: 40px;
        }
        .imperial-feedback-zone h2 { color: var(--text-secondary); margin-bottom: 12px; font-weight: 800; }
        .imperial-feedback-zone p { color: var(--text-muted); max-width: 400px; line-height: 1.6; }
      `}</style>
    </div>
  )
}

/** Generate page numbers with ellipsis */
function generatePageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = []
  pages.push(1)
  if (current > 3) pages.push('...')
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    pages.push(i)
  }
  if (current < total - 2) pages.push('...')
  pages.push(total)
  return pages
}
