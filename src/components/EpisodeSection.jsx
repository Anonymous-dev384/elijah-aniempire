import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getAnimeEpisodes } from '../services/api'
import { IconPlay } from './Icons'

export default function EpisodeSection({ malId, totalEpisodes, watchSlug }) {
  const [episodes, setEpisodes] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!malId) return
    setLoading(true)
    setError(null)
    getAnimeEpisodes(malId, currentPage)
      .then(({ episodes: eps, pagination }) => {
        setEpisodes(eps)
        if (totalEpisodes > 0) {
          setTotalPages(Math.ceil(totalEpisodes / 100))
        } else {
          setTotalPages(pagination.last_visible_page || 1)
        }
        setLoading(false)
      })
      .catch(err => {
        console.error('[Episodes Error]:', err)
        setError('Failed to load episodes.')
        setLoading(false)
      })
  }, [malId, currentPage, totalEpisodes])

  // Generate page range tabs (1-100, 101-200, etc.)
  const rangeTabs = []
  for (let p = 1; p <= totalPages; p++) {
    const start = (p - 1) * 100 + 1
    const end = Math.min(p * 100, totalEpisodes || p * 100)
    rangeTabs.push({ page: p, label: totalPages > 1 ? `${start}–${end}` : `EP 1–${end}` })
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    } catch { return '' }
  }

  if (totalEpisodes === 0 || totalEpisodes === undefined) return null

  return (
    <section className="detail-section ep-section">
      <div className="ep-header">
        <h3 className="detail-section-title">
          Episodes
          {totalEpisodes && <span className="ep-count">{totalEpisodes}</span>}
        </h3>
      </div>

      {/* Range tabs for long series */}
      {totalPages > 1 && (
        <div className="ep-range-tabs">
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

      {/* Episode list */}
      {loading ? (
        <div className="ep-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="ep-card ep-skeleton">
              <div className="ep-num-skeleton" />
              <div className="ep-info-skeleton">
                <div className="skeleton-line" style={{ width: '60%', height: 12 }} />
                <div className="skeleton-line" style={{ width: '35%', height: 10, marginTop: 6 }} />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <p className="ep-error">{error}</p>
      ) : (
        <div className="ep-grid">
          {episodes.length > 0 ? (
            episodes.map(ep => (
              <Link key={ep.mal_id} to={watchSlug ? `/watch/${watchSlug}?ep=${ep.mal_id}` : '#'}
                className={`ep-card ${ep.filler ? 'filler' : ''} ${ep.recap ? 'recap' : ''}`}
                style={{ textDecoration: 'none', color: 'inherit' }}>
                <span className="ep-num">{String(ep.mal_id).padStart(2, '0')}</span>
                <div className="ep-details">
                  <p className="ep-title">{ep.title || `Episode ${ep.mal_id}`}</p>
                  <div className="ep-meta">
                    {ep.aired && <span className="ep-date">{formatDate(ep.aired)}</span>}
                    {ep.score && <span className="ep-score">★ {ep.score.toFixed(1)}</span>}
                    {ep.filler && <span className="ep-tag filler-tag">Filler</span>}
                    {ep.recap && <span className="ep-tag recap-tag">Recap</span>}
                  </div>
                </div>
                <div className="ep-play-btn">
                  <IconPlay size={18} />
                </div>
              </Link>
            ))
          ) : (
            // Fallback: If Jikan has no metadata for individual episodes, but we know they exist
            Array.from({ length: Math.min(totalEpisodes || 0, 100) }).map((_, i) => {
              const epNum = (currentPage - 1) * 100 + i + 1;
              if (totalEpisodes && epNum > totalEpisodes) return null;
              return (
                <Link key={epNum} to={watchSlug ? `/watch/${watchSlug}?ep=${epNum}` : '#'}
                  className="ep-card"
                  style={{ textDecoration: 'none', color: 'inherit' }}>
                  <span className="ep-num">{String(epNum).padStart(2, '0')}</span>
                  <div className="ep-details">
                    <p className="ep-title">Episode {epNum}</p>
                    <div className="ep-meta">
                      <span className="ep-date">Metadata unavailable</span>
                    </div>
                  </div>
                  <div className="ep-play-btn">
                    <IconPlay size={18} />
                  </div>
                </Link>
              );
            })
          )}
        </div>
      )}

      {/* Navigation */}
      {totalPages > 1 && !loading && (
        <div className="ep-nav">
           <button
            className={`btn btn-ghost btn-sm nav-btn`}
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage(p => p - 1)}
          >
            ← Previous
          </button>
          <span className="ep-page-info">
            Page {currentPage} of {totalPages}
          </span>
           <button
            className="btn btn-ghost btn-sm nav-btn"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(p => p + 1)}
          >
            Next →
          </button>
        </div>
      )}
      <style>{`
        .ep-nav {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          margin-top: 30px;
          padding: 20px;
          border-top: 1px solid var(--border-subtle);
        }
        .nav-btn:disabled {
          opacity: 0.35;
          cursor: not-allowed;
          pointer-events: none;
        }
        .ep-page-info {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-secondary);
        }
      `}</style>
    </section>
  )
}
