import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMusic } from '../context/MusicContext'
import { generateDetailUrl } from '../services/api'

export default function PlaylistDrawer() {
  const {
    playlist,
    playlistIndex,
    setPlaylistIndex,
    setIsMinimized,
    showPlaylist,
    setShowPlaylist,
    playFromPlaylist,
    removeFromPlaylist,
    clearPlaylist,
    moveInPlaylist,
    playingId,
    generateMusicUrl,
  } = useMusic()

  const [draggedIdx, setDraggedIdx] = useState(null)

  useEffect(() => {
    if (showPlaylist) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [showPlaylist])

  if (!showPlaylist) return null

  const handleDragStart = (e, index) => {
    setDraggedIdx(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', index)
    setTimeout(() => {
      if (e.target && e.target.style) e.target.style.opacity = '0.5'
    }, 0)
  }

  const handleDragEnd = (e) => {
    setDraggedIdx(null)
    if (e.target && e.target.style) e.target.style.opacity = '1'
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
  }

  const handleDrop = (e, index) => {
    e.preventDefault()
    if (draggedIdx === null || draggedIdx === index) return
    moveInPlaylist(draggedIdx, index)
    setDraggedIdx(null)
  }

  return (
    <>
      <div className="playlist-backdrop" onClick={() => setShowPlaylist(false)} />
      <aside className="playlist-drawer">
        {/* Header */}
        <div className="playlist-drawer__header">
          <div className="playlist-drawer__title-row">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2.5">
              <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
            <h3>Queue</h3>
            <span className="playlist-drawer__count">{playlist.length} tracks</span>
          </div>
          <div className="playlist-drawer__actions">
            {playlist.length > 0 && (
              <button className="playlist-drawer__clear-btn" onClick={clearPlaylist}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                </svg>
                <span className="playlist-drawer__clear-text">Clear All</span>
              </button>
            )}
            <button className="playlist-drawer__close-btn" onClick={() => setShowPlaylist(false)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Track list */}
        <div className="playlist-drawer__list">
          {playlist.length === 0 ? (
            <div className="playlist-drawer__empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" style={{ opacity: 0.4 }}>
                <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
              </svg>
              <p>Your queue is empty</p>
              <span>Add tracks from the music page to build your queue</span>
            </div>
          ) : (
            playlist.map((item, index) => {
              const { animeEntry, theme } = item
              const isActive = playingId === theme.id
              const songTitle = theme.songTitle || theme.song?.title || 'Unknown Title'
              const artists = theme.artists || theme.song?.artists?.map(a => a.name).join(', ') || 'Unknown Artist'
              return (
                <div
                  key={`${theme.id}-${index}`}
                  className={`playlist-track ${isActive ? 'playlist-track--active' : ''}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  style={{ cursor: draggedIdx === index ? 'grabbing' : 'pointer' }}
                >
                  <div
                    className="playlist-track__link-content"
                    onClick={(e) => {
                      if (e.target.closest('a')) return; // Don't trigger if clicking nested link
                      playFromPlaylist(index);
                      setIsMinimized(true);
                      setShowPlaylist(false);
                    }}
                  >
                    <span className="playlist-track__number">{index + 1}</span>
                    <div className="playlist-track__cover-wrap">
                      {animeEntry.coverImage ? (
                        <img
                          src={animeEntry.coverImage}
                          alt={animeEntry.name}
                          className="playlist-track__cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="playlist-track__cover playlist-track__cover--placeholder">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--text-muted)"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                        </div>
                      )}
                      {isActive && (
                        <div className="playlist-track__playing-indicator">
                          <span /><span /><span />
                        </div>
                      )}
                    </div>
                    <div className="playlist-track__info">
                      <div className="playlist-track__title">{songTitle}</div>
                      <div className="playlist-track__meta">
                        <div className="playlist-track__artists">
                        { (theme.artistsData || theme.song?.artists) ? (
                          (theme.artistsData || theme.song.artists).map((a, i) => (
                            <React.Fragment key={a.id || i}>
                              <Link 
                                to={generateDetailUrl('artist', a.name, a)} 
                                className="hover-link" 
                                onClick={e => e.stopPropagation()}
                                title={`View ${a.name}`}
                              >
                                {a.name}
                              </Link>
                              {i < (theme.artistsData || theme.song.artists).length - 1 ? ', ' : ''}
                            </React.Fragment>
                          ))
                        ) : (
                          artists
                        )}
                        </div>
                        <span className="playlist-track__dot">·</span>
                        <Link 
                          to={generateDetailUrl('anime', animeEntry.name, animeEntry.malId)} 
                          className="playlist-track__anime hover-link"
                          onClick={e => e.stopPropagation()}
                          title={`View ${animeEntry.name}`}
                        >
                          {animeEntry.name}
                        </Link>
                      </div>
                    </div>
                    <div className="playlist-track__type-badge">
                      {theme.type}{theme.sequence ? theme.sequence : ''}
                    </div>
                  </div>
                  <div className="playlist-track__actions" onClick={e => e.stopPropagation()}>
                    {index > 0 && (
                      <button
                        className="playlist-track__move-btn"
                        onClick={() => moveInPlaylist(index, index - 1)}
                        title="Move Up"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="18 15 12 9 6 15"/></svg>
                      </button>
                    )}
                    {index < playlist.length - 1 && (
                      <button
                        className="playlist-track__move-btn"
                        onClick={() => moveInPlaylist(index, index + 1)}
                        title="Move Down"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 12 15 18 9"/></svg>
                      </button>
                    )}
                    <button
                      className="playlist-track__remove-btn"
                      onClick={() => removeFromPlaylist(index)}
                      title="Remove"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </aside>
    </>
  )
}
