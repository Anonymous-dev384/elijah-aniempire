import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { IconStar, IconPlay, IconBook, IconMaximize } from './Icons'
import { generateDetailUrl, encodeId, formatCount, decodeId } from '../services/api'

const getSeasonLink = (season, year, type) => {
  if (!season || !year) return `/browse/${type}`;
  return `/browse/${type}?cat=seasonal_archive&season=${season.toLowerCase()}&year=${year}`;
}

export default function DetailHero({ data, type = 'anime', onWatchClick, onPosterClick, onBannerClick }) {
  const [bannerLoaded, setBannerLoaded] = useState(false)
  const [posterError, setPosterError] = useState(false)
  const isManga = type === 'manga'

  const [bannerType, setBannerType] = useState(() => {
    if (data.anilistBanner) return 'hq'
    if (!isManga && (data.trailer?.youtube_id || data.trailer?.embed_url)) return 'trailer'
    return 'poster'
  })

  const title = data.title_english || data.title || data.title_japanese || 'Unknown Title'
  const japTitle = data.title_japanese || ''
  const poster = data.images?.webp?.large_image_url || data.images?.jpg?.large_image_url || ''
  const score = data.score || 'N/A'
  const scoredBy = data.scored_by ? `${formatCount(data.scored_by)} users` : ''
  const rank = data.rank ? `#${data.rank}` : null
  const popularity = data.popularity ? `#${data.popularity}` : null
  const status = data.status || 'Unknown'
  const mediaType = data.type || (isManga ? 'Manga' : 'TV')
  const year = data.year || (data.aired?.prop?.from?.year) || (data.published?.prop?.from?.year) || ''
  const season = data.season ? data.season.charAt(0).toUpperCase() + data.season.slice(1) : ''
  const episodes = data.episodes
  const chapters = data.chapters
  const volumes = data.volumes
  const rating = data.rating || ''
  
  const getRatingClass = (rStr) => {
    if (!rStr) return '';
    const r = rStr.toUpperCase();
    if (r.startsWith('R')) return 'rating-r';
    if (r.includes('PG-13')) return 'rating-pg13';
    if (r.includes('PG') || r.includes('G')) return 'rating-kids';
    return '';
  };

  const source = data.source || ''
  const genres = [...(data.genres || []), ...(data.themes || []), ...(data.demographics || [])]

  const renderLinks = (items, type) => {
    if (!items || !items.length) return null;
    return items.map((item, i) => (
      <span key={item.mal_id || i}>
        <Link to={generateDetailUrl(type, item.name, item)} className="hover-link" onClick={e => e.stopPropagation()}>{item.name}</Link>
        {i < items.length - 1 ? ', ' : ''}
      </span>
    ));
  };

  const studios = renderLinks(data.studios, 'producer');
  const authors = (data.authors || []).map((a, i) => (
    <span key={a.mal_id || i}>
      <Link to={generateDetailUrl('person', a.name, a)} className="hover-link" onClick={e => e.stopPropagation()}>{a.name}</Link>
      {` (${a.type})`}
      {i < (data.authors || []).length - 1 ? ', ' : ''}
    </span>
  ));

  // Banner image priority: AniList banner > YouTube thumbnail (Anime only) > poster
  let bannerUrl = poster

  useEffect(() => {
    setBannerLoaded(false)
    setPosterError(false)
    if (data.anilistBanner) {
      setBannerType('hq')
    } else if (!isManga && (data.trailer?.youtube_id || data.trailer?.embed_url)) {
      setBannerType('trailer')
    } else {
      setBannerType('poster')
    }
  }, [data.mal_id, data.anilistBanner, data.trailer, isManga])

  if (bannerType === 'hq' && data.anilistBanner) {
    bannerUrl = data.anilistBanner
  } else if (bannerType === 'trailer') {
    if (data.trailer?.youtube_id) {
        bannerUrl = `https://img.youtube.com/vi/${data.trailer.youtube_id}/maxresdefault.jpg`
    } else if (data.trailer?.embed_url) {
        const match = data.trailer.embed_url.match(/\/embed\/([^?]+)/)
        if (match?.[1]) bannerUrl = `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg`
    }
  }

  const fallbackPoster = `https://placehold.co/230x325/141210/D4A843?text=${encodeURIComponent(title.slice(0, 12))}`

  return (
    <div className="detail-hero">
      {/* Banner backdrop */}
      <div className="dh-banner-wrap">
        <img
          src={bannerUrl}
          alt=""
          className={`dh-banner-img no-drag ${bannerLoaded ? 'loaded' : ''} is-${bannerType}`}
          onLoad={(e) => {
            if (bannerType === 'trailer' && e.target.naturalWidth <= 120) {
              e.target.src = poster
              setBannerType('poster')
            } else {
              setBannerLoaded(true)
            }
          }}
          onError={(e) => { e.target.src = poster; setBannerLoaded(true); setBannerType('poster') }}
          draggable="false"
        />
        <div className="dh-banner-overlay" />
      </div>

      <button 
        className="dh-banner-enlarge" 
        onClick={() => onBannerClick(bannerUrl)}
        data-tooltip="Enlarge Banner"
      >
        <IconMaximize size={16} />
      </button>

      {/* Content */}
      <div className="dh-content">
        <div className="dh-poster-wrap">
          <img
            src={posterError ? fallbackPoster : poster}
            alt={title}
            className="dh-poster"
            onClick={() => onPosterClick && onPosterClick()}
            onError={() => setPosterError(true)}
            style={{ cursor: 'zoom-in' }}
          />
          {score !== 'N/A' && (
            <div className="dh-score-badge">
              <IconStar size={14} />
              <span>{score}</span>
            </div>
          )}
        </div>

        <div className="dh-info">
          <h1 className="dh-title">{title}</h1>
          {japTitle && japTitle !== title && (
            <p className="dh-jp-title">{japTitle}</p>
          )}

          <div className="dh-meta-row">
            {mediaType && <span className="dh-meta-chip">{mediaType}</span>}
            {status && (
              <span className={`dh-meta-chip ${status === 'Currently Airing' || status === 'Publishing' ? 'airing' : ''}`}>
                {status === 'Currently Airing' ? 'Airing' : status}
              </span>
            )}
            {!isManga && episodes && <span className="dh-meta-chip">{episodes} EPS</span>}
            {isManga && chapters && <span className="dh-meta-chip">{chapters} Chapters</span>}
            {isManga && volumes && <span className="dh-meta-chip">{volumes} Volumes</span>}
            {season && year && (
              <Link 
                to={getSeasonLink(season, year, type)} 
                className="dh-meta-chip hover-link"
                style={{ textDecoration: 'none' }}
              >
                {season} {year}
              </Link>
            )}
            {!season && year && <span className="dh-meta-chip">{year}</span>}
            {rating && <span className={`dh-meta-chip rating-chip ${getRatingClass(rating)}`}>{rating.split(' - ')[0].split(' ')[0]}</span>}
            {source && <span className="dh-meta-chip">{source}</span>}
          </div>

          {/* Genres */}
          <div className="dh-genres">
            {genres.map(g => (
              <Link
                key={g.mal_id}
                to={`/browse/${type}?genres=${g.name}`}
                className="tag"
              >
                {g.name}
              </Link>
            ))}
          </div>

          {/* Stats row */}
          <div className="dh-stats-row">
            {rank && (
              <div className="dh-stat">
                <span className="dh-stat-label">Rank</span>
                <span className="dh-stat-value">{rank}</span>
              </div>
            )}
            {popularity && (
              <div className="dh-stat">
                <span className="dh-stat-label">Popularity</span>
                <span className="dh-stat-value">{popularity}</span>
              </div>
            )}
            {data.members && (
              <div className="dh-stat">
                <span className="dh-stat-label">Members</span>
                <span className="dh-stat-value">{formatCount(data.members)}</span>
              </div>
            )}
            {data.favorites && (
              <div className="dh-stat">
                <span className="dh-stat-label">Favorites</span>
                <span className="dh-stat-value">{formatCount(data.favorites)}</span>
              </div>
            )}
          </div>

          {/* Studio / Author line */}
          {!isManga && studios && (
            <p className="dh-studio-line">
              <span className="dh-studio-label">Studio</span>
              <span className="dh-studio-value">{studios}</span>
            </p>
          )}
          {isManga && authors && (
            <p className="dh-studio-line">
              <span className="dh-studio-label">Author</span>
              <span className="dh-studio-value">{authors}</span>
            </p>
           )}

          {/* Action Buttons */}
          <div className="dh-actions">
            {!isManga && (
              <button className="btn btn-primary btn-lg" onClick={onWatchClick}>
                <IconPlay size={14} /> Watch Now
              </button>
            )}
            {isManga && (
              <button className="btn btn-primary btn-lg" onClick={onWatchClick}>
                <IconBook size={14} /> Read Now
              </button>
            )}
            <button className="btn btn-ghost btn-lg">+ Add to List</button>
          </div>
        </div>
      </div>
    </div>
  )
}
