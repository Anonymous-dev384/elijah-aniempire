import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getRandomAnime, getRandomManga, generateDetailUrl } from '../services/api'
import { IconRefresh, IconStar } from './Icons'

export default function SidebarRandom({ type = 'anime' }) {
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [animating, setAnimating] = useState(false)

  const fetchRandom = async () => {
    setLoading(true)
    setAnimating(true)
    try {
      const data = type === 'anime' ? await getRandomAnime() : await getRandomManga()
      if (data) setItem(data)
    } catch (err) {
      console.error('Failed to fetch random pick:', err)
    } finally {
      setLoading(false)
      // Small delay for animation feel
      setTimeout(() => setAnimating(false), 500)
    }
  }

  useEffect(() => {
    fetchRandom()
  }, [type])

  if (!loading && !item) return null

  return (
    <div className="sidebar-random">
      <div className="sidebar-random-header">
        <h3 className="detail-sidebar-title">Quick Discovery</h3>
        <button 
          className={`sidebar-refresh-btn ${animating ? 'rotating' : ''}`}
          onClick={fetchRandom}
          disabled={loading}
          title="Refresh discovery"
        >
          <IconRefresh size={16} />
        </button>
      </div>

      <div className={`random-card-wrapper ${loading ? 'loading' : ''}`}>
        {loading ? (
          <div className="random-skeleton">
            <div className="skeleton-img" />
            <div className="skeleton-content">
              <div className="skeleton-line" style={{ width: '80%' }} />
              <div className="skeleton-line" style={{ width: '40%' }} />
            </div>
          </div>
        ) : (
          <Link to={generateDetailUrl(type, item.title, item.id)} className="random-card">
            <div className="random-card-bg">
              <img src={item.coverImage} alt="" />
            </div>
            <div className="random-card-inner">
              <div className="random-poster">
                <img src={item.coverImage} alt={item.title} />
              </div>
              <div className="random-info">
                <h4 className="random-title">{item.title}</h4>
                <div className="random-meta">
                  <span className="random-score">
                    <IconStar size={12} />
                    {item.score}
                  </span>
                  {item.genres?.[0] && (
                    <span className="random-genre">{item.genres[0]}</span>
                  )}
                </div>
              </div>
            </div>
          </Link>
        )}
      </div>

      <style>{`
        .sidebar-random {
          margin-top: 2rem;
        }
        .sidebar-random-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
        }
        .sidebar-refresh-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: var(--text-secondary);
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .sidebar-refresh-btn:hover {
          background: rgba(255, 255, 255, 0.15);
          color: var(--accent);
          border-color: var(--accent);
          transform: translateY(-2px);
        }
        .sidebar-refresh-btn.rotating svg {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }

        .random-card-wrapper {
          position: relative;
          min-height: 120px;
          border-radius: 12px;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .random-card-wrapper:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
          border-color: rgba(var(--accent-rgb), 0.3);
        }

        .random-card {
          display: block;
          text-decoration: none;
          color: inherit;
          height: 100%;
        }

        .random-card-bg {
          position: absolute;
          inset: 0;
          z-index: 0;
          opacity: 0.15;
          filter: blur(20px);
        }
        .random-card-bg img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .random-card-inner {
          position: relative;
          z-index: 1;
          display: flex;
          gap: 12px;
          padding: 12px;
          background: linear-gradient(to right, rgba(0,0,0,0.4), transparent);
        }

        .random-poster {
          flex-shrink: 0;
          width: 70px;
          height: 100px;
          border-radius: 6px;
          overflow: hidden;
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        }
        .random-poster img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .random-info {
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 6px;
        }
        .random-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .random-meta {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.75rem;
        }
        .random-score {
          display: flex;
          align-items: center;
          gap: 4px;
          color: var(--gold);
          font-weight: 800;
        }
        .random-genre {
          color: var(--text-secondary);
          padding-left: 10px;
          border-left: 1px solid rgba(255,255,255,0.1);
        }

        /* Skeletons */
        .random-skeleton {
          padding: 12px;
          display: flex;
          gap: 12px;
        }
        .skeleton-img {
          width: 70px;
          height: 100px;
          border-radius: 6px;
          background: rgba(255,255,255,0.05);
          animation: pulse 1.5s infinite;
        }
        .skeleton-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 12px;
        }
        .skeleton-line {
          height: 12px;
          background: rgba(255,255,255,0.05);
          border-radius: 4px;
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
          0% { opacity: 0.5; }
          50% { opacity: 0.8; }
          100% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}
