import { useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams, Link, useLocation } from 'react-router-dom'
import SectionHeader from '../components/SectionHeader'
import AnimeCard from '../components/AnimeCard'
import SkeletonCard from '../components/SkeletonCard'
import {
  IconGrid,
  IconSearch,
  IconFilm,
  IconTrendUp,
  IconStar,
  IconFire,
  IconHeart,
  IconChevronLeft,
  IconChevronRight,
  IconWifiOff,
  IconShuffle,
  IconMusic,
  IconRefresh
} from '../components/Icons'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  searchAnime,
  getRecommendations,
  getSeasonalAnime,
  getUpcomingAnime,
  getPopularAnime,
  getTopAiringAnime,
  getNewEpisodes,
  getMovies,
  getTopAnime,
  searchManga,
  getTopManga,
  getPopularManga,
  getPublishingManga,
  getRandomAnime,
  getRandomManga,
  getSeasonArchiveAnime,
  generateDetailUrl
} from '../services/api'
import { ANIME_GENRES, MANGA_GENRES, MANGA_FORMATS, MANGA_STATUSES, SEASONAL_ARCHIVE } from '../data/filterData'

const MAIN_GENRES_SET = new Set([
  'action', 'adventure', 'cars', 'comedy', 'dementia', 'demons', 'drama', 'ecchi', 
  'fantasy', 'game', 'harem', 'historical', 'horror', 'isekai', 'josei', 'kids', 
  'magic', 'martial arts', 'mecha', 'military', 'music', 'mystery', 'parody', 
  'police', 'psychological', 'reincarnation', 'romance', 'samurai', 'school', 'sci-fi', 'seinen', 
  'shoujo', 'shoujo ai', 'shounen', 'shounen ai', 'slice of life', 'space', 
  'sports', 'super power', 'supernatural', 'thriller', 'vampire'
]);

// Sub-Discovery categories for Anime (Koyeb-powered)
const DISCOVERY_MAP = {
  all: { label: 'All Anime', icon: IconGrid, fetcher: (p, opt) => searchAnime('', p, opt), params: {}, subtitle: 'Browse the library' },
  trending: { label: 'Trending', icon: IconTrendUp, fetcher: (p, opt) => getTopAiringAnime(p, opt.rating), params: { filter: 'airing' }, subtitle: 'The current pulse of the empire' },
  popular: { label: 'Popular', icon: IconFire, fetcher: (p, opt) => getPopularAnime(p, opt.rating), params: { filter: 'bypopularity' }, subtitle: 'All-time legendary hits' },
  top: { label: 'Top Rated', icon: IconStar, fetcher: (p, opt) => getTopAnime('', p, '', opt.rating), params: { order_by: 'score' }, subtitle: 'Peerless masterpieces' },
  new: { label: 'New Episodes', icon: IconRefresh, fetcher: (p) => getNewEpisodes(p), subtitle: 'Fresh drops this season' },
  recommended: { label: 'Recommended', icon: IconHeart, fetcher: (p) => getRecommendations(p), subtitle: 'Chosen for your unique taste' },
  seasonal: { label: 'Seasonal', icon: IconGrid, fetcher: (p) => getSeasonalAnime(p), subtitle: 'Fresh drops this season' },
  upcoming: { label: 'Upcoming', icon: IconSearch, fetcher: (p) => getUpcomingAnime(p), subtitle: 'Sneak peek into the future' },
  movies: { label: 'Movies', icon: IconFilm, fetcher: (p, opt) => getMovies(p, opt.rating), params: { subtype: 'movie' }, subtitle: 'Cinematic experiences' }
}

const MANGA_DISCOVERY_MAP = {
  all: { label: 'All Manga', icon: IconGrid, fetcher: (p, opt) => searchManga('', p, opt), params: {}, subtitle: 'Browse the library' },
  popular: { label: 'Popular', icon: IconFire, fetcher: (p) => getPopularManga(p), params: { filter: 'bypopularity' }, subtitle: 'All-time legendary hits' },
  top: { label: 'Top Rated', icon: IconStar, fetcher: (p) => getTopManga('favorite', p), params: { filter: 'favorite' }, subtitle: 'Peerless masterpieces' }
}

const MUSIC_DISCOVERY_MAP = {
  all: { label: 'All Music', icon: IconMusic, fetcher: (p, opt) => searchAnime('music', p, opt), params: { q: 'music' }, subtitle: 'Legendary soundtracks and performances' },
  popular: { label: 'Popular', icon: IconFire, fetcher: (p, opt) => searchAnime('music', p, { ...opt, popular: true }), params: { q: 'music', order_by: 'popularity' }, subtitle: 'Greatest hits of the empire' },
  tops: { label: 'Top Rated', icon: IconStar, fetcher: (p, opt) => searchAnime('music', p, { ...opt, order_by: 'score' }), params: { q: 'music', order_by: 'score' }, subtitle: 'Peerless compositions' }
}

const SEASONS = ['All', 'Winter', 'Spring', 'Summer', 'Fall']
const SORT_MAP = {
  'Popularity': { order_by: 'popularity', sort: 'desc' },
  'Rating': { order_by: 'score', sort: 'desc' },
  'Newest': { order_by: 'start_date', sort: 'desc' },
  'A-Z': { order_by: 'title', sort: 'asc' }
}
const FORMATS = [
  { label: 'All', value: '' },
  { label: 'TV', value: 'tv' },
  { label: 'Movie', value: 'movie' },
  { label: 'OVA', value: 'ova' },
  { label: 'ONA', value: 'ona' },
  { label: 'Special', value: 'special' },
  { label: 'Music', value: 'music' }
]
const RATINGS = [
  { label: 'All', value: '' },
  { label: 'G (General)', value: 'g' },
  { label: 'PG (Children)', value: 'pg' },
  { label: 'PG-13 (Teens)', value: 'pg13' },
  { label: 'R-17+ (Violence)', value: 'r17' },
  { label: 'R (Restricted)', value: 'r' },
  { label: 'Rx (Explicit)', value: 'rx' }
]
const STATUSES = ['All', 'Currently Airing', 'Finished Airing', 'Not yet aired', 'Upcoming', 'Releasing']

export default function BrowsePage() {
  const { type: urlType } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const isManga = urlType === 'manga'
  const isMusic = urlType === 'music'

  const ACTIVE_DISCOVERY_MAP = isMusic ? MUSIC_DISCOVERY_MAP : (isManga ? MANGA_DISCOVERY_MAP : DISCOVERY_MAP)
  const ACTIVE_GENRES = isManga ? MANGA_GENRES : ANIME_GENRES
  const ACTIVE_FORMATS = isManga ? MANGA_FORMATS : FORMATS
  const ACTIVE_STATUSES = isManga ? MANGA_STATUSES : STATUSES

  const [searchParams, setSearchParams] = useSearchParams()
  const qParam = searchParams.get('q') || ''
  const pageParam = parseInt(searchParams.get('page')) || 1
  const catParam = searchParams.get('cat') || 'all'
  const subtypeParam = searchParams.get('subtype') || ''
  const ratingParam = searchParams.get('rating') || ''
  const genreParam = searchParams.get('genres') || ''
  const scoreParam = searchParams.get('score') || ''
  const producersParam = searchParams.get('producers') || ''
  const startDateParam = searchParams.get('start_date') || ''
  const endDateParam = searchParams.get('end_date') || ''
  const unapprovedParam = searchParams.get('unapproved') === 'true'
  const seasonParam = searchParams.get('season') || ''
  const yearParam = searchParams.get('year') || ''

  // Interactive UI States (Current selection in drawer/search bar)
  const [searchQuery, setSearchQuery] = useState(qParam)
  const [activeGenres, setActiveGenres] = useState(genreParam ? genreParam.split(',').map(name => {
    const found = ACTIVE_GENRES.find(g => g.name.toLowerCase() === name.toLowerCase())
    return found ? found.name : name
  }) : [])
  const [activeFormat, setActiveFormat] = useState(subtypeParam)
  const [activeRating, setActiveRating] = useState(ratingParam)
  const [activeStatus, setActiveStatus] = useState('All')
  const [minScore, setMinScore] = useState(scoreParam)
  const [producers, setProducers] = useState(producersParam)
  const [activeSeason, setActiveSeason] = useState(seasonParam)
  const [activeYear, setActiveYear] = useState(yearParam)
  const [isUnapproved, setIsUnapproved] = useState(unapprovedParam)

  const initialGenreIds = genreParam ? genreParam.split(',').map(name => {
    const found = ACTIVE_GENRES.find(g => g.name.toLowerCase() === name.toLowerCase())
    return found ? found.mal_id : null
  }).filter(Boolean).join(',') : ''

  // Snapshot State (What triggers the actual data fetch)
  const [appliedConfig, setAppliedConfig] = useState({
    query: qParam,
    genres: initialGenreIds,
    subtype: subtypeParam,
    rating: ratingParam,
    score: scoreParam,
    producers: producersParam,
    start_date: startDateParam,
    end_date: endDateParam,
    unapproved: unapprovedParam,
    season: seasonParam,
    year: yearParam
  })

  // Core Navigation States
  const [activeCategory, setActiveCategory] = useState(catParam)
  const [currentPage, setCurrentPage] = useState(pageParam)
  const [activeSort, setActiveSort] = useState('Popularity')
  const [items, setItems] = useState([])
  const [pagination, setPagination] = useState({ last_visible_page: 1, has_next_page: false })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [showAllGenres, setShowAllGenres] = useState(false)
  const [isRandomizing, setIsRandomizing] = useState(false)

  const gridRef = useRef(null)

  const handleRandomPick = async () => {
    if (isRandomizing) return
    setIsRandomizing(true)
    try {
      const item = isManga ? await getRandomManga() : await getRandomAnime()
      if (item) {
        navigate(generateDetailUrl(isManga ? 'manga' : 'anime', item.title, item.id))
      }
    } catch (err) {
      console.error('Failed to get random pick:', err)
    } finally {
      setIsRandomizing(false)
    }
  }

  // Commit Filters to Applied Config
  const handleApplyFilters = () => {
    const genreIds = activeGenres.map(name => {
      const found = ACTIVE_GENRES.find(g => g.name === name)
      return found ? found.mal_id : null
    }).filter(Boolean).join(',')

    const newConfig = {
      query: searchQuery,
      genres: genreIds,
      subtype: activeFormat,
      rating: activeRating,
      status: activeStatus !== 'All' ? activeStatus : '',
      min_score: minScore,
      producers: producers,
      start_date: '',
      end_date: '',
      season: activeSeason,
      year: activeYear,
      unapproved: isUnapproved
    }

    setAppliedConfig(newConfig)
    setActiveCategory('all')
    setCurrentPage(1)
    setShowFilters(false)

    // Sync URL: Add sorting to sync
    const params = new URLSearchParams()
    if (newConfig.query) {
      params.set('q', newConfig.query)
    } else {
      if (activeCategory !== 'all') params.set('cat', activeCategory)
    }

    if (activeGenres.length > 0) params.set('genres', activeGenres.join(','))
    if (newConfig.subtype) params.set('subtype', newConfig.subtype)
    if (newConfig.rating) params.set('rating', newConfig.rating)
    if (newConfig.min_score) params.set('score', newConfig.min_score)
    if (newConfig.producers) params.set('producers', newConfig.producers)
    if (newConfig.start_date) params.set('start_date', newConfig.start_date)
    if (newConfig.end_date) params.set('end_date', newConfig.end_date)
    if (newConfig.unapproved) params.set('unapproved', 'true')
    if (newConfig.season) params.set('season', newConfig.season)
    if (newConfig.year) params.set('year', newConfig.year)
    setSearchParams(params)
  }

  // Handle Search Submit
  const onSearchSubmit = (e) => {
    e.preventDefault()
    handleApplyFilters()
  }

  // Data Loading Triggered by Applied Config
  const loadContent = async () => {
    setLoading(true)
    setError(null)
    setItems([]) // Clear stale items immediately when switching type/category
    try {
      let res = { data: [], pagination: { last_visible_page: 1 } }
      const cfg = ACTIVE_DISCOVERY_MAP[activeCategory] || ACTIVE_DISCOVERY_MAP.all

      const fetchOptions = {
        subtype: appliedConfig.subtype || cfg.params?.subtype || '',
        type: isManga ? (appliedConfig.subtype || cfg.params?.type || '') : undefined,
        rating: appliedConfig.rating || '',
        genres: appliedConfig.genres || '',
        status: appliedConfig.status || '',
        min_score: appliedConfig.score || '',
        producers: appliedConfig.producers || '',
        start_date: appliedConfig.year && !appliedConfig.season ? `${appliedConfig.year}-01-01` : '',
        end_date: appliedConfig.year && !appliedConfig.season ? `${appliedConfig.year}-12-31` : '',
        unapproved: appliedConfig.unapproved
      }

      if (appliedConfig.season && appliedConfig.year) {
        res = await getSeasonArchiveAnime(appliedConfig.year, appliedConfig.season, currentPage)
      } else if (appliedConfig.query || appliedConfig.genres || appliedConfig.subtype || appliedConfig.rating || appliedConfig.score || appliedConfig.producers || appliedConfig.year || appliedConfig.unapproved) {
        res = isManga ? await searchManga(appliedConfig.query, currentPage, fetchOptions) : await searchAnime(appliedConfig.query, currentPage, fetchOptions)
      } else {
        if (cfg.fetcher) {
          res = await cfg.fetcher(currentPage, { rating: appliedConfig.rating })
        } else {
          res = isManga ? await searchManga('', currentPage, fetchOptions) : await searchAnime('', currentPage, fetchOptions)
        }
      }

      setItems(res.data || [])
      setPagination(res.pagination || { last_visible_page: 1 })
      setLoading(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      console.error('[Discovery Error]:', err)
      setError(err.message || 'unreachable')
      setLoading(false)
    }
  }

  useEffect(() => {
    loadContent()
  }, [activeCategory, currentPage, appliedConfig, urlType])


  useEffect(() => {
    const paramsLength = Array.from(searchParams.keys()).length
    if (paramsLength === 0 && (appliedConfig.query !== '' || activeCategory !== 'all')) {
      setActiveCategory('all')
      setSearchQuery('')
      setActiveGenres([])
      setActiveFormat('')
      setActiveRating('')
      setActiveStatus('All')
      setMinScore('')
      setProducers('')
      setActiveSeason('')
      setActiveYear('')
      setIsUnapproved(false)
      setAppliedConfig({ query: '', genres: '', subtype: '', rating: '', score: '', producers: '', start_date: '', end_date: '', unapproved: false, season: '', year: '' })
      setCurrentPage(1)
    }
  }, [searchParams])

  // Local Sorting Logic (Zero Latency)
  const sortedItems = useMemo(() => {
    const list = [...items]
    switch (activeSort) {
      case 'Rating':
        return list.sort((a, b) => (parseFloat(b.score) || 0) - (parseFloat(a.score) || 0))
      case 'Newest':
        return list.sort((a, b) => (b.year || 0) - (a.year || 0))
      case 'A-Z':
        return list.sort((a, b) => a.title.localeCompare(b.title))
      case 'Popularity':
      default:
        // Default to API order which is already sorted by popularity for most views
        return list
    }
  }, [items, activeSort])

  // Helper for generating page links
  const getPageLink = (pageNum) => {
    const params = new URLSearchParams()
    if (appliedConfig.query) {
      params.set('q', appliedConfig.query)
    } else {
      if (activeCategory !== 'all') params.set('cat', activeCategory)
    }

    if (activeGenres.length > 0) params.set('genres', activeGenres.join(','))
    if (appliedConfig.subtype) params.set('subtype', appliedConfig.subtype)
    if (appliedConfig.rating) params.set('rating', appliedConfig.rating)
    if (appliedConfig.score) params.set('score', appliedConfig.score)
    if (appliedConfig.producers) params.set('producers', appliedConfig.producers)
    if (appliedConfig.start_date) params.set('start_date', appliedConfig.start_date)
    if (appliedConfig.end_date) params.set('end_date', appliedConfig.end_date)
    if (appliedConfig.unapproved) params.set('unapproved', 'true')
    if (appliedConfig.season) params.set('season', appliedConfig.season)
    if (appliedConfig.year) params.set('year', appliedConfig.year)
    if (pageNum > 1) params.set('page', pageNum)
    return `?${params.toString()}`
  }

  // Helper for generating category links
  const getCategoryLink = (catKey) => {
    const params = new URLSearchParams()
    if (catKey !== 'all') params.set('cat', catKey)
    return `?${params.toString()}`
  }

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.last_visible_page) return
    setCurrentPage(newPage)
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

  const ActiveIcon = (appliedConfig.query || (appliedConfig.season && appliedConfig.year)) ? IconSearch : (ACTIVE_DISCOVERY_MAP[activeCategory]?.icon || IconGrid)

  return (
    <div style={{ padding: '24px 0' }} ref={gridRef}>
      <div className="section" style={{ paddingBottom: 0 }}>
        <SectionHeader
          title={appliedConfig.season && appliedConfig.year ? `${appliedConfig.season.charAt(0).toUpperCase() + appliedConfig.season.slice(1)} ${appliedConfig.year} Anime` : appliedConfig.query ? `Search Results` : (isManga ? `Explore ${appliedConfig.subtype === 'novel' ? 'Novels' : ACTIVE_DISCOVERY_MAP[activeCategory]?.label || 'Records'}` : `Explore ${appliedConfig.subtype === 'movie' ? 'Movies' : ACTIVE_DISCOVERY_MAP[activeCategory]?.label || 'Anime'}`)}
          icon={<ActiveIcon size={24} color="var(--gold)" />}
          subtitle={appliedConfig.season && appliedConfig.year ? 'Historical season archive' : appliedConfig.query ? `Found results for "${appliedConfig.query}"` : ACTIVE_DISCOVERY_MAP[activeCategory]?.subtitle}
        />
      </div>

      <div className="section" style={{ paddingTop: 16, paddingBottom: 8 }}>
        <div className="search-bar-row">
          <div className="discovery-pill-group">
            {Object.entries(ACTIVE_DISCOVERY_MAP).map(([key, val]) => (
              <Link
                key={key}
                className={`tag ${activeCategory === key && !appliedConfig.query ? 'active' : ''}`}
                to={getCategoryLink(key)}
                onClick={() => {
                  setActiveCategory(key)
                  setCurrentPage(1)
                  setSearchQuery('')
                  setAppliedConfig({
                    query: '',
                    genres: '',
                    subtype: '',
                    rating: '',
                    score: '',
                    producers: '',
                    start_date: '',
                    end_date: '',
                    unapproved: false
                  })
                }}
              >
                {val.label}
              </Link>
            ))}
          </div>

          <div className="search-spacer" />

          <form className="browse-search-wrapper" style={{ flex: '1 1 250px' }} onSubmit={onSearchSubmit}>
            <IconSearch size={20} color="var(--text-muted)" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input
              className="input"
              style={{ paddingLeft: 52, paddingRight: 40, fontSize: '0.8rem', height: '100%', minHeight: 46 }}
              placeholder="Search imperial records..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="search-confirm-btn" title="Execute Search">
              <IconChevronRight size={20} />
            </button>
          </form>


          <div className="search-actions-row">
            <button 
              className={`tag random-discovery-btn ${isRandomizing ? 'randomizing' : ''}`}
              onClick={handleRandomPick}
              disabled={isRandomizing}
            >
              <IconShuffle size={22} style={{ marginRight: 8 }} />
              Random
            </button>

            <button className={`tag ${showFilters ? 'active' : ''} adv-filters-btn`} onClick={() => setShowFilters(!showFilters)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ marginRight: 6 }}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
              Filters
            </button>
          </div>
        </div>

        {showFilters && (
          <form className="filter-drawer anim-fade-up" onSubmit={(e) => { e.preventDefault(); handleApplyFilters(); }}>
            <div className="filter-top-controls">
              <div className="filter-group" style={{ flex: 1.5 }}>
                <span className="filter-label">Min Score ({minScore || 'Any'})</span>
                <input type="range" min="0" max="9" step="0.5" value={minScore || 0} onChange={e => setMinScore(e.target.value)} className="empire-slider" />
              </div>
              <div className="filter-group">
                <span className="filter-label">Unapproved Titles</span>
                <label className="empire-switch">
                  <input type="checkbox" checked={isUnapproved} onChange={e => setIsUnapproved(e.target.checked)} />
                  <span className="switch-slider"></span>
                </label>
              </div>
            </div>

            <div className="filter-group">
              <span className="filter-label">Genres (Multiselect)</span>
              <div className="filter-options">
                {ACTIVE_GENRES.filter(g => MAIN_GENRES_SET.has(g.name.toLowerCase())).map(genre => (
                  <button
                    type="button"
                    key={`main-${genre.mal_id}`}
                    className={`tag ${activeGenres.includes(genre.name) ? 'active' : ''}`}
                    onClick={() => setActiveGenres(prev => prev.includes(genre.name) ? prev.filter(x => x !== genre.name) : [...prev, genre.name])}
                  >
                    {genre.name}
                  </button>
                ))}
                
                {showAllGenres && ACTIVE_GENRES.filter(g => !MAIN_GENRES_SET.has(g.name.toLowerCase())).map(genre => (
                  <button
                    type="button"
                    key={`extra-${genre.mal_id}`}
                    className={`tag ${activeGenres.includes(genre.name) ? 'active' : ''}`}
                    onClick={() => setActiveGenres(prev => prev.includes(genre.name) ? prev.filter(x => x !== genre.name) : [...prev, genre.name])}
                  >
                    {genre.name}
                  </button>
                ))}

                {ACTIVE_GENRES.filter(g => !MAIN_GENRES_SET.has(g.name.toLowerCase())).length > 0 && (
                  <button 
                    type="button" 
                    className="tag" 
                    style={{ borderStyle: 'dashed', borderColor: 'var(--gold)', background: 'transparent' }} 
                    onClick={() => setShowAllGenres(!showAllGenres)}
                  >
                    {showAllGenres ? '- Show Less' : '+ ' + Math.max(0, ACTIVE_GENRES.length - MAIN_GENRES_SET.size) + ' More'}
                  </button>
                )}
              </div>
            </div>

            <div className="filter-row-grid-high" style={{ marginTop: 24 }}>
              <div className="filter-group">
                <span className="filter-label">Format</span>
                <div className="filter-options">
                  {ACTIVE_FORMATS.map(f => (
                    <button type="button" key={f.value} className={`tag ${activeFormat === f.value ? 'active' : ''}`} onClick={() => setActiveFormat(f.value)}>{f.label}</button>
                  ))}
                </div>
              </div>
              <div className="filter-group">
                <span className="filter-label">Content Rating</span>
                <div className="filter-options">
                  {RATINGS.map(r => (
                    <button type="button" key={r.value} className={`tag ${activeRating === r.value ? 'active' : ''}`} onClick={() => setActiveRating(r.value)}>{r.label}</button>
                  ))}
                </div>
              </div>
            </div>

            <div className="filter-row-grid">
              <div className="filter-group">
                <span className="filter-label">Status</span>
                <div className="filter-options">
                  {ACTIVE_STATUSES.map(s => (
                    <button type="button" key={s} className={`tag ${activeStatus === s ? 'active' : ''}`} onClick={() => setActiveStatus(s)}>{s}</button>
                  ))}
                </div>
              </div>
              <div className="filter-group">
                <span className="filter-label">Producers (MAL IDs, e.g. 1, 2)</span>
                <input className="input" style={{ height: 42 }} placeholder="1, 10, 15..." value={producers} onChange={e => setProducers(e.target.value)} />
              </div>
            </div>

            <div className="filter-row-grid-high" style={{ marginTop: 20 }}>
              <div className="filter-group">
                <span className="filter-label">Season</span>
                <select className="input" style={{ width: '100%', height: 42 }} value={activeSeason} onChange={e => setActiveSeason(e.target.value)}>
                  <option value="">Any</option>
                  <option value="winter">Winter</option>
                  <option value="spring">Spring</option>
                  <option value="summer">Summer</option>
                  <option value="fall">Fall</option>
                </select>
              </div>
              <div className="filter-group">
                <span className="filter-label">Year</span>
                <select className="input" style={{ width: '100%', height: 42 }} value={activeYear} onChange={e => setActiveYear(e.target.value)}>
                  <option value="">Any</option>
                  {Array.from({ length: 75 }, (_, i) => new Date().getFullYear() + 2 - i).map(y => <option key={`year-${y}`} value={y}>{y}</option>)}
                </select>
              </div>
            </div>

            <div className="filter-drawer-footer">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setActiveGenres([]); setMinScore(''); setActiveFormat(''); setActiveRating(''); setActiveStatus('All'); setSearchQuery('');
                  setProducers(''); setActiveSeason(''); setActiveYear(''); setIsUnapproved(false);
                }}
              >
                Reset All
              </button>
              <button type="submit" className="btn btn-primary">
                Apply Filters
              </button>
            </div>
          </form>
        )}

        <div className="sort-bar">
          <span className="result-count">Showing <strong>{items.length}</strong> items • Page <strong>{currentPage}</strong></span>
          <div className="sort-options">
            {['Popularity', 'Rating', 'Newest', 'A-Z'].map(s => (
              <button
                key={s}
                className={`tag ${activeSort === s ? 'active' : ''}`}
                style={{ fontSize: '0.7rem' }}
                onClick={() => setActiveSort(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="section" style={{ paddingTop: 0 }}>
        {loading ? (
          <div className="anime-grid">
            {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : error ? (
          <div className="imperial-feedback-zone">
            <IconWifiOff size={100} color="var(--gold)" style={{ marginBottom: 32, opacity: 0.8 }} />
            <h2>Something went wrong</h2>
            <p>{error === 'unreachable' ? 'Please try again. If the issue persists, please contact the developer.' : error}</p>
            <button className="btn btn-primary" onClick={loadContent} style={{ marginTop: 24 }}>
              Try Reconnecting
            </button>
          </div>
        ) : sortedItems.length > 0 ? (
          <>
            <div className="anime-grid">
              {sortedItems.map((item, idx) => <AnimeCard key={`${activeCategory}-${item.id}-${idx}`} item={item} type={isManga ? 'manga' : 'anime'} />)}
            </div>

            <div className="pagination-wrapper">
              <div className="empire-pagination">
                <Link
                  className={`page-box edge ${currentPage === 1 ? 'disabled' : ''}`}
                  to={getPageLink(currentPage - 1)}
                  onClick={(e) => { if (currentPage === 1) e.preventDefault(); else handlePageChange(currentPage - 1) }}
                >
                  <IconChevronLeft size={18} />
                </Link>
                {getPageNumbers().map((num, idx) => (
                  num === '...' ? <span key={`dots-${idx}`} className="page-dots">...</span> :
                    <Link
                      key={`page-${num}`}
                      className={`page-box ${currentPage === num ? 'active' : ''}`}
                      to={getPageLink(num)}
                      onClick={() => handlePageChange(num)}
                    >
                      {num}
                    </Link>
                ))}
                <Link
                  className={`page-box edge ${!pagination.has_next_page ? 'disabled' : ''}`}
                  to={getPageLink(currentPage + 1)}
                  onClick={(e) => { if (!pagination.has_next_page) e.preventDefault(); else handlePageChange(currentPage + 1) }}
                >
                  <IconChevronRight size={18} />
                </Link>
              </div>
            </div>
          </>
        ) : (
          <div className="imperial-feedback-zone">
            <img src="/cartoon_lost_corner_crates_1775592227188-removebg-preview.png" alt="No results" className="hero-img" />
            <h2>Library archive empty for this query</h2>
            <p>Our scouts couldn't find any records matching your specific search parameters.</p>
            <button className="btn btn-ghost" onClick={() => { setSearchQuery(''); handleApplyFilters(); }} style={{ marginTop: 16 }}>
              Clear Search
            </button>
          </div>
        )}
      </div>

      <style>{`
        .search-bar-row {
          display: flex; gap: 12px; margin-bottom: 20px; align-items: stretch; flex-wrap: wrap;
          transform: translateZ(0);
          will-change: transform;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .discovery-pill-group {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          white-space: nowrap;
          scrollbar-width: none;
          -ms-overflow-style: none;
          -webkit-overflow-scrolling: touch;
          padding-bottom: 4px;
          width: 100%;
        }
        .discovery-pill-group::-webkit-scrollbar {
          display: none;
        }
        .discovery-pill-group .tag {
          flex-shrink: 0;
          text-decoration: none;
          cursor: pointer;
        }
        .search-actions-row {
          display: flex;
          gap: 12px;
          transform: translateZ(0);
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .browse-search-wrapper { position: relative; display: flex; align-items: center; }
        
        .search-confirm-btn {
          position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
          width: 32px; height: 32px; border-radius: 6px; background: var(--bg-surface);
          border: 1px solid var(--border-default); color: var(--gold);
          display: flex; align-items: center; justify-content: center; cursor: pointer;
          transition: all 0.2s;
        }
        .search-confirm-btn:hover { background: var(--gold); color: #000; }
        
        .random-discovery-btn.randomizing svg { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }

        .filter-drawer {
          background: var(--bg-card); border: 1px solid var(--border-default);
          border-radius: 12px; padding: 24px; margin-bottom: 24px;
          box-shadow: var(--shadow-gold);
          isolation: isolate;
          contain: layout style;
          transform: translateZ(0);
          will-change: transform, opacity;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }

        .random-discovery-btn, .adv-filters-btn {
          transform: translateZ(0);
          will-change: transform;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .filter-top-controls { display: flex; gap: 40px; margin-bottom: 24px; align-items: center; }
        .filter-group { display: flex; flex-direction: column; gap: 10px; }
        .filter-label { font-size: 0.7rem; color: var(--gold); font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.8; }
        .filter-options { display: flex; flex-wrap: wrap; gap: 8px; }
        .filter-drawer-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 32px; padding-top: 20px; border-top: 1px solid var(--border-subtle); }

        .empire-switch { position: relative; display: inline-block; width: 44px; height: 24px; }
        .empire-switch input { opacity: 0; width: 0; height: 0; }
        .switch-slider {
          position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
          background-color: var(--bg-surface); border: 1px solid var(--border-default);
          transition: .4s; border-radius: 34px;
        }
        .switch-slider:before {
          position: absolute; content: ""; height: 16px; width: 16px; left: 3px; bottom: 3px;
          background-color: var(--text-muted); transition: .4s; border-radius: 50%;
        }
        input:checked + .switch-slider { background-color: var(--gold-faded); border-color: var(--gold); }
        input:checked + .switch-slider:before { transform: translateX(20px); background-color: var(--gold); }

        .empire-slider {
          -webkit-appearance: none; width: 100%; height: 6px; border-radius: 5px;
          background: var(--bg-surface); outline: none; border: 1px solid var(--border-default);
        }
        .empire-slider::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none; width: 18px; height: 18px;
          border-radius: 50%; background: var(--gold); cursor: pointer; box-shadow: var(--shadow-gold);
        }



        .filter-row-grid-high { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
        .filter-row-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }

        .pagination-wrapper { display: flex; justify-content: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid var(--border-subtle); }
        .empire-pagination { display: flex; gap: 8px; align-items: center; }
        .page-box {
          width: 40px; height: 40px; border-radius: 6px; background: var(--bg-card);
          border: 1px solid var(--border-default); color: var(--text-secondary);
          display: flex; align-items: center; justify-content: center; cursor: pointer;
          font-weight: 700; transition: all 0.2s; text-decoration: none;
        }
        .page-box:hover:not(.disabled) { border-color: var(--gold); color: var(--gold); transform: translateY(-2px); }
        .page-box.active { background: var(--gold); color: #000; border-color: var(--gold); box-shadow: var(--shadow-gold); }
        .page-box.edge { color: var(--gold); }
        .page-box.disabled { opacity: 0.3; pointer-events: none; cursor: not-allowed; }
        .page-dots { color: var(--text-muted); }

        .sort-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .result-count { font-size: 0.85rem; color: var(--text-muted); }
        .result-count strong { color: var(--gold); }
        .sort-options { display: flex; gap: 14px; flex-wrap: wrap; }

        .imperial-feedback-zone {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          min-height: 500px; padding: 40px; text-align: center;
          animation: fadeIn 0.5s ease;
        }
        .imperial-feedback-zone .hero-img {
          width: 250px; margin-bottom: 32px;
          filter: drop-shadow(0 0 20px rgba(var(--gold-rgb), 0.2));
        }
        .imperial-feedback-zone h2 {
          color: var(--text-secondary); margin-bottom: 12px; font-weight: 800; letter-spacing: -0.02em;
        }
        .imperial-feedback-zone p {
          color: var(--text-muted); max-width: 400px; line-height: 1.6; font-size: 0.95rem;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 900px) {
          .filter-row-grid-high, .filter-row-grid { grid-template-columns: 1fr; gap: 16px; }
          .filter-top-controls { flex-direction: column; align-items: flex-start; gap: 20px; }
          .sort-bar { flex-direction: column; align-items: center; gap: 16px; text-align: center; }
          .sort-options { justify-content: center; }
        }
        @media (max-width: 600px) {
          .search-bar-row { flex-direction: column; gap: 12px; }
          .browse-search-wrapper { width: 100%; flex: none !important; }
          .search-actions-row { display: flex; width: 100%; gap: 12px; }
          .search-actions-row .tag { flex: 1; justify-content: center; }
          .filter-drawer-header { flex-direction: column; gap: 12px; align-items: flex-start; }
          .filter-drawer-footer { flex-direction: column-reverse; gap: 12px; }
          .filter-drawer-footer .btn { width: 100%; }
        }
      `}</style>
    </div>
  )
}
