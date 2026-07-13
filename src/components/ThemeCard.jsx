import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMusic } from '../context/MusicContext'
import { generateDetailUrl } from '../services/api'

export default function ThemeCard({ animeEntry }) {
  const { playTrack, playingId, addToPlaylist, playlist } = useMusic()
  const [imgError, setImgError] = useState(false)
  const [showAdded, setShowAdded] = useState(false)

  if (!animeEntry || !animeEntry.themes?.length) return null

  const firstTheme = animeEntry.themes[0]
  const isPlaying = playingId === firstTheme.id
  const isInQueue = playlist.some((item) => item.theme.id === firstTheme.id)
  const fallbackImg = `https://placehold.co/240x340/141210/D4A843?text=${encodeURIComponent(animeEntry.name?.slice(0, 10) || 'AniEmpire')}`

  const handleAddToQueue = (e) => {
    e.stopPropagation()
    if (isInQueue) return
    addToPlaylist(animeEntry, firstTheme)
    setShowAdded(true)
    setTimeout(() => setShowAdded(false), 1500)
  }

  return (
    <div className={`music-card ${isPlaying ? 'music-card--playing' : ''}`}>
      <div className="music-card__poster">
        <img
          src={imgError || !animeEntry.coverImage ? fallbackImg : animeEntry.coverImage}
          alt={animeEntry.name}
          onError={() => setImgError(true)}
          className="music-card__img"
          loading="lazy"
        />
        <div className="music-card__overlay">
          <button
            className="music-card__play-btn"
            onClick={() => playTrack(animeEntry, firstTheme, 'audio')}
            title={`Play ${firstTheme.songTitle}`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
          </button>
        </div>
        <span className={`music-card__type-badge type-${firstTheme.type?.toLowerCase()}`}>
          {firstTheme.type}{firstTheme.sequence ? ` ${firstTheme.sequence}` : ''}
        </span>
      </div>

      <div className="music-card__info">
        <p className="music-card__song">{firstTheme.songTitle}</p>
        <div className="music-card__artist">
          {firstTheme.artistsData ? (
            firstTheme.artistsData.map((a, i) => (
              <span key={a.id || i}>
                <Link to={generateDetailUrl('artist', a.name, a)} className="hover-link">{a.name}</Link>
                {i < firstTheme.artistsData.length - 1 ? ', ' : ''}
              </span>
            ))
          ) : (
            <span>{firstTheme.artists}</span>
          )}
        </div>

        <Link to={generateDetailUrl('anime', animeEntry.name, animeEntry.malId)} className="music-card__anime">{animeEntry.name}</Link>
        <div className="music-card__actions">
          {firstTheme.audioLink && (
            <button
              className={`music-card__action-btn ${isPlaying ? 'active' : ''}`}
              onClick={() => playTrack(animeEntry, firstTheme, 'audio')}
              title="Play Audio"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
            </button>
          )}
          {firstTheme.videoLink && (
            <button
              className="music-card__action-btn"
              onClick={() => playTrack(animeEntry, firstTheme, 'video')}
              title="Play Video"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="5 3 19 12 5 21 5 3" /></svg>
            </button>
          )}
          {/* Add to Queue */}
          <button
            className={`music-card__action-btn music-card__queue-btn ${isInQueue ? 'active' : ''} ${showAdded ? 'just-added' : ''}`}
            onClick={handleAddToQueue}
            title={isInQueue ? 'Already in Queue' : 'Add to Queue'}
            disabled={isInQueue}
          >
            {showAdded ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="16" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
                <path d="M19 16v6" /><path d="M16 19h6" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
