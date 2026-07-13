import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import DetailHero from '../components/DetailHero'
import DetailInfo from '../components/DetailInfo'
import CharacterSection from '../components/CharacterSection'
import EpisodeSection from '../components/EpisodeSection'
import AiringCountdown from '../components/AiringCountdown'
import ThemesSection from '../components/ThemesSection'
import NotFoundPage from './NotFoundPage'
import AnimeCard from '../components/AnimeCard'
import { IconStar, IconPlay, IconChevronLeft, IconChevronRight } from '../components/Icons'
import Lightbox from '../components/Lightbox'
import {
  parseDetailSlug,
  getAnimeDetail,
  getAnimeCharacters,
  getAnimeDetailRecommendations,
  getAnimePictures,
  getAnimeThemes,
  getAnimeStaff,
  generateDetailUrl,
  encodeId,
  slugify,
  formatCount
} from '../services/api'

export default function AnimeDetailPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const malId = parseDetailSlug(slug)

  const [data, setData] = useState(null)
  const [characters, setCharacters] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [pictures, setPictures] = useState([])
  const [themes, setThemes] = useState(null)
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [synopsisExpanded, setSynopsisExpanded] = useState(false)
  const [expandedRelations, setExpandedRelations] = useState(false)
  const [expandedItems, setExpandedItems] = useState({}) // { categoryIndex: boolean }
  const [galleryExpanded, setGalleryExpanded] = useState(false)
  const [lbState, setLbState] = useState({ open: false, images: [], index: 0 })
  const episodesRef = useRef(null)



  const openLightbox = (images, index = 0) => {
    setLbState({ open: true, images, index })
  }

  const getSeasonLink = (season, year) => {
    if (!season || !year) return `/browse/anime`;
    return `/browse/anime?cat=seasonal_archive&season=${season.toLowerCase()}&year=${year}`;
  }

  useEffect(() => {
    if (!malId) { setError('Invalid URL'); setLoading(false); return }

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const detail = await getAnimeDetail(malId)
        if (!detail) {
          setError('Anime not found')
          setLoading(false)
          return
        }

        // Robust ID-based validation
        const urlMalId = parseDetailSlug(slug);
        if (String(urlMalId) !== String(malId)) {
          console.log(`[AnimeDetail] ID mismatch. Got: ${urlMalId}, Expected: ${malId}`);
          setError('Anime not found.')
          setLoading(false)
          return
        }

        setData(detail)
        document.title = `${detail.title_english || detail.title || 'Anime'} — AniEmpire`

        // Redirect to canonical URL if we are using a raw slug or the wrong title slug
        const canonicalSlug = detail.title_english ? `${slugify(detail.title_english)}.${encodeId(detail.mal_id)}` : `${slugify(detail.title)}.${encodeId(detail.mal_id)}`
        if (slug !== canonicalSlug) {
           navigate(`/anime/${canonicalSlug}`, { replace: true })
        }

        // Parallel secondary fetches
        const [chars, recs, pics, themesData, staffData] = await Promise.allSettled([
          getAnimeCharacters(malId),
          getAnimeDetailRecommendations(malId),
          getAnimePictures(malId),
          getAnimeThemes(malId),
          getAnimeStaff(malId)
        ])
        if (chars.status === 'fulfilled') setCharacters(chars.value)
        if (recs.status === 'fulfilled') setRecommendations(recs.value)
        if (pics.status === 'fulfilled') setPictures(pics.value)
        if (themesData.status === 'fulfilled') setThemes(themesData.value)
        if (staffData.status === 'fulfilled') setStaff(staffData.value)
      } catch (err) {
        console.error('[AnimeDetail Error]:', err)
        if (err.message?.includes('404')) {
          setError('Anime not found.')
        } else {
          setError('Failed to load anime details.')
        }
      }
      setLoading(false)
    }
    load()
  }, [malId, slug])

  if (loading) return <DetailSkeleton />
  if (error === 'Anime not found.') return <NotFoundPage />
  if (error) return <div className="detail-error"><p>{error}</p><Link to="/browse/anime" className="btn btn-primary">Back to Browse</Link></div>
  if (!data) return null

  const synopsis = data.synopsis || 'No synopsis available.'
  const background = data.background || ''
  const trailerUrl = data.trailer?.embed_url?.replace('autoplay=1', 'autoplay=0') || null

  const renderLinks = (items, type) => {
    if (!items || !items.length) return null;
    return items.map((item, i) => (
      <span key={item.mal_id || i}>
        <Link to={generateDetailUrl(type, item.name, item)} className="hover-link" onClick={e => e.stopPropagation()}>{item.name}</Link>
        {i < items.length - 1 ? ', ' : ''}
      </span>
    ));
  };

  const directors = staff.filter(s => s.positions.includes('Director')).map(s => s.person)
  const creators = staff.filter(s => s.positions.includes('Original Creator')).map(s => s.person)
  const charDesigners = staff.filter(s => s.positions.includes('Character Design')).map(s => s.person)

  const infoFields = [
    { label: 'Type', value: data.type },
    { label: 'Source', value: data.source },
    { label: 'Episodes', value: data.episodes || '?' },
    { label: 'Status', value: data.status },
    { label: 'Aired', value: data.aired?.string || '' },
    { label: 'Broadcast', value: data.broadcast?.string || '' },
    { label: 'Duration', value: data.duration },
    { label: 'Rating', value: data.rating },
    { label: 'Score', value: data.score ? `${data.score} (${(data.scored_by || 0).toLocaleString()} users)` : 'N/A' },
    { label: 'Rank', value: data.rank ? `#${data.rank}` : '' },
    {label: 'Popularity', value: data.popularity ? `#${data.popularity}` : '' },
    { label: 'Members', value: formatCount(data.members) },
    { label: 'Favorites', value: formatCount(data.favorites) },
    { label: 'Studios', value: renderLinks(data.studios, 'producer') },
    { label: 'Producers', value: renderLinks(data.producers, 'producer') },
    { label: 'Licensors', value: renderLinks(data.licensors, 'producer') },
    { label: 'Directors', value: renderLinks(directors, 'person') },
    { label: 'Original Creator', value: renderLinks(creators, 'person') },
    { label: 'Character Design', value: renderLinks(charDesigners, 'person') },
    { label: 'Season', value: data.season ? <Link to={getSeasonLink(data.season, data.year)} className="hover-link">{data.season.charAt(0).toUpperCase() + data.season.slice(1)} {data.year || ''}</Link> : '' }
  ]

  const watchSlug = data.title_english ? `${slugify(data.title_english)}.${encodeId(data.mal_id)}` : `${slugify(data.title)}.${encodeId(data.mal_id)}`

  return (
    <div className="detail-page anim-fade-up">
      <DetailHero 
        data={data} 
        onWatchClick={() => navigate(`/watch/${watchSlug}?ep=1`)} 
        onPosterClick={() => {
          const poster = data.images?.webp?.large_image_url || data.images?.jpg?.large_image_url;
          const banner = data.anilistBanner || (data.trailer?.youtube_id ? `https://img.youtube.com/vi/${data.trailer.youtube_id}/maxresdefault.jpg` : poster);
          openLightbox([poster, banner], 0);
        }}
        onBannerClick={(currentBanner) => {
          const poster = data.images?.webp?.large_image_url || data.images?.jpg?.large_image_url;
          // Use the banner URL provided by the hero (which handles fallback logic)
          const banner = currentBanner || data.anilistBanner || (data.trailer?.youtube_id ? `https://img.youtube.com/vi/${data.trailer.youtube_id}/maxresdefault.jpg` : poster);
          openLightbox([banner, poster], 0);
        }}
      />

      <div className="detail-body">
        <div className="detail-main">
          {/* Synopsis */}
          <section className="detail-section">
            <h3 className="detail-section-title">Synopsis</h3>
            <p className={`detail-synopsis ${synopsisExpanded || synopsis.length <= 300 ? 'expanded' : ''}`}>
              {synopsis}
            </p>
            {synopsis.length > 300 && (
              <button className="synopsis-toggle" onClick={() => setSynopsisExpanded(!synopsisExpanded)}>
                {synopsisExpanded ? '− Show Less' : '+ Read More'}
              </button>
            )}
          </section>

          {/* Streaming Platforms */}
          {data.streaming && data.streaming.length > 0 && (
            <section className="detail-section">
              <h3 className="detail-section-title">Where to Watch</h3>
              <div className="streaming-grid">
                {data.streaming.map((site, idx) => (
                  <a key={idx} href={site.url} target="_blank" rel="noopener noreferrer" className="streaming-link">
                    <IconPlay size={14} /> {site.name}
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* Related Content */}
          {data.relations && data.relations.length > 0 && (
            <section className="detail-section">
              <h3 className="detail-section-title">Related Content</h3>
              <div className="relations-list">
                {data.relations.slice(0, expandedRelations ? undefined : 3).map((rel, idx) => {
                  const items = rel.entry || [];
                  const isExpanded = expandedItems[idx];
                  const visibleItems = isExpanded ? items : items.slice(0, 10);

                  return (
                    <div key={rel.relation} className="relation-stack">
                      <h4 className="relation-stack-title">{rel.relation}</h4>
                      <div className="relation-stack-grid">
                        {visibleItems.map(ent => (
                          <Link
                            key={ent.mal_id}
                            to={generateDetailUrl(ent.type, ent.name, ent)}
                            className="relation-link"
                            title={ent.name}
                          >
                            {ent.name}
                          </Link>
                        ))}
                        {!isExpanded && items.length > 10 && (
                          <button 
                            className="relation-link-more"
                            onClick={() => setExpandedItems(prev => ({ ...prev, [idx]: true }))}
                          >
                            + {items.length - 10} more
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {data.relations.length > 3 && (
                  <button 
                    className="btn-show-more" 
                    onClick={() => setExpandedRelations(!expandedRelations)}
                  >
                    {expandedRelations ? '− Show Less Categories' : `+ Show ${data.relations.length - 3} More Categories`}
                  </button>
                )}
              </div>
            </section>
          )}

          {/* Background */}
          {background && (
            <section className="detail-section">
              <h3 className="detail-section-title">Background</h3>
              <p className="detail-synopsis expanded" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {background}
              </p>
            </section>
          )}

          {/* Trailer */}
          {trailerUrl && (
            <section className="detail-section">
              <h3 className="detail-section-title">Trailer</h3>
              <div className="detail-trailer">
                <iframe
                  src={trailerUrl}
                  title="Trailer"
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </section>
          )}

          {/* Episodes */}
          <div ref={episodesRef}>
            <EpisodeSection malId={malId} totalEpisodes={data.episodes} watchSlug={watchSlug} />
          </div>

          {/* Themes / Music */}
          <ThemesSection themesData={themes} animeData={data} />

          {/* Characters */}
          <CharacterSection 
            characters={characters} 
            onImageClick={(type, index) => {
              const sortedChars = [...characters].sort((a, b) => {
                if (a.role === 'Main' && b.role !== 'Main') return -1
                if (a.role !== 'Main' && b.role === 'Main') return 1
                return (b.favorites || 0) - (a.favorites || 0)
              })
              if (type === 'char') {
                const imgs = sortedChars.map(c => c.character?.images?.webp?.image_url || c.character?.images?.jpg?.image_url)
                openLightbox(imgs, index)
              } else {
                const imgs = sortedChars.map(c => (c.voice_actors || []).find(v => v.language === 'Japanese')?.person?.images?.jpg?.image_url).filter(Boolean)
                const vaAtIdx = sortedChars[index].voice_actors?.find(v => v.language === 'Japanese')?.person?.images?.jpg?.image_url
                const vaIndex = imgs.indexOf(vaAtIdx)
                openLightbox(imgs, vaIndex >= 0 ? vaIndex : 0)
              }
            }}
          />

          {/* Recommendations */}
          {(data.recommendations?.length > 0 || recommendations.length > 0) && (
            <section className="detail-section">
              <h3 className="detail-section-title">Recommendations</h3>
              <div className="anime-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
                {(data.recommendations || recommendations).map(rec => (
                  <AnimeCard key={rec.id} item={{ ...rec, type: 'anime' }} />
                ))}
              </div>
            </section>
          )}

          {/* Pictures */}
          {pictures.length > 0 && (
            <section className="detail-section">
              <h3 className="detail-section-title">Gallery</h3>
              <div className="gallery-grid">
                {(galleryExpanded ? pictures : pictures.slice(0, 10)).map((pic, i) => (
                  <div key={i} className="gallery-item" onClick={() => openLightbox(pictures, i)}>
                    <img src={pic} alt={`Gallery ${i + 1}`} loading="lazy" />
                  </div>
                ))}
              </div>
              {pictures.length > 10 && (
                <button 
                  className="btn-show-more" 
                  style={{ marginTop: 16 }}
                  onClick={() => setGalleryExpanded(!galleryExpanded)}
                >
                  {galleryExpanded ? '− Show Less' : `+ Show All (${pictures.length} images)`}
                </button>
              )}
            </section>
          )}
        </div>

        {/* Sidebar */}
        <aside className="detail-sidebar">
          {/* Airing Countdown */}
          {data.nextAiringEpisode && <AiringCountdown airingData={data.nextAiringEpisode} />}
          
          <DetailInfo fields={infoFields} />
        </aside>
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

function DetailSkeleton() {
  return (
    <div className="detail-page">
      <div className="dh-skeleton-banner" />
      <div className="detail-body" style={{ padding: '40px 28px' }}>
        <div className="detail-main">
          <div className="skeleton-line skeleton-title" style={{ width: '60%', height: 24, marginBottom: 16 }} />
          <div className="skeleton-line" style={{ width: '100%', height: 14, marginBottom: 8 }} />
          <div className="skeleton-line" style={{ width: '90%', height: 14, marginBottom: 8 }} />
          <div className="skeleton-line" style={{ width: '75%', height: 14, marginBottom: 8 }} />
          <div className="skeleton-line" style={{ width: '85%', height: 14 }} />
        </div>
        <aside className="detail-sidebar">
          <div className="skeleton-line" style={{ width: '100%', height: 300, borderRadius: 14 }} />
        </aside>
      </div>
    </div>
  )
}
