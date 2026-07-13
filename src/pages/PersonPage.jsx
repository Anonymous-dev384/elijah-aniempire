import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import Lightbox from '../components/Lightbox'
import { getPersonInfo, decodeId } from '../services/api'
import AnimeCard from '../components/AnimeCard'
import RoleCard from '../components/RoleCard'
import { IconHeart, IconCalendar, IconChevronLeft, IconChevronRight } from '../components/Icons'
import NotFoundPage from './NotFoundPage'

export default function PersonPage() {
  const { id } = useParams()
  const [person, setPerson] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [descExpanded, setDescExpanded] = useState(false)
  const [lbState, setLbState] = useState({ open: false, images: [], index: 0 })
  const [activeTab, setActiveTab] = useState('voices') // 'voices', 'staff', 'manga'
  
  const [searchQuery, setSearchQuery] = useState('')
  const [visibleVoices, setVisibleVoices] = useState(24)



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
        const info = await getPersonInfo(malId)
        if (!info) {
          setError('Person not found')
          setLoading(false)
          return
        }

        setPerson(info)
        document.title = `${info.name || 'Staff'} — AniEmpire`
      } catch (err) {
        console.error(err)
        setError('Failed to load data')
      }
      setLoading(false)
    }
    loadData()
  }, [id])

  useEffect(() => {
    if (!person) return;
    const hasVoices = person.voices?.length > 0;
    const hasStaff = person.anime?.length > 0;
    const hasManga = person.manga?.length > 0;
    
    if (activeTab === 'voices' && !hasVoices && hasStaff) setActiveTab('staff');
    if (activeTab === 'voices' && !hasVoices && !hasStaff && hasManga) setActiveTab('manga');
  }, [person, activeTab]);

  // Reset pagination on search
  useEffect(() => {
    setVisibleVoices(24);
  }, [searchQuery]);

  if (loading) return <PersonSkeleton />
  if (error === 'Person not found') return <NotFoundPage />
  if (error) return <div className="detail-error">{error}</div>
  if (!person) return null

  const title = person.name || 'Unknown'
  const altNames = person.alternate_names?.length > 0 ? person.alternate_names.join(', ') : null
  const birthday = person.birthday ? new Date(person.birthday).toLocaleDateString() : null
  const about = person.about || 'No biography available.'

  // Map works to AnimeCard format
  const mappedAnime = (person.anime || []).map(a => ({
    id: a.anime.mal_id,
    title: a.anime.title,
    coverImage: a.anime.images?.webp?.large_image_url || a.anime.images?.jpg?.large_image_url || '',
    status: a.position, // Display role in place of status
    score: 'N/A'
  })).filter((v, i, arr) => arr.findIndex(t => t.id === v.id) === i)

  // Map voices for RoleCard (do NOT filter out multiple characters in the same anime)
  const mappedVoices = (person.voices || []).map(v => ({
    anime: v.anime,
    character: v.character,
    role: v.role
  })).filter((v, i, arr) => arr.findIndex(t => t.anime.mal_id === v.anime.mal_id && t.character.mal_id === v.character.mal_id) === i)

  const mappedManga = (person.manga || []).map(m => ({
    id: m.manga.mal_id,
    title: m.manga.title,
    coverImage: m.manga.images?.webp?.large_image_url || m.manga.images?.jpg?.large_image_url || '',
    status: m.position,
    type: 'Manga',
    score: 'N/A'
  })).filter((v, i, arr) => arr.findIndex(t => t.id === v.id) === i)

  // Determine which tabs to show
  const hasVoices = mappedVoices.length > 0;
  const hasStaff = mappedAnime.length > 0;
  const hasManga = mappedManga.length > 0;

  // Search and Pagination for voices
  const filteredVoices = mappedVoices.filter(v => {
    const q = searchQuery.toLowerCase();
    const charMatch = v.character?.name?.toLowerCase().includes(q);
    const animeMatch = v.anime?.title?.toLowerCase().includes(q);
    return charMatch || animeMatch;
  });

  const displayedVoices = filteredVoices.slice(0, visibleVoices);

  return (
    <div className="detail-page anim-fade-up">
      {/* Mini Hero */}
      <div className="producer-hero" style={{ padding: '80px 28px 40px', background: 'linear-gradient(to bottom, rgba(212, 168, 67, 0.1), var(--bg-primary))', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="producer-hero-content" style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 32, alignItems: 'flex-start' }}>
          {person.images?.jpg?.image_url && (
            <img 
              src={person.images.jpg.image_url} 
              alt={title}
              onClick={() => openLightbox([person.images.jpg.image_url])}
              style={{ width: 180, borderRadius: 'var(--radius-lg)', border: '2px solid var(--border-hover)', background: 'var(--bg-card)', cursor: 'zoom-in' }}
            />
          )}
          <div className="producer-hero-info" style={{ flex: 1 }}>
            <h1 className="dh-title" style={{ marginBottom: 8 }}>{title}</h1>
            {altNames && <h2 style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: 16 }}>{altNames}</h2>}
            
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
              {birthday && <span className="tag" style={{ gap: 6 }}><IconCalendar size={14} /> {birthday}</span>}
              {person.favorites > 0 && <span className="tag" style={{ gap: 6 }}><IconHeart size={14} /> {person.favorites.toLocaleString()} Favorites</span>}
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

      <div className="section" style={{ maxWidth: 1200, margin: '0 auto', paddingTop: 16 }}>
        {/* Tabs Navigation */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 32, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16, overflowX: 'auto' }}>
          {hasVoices && (
            <button 
              onClick={() => setActiveTab('voices')}
              style={{
                background: 'none', border: 'none', padding: '8px 16px', fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                color: activeTab === 'voices' ? 'var(--gold)' : 'var(--text-muted)',
                borderBottom: activeTab === 'voices' ? '2px solid var(--gold)' : '2px solid transparent',
                transition: 'all 0.2s ease'
              }}
            >
              Voice Acting ({mappedVoices.length})
            </button>
          )}
          {hasStaff && (
            <button 
              onClick={() => setActiveTab('staff')}
              style={{
                background: 'none', border: 'none', padding: '8px 16px', fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                color: activeTab === 'staff' ? 'var(--gold)' : 'var(--text-muted)',
                borderBottom: activeTab === 'staff' ? '2px solid var(--gold)' : '2px solid transparent',
                transition: 'all 0.2s ease'
              }}
            >
              Staff Roles ({mappedAnime.length})
            </button>
          )}
          {hasManga && (
            <button 
              onClick={() => setActiveTab('manga')}
              style={{
                background: 'none', border: 'none', padding: '8px 16px', fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                color: activeTab === 'manga' ? 'var(--gold)' : 'var(--text-muted)',
                borderBottom: activeTab === 'manga' ? '2px solid var(--gold)' : '2px solid transparent',
                transition: 'all 0.2s ease'
              }}
            >
              Published Manga ({mappedManga.length})
            </button>
          )}
        </div>

        {/* Tab Content */}
        {activeTab === 'voices' && hasVoices && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
               <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', margin: 0 }}>Voice Acting Roles</h3>
               <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
                 <input 
                   type="text" 
                   placeholder="Search characters or anime..." 
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   style={{ 
                     width: '100%',
                     padding: '10px 16px 10px 40px', 
                     borderRadius: '24px', 
                     border: '1px solid var(--border-subtle)', 
                     background: 'var(--bg-card)', 
                     color: 'var(--text-primary)',
                     outline: 'none',
                     fontSize: '0.9rem'
                   }} 
                 />
                 <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>
                   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                 </div>
               </div>
            </div>
            
            {filteredVoices.length === 0 ? (
               <p style={{ color: 'var(--text-muted)' }}>No roles found matching "{searchQuery}"</p>
            ) : (
               <>
                 <div className="anime-grid">
                   {displayedVoices.map((work, idx) => (
                     <RoleCard 
                       key={`${work.anime.mal_id}-${work.character.mal_id}-${idx}`} 
                       roleItem={work} 
                       onImageClick={() => {
                         const allImages = displayedVoices.map(v => v.character?.images?.webp?.image_url || v.character?.images?.jpg?.image_url || '');
                         openLightbox(allImages, idx);
                       }}
                     />
                   ))}
                 </div>
                 {visibleVoices < filteredVoices.length && (
                   <div style={{ textAlign: 'center', marginTop: 32 }}>
                     <button onClick={() => setVisibleVoices(p => p + 24)} className="btn btn-secondary">
                       Load More ({filteredVoices.length - visibleVoices} remaining)
                     </button>
                   </div>
                 )}
               </>
            )}
          </div>
        )}

        {activeTab === 'staff' && hasStaff && (
          <div className="anime-grid">
            {mappedAnime.map((work, idx) => (
              <AnimeCard key={`${work.id}-${idx}`} item={work} type="anime" />
            ))}
          </div>
        )}

        {activeTab === 'manga' && hasManga && (
          <div className="anime-grid">
            {mappedManga.map((work, idx) => (
              <AnimeCard key={`${work.id}-${idx}`} item={work} type="manga" />
            ))}
          </div>
        )}

        {!hasVoices && !hasStaff && !hasManga && (
           <p style={{ color: 'var(--text-muted)' }}>No works found.</p>
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

function PersonSkeleton() {
  return (
    <div className="detail-page">
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
      <div className="section" style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div className="skeleton-line" style={{ width: 200, height: 24, marginBottom: 24 }} />
        <div className="anime-grid">
           {Array.from({ length: 12 }).map((_, i) => (
             <div key={i} className="skeleton-card">
               <div className="skeleton-poster" />
               <div className="skeleton-info">
                 <div className="skeleton-line skeleton-title" />
                 <div className="skeleton-meta">
                   <div className="skeleton-line skeleton-rating" />
                   <div className="skeleton-line skeleton-year" />
                 </div>
               </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  )
}
