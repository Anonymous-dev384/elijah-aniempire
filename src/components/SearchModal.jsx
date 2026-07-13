import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { IconSearch, IconGrid } from './Icons'
import { searchAnime, searchManga, generateDetailUrl, mapAnimeData, mapMangaData } from '../services/api'

// Direct Jikan search fallback when backend search endpoint is unavailable
const JIKAN_SEARCH_URL = 'https://api.jikan.moe/v4/'
const jikanSearch = async (query, type = 'anime') => {
  const res = await fetch(`${JIKAN_SEARCH_URL}${type}?limit=10&q=${encodeURIComponent(query)}`)
  if (!res.ok) throw new Error('Jikan search failed')
  const json = await res.json()
  const data = json.data || []
  return type === 'anime' ? data.map(mapAnimeData) : data.map(mapMangaData)
}

export default function SearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState([])
  const inputRef = useRef()
  const navigate = useNavigate()

  useEffect(() => {
    if (!query.trim()) {
      setIsSearching(false)
      setDebouncedQuery('')
      setResults([])
      return
    }
    setIsSearching(true)
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, 280)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    if (debouncedQuery.trim()) {
      setIsSearching(true)
      const queryLower = debouncedQuery.toLowerCase()

      Promise.allSettled([
        searchAnime(debouncedQuery, 1, { limit: 5 }),
        searchManga(debouncedQuery, 1, { limit: 5 })
      ]).then(async ([animeRes, mangaRes]) => {
        let animes = animeRes.status === 'fulfilled' ? animeRes.value.data || [] : [];
        let mangas = mangaRes.status === 'fulfilled' ? mangaRes.value.data || [] : [];

        // Fallbacks if results don't match the query
        if (!animes.some(r => r.title?.toLowerCase().includes(queryLower)) && debouncedQuery.trim().length >= 2) {
          try { animes = await jikanSearch(debouncedQuery, 'anime'); } catch(e){}
        }
        if (!mangas.some(r => r.title?.toLowerCase().includes(queryLower)) && debouncedQuery.trim().length >= 2) {
          try { mangas = await jikanSearch(debouncedQuery, 'manga'); } catch(e){}
        }

        const combined = [
          ...animes.slice(0, 5).map(item => ({ ...item, _searchType: 'anime' })),
          ...mangas.slice(0, 5).map(item => ({ ...item, _searchType: 'manga' }))
        ];

        // Smart recommendation: exact matches first, then starts with, then sort by type priority
        combined.sort((a, b) => {
          const aTitle = (a.title || a.name || '').toLowerCase();
          const bTitle = (b.title || b.name || '').toLowerCase();
          
          const aExact = aTitle === queryLower;
          const bExact = bTitle === queryLower;
          if (aExact && !bExact) return -1;
          if (!aExact && bExact) return 1;
          
          const aStarts = aTitle.startsWith(queryLower);
          const bStarts = bTitle.startsWith(queryLower);
          if (aStarts && !bStarts) return -1;
          if (!aStarts && bStarts) return 1;

          const typeWeight = { anime: 2, manga: 1 };
          return typeWeight[b._searchType] - typeWeight[a._searchType];
        });

        setResults(combined.slice(0, 10)); // Ensure max 10 results
        setIsSearching(false)
      }).catch(err => {
        console.warn('Backend search failed, falling back to Jikan:', err.message)
        jikanSearch(debouncedQuery, 'anime').then(jikanData => {
          setResults(jikanData.slice(0, 10).map(item => ({ ...item, _searchType: 'anime' })))
          setIsSearching(false)
        }).catch(() => setIsSearching(false))
      })
    }
  }, [debouncedQuery])

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter' && query.trim()) {
      e.preventDefault()
      navigate(`/browse?q=${encodeURIComponent(query.trim())}`)
      onClose()
    }
  }

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      document.body.style.overflow = ''
      setQuery('')
      setDebouncedQuery('')
      setResults([])
    }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!isOpen) return null

  return (
    <div className="search-modal-overlay">
      <div className="search-backdrop" onClick={onClose} />
      <div className="search-modal-content anim-fade-up">

        <div className="modal-search-wrapper">
          <IconSearch size={22} color="var(--gold)" style={{ position: 'absolute', left: 28, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            ref={inputRef}
            className="search-huge-input"
            type="search"
            aria-label="Search anime, manga, and music"
            placeholder="Search anime, manga, and music..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleSearchSubmit}
          />
          <button className="search-close-btn" onClick={onClose} aria-label="Close search">
            <span className="search-close-btn-desktop">ESC</span>
            <span className="search-close-btn-mobile">✕</span>
          </button>
        </div>

        <div className="search-results-area">
          {!query.trim() ? (
            <div className="search-empty-state">
              <IconSearch size={48} color="var(--gold-dark)" style={{ opacity: 0.6, marginBottom: 16 }} />
              <h3>Quick Search</h3>
              <p>Type a name to search through anime, manga, and music.</p>
            </div>
          ) : isSearching ? (
            <div className="search-results-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton-result-card">
                  <div className="skeleton-thumb" />
                  <div className="skeleton-info">
                    <div className="skeleton-badge" />
                    <div className="skeleton-title" />
                    <div className="skeleton-subtitle" />
                  </div>
                </div>
              ))}
            </div>
          ) : results.length > 0 ? (
            <>
              <div className="search-results-grid">
                {results.map((item, idx) => {
                  let linkUrl = '';
                  let badge = '';
                  let title = '';
                  let subtitle = '';

                  if (item._searchType === 'anime') {
                    linkUrl = generateDetailUrl('anime', item.title, item.id);
                    badge = 'ANIME';
                    title = item.title;
                    subtitle = item.year || 'Classic';
                  } else if (item._searchType === 'manga') {
                    linkUrl = generateDetailUrl('manga', item.title, item.id);
                    badge = 'MANGA';
                    title = item.title;
                    subtitle = item.year || 'Manga';
                  }

                  return (
                    <Link key={`${item.id || item.slug}-${idx}`} to={linkUrl} className="search-result-card" onClick={onClose}>
                      <img src={item.coverImage} alt={title} />
                      <div className="src-info">
                        <span className={`src-badge ${item._searchType}`}>{badge}</span>
                        <h4>{title}</h4>
                        <p className="src-year">{subtitle}</p>
                      </div>
                    </Link>
                  )
                })}
              </div>
              <div style={{ marginTop: 24, textAlign: 'center' }}>
                <Link 
                  to={`/browse?q=${encodeURIComponent(query.trim())}`} 
                  className="btn btn-ghost" 
                  onClick={onClose}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  View all results for "{query.trim()}"
                </Link>
              </div>
            </>
          ) : (
            <div className="search-empty-state">
              <div className="empty-graphic">
                <img src="/cartoon_lost_corner_crates_1775592227188-removebg-preview.png" alt="No results" className="empty-img" />
              </div>
              <h3>No results found</h3>
              <p>We couldn't find any items matching your search query.</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .search-modal-overlay {
          position: fixed; inset: 0; z-index: 1000;
          display: flex; justify-content: center; padding-top: 10vh;
        }
        .search-backdrop {
          position: absolute; inset: 0;
          background: rgba(5, 4, 3, 0.9); backdrop-filter: blur(12px);
        }
        .search-modal-content {
          position: relative; width: 100%; max-width: 820px; padding: 0 24px;
          display: flex; flex-direction: column; max-height: 85vh;
        }
        .modal-search-wrapper {
          position: relative; border-radius: var(--radius-lg);
          background: var(--bg-card); border: 1px solid var(--border-hover);
          box-shadow: var(--shadow-gold-lg); overflow: hidden;
        }
        .search-huge-input {
          width: 100%; background: transparent; border: none;
          padding: 26px 140px 26px 100px; color: var(--text-primary);
          font-family: var(--font-heading); font-size: 1.35rem; font-weight: 600;
          outline: none;
        }
        .search-huge-input::placeholder { color: var(--text-muted); opacity: 0.5; }
        .search-close-btn {
          position: absolute; right: 22px; top: 50%; transform: translateY(-50%);
          background: var(--bg-surface); color: var(--text-secondary); font-size: 0.72rem;
          font-weight: 700; padding: 5px 10px; border-radius: 5px; cursor: pointer;
          border: 1px solid var(--border-subtle); transition: all 0.2s;
          display: flex; align-items: center; justify-content: center;
        }
        .search-close-btn:hover {
          background: var(--bg-hover); color: var(--text-primary); border-color: var(--border-hover);
        }
        .search-close-btn-mobile {
          display: none;
        }
        .search-results-area {
          margin-top: 24px; background: transparent; overflow-y: auto; flex: 1; padding-bottom: 24px;
        }
        .search-empty-state {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 60px 24px; text-align: center;
        }
        .empty-graphic {
          width: 140px; height: 140px; margin-bottom: 20px;
          display: flex; align-items: center; justify-content: center;
        }
        .empty-img { 
          width: 100%; height: 100%; object-fit: contain; 
          opacity: 0.8; 
        }
        .search-empty-state h3 { color: var(--gold); font-size: 1.5rem; margin-bottom: 10px; }
        .search-empty-state p { color: var(--text-muted); font-size: 1rem; line-height: 1.5; }

        .search-results-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px;
        }
        .search-result-card {
          display: flex; gap: 16px; padding: 14px 16px; background: var(--bg-card);
          border: 1px solid var(--border-subtle); border-radius: var(--radius-md);
          transition: all 0.2s; align-items: center; text-decoration: none;
        }
        .search-result-card:hover {
          background: var(--bg-elevated); border-color: var(--gold); transform: translateY(-2px);
        }
        .search-result-card img {
          width: 56px; height: 78px; object-fit: cover; border-radius: 5px; flex-shrink: 0;
        }
        .src-info { flex: 1; min-width: 0; }
        .src-info h4 { font-size: 0.92rem; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 6px; }
        .src-badge { font-size: 0.62rem; background: rgba(212, 168, 67, 0.1); border: 1px solid rgba(212, 168, 67, 0.2); color: var(--gold); padding: 3px 8px; border-radius: 4px; font-weight: 800; letter-spacing: 1px; display: inline-block; margin-bottom: 6px; }
        .src-badge.manga { background: rgba(56, 189, 248, 0.1); border-color: rgba(56, 189, 248, 0.2); color: #38bdf8; }
        .src-year { font-size: 0.8rem; color: var(--text-secondary); }

        .skeleton-result-card {
          display: flex; gap: 16px; padding: 14px 16px; background: var(--bg-card);
          border: 1px solid var(--border-subtle); border-radius: var(--radius-md);
          align-items: center; pointer-events: none;
        }
        .skeleton-thumb {
          width: 56px; height: 78px; border-radius: 5px; flex-shrink: 0;
          background: var(--bg-surface); animation: skeleton-pulse 1.4s ease-in-out infinite;
        }
        .skeleton-result-card .skeleton-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8px; padding: 0; }
        .skeleton-badge { width: 30%; height: 10px; background: var(--bg-surface); border-radius: 4px; animation: skeleton-pulse 1.4s ease-in-out infinite; }
        .skeleton-result-card .skeleton-title { width: 80%; height: 12px; margin: 0; background: var(--bg-surface); border-radius: 5px; animation: skeleton-pulse 1.4s ease-in-out infinite; }
        .skeleton-result-card .skeleton-subtitle { width: 40%; height: 10px; margin-top: -4px; background: var(--bg-surface); border-radius: 5px; animation: skeleton-pulse 1.4s ease-in-out infinite; }

        @media (max-width: 768px) {
          .search-modal-overlay { padding-top: 0; }
          .search-modal-content { max-width: 100%; padding: 0; max-height: 100vh; height: 100vh; }
          .modal-search-wrapper { border-radius: 0; border-left: none; border-right: none; border-top: none; }
          .search-huge-input { font-size: 1.1rem; padding: 22px 80px 22px 64px; }
          .search-results-grid { grid-template-columns: 1fr; gap: 12px; }
          .search-close-btn-desktop { display: none; }
          .search-close-btn-mobile { display: block; font-size: 1.1rem; color: var(--text-secondary); }
          .search-close-btn { right: 16px; padding: 8px; border-radius: 50%; width: 36px; height: 36px; background: transparent; border: none; }
          .search-close-btn:hover { background: rgba(255,255,255,0.06); }
        }
      `}</style>
    </div>
  )
}
