import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import Lightbox from '../components/Lightbox'
import { getProducerInfo, searchAnime, decodeId } from '../services/api'
import AnimeCard from '../components/AnimeCard'
import { IconHeart, IconCalendar, IconChevronLeft, IconChevronRight } from '../components/Icons'
import NotFoundPage from './NotFoundPage'

export default function ProducerPage() {
  const { id } = useParams()
  const [producer, setProducer] = useState(null)
  const [works, setWorks] = useState([])
  const [pagination, setPagination] = useState({ last_visible_page: 1, has_next_page: false })
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadingWorks, setLoadingWorks] = useState(false)
  const [error, setError] = useState(null)
  const [descExpanded, setDescExpanded] = useState(false)
  const [lbState, setLbState] = useState({ open: false, images: [], index: 0 })



  const openLightbox = (images, index = 0) => {
    setLbState({ open: true, images, index })
  }

  const loadWorks = async (page = 1) => {
    if (!id) return;
    setLoadingWorks(true)
    try {
      const resolvedId = isNaN(id) ? decodeId(id) : id;
      const animeRes = await searchAnime('', page, { producers: resolvedId, sort: 'desc', order_by: 'score' })
      if (animeRes && animeRes.data) {
        setWorks(animeRes.data)
        setPagination(animeRes.pagination || { last_visible_page: 1, has_next_page: false })
      }
      setCurrentPage(page)
    } catch (err) {
      console.error('Error loading producer works:', err)
    } finally {
      setLoadingWorks(false)
    }
  }

  useEffect(() => {
    if (!id) return;
    
    const loadData = async () => {
      setLoading(true)
      setError(null)
      try {
        const resolvedId = isNaN(id) ? decodeId(id) : id;
        const prodInfo = await getProducerInfo(resolvedId)
        if (!prodInfo) {
          setError('Producer not found')
          setLoading(false)
          return
        }
        setProducer(prodInfo)
        document.title = `${prodInfo.titles?.[0]?.title || prodInfo.title || 'Studio'} — AniEmpire`
 
        // Fetch initial works
        await loadWorks(1)
      } catch (err) {
        console.error(err)
        setError('Failed to load data')
      }
      setLoading(false)
    }
    loadData()
  }, [id])

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.last_visible_page) return
    loadWorks(newPage)
    const section = document.getElementById('works-section')
    if (section) section.scrollIntoView({ behavior: 'smooth' })
  }

  const getPageNumbers = () => {
    const total = pagination.last_visible_page
    const current = currentPage
    const pages = []
    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i)
    } else {
      pages.push(1)
      if (current > 4) pages.push('...')
      const start = Math.max(2, current - 2);
      const end = Math.min(total - 1, current + 2);
      for (let i = start; i <= end; i++) pages.push(i)
      if (current < total - 3) pages.push('...')
      pages.push(total)
    }
    return pages
  }

  if (loading) return <ProducerSkeleton />
  if (error === 'Producer not found') return <NotFoundPage />
  if (error) return <div className="detail-error">{error}</div>
  if (!producer) return null

  const title = producer.titles?.[0]?.title || producer.title || producer.name || 'Unknown Studio'
  const japaneseTitle = producer.titles?.find(t => t.type === 'Japanese')?.title
  const established = producer.established ? new Date(producer.established).getFullYear() : null
  const about = producer.about || 'No description available.'

  return (
    <div className="detail-page anim-fade-up">
      {/* Mini Hero */}
      <div className="producer-hero" style={{ padding: '80px 28px 40px', background: 'linear-gradient(to bottom, rgba(212, 168, 67, 0.1), var(--bg-primary))', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="producer-hero-content" style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 32, alignItems: 'flex-start' }}>
          {producer.images?.jpg?.image_url && (
            <img 
              src={producer.images.jpg.image_url} 
              alt={title}
              onClick={() => openLightbox([producer.images.jpg.image_url])}
              style={{ width: 160, borderRadius: 'var(--radius-md)', border: '2px solid var(--border-hover)', background: 'var(--bg-card)', cursor: 'zoom-in' }}
            />
          )}
          <div className="producer-hero-info" style={{ flex: 1 }}>
            <h1 className="dh-title" style={{ marginBottom: 8 }}>{title}</h1>
            {japaneseTitle && <h2 style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginBottom: 16 }}>{japaneseTitle}</h2>}
            
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
              {established && <span className="tag" style={{ gap: 6 }}><IconCalendar size={14} /> Est. {established}</span>}
              {producer.favorites > 0 && <span className="tag" style={{ gap: 6 }}><IconHeart size={14} /> {producer.favorites.toLocaleString()} Favorites</span>}
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

      <div className="section" id="works-section" style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h3 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', margin: 0 }}>Works by {title}</h3>
          {pagination.last_visible_page > 1 && (
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Page <strong>{currentPage}</strong> of <strong>{pagination.last_visible_page}</strong>
            </span>
          )}
        </div>

        {loadingWorks ? (
          <div className="anime-grid">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="skeleton-card" style={{ opacity: 0.6 }}>
                <div className="skeleton-poster" />
              </div>
            ))}
          </div>
        ) : works.length > 0 ? (
          <>
            <div className="anime-grid">
              {works.map((work) => (
                <AnimeCard key={work.id} item={work} type="anime" />
              ))}
            </div>

            {pagination.last_visible_page > 1 && (
              <div className="pagination-wrapper" style={{ marginTop: 48, display: 'flex', justifyContent: 'center' }}>
                <div className="empire-pagination" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button
                    className={`page-box edge ${currentPage === 1 ? 'disabled' : ''}`}
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <IconChevronLeft size={18} />
                  </button>
                  {getPageNumbers().map((num, idx) => (
                    num === '...' ? <span key={`dots-${idx}`} className="page-dots" style={{ color: 'var(--text-muted)' }}>...</span> :
                      <button
                        key={`page-${num}`}
                        className={`page-box ${currentPage === num ? 'active' : ''}`}
                        onClick={() => handlePageChange(num)}
                      >
                        {num}
                      </button>
                  ))}
                  <button
                    className={`page-box edge ${!pagination.has_next_page ? 'disabled' : ''}`}
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!pagination.has_next_page}
                  >
                    <IconChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <p style={{ color: 'var(--text-muted)' }}>No works found.</p>
        )}
      </div>

      <style>{`
        .pagination-wrapper { padding-top: 24px; border-top: 1px solid var(--border-subtle); }
        .empire-pagination { display: flex; gap: 8px; align-items: center; }
        .page-box {
          width: 40px; height: 40px; border-radius: 6px; background: var(--bg-card);
          border: 1px solid var(--border-default); color: var(--text-secondary);
          display: flex; align-items: center; justify-content: center; cursor: pointer;
          font-weight: 700; transition: all 0.2s; outline: none;
        }
        .page-box:hover:not(.disabled):not(.active) { border-color: var(--gold); color: var(--gold); transform: translateY(-2px); }
        .page-box.active { background: var(--gold); color: #000; border-color: var(--gold); box-shadow: var(--shadow-gold); }
        .page-box.edge { color: var(--gold); }
        .page-box.disabled { opacity: 0.3; pointer-events: none; cursor: not-allowed; }
      `}</style>

      <Lightbox
        isOpen={lbState.open}
        images={lbState.images}
        initialIndex={lbState.index}
        onClose={() => setLbState(prev => ({ ...prev, open: false }))}
      />
    </div>
  )
}

function ProducerSkeleton() {
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
