import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { IconStar } from './Icons'
import { generateDetailUrl, getAnimeDetail } from '../services/api'

export default function RoleCard({ roleItem, onImageClick }) {
  const { character, anime, role } = roleItem;
  
  const [hovered, setHovered] = useState(false)
  const [panelSide, setPanelSide] = useState('right')
  const [detailData, setDetailData] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [imgError, setImgError] = useState(false)
  
  const cardRef = useRef(null)
  const navigate = useNavigate()

  const charName = character?.name || 'Unknown Character';
  const charImage = character?.images?.webp?.image_url || character?.images?.jpg?.image_url || '';
  
  const animeTitle = anime?.title || 'Unknown Anime';
  const animeImage = anime?.images?.webp?.large_image_url || anime?.images?.jpg?.large_image_url || '';

  const fallbackAnime = `https://placehold.co/230x325/141210/D4A843?text=${encodeURIComponent(animeTitle.slice(0, 10))}`

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
      setPanelSide(spaceRight < 260 ? 'left' : 'right')
      
      if (!detailData && !loadingDetail && anime?.mal_id) {
        setLoadingDetail(true)
        getAnimeDetail(anime.mal_id).then(data => {
          if (data) {
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
    }
  }, [hovered, anime?.mal_id])

  const animeUrl = generateDetailUrl('anime', animeTitle, anime?.mal_id);
  const charUrl = generateDetailUrl('character', charName, character?.mal_id);
  const displayItem = { ...anime, ...detailData }

  const handleZoomClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onImageClick) {
      onImageClick();
    }
  };

  return (
    <div
      ref={cardRef}
      className="anime-card role-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link to={animeUrl} style={{ display: 'block' }}>
        <div className="ac-poster">
          <img 
            src={imgError ? fallbackAnime : animeImage} 
            alt={animeTitle} 
            onError={() => setImgError(true)}
            className="ac-img" 
            loading="lazy" 
          />
          
          <div className="ac-role-badge">
            <span className={role === 'Main' ? 'role-main' : 'role-sub'}>{role}</span>
          </div>

          {/* Age Rating Badge */}
          {displayItem.rating && (
            <div className={`ac-rating-badge ${getRatingClass(displayItem.rating)}`}>
              {displayItem.rating.split(' ')[0]}
            </div>
          )}

          {/* Character portrait embedded inside anime poster */}
          {charImage && (
            <div className="ac-char-thumb" onClick={handleZoomClick} style={{ cursor: 'zoom-in' }}>
              <img src={charImage} alt={charName} title={charName} />
            </div>
          )}

          <div className="ac-play-overlay">
            <div className="ac-play-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#0A0908" stroke="none"><polygon points="5 3 19 12 5 21 5 3" /></svg>
            </div>
          </div>
        </div>
      </Link>

      <div className="ac-info">
        <Link to={charUrl} className="rc-char-name" title={charName}>{charName}</Link>
        <Link to={animeUrl} className="rc-anime-title" title={animeTitle}>{animeTitle}</Link>
      </div>

      {/* Hover detail panel */}
      <div
        className={`ac-detail-panel ${hovered ? 'visible' : ''}`}
        style={panelSide === 'left' ? { right: 'calc(100% + 12px)', left: 'auto' } : {}}
      >
        <div className="ac-detail-inner">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <h4 className="ac-detail-title">{displayItem.title || animeTitle}</h4>
          </div>
          {loadingDetail && !detailData ? (
             <div className="ac-detail-skeleton" style={{ marginTop: '12px', marginBottom: '16px' }}>
               <div className="skeleton-line" style={{ width: '90%', height: '10px', marginBottom: '14px' }} />
               <div className="skeleton-line" style={{ width: '100%', height: '8px', marginBottom: '8px' }} />
               <div className="skeleton-line" style={{ width: '80%', height: '8px', marginBottom: '8px' }} />
               <div className="skeleton-line" style={{ width: '60%', height: '8px', marginBottom: '16px' }} />
             </div>
          ) : (
            <>
              <div className="ac-detail-meta-row">
                <span className="ac-rating"><IconStar size={11} /> {displayItem.score || 'N/A'}</span>
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
              <p className="ac-detail-desc">{displayItem.description || displayItem.genres?.join(' · ') || 'No description available.'}</p>
              <div className="ac-detail-genres">
                {displayItem.genres?.slice(0, 4).map(g => (
                  <span key={g} className="tag" style={{ fontSize: '0.65rem', padding: '3px 8px', cursor: 'default' }}>{g}</span>
                ))}
              </div>
            </>
          )}
          <Link to={animeUrl} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 14 }}>
            Go to Anime
          </Link>
          <Link to={charUrl} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
            Go to Character
          </Link>
        </div>
      </div>

      <style>{`
        .anime-card { position: relative; cursor: pointer; }
        .ac-poster {
          position: relative; 
          border-radius: var(--radius-lg); 
          overflow: hidden;
          aspect-ratio: 2/3; 
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
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
        
        .ac-role-badge {
          position: absolute;
          top: 8px;
          left: 8px;
          z-index: 2;
        }
        .ac-role-badge span {
          font-size: 0.65rem;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 4px;
          text-transform: uppercase;
          backdrop-filter: blur(8px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        }
        .role-main {
          background: var(--gold);
          color: #000;
        }
        .role-sub {
          background: rgba(0,0,0,0.8);
          color: #fff;
          border: 1px solid rgba(255,255,255,0.2);
        }

        .ac-rating-badge {
          position: absolute; top: 12px; right: 12px; z-index: 2;
          font-size: 0.75rem; font-weight: 900; padding: 4px 10px;
          border-radius: 4px; backdrop-filter: blur(8px);
          border: 1.5px solid rgba(255,255,255,0.25);
          box-shadow: 0 4px 12px rgba(0,0,0,0.5);
          text-transform: uppercase; letter-spacing: 0.03em;
          background: rgba(0,0,0,0.8); color: #fff;
        }

        .ac-char-thumb {
          position: absolute;
          bottom: 12px;
          right: 12px;
          width: 80px;
          height: 120px;
          border-radius: 6px;
          overflow: hidden;
          border: 2px solid var(--bg-surface);
          box-shadow: 0 4px 16px rgba(0,0,0,0.8);
          z-index: 4; /* Above play overlay */
          transition: transform 0.3s ease, border-color 0.3s ease;
          background: var(--bg-card);
          cursor: zoom-in;
        }
        .ac-char-thumb:hover {
          transform: scale(1.1) rotate(-2deg);
          border-color: var(--gold);
        }
        .ac-char-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .ac-play-overlay {
          position: absolute; inset: 0; background: rgba(0,0,0,0.4);
          display: flex; align-items: center; justify-content: center;
          opacity: 0; transition: opacity 0.25s ease; z-index: 3;
        }
        .anime-card:hover .ac-play-overlay { opacity: 1; }
        .ac-play-btn {
          width: 40px; height: 40px; border-radius: 50%;
          background: var(--gold); display: flex; align-items: center;
          justify-content: center; padding-left: 2px;
          box-shadow: 0 2px 16px rgba(212,168,67,0.4);
          transform: scale(0.8); transition: transform 0.2s ease;
        }
        .anime-card:hover .ac-play-btn { transform: scale(1); }
        
        .ac-info { padding: 8px 2px 2px; display: flex; flex-direction: column; gap: 2px; }
        .rc-char-name {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--gold);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          text-decoration: none;
        }
        .rc-char-name:hover { text-decoration: underline; }
        .rc-anime-title {
          font-size: 0.72rem;
          color: var(--text-secondary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          text-decoration: none;
        }
        .rc-anime-title:hover { text-decoration: underline; color: var(--text-primary); }

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
        .ac-detail-desc { font-size: 0.8rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 16px; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }
        .ac-detail-genres { display: flex; flex-wrap: wrap; gap: 6px; }
        @media (max-width: 768px) {
          .ac-detail-panel { display: none !important; }
        }
      `}</style>
    </div>
  )
}
