import React, { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import Lightbox from '../components/Lightbox'
import { getArtistInfo, getBatchAnimeThemesMeta, generateDetailUrl, parseDetailSlug, encodeId, decodeId, slugify } from '../services/api'
import { IconChevronLeft, IconChevronRight, IconPlay, IconPlus, IconCheck } from '../components/Icons'
import { useMusic } from '../context/MusicContext'
import NotFoundPage from './NotFoundPage'

export default function ArtistPage() {
  const { id } = useParams()
  const [artist, setArtist] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lbState, setLbState] = useState({ open: false, images: [], index: 0 })
  const { playTrack, addToPlaylist, playlist, setIsMinimized } = useMusic()



  const openLightbox = (images, index = 0) => {
    setLbState({ open: true, images, index })
  }

  useEffect(() => {
    if (!id) return;
    
    const loadData = async () => {
      setLoading(true)
      setError(null)
      try {
        // The URL param is typically a slug (e.g. "lisa", "bump-of-chicken").
        let artistIdentifier = id;
        
        // Only try Base62 decoding if it looks like an encoded ID (short alphanumeric, no hyphens)
        // and contains numbers or uppercase letters (since slugs are strictly lowercase and alphabetic)
        const isStrictlySlug = /^[a-z]+$/.test(id);
        if (!isStrictlySlug && /^[0-9a-zA-Z]{1,5}$/.test(id) && !id.includes('-')) {
            const decoded = decodeId(id);
            if (decoded > 0 && encodeId(decoded) === id) {
                // It's a valid Base62 encoded ID - pass the decoded number
                artistIdentifier = decoded;
            }
        }
        
        let info = await getArtistInfo(artistIdentifier)

        if (!info) {
          setError('Artist not found')
          setLoading(false)
          return
        }

        // Post-process: If the API gracefully degraded (dropped resources/images to avoid 422),
        // we can fetch them separately for the unique anime to keep links clean and images accurate.
        if (info.songs) {
          const uniqueSlugs = new Set();
          info.songs.forEach(s => s.animethemes?.forEach(at => {
            if (at.anime && (!at.anime.resources || !at.anime.images)) {
              uniqueSlugs.add(at.anime.slug);
            }
          }));

          if (uniqueSlugs.size > 0) {
            try {
              const batchMeta = await getBatchAnimeThemesMeta(Array.from(uniqueSlugs));
              const metaMap = {};
              batchMeta.forEach(item => {
                if (item && item.slug) {
                  metaMap[item.slug] = {
                    resources: item.resources,
                    images: item.images
                  };
                }
              });
              
              info.songs.forEach(s => s.animethemes?.forEach(at => {
                if (at.anime && metaMap[at.anime.slug]) {
                  if (!at.anime.resources) at.anime.resources = metaMap[at.anime.slug].resources;
                  if (!at.anime.images) at.anime.images = metaMap[at.anime.slug].images;
                }
              }));
            } catch (e) {
              console.error('[ArtistPage] Error fetching batch themes metadata:', e);
            }
          }
        }

        setArtist(info)
        document.title = `${info.name || 'Artist'} — AniEmpire`
      } catch (err) {
        console.error(err)
        setError('Failed to load data')
      }
      setLoading(false)
    }

    loadData()
  }, [id])

  if (loading) return <ArtistSkeleton />
  if (error === 'Artist not found') return <NotFoundPage />
  if (error) return <div className="detail-error">{error}</div>
  if (!artist) return null

  const title = artist.name || 'Unknown'
  const images = artist.images || []
  const avatar = images.find(img => img.facet === 'portrait')?.link || images[0]?.link || ''
  const cover = images.find(img => img.facet === 'Large Cover')?.link || images.find(img => img.facet === 'banner')?.link || ''
  
  const songs = artist.songs || []
  const allDiscographyImages = songs.flatMap(song => 
    (song.animethemes || []).map(at => 
      at.anime?.images?.find(img => img.facet === 'Large Cover' || img.facet === 'Small Cover')?.link 
      || avatar 
      || 'https://images.unsplash.com/photo-1618331835717-801e976710b2?q=80&w=200&auto=format&fit=crop'
    )
  );

  return (
    <div className="detail-page anim-fade-up">
      {/* Mini Hero (Matches Person/Producer style exactly) */}
      <div className="producer-hero" style={{ padding: '80px 28px 40px', background: 'linear-gradient(to bottom, rgba(212, 168, 67, 0.1), var(--bg-primary))', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="producer-hero-content" style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 32, alignItems: 'flex-start' }}>
          {avatar && (
            <img 
              src={avatar} 
              alt={title}
              onClick={() => openLightbox([avatar])}
              style={{ width: 160, height: 160, borderRadius: 'var(--radius-md)', objectFit: 'cover', border: '2px solid var(--border-hover)', background: 'var(--bg-card)', cursor: 'zoom-in' }}
            />
          )}
          <div className="producer-hero-info" style={{ flex: 1 }}>
            <h1 className="dh-title" style={{ marginBottom: 8, lineHeight: 1.2 }}>{title}</h1>
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
               <span className="tag" style={{ background: 'rgba(212, 168, 67, 0.1)', color: 'var(--gold)', border: '1px solid rgba(212, 168, 67, 0.3)' }}>Musical Artist</span>
               {artist.slug && <span className="tag">@{artist.slug}</span>}
            </div>
            
            <div style={{ display: 'flex', gap: 32 }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>{songs.length}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Themes</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="section" style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 28px' }}>
        <div className="artist-grid-header" style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: 8 }}>Discography</h2>
          <div className="section-divider" />
        </div>
        
        <div className="artist-songs-grid">
          {songs.map((song, songIdx) => {
            const songStartIndex = songs.slice(0, songIdx).reduce((acc, s) => acc + (s.animethemes?.length || 0), 0);
            return (
              <div key={songIdx} className="artist-song-card">
                <div className="song-card__header">
                <h3 className="song-card__title">{song.title}</h3>
                <div className="song-card__icon">
                   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
                </div>
              </div>
              
              <div className="song-card__themes">
                {song.animethemes?.map((at, atIdx) => {
                  const inPlaylist = playlist.some(item => item.theme.id === at.id)
                  
                  // Extract correct media links
                  const firstEntry = at.animethemeentries?.[0];
                  const firstVideo = firstEntry?.videos?.[0];
                  const videoLink = firstVideo?.link || null;
                  const audioLink = firstVideo?.audio?.link || null;
                  
                  // Anime Image
                  const animeImage = at.anime?.images?.find(img => img.facet === 'Large Cover' || img.facet === 'Small Cover')?.link 
                                    || avatar 
                                    || 'https://images.unsplash.com/photo-1618331835717-801e976710b2?q=80&w=200&auto=format&fit=crop';

                  // Normalized theme for player
                  const normalizedTheme = {
                    ...at,
                    songTitle: song.title,
                    artists: title,
                    artistsData: [{ name: title, slug: artist.slug, id: artist.id }],
                    audio: audioLink ? { link: audioLink } : null,
                    video: videoLink ? { link: videoLink } : null
                  };
                  const malResource = at.anime?.resources?.find(r => r.site === 'MyAnimeList');
                  const explicitMalId = malResource ? malResource.external_id : null;
                  const finalMalId = explicitMalId || at.anime?.slug || 0;

                  const animeEntry = {
                    name: at.anime?.name || 'Unknown Anime',
                    malId: finalMalId,
                    slug: at.anime?.slug || '',
                    coverImage: animeImage
                  }

                  return (
                    <div key={atIdx} className="song-theme-item" style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(0, 0, 0, 0.2)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.03)' }}>
                       <div className="theme-item__info" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                         <img 
                           src={animeImage} 
                           alt={at.anime?.name} 
                           onClick={() => openLightbox(allDiscographyImages, songStartIndex + atIdx)}
                           style={{ width: '40px', height: '56px', borderRadius: '4px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.08)', flexShrink: 0, cursor: 'zoom-in' }} 
                         />
                         <div style={{ flex: 1, minWidth: 0 }}>
                           <div className="theme-badge-row" style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '4px' }}>
                             <div className={`theme-type-badge type-${at.type.toLowerCase()}`} style={{ fontSize: '0.65rem', padding: '2px 6px', fontWeight: 'bold' }}>{at.type}{at.sequence || ''}</div>
                           </div>
                           <Link to={generateDetailUrl('anime', at.anime?.name || 'Anime', finalMalId)} className="theme-anime-link" style={{ fontSize: '0.85rem', fontWeight: '700', color: '#fff', textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {at.anime?.name || 'Unknown Anime'}
                           </Link>
                         </div>
                       </div>

                       <div className="theme-actions" style={{ display: 'flex', gap: '6px' }}>
                          {audioLink && (
                            <button 
                              onClick={() => { setIsMinimized(true); playTrack(animeEntry, normalizedTheme, 'audio'); }}
                              className="action-btn play-btn"
                              title="Play Audio"
                              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '6px 8px', fontSize: '0.75rem', borderRadius: '6px', background: 'rgba(212, 168, 67, 0.1)', color: 'var(--gold)', border: '1px solid rgba(212, 168, 67, 0.25)', cursor: 'pointer' }}
                            >
                              <IconPlay size={10} /> <span>Audio</span>
                            </button>
                          )}
                          {videoLink && (
                            <button 
                              onClick={() => { setIsMinimized(true); playTrack(animeEntry, normalizedTheme, 'video'); }}
                              className="action-btn play-btn"
                              title="Play Video"
                              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '6px 8px', fontSize: '0.75rem', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}
                            >
                              <IconPlay size={10} /> <span>Video</span>
                            </button>
                          )}
                          <button 
                            onClick={() => { if (!inPlaylist) addToPlaylist(animeEntry, normalizedTheme) }}
                            className={`action-btn queue-btn ${inPlaylist ? 'active' : ''}`}
                            disabled={inPlaylist}
                            title={inPlaylist ? "In Queue" : "Add to Queue"}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px 10px', borderRadius: '6px', background: inPlaylist ? 'rgba(212,168,67,0.15)' : 'rgba(255,255,255,0.02)', color: inPlaylist ? 'var(--gold)' : '#fff', border: inPlaylist ? '1px solid rgba(212,168,67,0.3)' : '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}
                          >
                            {inPlaylist ? <IconCheck size={10} /> : <IconPlus size={10} />}
                          </button>
                       </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
        
        {songs.length === 0 && (
          <div className="artist-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
            <p>No recorded themes found for this artist.</p>
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

function ArtistSkeleton() {
  return (
    <div className="detail-page anim-fade-up">
      <div className="producer-hero" style={{ padding: '80px 28px 40px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 32 }}>
          <div className="skeleton-line" style={{ width: 160, height: 160, borderRadius: 'var(--radius-md)' }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton-line skeleton-title" style={{ width: '40%', height: 32, marginBottom: 16 }} />
            <div className="skeleton-line" style={{ width: '20%', height: 20, marginBottom: 24 }} />
            <div className="skeleton-line" style={{ width: '100%', height: 14, marginBottom: 8 }} />
            <div className="skeleton-line" style={{ width: '90%', height: 14, marginBottom: 8 }} />
            <div className="skeleton-line" style={{ width: '75%', height: 14 }} />
          </div>
        </div>
      </div>
      <div className="section" style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 28px' }}>
        <div className="skeleton-line" style={{ width: 200, height: 24, marginBottom: 32 }} />
        <div className="artist-songs-grid">
           {Array.from({ length: 6 }).map((_, i) => (
             <div key={i} className="artist-song-card" style={{ height: 200 }}>
               <div className="skeleton-line" style={{ width: '70%', height: 24, marginBottom: 20 }} />
               <div className="skeleton-line" style={{ width: '100%', height: 80, borderRadius: 12 }} />
             </div>
           ))}
        </div>
      </div>
    </div>
  )
}
