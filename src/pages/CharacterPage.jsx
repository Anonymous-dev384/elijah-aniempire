import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import Lightbox from '../components/Lightbox'
import { getCharacterInfo, getCharacterAnime, decodeId, generateDetailUrl } from '../services/api'
import AnimeCard from '../components/AnimeCard'
import { IconHeart, IconChevronLeft, IconChevronRight } from '../components/Icons'
import NotFoundPage from './NotFoundPage'

export default function CharacterPage() {
  const { id } = useParams()
  const [character, setCharacter] = useState(null)
  const [animeWorks, setAnimeWorks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [descExpanded, setDescExpanded] = useState(false)
  const [lbState, setLbState] = useState({ open: false, images: [], index: 0 })

  const openLightbox = (images, index = 0) => {
    setLbState({ open: true, images, index })
  }

  useEffect(() => {
    if (!id) return;
    
    const loadData = async () => {
      setLoading(true)
      setError(null)
      try {
        const malId = isNaN(id) ? decodeId(id) : id;
        const [info, anime] = await Promise.all([
          getCharacterInfo(malId),
          getCharacterAnime(malId)
        ])
        
        if (!info) {
          setError('Character not found')
          setLoading(false)
          return
        }

        setCharacter(info)
        setAnimeWorks(anime || [])
        document.title = `${info.name || 'Character'} — AniEmpire`
      } catch (err) {
        console.error(err)
        setError('Failed to load data')
      }
      setLoading(false)
    }
    loadData()
  }, [id])

  if (loading) return <CharacterSkeleton />
  if (error === 'Character not found') return <NotFoundPage />
  if (error) return <div className="detail-error">{error}</div>
  if (!character) return null

  const title = character.name || 'Unknown'
  const kanji = character.name_kanji || null
  const about = character.about || 'No biography available.'

  // Map works to AnimeCard format
  const mappedAnime = animeWorks.map(a => ({
    id: a.anime.mal_id,
    title: a.anime.title,
    coverImage: a.anime.images?.webp?.large_image_url || a.anime.images?.jpg?.large_image_url || '',
    status: a.role, // Display role
    score: 'N/A'
  })).filter((v, i, arr) => arr.findIndex(t => t.id === v.id) === i)

  const voiceImages = (character.voices || []).map(v => v.person?.images?.jpg?.image_url).filter(Boolean)

  return (
    <div className="detail-page anim-fade-up">
      {/* Mini Hero */}
      <div className="producer-hero" style={{ padding: '80px 28px 40px', background: 'linear-gradient(to bottom, rgba(212, 168, 67, 0.1), var(--bg-primary))', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="producer-hero-content" style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 32, alignItems: 'flex-start' }}>
          {character.images?.jpg?.image_url && (
            <img 
              src={character.images.jpg.image_url} 
              alt={title}
              onClick={() => openLightbox([character.images.jpg.image_url])}
              style={{ width: 180, borderRadius: 'var(--radius-lg)', border: '2px solid var(--border-hover)', background: 'var(--bg-card)', cursor: 'zoom-in' }}
            />
          )}
          <div className="producer-hero-info" style={{ flex: 1 }}>
            <h1 className="dh-title" style={{ marginBottom: 8 }}>{title}</h1>
            {kanji && <h2 style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginBottom: 16 }}>{kanji}</h2>}
            
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
              {character.favorites > 0 && <span className="tag" style={{ gap: 6 }}><IconHeart size={14} /> {character.favorites.toLocaleString()} Favorites</span>}
            </div>

            <p className={`detail-synopsis ${descExpanded || about.length <= 300 ? 'expanded' : ''}`} style={{ maxWidth: 900, marginBottom: 0 }}>
              {about}
            </p>
            {about.length > 300 && (
              <button className="synopsis-toggle" onClick={() => setDescExpanded(!descExpanded)} style={{ background: 'none', border: 'none', padding: 0 }}>
                {descExpanded ? '− Show Less' : '+ Read More'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="section" style={{ maxWidth: 1200, margin: '0 auto' }}>
        {mappedAnime.length > 0 && (
          <div style={{ marginBottom: 48 }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: 24, color: 'var(--text-primary)' }}>Anime Appearances</h3>
            <div className="anime-grid">
              {mappedAnime.map((work, idx) => (
                <AnimeCard key={`${work.id}-${idx}`} item={work} type="anime" />
              ))}
            </div>
          </div>
        )}

        {character.voices?.length > 0 && (
          <div style={{ marginBottom: 48 }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: 24, color: 'var(--text-primary)' }}>Voice Actors</h3>
            <div className="anime-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
              {character.voices.map((v, idx) => (
                <div key={idx} className="char-card" style={{ background: 'var(--bg-card)', padding: 12, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', display: 'flex', gap: 12, alignItems: 'center' }}>
                  <img 
                    src={v.person.images.jpg.image_url} 
                    alt={v.person.name} 
                    onClick={() => openLightbox(voiceImages, idx)}
                    style={{ width: 50, height: 50, borderRadius: '50%', objectFit: 'cover', cursor: 'zoom-in', border: '2px solid var(--border-subtle)', transition: 'all 0.2s' }}
                    onMouseOver={(e) => { e.target.style.borderColor = 'var(--gold)'; e.target.style.transform = 'scale(1.08)' }}
                    onMouseOut={(e) => { e.target.style.borderColor = 'var(--border-subtle)'; e.target.style.transform = 'none' }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <Link to={generateDetailUrl('person', v.person.name, v.person.mal_id)} className="hover-link" style={{ fontWeight: 700, fontSize: '0.9rem' }}>{v.person.name}</Link>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{v.language}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Lightbox
        isOpen={lbState.open}
        images={lbState.images}
        initialIndex={lbState.index}
        onClose={() => setLbState(prev => ({ ...prev, open: false }))}
      />
    </div>
  )
}

function CharacterSkeleton() {
  return (
    <div className="detail-page">
      <div className="producer-hero" style={{ padding: '80px 28px 40px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 32 }}>
          <div className="skeleton-line" style={{ width: 160, height: 160, borderRadius: 'var(--radius-md)' }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton-line skeleton-title" style={{ width: '40%', height: 32, marginBottom: 16 }} />
            <div className="skeleton-line" style={{ width: '20%', height: 20, marginBottom: 24 }} />
            <div className="skeleton-line" style={{ width: '100%', height: 14, marginBottom: 8 }} />
          </div>
        </div>
      </div>
    </div>
  )
}
