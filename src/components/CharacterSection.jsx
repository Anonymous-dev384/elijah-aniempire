import { useState } from 'react'
import { Link } from 'react-router-dom'
import { generateDetailUrl } from '../services/api'

const PLACEHOLDER_PERSON = 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><rect width="100" height="100" fill="#1A1815"/><circle cx="50" cy="38" r="16" stroke="#665C46" stroke-width="2"/><path d="M20 85c0-16.57 13.43-30 30-30s30 13.43 30 30" stroke="#665C46" stroke-width="2" fill="none"/></svg>`)

export default function CharacterSection({ characters = [], type = 'anime', onImageClick }) {
  const [showAll, setShowAll] = useState(false)
  const isAnime = type === 'anime'

  const sortedChars = [...characters].sort((a, b) => {
    if (a.role === 'Main' && b.role !== 'Main') return -1
    if (a.role !== 'Main' && b.role === 'Main') return 1
    return (b.favorites || 0) - (a.favorites || 0)
  })

  const displayed = showAll ? sortedChars : sortedChars.slice(0, 12)

  if (characters.length === 0) return null

  return (
    <div className="char-section">
      <div className="char-section-header">
        <h3 className="detail-section-title">Characters {isAnime ? '& Voice Actors' : ''}</h3>
        {sortedChars.length > 12 && (
          <button className="btn btn-ghost btn-sm" onClick={() => setShowAll(!showAll)}>
            {showAll ? 'Show Less' : `View All (${sortedChars.length})`}
          </button>
        )}
      </div>
      <div className="char-grid">
        {displayed.map((char, index) => {
          const character = char.character || {}
          const va = isAnime ? (char.voice_actors || []).find(v => v.language === 'Japanese') : null
          const charImg = character.images?.webp?.image_url || character.images?.jpg?.image_url || PLACEHOLDER_PERSON
          const vaImg = va?.person?.images?.jpg?.image_url || PLACEHOLDER_PERSON

          return (
            <div key={character.mal_id} className="char-card">
              <div className="char-card-left">
                <img
                  src={charImg}
                  alt={character.name}
                  className="char-avatar"
                  loading="lazy"
                  onError={(e) => { e.target.src = PLACEHOLDER_PERSON }}
                  onClick={() => onImageClick && onImageClick('char', index)}
                  style={{ cursor: 'zoom-in' }}
                />
                <div className="char-info">
                  <Link to={generateDetailUrl('character', character.name, character.mal_id)} className="char-name hover-link">{character.name}</Link>
                  <span className={`char-role ${char.role === 'Main' ? 'main' : ''}`}>{char.role}</span>
                </div>
              </div>
              {isAnime && (
                <div className="char-card-right">
                  <div className="char-info" style={{ textAlign: 'right' }}>
                    <Link to={generateDetailUrl('person', va?.person?.name, va?.person?.mal_id)} className="char-name va-name hover-link">{va?.person?.name || 'Unknown'}</Link>
                    <span className="char-role">{va ? 'Japanese' : 'N/A'}</span>
                  </div>
                  <img
                    src={vaImg}
                    alt={va?.person?.name || 'Unknown VA'}
                    className="char-avatar"
                    loading="lazy"
                    onError={(e) => { e.target.src = PLACEHOLDER_PERSON }}
                    onClick={() => onImageClick && onImageClick('va', index)}
                    style={{ cursor: 'zoom-in' }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
