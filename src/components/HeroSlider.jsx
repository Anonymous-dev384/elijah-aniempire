import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { IconPlay, IconChevron } from './Icons'
import { generateDetailUrl, encodeId, slugify } from '../services/api'

const DEFAULT_SLIDES = [
  { id: 154587, title: "Frieren: Beyond Journey's End", description: "Half a century after the party's triumph over the Demon King, the elf mage Frieren begins a new journey to understand what it means to be human.", coverImage: 'https://img.anili.st/media/154587', genres: ['Adventure', 'Fantasy', 'Drama'], score: 9.3, episodes: 28, status: 'Finished', isNew: false },
  { id: 170942, title: 'Solo Leveling', description: "In a world of hunters, the weakest awakens a unique power — the ability to grow without limit.", coverImage: 'https://img.anili.st/media/170942', genres: ['Action', 'Fantasy'], score: 8.8, episodes: 13, status: 'Finished', isNew: true },
  { id: 129874, title: 'Bleach: Thousand-Year Blood War', description: "Ichigo and the Soul Reapers face Yhwach's Quincy army in the most devastating war the Soul Society has ever seen.", coverImage: 'https://img.anili.st/media/129874', genres: ['Action', 'Supernatural'], score: 9.1, episodes: 26, status: 'Releasing', isNew: true },
]

function DynamicHeroBackground({ sources, coverImage }) {
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [blurLoaded, setBlurLoaded] = useState(false);
  const sharpRef = useRef(null);
  const blurRef = useRef(null);

  const currentSrc = sources && sources.length > 0 && index < sources.length ? sources[index] : coverImage;
  const isLandscape = sources && sources.length > 0 && index < sources.length;

  // Reset when sources change
  useEffect(() => {
    setIndex(0);
    setLoaded(false);
  }, [sources]);

  // Reset when coverImage changes
  useEffect(() => {
    setBlurLoaded(false);
  }, [coverImage]);

  // Handle cached images immediately
  useEffect(() => {
    if (sharpRef.current && sharpRef.current.complete) {
      setLoaded(true);
    }
  }, [currentSrc]);

  useEffect(() => {
    if (blurRef.current && blurRef.current.complete) {
      setBlurLoaded(true);
    }
  }, [coverImage]);

  const handleError = () => {
    if (sources && index < sources.length - 1) {
      setIndex(prev => prev + 1);
    }
  };

  return (
    <>
      {/* Ambient Blur Layer */}
      <img
        ref={blurRef}
        key={coverImage}
        src={coverImage}
        className="hero-bg-blur"
        style={{ opacity: blurLoaded ? 1 : 0 }}
        onLoad={() => setBlurLoaded(true)}
        alt=""
        loading="eager"
        fetchPriority="low"
      />
      {/* Sharp Banner/Cover Layer */}
      <img
        ref={sharpRef}
        key={currentSrc}
        src={currentSrc}
        onLoad={() => setLoaded(true)}
        onError={handleError}
        className={`hero-bg ${isLandscape ? 'is-banner' : ''}`}
        style={{ opacity: loaded ? 1 : 0 }}
        alt="Hero Banner"
        draggable="false"
        loading="eager"
        fetchPriority="high"
      />
    </>
  );
}

export default function HeroSlider({ slides = [], loading = false }) {
  const [current, setCurrent] = useState(0)
  const [animating, setAnimating] = useState(false)

  const displaySlides = slides.length > 0 ? slides : DEFAULT_SLIDES
  const slide = displaySlides[current]

  const goTo = useCallback((idx) => {
    if (idx === current || animating) return
    setAnimating(true)
    setTimeout(() => {
      setCurrent(idx)
      setAnimating(false)
    }, 350)
  }, [current, animating])

  const prev = () => goTo((current - 1 + displaySlides.length) % displaySlides.length)
  const next = () => goTo((current + 1) % displaySlides.length)

  // Preload all slides' images once they are available to make transitions instantaneous
  useEffect(() => {
    if (loading || displaySlides.length === 0) return;
    displaySlides.forEach(s => {
      if (s.coverImage) {
        const img = new Image();
        img.src = s.coverImage;
      }
      if (s.bannerSources && Array.isArray(s.bannerSources)) {
        s.bannerSources.forEach(src => {
          const img = new Image();
          img.src = src;
        });
      }
    });
  }, [displaySlides, loading]);

  // Auto-advance timer setup
  useEffect(() => {
    if (loading || displaySlides.length === 0 || animating) return;

    const timer = setTimeout(() => {
      setAnimating(true);
      setTimeout(() => {
        setCurrent(c => (c + 1) % displaySlides.length);
        setAnimating(false);
      }, 350);
    }, 7000);

    return () => clearTimeout(timer);
  }, [loading, displaySlides.length, animating, current]);

  if (loading) {
    return (
      <div className="hero-slider hero-loading">
        <div className="hero-gradient" />
        <div className="hero-skeleton-content">
          <div className="skeleton-line w-badges" />
          <div className="skeleton-line w-title" />
          <div className="skeleton-line w-title" />
          <div className="skeleton-line w-desc" />
          <div className="skeleton-line w-desc" />
          <div className="skeleton-line w-meta" />
          <div className="skeleton-line w-btn" />
        </div>
        <style>{`
          .hero-slider { position: relative; width: 100%; height: 520px; overflow: hidden; background: var(--bg-elevated); }
          .hero-gradient { position: absolute; inset: 0; background: linear-gradient(to right, rgba(10,9,8,0.97) 0%, rgba(10,9,8,0.4) 60%, transparent 100%); }
          .hero-skeleton-content {
            position: relative; z-index: 2; padding: 60px 48px; max-width: 560px;
            display: flex; flex-direction: column; gap: 14px;
          }
          .hero-skeleton-content .skeleton-line {
            animation: skeleton-pulse 1.4s ease-in-out infinite;
            border-radius: 6px;
          }
          .w-badges { width: 55%; height: 14px; }
          .w-title { width: 75%; height: 22px; }
          .w-desc { width: 90%; height: 14px; }
          .w-meta { width: 30%; height: 14px; margin-top: 8px; }
          .w-btn { width: 40%; height: 42px; border-radius: 10px; margin-top: 10px; }
        `}</style>
      </div>
    )
  }

  return (
    <div className="hero-slider">
      <DynamicHeroBackground sources={slide.bannerSources} coverImage={slide.coverImage} />
      <div className="hero-gradient" />

      {/* LEFT / RIGHT arrows */}
      <button className="hero-arrow hero-arrow-left" onClick={prev} aria-label="Previous slide">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 6 9 12 15 18" /></svg>
      </button>
      <button className="hero-arrow hero-arrow-right" onClick={next} aria-label="Next slide">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 6 15 12 9 18" /></svg>
      </button>

      <div className={`hero-content ${animating ? 'fading' : ''}`}>
        <div className="hero-badges">
          {slide.isNew && <span className="badge badge-new">NEW</span>}
          <span className="badge badge-gold">{slide.status}</span>
          {slide.genres?.slice(0, 3).map(g => <span key={g} className="tag" style={{ pointerEvents: 'none', fontSize: '0.76rem' }}>{g}</span>)}
        </div>
        <h1 className="hero-title">{slide.title}</h1>
        <p className="hero-desc">{slide.description}</p>
        <div className="hero-meta">
          <span style={{ color: 'var(--gold)', fontSize: '0.92rem', fontWeight: 700 }}>
            ★ {slide.score != null && !isNaN(parseFloat(slide.score)) ? parseFloat(slide.score).toFixed(1) : 'N/A'}
          </span>
          <span style={{ color: 'var(--text-muted)' }}>·</span>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{slide.episodes} Episodes</span>
        </div>
        <div className="hero-actions">
          {(() => {
            const watchSlug = `${slugify(slide.title)}.${encodeId(slide.id)}`
            return (
              <Link to={`/watch/${watchSlug}?ep=1`} className="btn btn-primary btn-lg">
                <IconPlay size={14} /> Watch Now
              </Link>
            )
          })()}
          <Link to={generateDetailUrl('anime', slide.title, slide.id)} className="btn btn-ghost btn-lg">View Details</Link>
        </div>
      </div>

      <div className="hero-dots">
        {displaySlides.map((_, i) => <button key={i} className={`hero-dot ${i === current ? 'active' : ''}`} onClick={() => goTo(i)} />)}
      </div>
      <div className="hero-progress"><div className="hero-progress-bar" key={`${current}-${displaySlides.length}`} /></div>

      <style>{`
        .hero-slider { position: relative; width: 100%; height: 520px; overflow: hidden; background: var(--bg-primary); }
        img.hero-bg-blur { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center; filter: blur(35px) brightness(0.35); transform: scale(1.1); transition: opacity 0.5s ease; z-index: 0; }
        img.hero-bg { position: absolute; top: 0; right: 40px; bottom: 0; width: 50%; height: 100%; object-fit: contain; object-position: right center; transition: opacity 0.5s ease; mask-image: linear-gradient(to right, transparent, black 15%); -webkit-mask-image: linear-gradient(to right, transparent, black 15%); z-index: 1; }
        img.hero-bg.is-banner { left: 0; right: 0; width: 100%; height: 100%; object-fit: cover; object-position: center 20%; mask-image: linear-gradient(to right, transparent 0%, black 60%); -webkit-mask-image: linear-gradient(to right, transparent 0%, black 60%); }
        .hero-gradient {
          position: absolute; inset: 0; z-index: 1; pointer-events: none;
          background: linear-gradient(to right, rgba(10,9,8,0.97) 0%, rgba(10,9,8,0.85) 40%, rgba(10,9,8,0.2) 70%, transparent 100%),
                      linear-gradient(to top, var(--bg-primary) 0%, transparent 25%);
        }
        .hero-content {
          position: relative; z-index: 2; padding: 60px 48px; max-width: 560px;
          display: flex; flex-direction: column; justify-content: center;
          height: 100%; opacity: 1; transform: translateY(0); transition: all 0.35s ease;
        }
        .hero-content.fading { opacity: 0; transform: translateY(10px); }
        .hero-badges { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 14px; }
        .hero-title {
          font-family: var(--font-heading); font-size: 2.2rem; font-weight: 800;
          color: #fff; line-height: 1.1; margin-bottom: 12px;
          text-shadow: 0 2px 16px rgba(0,0,0,0.5);
        }
        .hero-desc {
          font-size: 0.92rem; color: var(--text-secondary); line-height: 1.65;
          margin-bottom: 16px; display: -webkit-box;
          -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
        }
        .hero-meta { display: flex; align-items: center; gap: 10px; margin-bottom: 22px; }
        .hero-actions { display: flex; gap: 12px; flex-wrap: wrap; }

        /* Arrow navigation */
        .hero-arrow {
          position: absolute; top: 50%; transform: translateY(-50%);
          z-index: 5; width: 48px; height: 48px;
          border-radius: 50%; border: 1px solid rgba(255,255,255,0.15);
          background: rgba(0,0,0,0.45); backdrop-filter: blur(6px);
          color: #fff; display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.25s ease;
          opacity: 0.6;
        }
        .hero-arrow:hover { opacity: 1; background: rgba(212,168,67,0.3); border-color: var(--gold); color: var(--gold); transform: translateY(-50%) scale(1.08); }
        .hero-arrow-left { left: 20px; }
        .hero-arrow-right { right: 20px; }

        .hero-dots { position: absolute; bottom: 28px; right: 40px; z-index: 3; display: flex; gap: 8px; }
        .hero-dot { width: 10px; height: 10px; border-radius: 50%; background: rgba(255,255,255,0.2); border: none; cursor: pointer; transition: all 0.3s ease; }
        .hero-dot.active { background: var(--gold); box-shadow: 0 0 10px var(--gold-glow); transform: scale(1.3); }
        .hero-progress { position: absolute; bottom: 0; left: 0; right: 0; height: 3px; background: rgba(255,255,255,0.06); z-index: 3; }
        .hero-progress-bar { height: 100%; background: var(--gold); animation: heroProgress 7s linear forwards; }
        @keyframes heroProgress { from { width: 0; } to { width: 100%; } }
        @media (max-width: 768px) {
          .hero-slider { height: 350px; }
          .hero-content { padding: 40px 16px 20px; justify-content: flex-end; }
          .hero-title { font-size: 1.5rem; margin-bottom: 8px; text-shadow: 0 2px 10px rgba(0,0,0,0.8); }
          .hero-desc { display: none; }
          .hero-badges { margin-bottom: 8px; gap: 4px; }
          .hero-badges .tag { display: none; }
          .hero-meta { margin-bottom: 12px; }
          .hero-arrow { display: none; }
          .hero-dots { right: 16px; bottom: 16px; }
        }
      `}</style>
    </div>
  )
}
