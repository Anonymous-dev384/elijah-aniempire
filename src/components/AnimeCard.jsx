import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { IconStar } from './Icons'
import { generateDetailUrl, encodeId, slugify, getAnimeDetail, getMangaDetail } from '../services/api'

export default function AnimeCard({ item, type = 'anime' }) {
  const [hovered, setHovered] = useState(false)
  const [imgError, setImgError] = useState(false)
  const [panelSide, setPanelSide] = useState('right')
  const [panelStyles, setPanelStyles] = useState({})
  const [detailData, setDetailData] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const cardRef = useRef(null)

  const isAnime = type === 'anime'
  const isManga = type === 'manga'
  const isMusic = type === 'music'

  const fallback = `https://placehold.co/230x325/141210/D4A843?text=${encodeURIComponent(item.title?.slice(0, 10) || 'AniEmpire')}`

  const fmtScore = (score) => {
    if (!score || score === 'N/A') return score;
    const n = parseFloat(score);
    return isNaN(n) ? score : n.toFixed(1);
  };

  const getRatingClass = (rating) => {
    if (!rating) return '';
    const r = rating.toUpperCase();
    if (r.startsWith('R')) return 'rating-r';
    if (r.includes('PG-13')) return 'rating-pg13';
    if (r.includes('PG') || r.includes('G')) return 'rating-kids';
    return '';
  };

  useEffect(() => {
    if (hovered && cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect()
      const spaceRight = window.innerWidth - rect.right
      const spaceLeft = rect.left
      const useLeft = spaceRight < 260 && spaceLeft > 260
      setPanelSide(useLeft ? 'left' : 'right')
      
      setPanelStyles({
        position: 'fixed',
        top: Math.max(20, rect.top - 20) + 'px',
        left: useLeft ? (rect.left - 272) + 'px' : (rect.right + 12) + 'px',
        zIndex: 99999
      })
      
      // Fetch more data on hover if missing essential info
      if (isAnime && (!item.episodes || !item.duration || !item.score || !item.description) && !detailData && !loadingDetail) {
        setLoadingDetail(true)
        getAnimeDetail(item.id).then(data => {
          if (data) {
            // Map jikan API response fields to what AnimeCard expects
            setDetailData({
              episodes: data.episodes,
              duration: data.duration,
              score: data.score,
              description: data.synopsis,
              year: data.year,
              rating: data.rating,
              genres: data.genres?.map(g => g.name),
              status: data.status,
              type: data.type
            })
          }
          setLoadingDetail(false)
        }).catch(() => setLoadingDetail(false))
      }

      // Fetch manga detail on hover if missing info
      if (isManga && (!item.score || !item.description || !item.genres) && !detailData && !loadingDetail) {
        setLoadingDetail(true)
        getMangaDetail(item.id).then(data => {
          if (data) {
            setDetailData({
              chapters: data.chapters,
              volumes: data.volumes,
              score: data.score,
              description: data.synopsis,
              year: data.published?.prop?.from?.year,
              genres: data.genres?.map(g => g.name),
              status: data.status,
              type: data.type
            })
          }
          setLoadingDetail(false)
        }).catch(() => setLoadingDetail(false))
      }
    }
  }, [hovered])

  const watchSlug = isAnime ? (item.title_english ? `${slugify(item.title_english)}.${encodeId(item.id)}` : `${slugify(item.title)}.${encodeId(item.id)}`) : ''
  const latestEpMatch = item.isNewEpisode && item.episodeTitle ? item.episodeTitle.match(/\d+/) : null
  const latestEp = latestEpMatch ? latestEpMatch[0] : '1'
  const watchUrl = `/watch/${watchSlug}?ep=${latestEp}`
  
  const mangaSlug = isManga ? (item.title_english ? `${slugify(item.title_english)}.${encodeId(item.id)}` : `${slugify(item.title)}.${encodeId(item.id)}`) : ''
  const readUrl = `/manga/${mangaSlug}/read/1`
  
  const displayItem = { ...item, ...detailData }

  return (
    <div
      ref={cardRef}
      className="anime-card card-shimmer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link to={isAnime && item.isNewEpisode ? watchUrl : generateDetailUrl(type, item.title, item.id)} style={{ display: 'block' }}>
        {/* Poster */}
        <div className="ac-poster">
          <img
            src={imgError ? fallback : item.coverImage}
            alt={item.title}
            onError={() => setImgError(true)}
            className="ac-img"
            loading="lazy"
          />
          {/* Top badges */}
          <div className="ac-badges-top">
            {item.isNew && !item.isNewEpisode && <span className="badge badge-new">NEW</span>}
            {isMusic && <span className="badge badge-music">{item.type}</span>}
            {isManga && <span className="badge badge-manga">MANGA</span>}
          </div>
          
          {/* Top-Right Age Rating Badge */}
          {displayItem.rating && (
            <div className={`ac-rating-badge ${getRatingClass(displayItem.rating)}`}>
              {displayItem.rating.split(' ')[0]}
            </div>
          )}

          {/* Bottom metadata badges */}
          <div className="ac-badges-bot">
             <div className="ac-meta-badges">
                <span className="ac-meta-badge total">
                  {isAnime ? (displayItem.episodes || '?') : (item.chapters ? `${item.chapters}` : '?')}
                  {isAnime ? ' EPS' : ' CH'}
                </span>
             </div>
             {isAnime && item.isNewEpisode && (
               <span className="ac-ep-badge latest">{item.episodeTitle.toUpperCase()}</span>
             )}
          </div>
          {/* Play overlay on hover */}
          <div className={`ac-play-overlay ${hovered ? 'show' : ''}`}>
            <div className="ac-play-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#0A0908" stroke="none"><polygon points="5 3 19 12 5 21 5 3" /></svg>
            </div>
          </div>
        </div>

        {/* Title area */}
        <div className="ac-info">
          <p className="ac-title">{item.title}</p>
          <div className="ac-meta">
            {displayItem.score && displayItem.score !== 'N/A' ? <span className="ac-rating"><IconStar size={11} /> {fmtScore(displayItem.score)}</span> : <span className="ac-rating-placeholder"></span>}
            {displayItem.year && displayItem.year !== 'N/A' && <span className="ac-year">{displayItem.year}</span>}
          </div>
        </div>
      </Link>

      {/* Hover detail panel — rendered via Portal to avoid overflow:hidden clipping */}
      {hovered && createPortal(
        <div
          className="ac-detail-panel visible"
          style={panelStyles}
        >
          <div className="ac-detail-inner">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <h4 className="ac-detail-title">{displayItem.title}</h4>
            </div>
            {loadingDetail && !detailData ? (
               <div className="ac-detail-skeleton" style={{ marginTop: '12px', marginBottom: '16px' }}>
                 <div className="skeleton-line" style={{ width: '90%', height: '10px', marginBottom: '14px' }} />
                 <div className="skeleton-line" style={{ width: '100%', height: '8px', marginBottom: '8px' }} />
                 <div className="skeleton-line" style={{ width: '80%', height: '8px', marginBottom: '8px' }} />
                 <div className="skeleton-line" style={{ width: '60%', height: '8px', marginBottom: '16px' }} />
                 <div style={{ display: 'flex', gap: '8px' }}>
                   <div className="skeleton-line" style={{ width: '45px', height: '18px', borderRadius: '4px', marginBottom: 0 }} />
                   <div className="skeleton-line" style={{ width: '45px', height: '18px', borderRadius: '4px', marginBottom: 0 }} />
                   <div className="skeleton-line" style={{ width: '45px', height: '18px', borderRadius: '4px', marginBottom: 0 }} />
                 </div>
               </div>
            ) : (
              <>
                <div className="ac-detail-meta-row">
                  <span className="ac-rating"><IconStar size={11} /> {fmtScore(displayItem.score)}</span>
                  <span style={{ color: displayItem.status === 'Releasing' || displayItem.status === 'Currently Airing' ? 'var(--gold)' : 'var(--text-muted)' }}>{displayItem.status === 'Currently Airing' ? 'Airing' : (displayItem.status || 'Unknown')}</span>
                  <span>•</span>
                  <span>{displayItem.type || 'TV'}</span>
                  {displayItem.episodes && (
                    <>
                      <span>•</span>
                      <span>{displayItem.episodes} EPS</span>
                    </>
                  )}
                  {displayItem.duration && (
                    <>
                      <span>•</span>
                      <span>{displayItem.duration.replace(' per ep', '')}</span>
                    </>
                  )}
                  <span>•</span>
                  <span>{displayItem.year || ''}</span>
                  {displayItem.rating && (
                    <>
                      <span>•</span>
                      <span className="ac-age-rating">{displayItem.rating.split(' ')[0]}</span>
                    </>
                  )}
                </div>
                {isMusic && <p className="ac-detail-artist">{displayItem.artist} · {displayItem.anime}</p>}
                <p className="ac-detail-desc">{displayItem.description || displayItem.genres?.join(' · ') || 'No description available.'}</p>
                <div className="ac-detail-genres">
                  {displayItem.genres?.slice(0, 4).map(g => (
                    <span key={g} className="tag" style={{ fontSize: '0.65rem', padding: '3px 8px', cursor: 'default' }}>{g}</span>
                  ))}
                </div>
              </>
            )}
            <Link to={isAnime ? watchUrl : isManga ? readUrl : generateDetailUrl(type, displayItem.title, displayItem.id)} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 14 }}>
              {isAnime ? 'Watch Now' : isManga ? 'Read Now' : 'Play Now'}
            </Link>
          </div>
        </div>,
        document.body
      )}

      <style>{`
        .anime-card { position: relative; cursor: pointer; }
        .ac-poster {
          position: relative; 
          border-radius: var(--radius-lg); 
          overflow: hidden;
          aspect-ratio: 2/3; 
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          /* Fix for mobile Safari "ghosting/repeating" glitch during scroll */
          -webkit-transform: translateZ(0);
          transform: translateZ(0);
          -webkit-mask-image: -webkit-radial-gradient(white, black);
          transition: border-color 0.25s ease, transform 0.25s ease, box-shadow 0.25s ease;
        }
        .anime-card:hover .ac-poster {
          border-color: var(--border-hover);
          box-shadow: var(--shadow-gold);
          transform: translateY(-3px);
        }
        .ac-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s ease; }
        .anime-card:hover .ac-img { transform: scale(1.06); }
        .ac-badges-top { position: absolute; top: 8px; left: 8px; display: flex; gap: 4px; z-index: 2; }
        .ac-rating-badge {
          position: absolute; top: 12px; right: 12px; z-index: 2;
          font-size: 0.75rem; font-weight: 900; padding: 4px 10px;
          border-radius: 4px; backdrop-filter: blur(8px);
          border: 1.5px solid rgba(255,255,255,0.25);
          box-shadow: 0 4px 12px rgba(0,0,0,0.5);
          text-transform: uppercase; letter-spacing: 0.03em;
          background: rgba(0,0,0,0.8); color: #fff;
        }
        .ac-badges-bot { position: absolute; bottom: 8px; width: calc(100% - 16px); left: 8px; display: flex; align-items: center; justify-content: space-between; z-index: 2; }
        .ac-meta-badges { display: flex; gap: 1px; border-radius: 4px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.4); }
        .ac-meta-badge {
          display: flex; align-items: center; gap: 4px;
          font-size: 0.65rem; font-weight: 800; padding: 3px 8px;
          color: #000; white-space: nowrap;
        }
        .ac-meta-badge.total { background: rgba(255,255,255,0.95); }
        .ac-ep-badge {
          background: rgba(0,0,0,0.85); color: #fff; font-size: 0.65rem;
          font-weight: 700; padding: 3px 8px; border-radius: 4px;
          white-space: nowrap;
        }
        .ac-ep-badge.latest { background: var(--gold); color: #000; }
        .ac-play-overlay {
          position: absolute; inset: 0; background: rgba(0,0,0,0.4);
          display: flex; align-items: center; justify-content: center;
          opacity: 0; transition: opacity 0.25s ease; z-index: 3;
        }
        .ac-play-overlay.show { opacity: 1; }
        .ac-play-btn {
          width: 40px; height: 40px; border-radius: 50%;
          background: var(--gold); display: flex; align-items: center;
          justify-content: center; padding-left: 2px;
          box-shadow: 0 2px 16px rgba(212,168,67,0.4);
          transform: scale(0.8); transition: transform 0.2s ease;
        }
        .ac-play-overlay.show .ac-play-btn { transform: scale(1); }
        .ac-info { padding: 8px 2px 2px; }
        .ac-title { font-size: 0.8rem; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .ac-meta { display: flex; align-items: center; justify-content: space-between; margin-top: 3px; }
        .ac-rating { display: inline-flex; align-items: center; gap: 3px; color: var(--gold); font-size: 0.72rem; font-weight: 600; }
        .ac-year { font-size: 0.68rem; color: var(--text-muted); }
        .ac-detail-panel {
          position: absolute; left: calc(100% + 12px); top: -10px;
          width: 340px; background: var(--bg-surface);
          border: 1px solid var(--border-hover);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-gold-lg), var(--shadow-card);
          opacity: 0; pointer-events: none;
          transform: translateX(-8px) scale(0.97);
          transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
          z-index: 200;
        }
        .ac-detail-panel.visible { opacity: 1; pointer-events: auto; transform: translateX(0) scale(1); }
        .ac-detail-inner { padding: 18px; }
        .ac-detail-title { font-family: var(--font-heading); font-size: 1rem; color: var(--gold); line-height: 1.3; font-weight: 800; }
        .ac-detail-meta-row { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; row-gap: 6px; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 12px; font-weight: 600; }
        .ac-age-rating { border: 1px solid var(--text-muted); padding: 1px 4px; border-radius: 4px; font-size: 0.65rem; white-space: nowrap; }
        .ac-detail-artist { color: var(--gold); font-size: 0.78rem; margin-bottom: 8px; opacity: 0.9; }
        .ac-detail-desc { font-size: 0.8rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 16px; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }
        .ac-detail-genres { display: flex; flex-wrap: wrap; gap: 6px; }
        @media (max-width: 768px) {
          .ac-detail-panel { display: none !important; }
        }
      `}</style>
    </div>
  )
}
