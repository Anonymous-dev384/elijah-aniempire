import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import DetailHero from '../components/DetailHero'
import DetailInfo from '../components/DetailInfo'
import CharacterSection from '../components/CharacterSection'
import ChapterSection from '../components/ChapterSection'
import NotFoundPage from './NotFoundPage'
import AnimeCard from '../components/AnimeCard'
import { IconStar, IconChevronLeft, IconChevronRight } from '../components/Icons'
import Lightbox from '../components/Lightbox'
import {
  parseDetailSlug,
  getMangaDetail,
  getMangaCharacters,
  getMangaDetailRecommendations,
  getMangaPictures,
  generateDetailUrl,
  fetchAnilistMediaData,
  formatCount,
  encodeId,
  slugify
} from '../services/api'

export default function MangaDetailPage() {
  const navigate = useNavigate()
  const { slug } = useParams()
  const malId = parseDetailSlug(slug)

  const [data, setData] = useState(null)
  const [characters, setCharacters] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [pictures, setPictures] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [synopsisExpanded, setSynopsisExpanded] = useState(false)
  const [expandedRelations, setExpandedRelations] = useState(false)
  const [expandedItems, setExpandedItems] = useState({}) // { categoryIndex: boolean }
  const [galleryExpanded, setGalleryExpanded] = useState(false)
  const [lbState, setLbState] = useState({ open: false, images: [], index: 0 })
  const chaptersRef = useRef(null)


  const openLightbox = (images, index = 0) => {
    setLbState({ open: true, images, index })
  }

  useEffect(() => {
    if (!malId) { setError('Invalid URL'); setLoading(false); return }

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const detail = await getMangaDetail(malId)
        if (!detail || !detail.mal_id) {
          setError('Manga not found.')
          setLoading(false)
          return
        }

        // Strict Canonical Slug Validation (Allow English or Romaji)
        const slugEng = detail.title_english ? `${slugify(detail.title_english)}.${encodeId(malId)}` : null
        const slugRom = detail.title ? `${slugify(detail.title)}.${encodeId(malId)}` : null
        
        if (slug !== slugEng && slug !== slugRom) {
          console.log(`[MangaDetail] Slug mismatch (Strict 404). Got: ${slug}, Expected one of:`, { slugEng, slugRom });
          setError('Manga not found.')
          setLoading(false)
          return
        }

        setData(detail)
        document.title = `${detail.title_english || detail.title || 'Manga'} — AniEmpire`

        const [chars, recs, pics, anilist] = await Promise.allSettled([
          getMangaCharacters(malId),
          getMangaDetailRecommendations(malId),
          getMangaPictures(malId),
          fetchAnilistMediaData(malId, 'MANGA')
        ])
        if (chars.status === 'fulfilled') setCharacters(chars.value)
        if (recs.status === 'fulfilled') setRecommendations(recs.value)
        if (pics.status === 'fulfilled') setPictures(pics.value)
        
        // Inject Anilist Data (Banner + Ongoing Chapters count)
        if (anilist.status === 'fulfilled' && anilist.value) {
          setData(prev => ({
            ...prev,
            anilistBanner: anilist.value.bannerImage || null,
            chapters: prev.chapters || anilist.value.chapters || null
          }))
        }
      } catch (err) {
        console.error('[MangaDetail Error]:', err)
        if (err.message?.includes('404')) {
          setError('Manga not found.')
        } else {
          setError('Failed to load manga details.')
        }
      }
      setLoading(false)
    }
    load()
  }, [malId, slug])

  if (loading) return <MangaDetailSkeleton />
  if (error === 'Manga not found.') return <NotFoundPage />
  if (error) return <div className="detail-error"><p>{error}</p><Link to="/browse/manga" className="btn btn-primary">Back to Browse</Link></div>
  if (!data) return null

  const synopsis = data.synopsis || 'No synopsis available.'
  const background = data.background || ''

  const serializations = (data.serializations || []).map(s => s.name).join(', ')

  const renderLinks = (items, type) => {
    if (!items || !items.length) return null;
    return items.map((item, i) => (
      <span key={item.mal_id || i}>
        <Link to={generateDetailUrl(type, item.name, item)} className="hover-link" onClick={e => e.stopPropagation()}>{item.name}</Link>
        {i < items.length - 1 ? ', ' : ''}
      </span>
    ));
  };

  const infoFields = [
    { label: 'Type', value: data.type },
    { label: 'Status', value: data.status },
    { label: 'Chapters', value: data.chapters || 'Unknown' },
    { label: 'Volumes', value: data.volumes || 'Unknown' },
    { label: 'Published', value: data.published?.string || '' },
    { label: 'Authors', value: renderLinks(data.authors, 'person') },
    { label: 'Serialization', value: serializations },
    { label: 'Score', value: data.score ? `${data.score} (${(data.scored_by || 0).toLocaleString()} users)` : 'N/A' },
    { label: 'Rank', value: data.rank ? `#${data.rank}` : '' },
    { label: 'Popularity', value: data.popularity ? `#${data.popularity}` : '' },
    { label: 'Members', value: formatCount(data.members) },
    { label: 'Favorites', value: formatCount(data.favorites) }
  ]

  return (
    <div className="detail-page anim-fade-up">
      <DetailHero 
        data={data} 
        type="manga" 
        onWatchClick={() => {
          const mangaSlug = data.title_english ? `${slugify(data.title_english)}.${encodeId(data.mal_id)}` : `${slugify(data.title)}.${encodeId(data.mal_id)}`
          navigate(`/manga/${mangaSlug}/read/1`)
        }} 
        onPosterClick={() => {
          const poster = data.images?.webp?.large_image_url || data.images?.jpg?.large_image_url;
          const banner = data.anilistBanner;
          const images = [poster].filter(Boolean);
          if (banner && banner !== poster) images.push(banner);
          openLightbox(images, 0);
        }}
        onBannerClick={(currentBanner) => {
          const poster = data.images?.webp?.large_image_url || data.images?.jpg?.large_image_url;
          const banner = currentBanner || data.anilistBanner;
          const images = [];
          if (banner) images.push(banner);
          if (poster && poster !== banner) images.push(poster);
          openLightbox(images, 0);
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

          {/* Background */}
          {background && (
            <section className="detail-section">
              <h3 className="detail-section-title">Background</h3>
              <p className="detail-synopsis expanded" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {background}
              </p>
            </section>
          )}

          {/* Chapters */}
          <div ref={chaptersRef}>
            <ChapterSection malId={malId} totalChapters={data.chapters} status={data.status} />
          </div>

          {/* External Links */}
          {data.external && data.external.length > 0 && (
            <section className="detail-section">
              <h3 className="detail-section-title">Official Links</h3>
              <div className="streaming-grid">
                {data.external.map((site, idx) => (
                  <a key={idx} href={site.url} target="_blank" rel="noopener noreferrer" className="streaming-link">
                    <IconStar size={14} /> {site.name}
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

          {/* Characters */}
          <CharacterSection 
            characters={data.characters || characters} 
            type="manga" 
            onImageClick={(type, index) => {
              const sortedChars = [...(data.characters || characters)].sort((a, b) => {
                if (a.role === 'Main' && b.role !== 'Main') return -1
                if (a.role !== 'Main' && b.role === 'Main') return 1
                return (b.favorites || 0) - (a.favorites || 0)
              })
              const imgs = sortedChars.map(c => c.character?.images?.webp?.image_url || c.character?.images?.jpg?.image_url)
              openLightbox(imgs, index)
            }}
          />

          {/* Recommendations */}
          {(data.recommendations?.length > 0 || recommendations.length > 0) && (
            <section className="detail-section">
              <h3 className="detail-section-title">Recommendations</h3>
              <div className="anime-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
                {(data.recommendations || recommendations).map(rec => (
                  <AnimeCard key={rec.id} item={{ ...rec, type: 'manga' }} type="manga" />
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

function MangaDetailSkeleton() {
  return (
    <div className="detail-page">
      <div className="dh-skeleton-banner" />
      <div className="detail-body" style={{ padding: '40px 28px' }}>
        <div className="detail-main">
          <div className="skeleton-line skeleton-title" style={{ width: '60%', height: 24, marginBottom: 16 }} />
          <div className="skeleton-line" style={{ width: '100%', height: 14, marginBottom: 8 }} />
          <div className="skeleton-line" style={{ width: '90%', height: 14, marginBottom: 8 }} />
          <div className="skeleton-line" style={{ width: '75%', height: 14 }} />
        </div>
        <aside className="detail-sidebar">
          <div className="skeleton-line" style={{ width: '100%', height: 300, borderRadius: 14 }} />
        </aside>
      </div>
    </div>
  )
}
