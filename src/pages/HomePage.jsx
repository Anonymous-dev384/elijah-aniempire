import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import HeroSlider from '../components/HeroSlider'
import SectionHeader from '../components/SectionHeader'
import AnimeCard from '../components/AnimeCard'
import SkeletonCard from '../components/SkeletonCard'
import EstimatedSchedule from '../components/EstimatedSchedule'
import { IconFire, IconStar, IconBook, IconMusic, CrownIcon, IconTrendUp, IconRefresh, IconCalendar } from '../components/Icons'
import { MANGA, ANIME as MOCK_ANIME } from '../data/mockData'
import { getPopularAnime, getTopAiringAnime, getUpcomingAnime, getNewEpisodes, getSeasonalAnime, getTopManga, searchAnime, generateDetailUrl, getPopularAnimeThemes } from '../services/api'
import ThemeCard from '../components/ThemeCard'

function TrendingRankRow({ loading, items }) {
  if (loading) {
    return (
      <div className="trending-rank-list">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="trending-rank-item trending-rank-skeleton">
            <div className="skeleton-rank-num" />
            <div className="skeleton-thumb" />
            <div className="skeleton-info">
              <div className="skeleton-title" />
              <div className="skeleton-subtitle" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="trending-rank-list">
      {items.slice(0, 10).map((item, i) => (
        <Link
          key={`${item.id}-${i}`}
          className="trending-rank-item"
          to={generateDetailUrl('anime', item.title, item.id)}
          style={{ textDecoration: 'none' }}
        >
          <span className="rank-num">{String(i + 1).padStart(2, '0')}</span>
          <img src={item.coverImage} alt={item.title} className="trending-rank-img" />
          <div className="trending-rank-info">
            <p className="trending-rank-title">{item.title}</p>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4 }}>
              <span className="ac-rating" style={{ fontSize: '0.8rem' }}><IconStar size={12} /> {item.score != null && !isNaN(parseFloat(item.score)) ? parseFloat(item.score).toFixed(1) : 'N/A'}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{item.episodes} ep</span>
            </div>
          </div>
        </Link>
      ))}
      <style>{`
        .trending-rank-list { display: flex; flex-direction: column; gap: 8px; }
        .trending-rank-item {
          display: flex; align-items: center; gap: 14px;
          padding: 10px 14px; background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          transition: all 0.2s ease; cursor: pointer;
        }
        .trending-rank-item:hover {
          border-color: var(--border-hover); background: var(--bg-elevated);
          box-shadow: var(--shadow-gold); transform: translateX(6px);
        }
        .trending-rank-img { width: 50px; height: 70px; object-fit: cover; border-radius: var(--radius-sm); flex-shrink: 0; }
        .trending-rank-info { flex: 1; min-width: 0; }
        .trending-rank-title { font-size: 0.9rem; font-weight: 700; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .trending-rank-skeleton { cursor: default; }
        .skeleton-rank-num { width: 28px; height: 28px; border-radius: 50%; background: var(--bg-surface); animation: skeleton-pulse 1.4s ease-in-out infinite; flex-shrink: 0; }
        .trending-rank-skeleton .skeleton-thumb { width: 50px; height: 70px; border-radius: var(--radius-sm); flex-shrink: 0; }
        .trending-rank-skeleton .skeleton-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8px; padding: 0; }
        .trending-rank-skeleton .skeleton-title { width: 75%; height: 14px; background: var(--bg-surface); border-radius: 5px; animation: skeleton-pulse 1.4s ease-in-out infinite; }
        .trending-rank-skeleton .skeleton-subtitle { width: 40%; height: 10px; background: var(--bg-surface); border-radius: 5px; animation: skeleton-pulse 1.4s ease-in-out infinite; }
      `}</style>
    </div>
  )
}

export default function HomePage() {
  const [popular, setPopular] = useState([])
  const [topAiring, setTopAiring] = useState([])
  const [upcoming, setUpcoming] = useState([])
  const [seasonal, setSeasonal] = useState([])
  const [newReleases, setNewReleases] = useState([])
  const [manga, setManga] = useState([])
  const [music, setMusic] = useState([])

  const [loadingPopular, setLoadingPopular] = useState(true)
  const [loadingTopAiring, setLoadingTopAiring] = useState(true)
  const [loadingUpcoming, setLoadingUpcoming] = useState(true)
  const [loadingSeasonal, setLoadingSeasonal] = useState(true)
  const [loadingNew, setLoadingNew] = useState(true)
  const [loadingManga, setLoadingManga] = useState(true)
  const [loadingMusic, setLoadingMusic] = useState(true)

  const trendingManga = MANGA.filter(m => m.isTrending)

  useEffect(() => {
    let ignore = false;

    async function loadData() {
      const wait = (ms) => new Promise(r => setTimeout(r, ms));

      // 1. Seasonal (Hero Slider)
      getSeasonalAnime().then(res => {
        if (ignore) return;
        const data = res.data || [];
        setSeasonal(data.length > 0 ? data : MOCK_ANIME.filter(a => a.isTrending))
        setLoadingSeasonal(false)
      }).catch(() => { if (!ignore) setLoadingSeasonal(false) })

      await wait(400);
      if (ignore) return;

      // 2. Popular
      getPopularAnime().then(res => {
        if (ignore) return;
        const data = res.data || [];
        setPopular(data.length > 0 ? data : MOCK_ANIME.filter(a => a.isPopular))
        setLoadingPopular(false)
      }).catch(() => { if (!ignore) setLoadingPopular(false) })

      await wait(400);
      if (ignore) return;

      // 3. New Episodes
      getNewEpisodes().then(res => {
        if (ignore) return;
        const newData = res.data || [];
        setNewReleases(newData.length > 0 ? newData : MOCK_ANIME.filter(a => a.isNew))
        setLoadingNew(false)
      }).catch(() => { if (!ignore) setLoadingNew(false) })

      await wait(400);
      if (ignore) return;

      // 4. Upcoming
      getUpcomingAnime().then(res => {
        if (ignore) return;
        setUpcoming(res.data || [])
        setLoadingUpcoming(false)
      }).catch(() => { if (!ignore) setLoadingUpcoming(false) })

      await wait(400);
      if (ignore) return;

      // 5. Top Airing (Sidebar)
      getTopAiringAnime().then(res => {
        if (ignore) return;
        setTopAiring(res.data || [])
        setLoadingTopAiring(false)
      }).catch(() => { if (!ignore) setLoadingTopAiring(false) })

      await wait(400);
      if (ignore) return;

      // 6. Top Manga
      getTopManga().then(res => {
        if (ignore) return;
        setManga(res.data || [])
        setLoadingManga(false)
      }).catch(() => { if (!ignore) setLoadingManga(false) })

      await wait(400);
      if (ignore) return;

      // 7. Music Section (Popular Themes)
      getPopularAnimeThemes(4).then(themes => {
        if (ignore) return;
        setMusic(themes.data || [])
        setLoadingMusic(false)
      }).catch(() => { if (!ignore) setLoadingMusic(false) })
    }

    loadData();
    return () => { ignore = true; }
  }, [])

  return (
    <div>
      <HeroSlider slides={seasonal.slice(0, 5)} loading={loadingSeasonal} />
      <div className="home-layout">
        <div className="home-main">

          <div className="section">
            <SectionHeader title="Popular" icon={<IconFire size={20} color="var(--gold)" />} linkTo="/browse/anime?cat=popular" />
            <div className="anime-grid">
              {loadingPopular
                ? [...Array(6)].map((_, i) => <SkeletonCard key={i} />)
                : popular.slice(0, 6).map((item, i) => <AnimeCard key={`${item.id}-${i}`} item={item} type="anime" />)
              }
            </div>
          </div>

          <div className="section">
            <SectionHeader title="New Episodes" subtitle="Fresh drops this season" icon={<IconRefresh size={18} color="var(--gold)" />} linkTo="/browse/anime?cat=new" />
            <div className="anime-grid">
              {loadingNew
                ? [...Array(6)].map((_, i) => <SkeletonCard key={i} />)
                : newReleases.slice(0, 6).map((item, i) => <AnimeCard key={`${item.id}-${i}`} item={item} type="anime" />)
              }
            </div>
          </div>

          <div className="section">
            <SectionHeader title="Upcoming" subtitle="Sneak peek into the future" icon={<IconCalendar size={20} color="var(--gold)" />} linkTo="/browse/anime?cat=upcoming" />
            <div className="anime-grid">
              {loadingUpcoming
                ? [...Array(6)].map((_, i) => <SkeletonCard key={i} />)
                : upcoming.slice(0, 6).map((item, i) => <AnimeCard key={`${item.id}-${i}`} item={item} type="anime" />)
              }
            </div>
          </div>

          <div className="section" style={{ paddingTop: '20px' }}>
            <EstimatedSchedule />
          </div>

          <div className="section">
            <SectionHeader title="Top Manga" subtitle="Legendary scrolls of the empire" icon={<IconBook size={18} color="var(--gold)" />} linkTo="/browse/manga?cat=top" />
            <div className="anime-grid">
              {loadingManga
                ? [...Array(6)].map((_, i) => <SkeletonCard key={i} />)
                : manga.slice(0, 6).map(item => <AnimeCard key={item.id} item={item} type="manga" />)
              }
            </div>
          </div>
          <div className="section">
            <SectionHeader title="Soundtracks" subtitle="Iconic anime openings" icon={<IconMusic size={18} color="var(--gold)" />} linkTo="/browse/music?cat=popular" />
            <div className="music-grid">
              {loadingMusic
                ? [...Array(4)].map((_, i) => <SkeletonCard key={i} />)
                : music.map((item, idx) => <ThemeCard key={item.slug || idx} animeEntry={item} />)
              }
            </div>
          </div>
        </div>

        <aside className="home-sidebar">
          <div style={{ position: 'sticky', top: 16 }}>
            <SectionHeader title="Top Airing" icon={<IconTrendUp size={20} color="var(--gold)" />} />
            <TrendingRankRow loading={loadingTopAiring} items={topAiring.length > 0 ? topAiring : popular} />
          </div>
        </aside>
      </div>
    </div>
  )
}
