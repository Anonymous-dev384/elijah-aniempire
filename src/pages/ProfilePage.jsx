import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useRPGStore, FACTIONS } from '../store/rpgStore'
import {
  IconUser, IconUsers, IconMail, IconHeart, IconMessage,
  IconFire, IconStar, IconTrophy, IconShield, IconZap, IconTarget, IconAward,
  IconGem, IconCoins, IconSparkles, IconCheck, IconEye,
  IconCalendar, IconTrendUp, IconClock, IconSword, IconBook,
  IconFilm, IconTv, IconPlay, IconPenLine, CrownIcon, IconSettings
} from '../components/Icons'

// ── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_CURRENTLY_WATCHING = [
  { id: 1, title: 'Frieren: Beyond Journey\'s End', ep: 8, total: 28, color: '#4A8FCC' },
  { id: 2, title: 'Dungeon Meshi', ep: 14, total: 24, color: '#45A35E' },
]

const MOCK_FAVORITES = [
  { id: 1, title: 'Fullmetal Alchemist: Brotherhood', color: '#D4A843' },
  { id: 2, title: 'Steins;Gate', color: '#8B52C4' },
  { id: 3, title: 'Hunter x Hunter', color: '#D93B3B' },
]

const MOCK_ACHIEVEMENTS = [
  { id: 1, icon: '🏆', name: 'Century Club', desc: '100 anime completed', xp: 500, date: 'Jan 12, 2025' },
  { id: 2, icon: '🔥', name: '30-Day Streak', desc: 'Logged in 30 days straight', xp: 300, date: 'Dec 28, 2024' },
  { id: 3, icon: '⭐', name: 'Critic', desc: 'Wrote 10 reviews', xp: 200, date: 'Dec 15, 2024' },
  { id: 4, icon: '🎭', name: 'Genre Hopper', desc: 'Watched 10 different genres', xp: 150, date: 'Nov 30, 2024' },
  { id: 5, icon: '💬', name: 'Social Butterfly', desc: 'Sent 500 messages', xp: 100, date: 'Nov 10, 2024' },
  { id: 6, icon: '📖', name: 'Manga Maven', desc: 'Read 50 manga chapters', xp: 200, date: 'Oct 25, 2024' },
  { id: 7, icon: '🌙', name: 'Night Owl', desc: 'Watched 5 episodes after midnight', xp: 75, date: 'Oct 14, 2024' },
  { id: 8, icon: '🎵', name: 'Audiophile', desc: 'Played 100 anime tracks', xp: 100, date: 'Sep 20, 2024' },
]

const MOCK_WATCHLIST = [
  { id: 1, title: 'Solo Leveling S2', airDate: 'Jul 2025', color: '#8B52C4' },
  { id: 2, title: 'Chainsaw Man S2', airDate: 'Oct 2025', color: '#D93B3B' },
  { id: 3, title: 'Jujutsu Kaisen S3', airDate: 'Apr 2025', color: '#4A8FCC' },
  { id: 4, title: 'Bleach: TYBW Part 4', airDate: 'Jul 2025', color: '#D4A843' },
]

const MOCK_RECENT_ACTIVITY = [
  { id: 1, icon: '⭐', text: 'Rated Attack on Titan', detail: '10/10', time: '2h ago', color: '#D4A843' },
  { id: 2, icon: '✅', text: 'Completed Demon Slayer S3', detail: null, time: '1 day ago', color: '#45A35E' },
  { id: 3, icon: '▶', text: 'Watched Frieren Ep 8', detail: null, time: '1 day ago', color: '#4A8FCC' },
  { id: 4, icon: '📖', text: 'Read Berserk Ch. 374', detail: null, time: '2 days ago', color: '#A89878' },
  { id: 5, icon: '💬', text: 'Reviewed Vinland Saga', detail: '9/10', time: '3 days ago', color: '#8B52C4' },
  { id: 6, icon: '➕', text: 'Added One Piece to Watchlist', detail: null, time: '4 days ago', color: '#4A8FCC' },
  { id: 7, icon: '🏆', text: 'Earned Achievement: Century Club', detail: '+500 XP', time: '5 days ago', color: '#D4A843' },
  { id: 8, icon: '🔥', text: 'Reached 14-day Streak', detail: '+150 XP', time: '1 week ago', color: '#D93B3B' },
]

const MOCK_ANIME_LIST = [
  { id: 1, title: 'Attack on Titan', status: 'Completed', score: 10, ep: 87, total: 87, color: '#D93B3B' },
  { id: 2, title: 'Fullmetal Alchemist: Brotherhood', status: 'Completed', score: 10, ep: 64, total: 64, color: '#D4A843' },
  { id: 3, title: 'Frieren: Beyond Journey\'s End', status: 'Watching', score: 9, ep: 8, total: 28, color: '#4A8FCC' },
  { id: 4, title: 'Dungeon Meshi', status: 'Watching', score: 9, ep: 14, total: 24, color: '#45A35E' },
  { id: 5, title: 'Vinland Saga', status: 'Completed', score: 9, ep: 48, total: 48, color: '#8B52C4' },
  { id: 6, title: 'Solo Leveling', status: 'Plan to Watch', score: null, ep: 0, total: 12, color: '#8B52C4' },
  { id: 7, title: 'Berserk', status: 'Dropped', score: 7, ep: 12, total: 25, color: '#665C46' },
  { id: 8, title: 'Demon Slayer', status: 'Completed', score: 8, ep: 55, total: 55, color: '#D93B3B' },
]

const MOCK_REVIEWS = [
  {
    id: 1,
    title: 'Attack on Titan: The Final Season',
    date: 'Jan 10, 2025',
    score: 10,
    color: '#D93B3B',
    excerpt: 'A masterpiece that redefined what anime could achieve in storytelling. The Final Season takes every established character and subjects them to moral ambiguity that challenges the viewer at every turn. The animation quality during key battle sequences is simply unmatched in the medium.',
    helpful: 42,
  },
  {
    id: 2,
    title: 'Vinland Saga Season 2',
    date: 'Dec 5, 2024',
    score: 9,
    color: '#8B52C4',
    excerpt: 'Season 2 is a bold pivot that some viewers may struggle with initially — there are almost no fight scenes for the first half. But what it delivers instead is a profound exploration of trauma, redemption, and what it truly means to seek peace. Askeladd\'s shadow looms large.',
    helpful: 27,
  },
  {
    id: 3,
    title: 'Frieren: Beyond Journey\'s End',
    date: 'Nov 22, 2024',
    score: 9,
    color: '#4A8FCC',
    excerpt: 'Frieren is a rare anime that uses its fantasy setting to explore deeply human themes about memory, grief, and what we leave behind. The slow pace is deliberate — it mirrors Frieren\'s perception of time — and the payoffs are emotionally devastating. The magic system is imaginative.',
    helpful: 19,
  },
]

const MOCK_ACTIVITY_TIMELINE = [
  { id: 1, text: 'Rated Attack on Titan 10/10', date: 'Jan 14, 2025', color: '#D4A843' },
  { id: 2, text: 'Completed Demon Slayer Season 3', date: 'Jan 13, 2025', color: '#45A35E' },
  { id: 3, text: 'Watched Frieren Episode 8', date: 'Jan 13, 2025', color: '#4A8FCC' },
  { id: 4, text: 'Read Berserk Chapter 374', date: 'Jan 12, 2025', color: '#A89878' },
  { id: 5, text: 'Wrote review for Vinland Saga S2', date: 'Jan 11, 2025', color: '#8B52C4' },
  { id: 6, text: 'Joined Guild: Dragon\'s Roar', date: 'Jan 10, 2025', color: '#D4A843' },
  { id: 7, text: 'Earned Achievement: Century Club', date: 'Jan 10, 2025', color: '#D4A843' },
  { id: 8, text: 'Added Solo Leveling to Watchlist', date: 'Jan 9, 2025', color: '#4A8FCC' },
  { id: 9, text: 'Completed Attack on Titan Final Season', date: 'Jan 8, 2025', color: '#45A35E' },
  { id: 10, text: 'Reached 14-Day Login Streak', date: 'Jan 7, 2025', color: '#D93B3B' },
]

// Generate heatmap data: 84 days of activity (12 rows × 7 cols)
const HEATMAP_DATA = Array.from({ length: 84 }, (_, i) => ({
  id: i,
  intensity: Math.random(),
}))

const STATUS_COLORS = {
  'Watching': '#4A8FCC',
  'Completed': '#45A35E',
  'Plan to Watch': '#8B52C4',
  'Dropped': '#D93B3B',
}

// ── Component ────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { username: paramUsername } = useParams()
  const navigate = useNavigate()
  const { level, xpIntoLevel, xpForNext, title, faction, streak, credits, gems, username: storeUsername } = useRPGStore()

  const [activeTab, setActiveTab] = useState('overview')
  const [animeFilter, setAnimeFilter] = useState('All')
  const [followed, setFollowed] = useState(false)

  const displayUsername = paramUsername || storeUsername || 'ShonenLord'
  const isOwnProfile = !paramUsername || paramUsername === storeUsername

  const factionData = faction ? FACTIONS[faction] : FACTIONS.shonen
  const xpPercent = xpForNext > 0 ? Math.round((xpIntoLevel / xpForNext) * 100) : 0

  const filteredAnime = animeFilter === 'All'
    ? MOCK_ANIME_LIST
    : MOCK_ANIME_LIST.filter(a => a.status === animeFilter)

  const TABS = ['Overview', 'Anime List', 'Reviews', 'Achievements', 'Activity']

  return (
    <div className="profile-page">
      <style>{`
        .profile-page {
          min-height: 100vh;
          background: var(--bg-primary);
          padding-bottom: 60px;
        }

        /* ── Banner ── */
        .profile-banner {
          position: relative;
          width: 100%;
          height: 240px;
          overflow: hidden;
          background: linear-gradient(135deg, #0A0908, #1A1815);
        }
        .profile-banner-gradient {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            120deg,
            #D4A843 0%,
            #8B52C4 25%,
            #00D9FF 50%,
            #D93B3B 75%,
            #D4A843 100%
          );
          background-size: 300% 300%;
          animation: bannerShift 8s ease infinite;
          opacity: 0.35;
        }
        @keyframes bannerShift {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .profile-banner-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(10,9,8,0) 0%,
            rgba(10,9,8,0.7) 100%
          );
        }
        .banner-pattern {
          position: absolute;
          inset: 0;
          background-image:
            radial-gradient(circle at 20% 50%, rgba(212,168,67,0.12) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(139,82,196,0.15) 0%, transparent 50%),
            radial-gradient(circle at 60% 80%, rgba(0,217,255,0.08) 0%, transparent 50%);
        }
        .banner-top-actions {
          position: absolute;
          top: 16px;
          right: 20px;
          display: flex;
          gap: 10px;
          z-index: 10;
        }
        .banner-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: var(--radius-full);
          font-size: 0.82rem;
          font-family: var(--font-body);
          font-weight: 700;
          cursor: pointer;
          transition: all var(--transition-fast);
          border: 1px solid rgba(212,168,67,0.3);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
        .banner-btn-follow {
          background: rgba(212,168,67,0.15);
          color: var(--gold);
        }
        .banner-btn-follow:hover {
          background: rgba(212,168,67,0.3);
          border-color: var(--gold);
          box-shadow: 0 0 12px rgba(212,168,67,0.3);
        }
        .banner-btn-follow.followed {
          background: rgba(69,163,94,0.2);
          color: #45A35E;
          border-color: rgba(69,163,94,0.4);
        }
        .banner-btn-msg {
          background: rgba(20,18,16,0.6);
          color: var(--text-secondary);
        }
        .banner-btn-msg:hover {
          background: rgba(30,27,24,0.8);
          color: var(--text-primary);
          border-color: rgba(212,168,67,0.4);
        }
        .banner-views-badge {
          position: absolute;
          bottom: 14px;
          right: 20px;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: var(--radius-full);
          background: rgba(10,9,8,0.6);
          border: 1px solid rgba(212,168,67,0.2);
          backdrop-filter: blur(8px);
          font-size: 0.78rem;
          color: var(--text-secondary);
          font-family: var(--font-body);
        }

        /* ── Avatar ── */
        .profile-avatar-wrap {
          position: absolute;
          bottom: -48px;
          left: 32px;
          z-index: 20;
        }
        .profile-avatar {
          width: 96px;
          height: 96px;
          border-radius: 50%;
          background: linear-gradient(135deg, #1A1815 0%, #28251F 100%);
          border: 3px solid var(--gold);
          box-shadow: 0 0 0 2px rgba(10,9,8,1), 0 0 20px rgba(212,168,67,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.4rem;
          overflow: hidden;
          transition: box-shadow var(--transition-base);
        }
        .profile-avatar:hover {
          box-shadow: 0 0 0 2px rgba(10,9,8,1), 0 0 32px rgba(212,168,67,0.6);
        }
        .profile-avatar-inner {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #201E1A 0%, #141210 100%);
          font-size: 2.2rem;
        }

        /* ── User Info Row ── */
        .profile-info-row {
          max-width: 1200px;
          margin: 0 auto;
          padding: 64px 32px 28px;
        }
        .profile-name-line {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 8px;
        }
        .profile-username {
          font-family: var(--font-heading);
          font-size: 1.8rem;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.2;
        }
        .level-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 12px;
          border-radius: var(--radius-full);
          background: linear-gradient(135deg, rgba(212,168,67,0.2), rgba(212,168,67,0.08));
          border: 1px solid rgba(212,168,67,0.4);
          color: var(--gold);
          font-size: 0.78rem;
          font-weight: 700;
          font-family: var(--font-heading);
          letter-spacing: 0.05em;
        }
        .faction-tag {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 12px;
          border-radius: var(--radius-full);
          font-size: 0.75rem;
          font-weight: 700;
          font-family: var(--font-body);
          border: 1px solid;
          opacity: 0.9;
        }
        .profile-title {
          font-style: italic;
          color: var(--gold);
          font-size: 0.9rem;
          font-family: var(--font-body);
          opacity: 0.85;
          margin-bottom: 10px;
        }
        .profile-bio {
          color: var(--text-secondary);
          font-family: var(--font-body);
          font-size: 0.9rem;
          line-height: 1.6;
          max-width: 600px;
          margin-bottom: 16px;
        }
        .profile-stats-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 16px;
        }
        .stat-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: var(--radius-full);
          background: var(--bg-elevated);
          border: 1px solid var(--border-subtle);
          color: var(--text-secondary);
          font-size: 0.8rem;
          font-family: var(--font-body);
          font-weight: 600;
          transition: all var(--transition-fast);
        }
        .stat-pill:hover {
          border-color: var(--border-hover);
          background: var(--bg-hover);
          color: var(--text-primary);
        }
        .stat-pill span:first-child {
          font-size: 0.95em;
        }
        .profile-xp-section {
          max-width: 500px;
        }
        .profile-xp-label {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
          font-size: 0.75rem;
          font-family: var(--font-body);
          color: var(--text-muted);
        }
        .profile-xp-bar {
          height: 6px;
          background: var(--bg-surface);
          border-radius: var(--radius-full);
          overflow: hidden;
          border: 1px solid var(--border-subtle);
        }
        .profile-xp-fill {
          height: 100%;
          border-radius: var(--radius-full);
          background: linear-gradient(90deg, var(--gold-dark), var(--gold));
          box-shadow: 0 0 8px rgba(212,168,67,0.4);
          transition: width 1s ease;
        }

        /* ── Container ── */
        .profile-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 32px;
        }

        /* ── Widgets Grid ── */
        .showcase-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
          margin-bottom: 32px;
        }
        @media (max-width: 1024px) {
          .showcase-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 640px) {
          .showcase-grid { grid-template-columns: 1fr; }
          .profile-info-row { padding: 64px 16px 24px; }
          .profile-content { padding: 0 16px; }
          .banner-top-actions { top: 10px; right: 10px; gap: 6px; }
          .banner-btn { padding: 6px 12px; font-size: 0.75rem; }
          .profile-avatar-wrap { left: 16px; }
        }
        .widget-card {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          padding: 18px;
          min-height: 200px;
          transition: border-color var(--transition-base), box-shadow var(--transition-base);
        }
        .widget-card:hover {
          border-color: var(--border-hover);
          box-shadow: var(--shadow-card);
        }
        .widget-title {
          font-family: var(--font-heading);
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 14px;
          display: flex;
          align-items: center;
          gap: 7px;
        }
        .widget-title-icon {
          color: var(--gold);
          opacity: 0.8;
        }

        /* Currently Watching */
        .watching-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px;
          border-radius: var(--radius-md);
          background: var(--bg-elevated);
          border: 1px solid var(--border-subtle);
          margin-bottom: 10px;
          transition: all var(--transition-fast);
        }
        .watching-item:last-child { margin-bottom: 0; }
        .watching-item:hover { border-color: var(--border-hover); background: var(--bg-hover); }
        .anime-cover-placeholder {
          flex-shrink: 0;
          width: 44px;
          height: 60px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.3rem;
          border: 1px solid rgba(255,255,255,0.06);
        }
        .watching-info { flex: 1; min-width: 0; }
        .watching-title {
          font-family: var(--font-body);
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: 4px;
        }
        .ep-badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: var(--radius-full);
          background: rgba(74,143,204,0.15);
          border: 1px solid rgba(74,143,204,0.3);
          color: #4A8FCC;
          font-size: 0.7rem;
          font-weight: 700;
          font-family: var(--font-body);
        }

        /* Favorites */
        .favorites-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }
        .fav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 7px;
          text-align: center;
        }
        .fav-cover {
          width: 100%;
          aspect-ratio: 2/3;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.6rem;
          border: 1px solid rgba(255,255,255,0.06);
          transition: transform var(--transition-fast);
        }
        .fav-cover:hover { transform: scale(1.04); }
        .fav-title {
          font-size: 0.7rem;
          font-family: var(--font-body);
          color: var(--text-secondary);
          line-height: 1.3;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        /* Recent Achievements */
        .achievement-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px;
          border-radius: var(--radius-md);
          background: var(--bg-elevated);
          border: 1px solid var(--border-subtle);
          margin-bottom: 8px;
          transition: all var(--transition-fast);
        }
        .achievement-item:last-child { margin-bottom: 0; }
        .achievement-item:hover { border-color: rgba(212,168,67,0.3); background: var(--bg-hover); }
        .achievement-emoji {
          font-size: 1.6rem;
          flex-shrink: 0;
          width: 36px;
          text-align: center;
        }
        .achievement-info { flex: 1; min-width: 0; }
        .achievement-name {
          font-size: 0.82rem;
          font-weight: 700;
          font-family: var(--font-body);
          color: var(--text-primary);
        }
        .achievement-date {
          font-size: 0.7rem;
          color: var(--text-muted);
          font-family: var(--font-body);
        }

        /* Guild Widget */
        .guild-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 14px;
        }
        .guild-emblem {
          width: 52px;
          height: 52px;
          border-radius: var(--radius-md);
          background: linear-gradient(135deg, rgba(212,168,67,0.2), rgba(139,82,196,0.2));
          border: 1px solid rgba(212,168,67,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.6rem;
        }
        .guild-info { flex: 1; }
        .guild-name {
          font-family: var(--font-heading);
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 2px;
        }
        .guild-sub {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-family: var(--font-body);
        }
        .guild-stats-row {
          display: flex;
          gap: 12px;
          margin-bottom: 12px;
        }
        .guild-stat {
          flex: 1;
          text-align: center;
          padding: 8px;
          background: var(--bg-elevated);
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-subtle);
        }
        .guild-stat-val {
          font-family: var(--font-heading);
          font-size: 1rem;
          font-weight: 700;
          color: var(--gold);
          display: block;
        }
        .guild-stat-label {
          font-size: 0.65rem;
          color: var(--text-muted);
          font-family: var(--font-body);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .guild-xp-bar {
          height: 5px;
          background: var(--bg-surface);
          border-radius: var(--radius-full);
          overflow: hidden;
          margin-top: 6px;
        }
        .guild-xp-fill {
          height: 100%;
          width: 68%;
          background: linear-gradient(90deg, #8B52C4, #D4A843);
          border-radius: var(--radius-full);
        }

        /* Watchlist Widget */
        .watchlist-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 0;
          border-bottom: 1px solid var(--border-subtle);
          font-family: var(--font-body);
        }
        .watchlist-item:last-child { border-bottom: none; }
        .watchlist-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .watchlist-title {
          flex: 1;
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .watchlist-date {
          font-size: 0.72rem;
          color: var(--text-muted);
          flex-shrink: 0;
        }

        /* Heatmap Widget */
        .heatmap-grid {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          grid-template-rows: repeat(7, 1fr);
          gap: 3px;
          grid-auto-flow: column;
        }
        .heatmap-cell {
          aspect-ratio: 1;
          border-radius: 2px;
          transition: transform var(--transition-fast);
        }
        .heatmap-cell:hover {
          transform: scale(1.5);
          z-index: 2;
        }
        .heatmap-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 10px;
        }
        .heatmap-label {
          font-size: 0.68rem;
          color: var(--text-muted);
          font-family: var(--font-body);
        }
        .heatmap-legend {
          display: flex;
          align-items: center;
          gap: 3px;
        }
        .heatmap-legend-cell {
          width: 10px;
          height: 10px;
          border-radius: 2px;
        }
        .heatmap-legend-text {
          font-size: 0.65rem;
          color: var(--text-muted);
          font-family: var(--font-body);
          margin: 0 3px;
        }

        /* ── Tabs ── */
        .profile-tabs {
          display: flex;
          gap: 2px;
          border-bottom: 1px solid var(--border-subtle);
          margin-bottom: 28px;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .profile-tabs::-webkit-scrollbar { display: none; }
        .profile-tab {
          padding: 12px 20px;
          border: none;
          background: transparent;
          color: var(--text-muted);
          font-family: var(--font-heading);
          font-size: 0.82rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          cursor: pointer;
          position: relative;
          white-space: nowrap;
          transition: color var(--transition-fast);
        }
        .profile-tab:hover { color: var(--text-secondary); }
        .profile-tab.active {
          color: var(--gold);
        }
        .profile-tab.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--gold);
          border-radius: 2px 2px 0 0;
          box-shadow: 0 0 8px rgba(212,168,67,0.5);
        }

        /* ── Overview Tab ── */
        .activity-list { display: flex; flex-direction: column; gap: 10px; }
        .activity-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px 16px;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          transition: all var(--transition-fast);
        }
        .activity-item:hover { border-color: var(--border-hover); background: var(--bg-elevated); }
        .activity-icon-wrap {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: var(--bg-surface);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          flex-shrink: 0;
          border: 1px solid var(--border-subtle);
        }
        .activity-text {
          flex: 1;
          font-family: var(--font-body);
          font-size: 0.85rem;
          color: var(--text-primary);
        }
        .activity-detail {
          font-weight: 700;
          color: var(--gold);
        }
        .activity-time {
          font-size: 0.73rem;
          color: var(--text-muted);
          font-family: var(--font-body);
          flex-shrink: 0;
        }

        /* ── Anime List Tab ── */
        .filter-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }
        .filter-btn {
          padding: 7px 16px;
          border-radius: var(--radius-full);
          border: 1px solid var(--border-subtle);
          background: var(--bg-card);
          color: var(--text-secondary);
          font-family: var(--font-body);
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .filter-btn:hover { border-color: var(--border-hover); color: var(--text-primary); background: var(--bg-elevated); }
        .filter-btn.active {
          background: rgba(212,168,67,0.12);
          border-color: rgba(212,168,67,0.4);
          color: var(--gold);
        }
        .anime-list-grid {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .anime-list-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          transition: all var(--transition-fast);
        }
        .anime-list-item:hover { border-color: var(--border-hover); background: var(--bg-elevated); }
        .anime-list-cover {
          width: 40px;
          height: 56px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.3rem;
          flex-shrink: 0;
          border: 1px solid rgba(255,255,255,0.06);
        }
        .anime-list-info { flex: 1; min-width: 0; }
        .anime-list-title {
          font-family: var(--font-body);
          font-size: 0.87rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .anime-list-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .status-badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: var(--radius-full);
          font-size: 0.68rem;
          font-weight: 700;
          font-family: var(--font-body);
          border: 1px solid;
        }
        .ep-info {
          font-size: 0.72rem;
          color: var(--text-muted);
          font-family: var(--font-body);
        }
        .score-stars {
          display: flex;
          align-items: center;
          gap: 2px;
          flex-shrink: 0;
        }
        .score-val {
          font-family: var(--font-heading);
          font-size: 1rem;
          font-weight: 700;
          color: var(--gold);
          min-width: 30px;
          text-align: right;
        }
        .score-na {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-family: var(--font-body);
          min-width: 30px;
          text-align: right;
        }

        /* ── Reviews Tab ── */
        .reviews-list { display: flex; flex-direction: column; gap: 18px; }
        .review-card {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          padding: 20px;
          display: flex;
          gap: 16px;
          transition: all var(--transition-fast);
        }
        .review-card:hover { border-color: var(--border-hover); box-shadow: var(--shadow-card); }
        .review-cover {
          width: 60px;
          height: 84px;
          border-radius: var(--radius-md);
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.8rem;
          border: 1px solid rgba(255,255,255,0.06);
        }
        .review-body { flex: 1; min-width: 0; }
        .review-title {
          font-family: var(--font-heading);
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 4px;
        }
        .review-meta {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
          flex-wrap: wrap;
        }
        .review-date {
          font-size: 0.72rem;
          color: var(--text-muted);
          font-family: var(--font-body);
        }
        .stars-row {
          display: flex;
          gap: 2px;
        }
        .star-icon {
          font-size: 0.85rem;
          color: var(--gold);
        }
        .star-icon.empty { color: var(--bg-hover); }
        .review-excerpt {
          font-family: var(--font-body);
          font-size: 0.83rem;
          color: var(--text-secondary);
          line-height: 1.65;
          margin-bottom: 12px;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
        }
        .helpful-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: var(--radius-full);
          border: 1px solid var(--border-subtle);
          background: var(--bg-elevated);
          color: var(--text-muted);
          font-size: 0.75rem;
          font-family: var(--font-body);
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .helpful-btn:hover {
          border-color: rgba(212,168,67,0.3);
          color: var(--gold);
          background: rgba(212,168,67,0.07);
        }
        @media (max-width: 480px) {
          .review-card { flex-direction: column; }
          .review-cover { width: 48px; height: 68px; }
        }

        /* ── Achievements Tab ── */
        .achievements-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 14px;
        }
        .achievement-card {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          padding: 18px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 8px;
          transition: all var(--transition-base);
        }
        .achievement-card:hover {
          border-color: rgba(212,168,67,0.35);
          box-shadow: 0 4px 20px rgba(212,168,67,0.1);
          transform: translateY(-2px);
        }
        .achievement-card-icon {
          font-size: 2.2rem;
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-elevated);
          border-radius: 50%;
          border: 1px solid rgba(212,168,67,0.2);
        }
        .achievement-card-name {
          font-family: var(--font-heading);
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        .achievement-card-desc {
          font-size: 0.72rem;
          color: var(--text-muted);
          font-family: var(--font-body);
          line-height: 1.4;
        }
        .achievement-card-xp {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 10px;
          border-radius: var(--radius-full);
          background: rgba(212,168,67,0.1);
          border: 1px solid rgba(212,168,67,0.25);
          color: var(--gold);
          font-size: 0.7rem;
          font-weight: 700;
          font-family: var(--font-body);
        }
        .achievement-card-date {
          font-size: 0.68rem;
          color: var(--text-muted);
          font-family: var(--font-body);
        }

        /* ── Activity Tab ── */
        .timeline-list {
          display: flex;
          flex-direction: column;
          position: relative;
          padding-left: 24px;
        }
        .timeline-list::before {
          content: '';
          position: absolute;
          left: 7px;
          top: 10px;
          bottom: 10px;
          width: 2px;
          background: var(--border-subtle);
          border-radius: 2px;
        }
        .timeline-item {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 12px 0;
          position: relative;
        }
        .timeline-dot {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          flex-shrink: 0;
          margin-top: 3px;
          position: absolute;
          left: -24px;
          border: 2px solid var(--bg-primary);
          box-shadow: 0 0 6px rgba(0,0,0,0.5);
        }
        .timeline-content {
          flex: 1;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 10px 14px;
          transition: border-color var(--transition-fast);
        }
        .timeline-content:hover { border-color: var(--border-hover); }
        .timeline-text {
          font-family: var(--font-body);
          font-size: 0.85rem;
          color: var(--text-primary);
          margin-bottom: 4px;
        }
        .timeline-date {
          font-size: 0.72rem;
          color: var(--text-muted);
          font-family: var(--font-body);
        }
      `}</style>

      {/* ── Banner ── */}
      <div className="profile-banner">
        <div className="profile-banner-gradient" />
        <div className="banner-pattern" />
        <div className="profile-banner-overlay" />

        {/* Follow / Message buttons */}
        <div className="banner-top-actions">
          {!isOwnProfile ? (
            <>
              <button
                className={`banner-btn banner-btn-follow${followed ? ' followed' : ''}`}
                onClick={() => setFollowed(f => !f)}
              >
                {followed ? <IconCheck size={13} /> : <IconHeart size={13} />}
                {followed ? 'Following' : 'Follow'}
              </button>
              <button className="banner-btn banner-btn-msg">
                <IconMessage size={13} />
                Message
              </button>
            </>
          ) : (
            <button className="banner-btn banner-btn-msg" onClick={() => navigate('/settings')}>
              <IconSettings size={13} />
              Edit Profile
            </button>
          )}
        </div>

        {/* Views badge */}
        <div className="banner-views-badge">
          <IconEye size={12} />
          142 views this week
        </div>

        {/* Avatar */}
        <div className="profile-avatar-wrap">
          <div className="profile-avatar">
            <div className="profile-avatar-inner">
              {factionData?.icon || '⚔️'}
            </div>
          </div>
        </div>
      </div>

      {/* ── User Info Row ── */}
      <div className="profile-info-row">
        <div className="profile-name-line">
          <h1 className="profile-username">{displayUsername}</h1>
          <span className="level-badge">
            <CrownIcon size={12} />
            Lv.{level}
          </span>
          {factionData && (
            <span
              className="faction-tag"
              style={{
                color: factionData.color,
                borderColor: `${factionData.color}40`,
                background: `${factionData.color}18`,
              }}
            >
              {factionData.icon} {factionData.label}
            </span>
          )}
        </div>

        <p className="profile-title">"{title}"</p>

        <p className="profile-bio">
          Anime connoisseur. Shonen enthusiast. Guild master of Dragon's Roar.
          On a mission to conquer every seasonal anime — one episode at a time.
        </p>

        {/* Stats Pills */}
        <div className="profile-stats-pills">
          <div className="stat-pill"><span>🎬</span><span>347 Anime</span></div>
          <div className="stat-pill"><span>📺</span><span>4,829 Eps</span></div>
          <div className="stat-pill"><span>📖</span><span>89 Manga</span></div>
          <div className="stat-pill"><span>⭐</span><span>23 Reviews</span></div>
          <div className="stat-pill"><span>🔥</span><span>{streak > 0 ? streak : 14}d Streak</span></div>
          <div className="stat-pill"><span>💰</span><span>{credits.toLocaleString()} Credits</span></div>
        </div>

        {/* XP Bar */}
        <div className="profile-xp-section">
          <div className="profile-xp-label">
            <span>XP Progress — Level {level}</span>
            <span>{xpIntoLevel} / {xpForNext} XP ({xpPercent}%)</span>
          </div>
          <div className="profile-xp-bar">
            <div className="profile-xp-fill" style={{ width: `${xpPercent}%` }} />
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="profile-content">

        {/* ── Showcase Widgets Grid ── */}
        <div className="showcase-grid">

          {/* Currently Watching */}
          <div className="widget-card">
            <div className="widget-title">
              <span className="widget-title-icon"><IconPlay size={13} /></span>
              Currently Watching
            </div>
            {MOCK_CURRENTLY_WATCHING.map(a => (
              <div key={a.id} className="watching-item">
                <div className="anime-cover-placeholder" style={{ background: `${a.color}18` }}>🎬</div>
                <div className="watching-info">
                  <div className="watching-title">{a.title}</div>
                  <span className="ep-badge">Ep {a.ep}/{a.total}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Favorites */}
          <div className="widget-card">
            <div className="widget-title">
              <span className="widget-title-icon"><IconHeart size={13} /></span>
              Favorites
            </div>
            <div className="favorites-grid">
              {MOCK_FAVORITES.map(a => (
                <div key={a.id} className="fav-item">
                  <div className="fav-cover" style={{ background: `${a.color}18` }}>⭐</div>
                  <span className="fav-title">{a.title}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Achievements */}
          <div className="widget-card">
            <div className="widget-title">
              <span className="widget-title-icon"><IconTrophy size={13} /></span>
              Recent Achievements
            </div>
            {MOCK_ACHIEVEMENTS.slice(0, 3).map(a => (
              <div key={a.id} className="achievement-item">
                <div className="achievement-emoji">{a.icon}</div>
                <div className="achievement-info">
                  <div className="achievement-name">{a.name}</div>
                  <div className="achievement-date">{a.desc} · {a.date}</div>
                </div>
              </div>
            ))}
          </div>

          {/* My Guild */}
          <div className="widget-card">
            <div className="widget-title">
              <span className="widget-title-icon"><IconShield size={13} /></span>
              My Guild
            </div>
            <div className="guild-header">
              <div className="guild-emblem">🐉</div>
              <div className="guild-info">
                <div className="guild-name">Dragon's Roar</div>
                <div className="guild-sub">Rank: Elite · Master</div>
              </div>
            </div>
            <div className="guild-stats-row">
              <div className="guild-stat">
                <span className="guild-stat-val">Lv.12</span>
                <span className="guild-stat-label">Guild Level</span>
              </div>
              <div className="guild-stat">
                <span className="guild-stat-val">48</span>
                <span className="guild-stat-label">Members</span>
              </div>
              <div className="guild-stat">
                <span className="guild-stat-val">#7</span>
                <span className="guild-stat-label">Rank</span>
              </div>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginBottom: 4 }}>
              Guild XP: 68,420 / 100,000
            </div>
            <div className="guild-xp-bar">
              <div className="guild-xp-fill" />
            </div>
          </div>

          {/* Watchlist */}
          <div className="widget-card">
            <div className="widget-title">
              <span className="widget-title-icon"><IconCalendar size={13} /></span>
              Watchlist
            </div>
            {MOCK_WATCHLIST.map(w => (
              <div key={w.id} className="watchlist-item">
                <div className="watchlist-dot" style={{ background: w.color, boxShadow: `0 0 6px ${w.color}60` }} />
                <span className="watchlist-title">{w.title}</span>
                <span className="watchlist-date">{w.airDate}</span>
              </div>
            ))}
          </div>

          {/* Activity Heatmap */}
          <div className="widget-card">
            <div className="widget-title">
              <span className="widget-title-icon"><IconTrendUp size={13} /></span>
              Activity Heatmap
            </div>
            <div className="heatmap-grid">
              {HEATMAP_DATA.map(cell => {
                const opacity = 0.08 + cell.intensity * 0.85
                return (
                  <div
                    key={cell.id}
                    className="heatmap-cell"
                    title={`${Math.round(cell.intensity * 10)} activities`}
                    style={{
                      background: cell.intensity < 0.15
                        ? 'var(--bg-surface)'
                        : `rgba(212, 168, 67, ${opacity})`,
                      border: cell.intensity > 0.7 ? '1px solid rgba(212,168,67,0.4)' : '1px solid transparent',
                    }}
                  />
                )
              })}
            </div>
            <div className="heatmap-footer">
              <span className="heatmap-label">Last 84 days</span>
              <div className="heatmap-legend">
                <span className="heatmap-legend-text">Less</span>
                {[0.1, 0.3, 0.55, 0.75, 0.95].map((op, i) => (
                  <div
                    key={i}
                    className="heatmap-legend-cell"
                    style={{ background: `rgba(212,168,67,${op})` }}
                  />
                ))}
                <span className="heatmap-legend-text">More</span>
              </div>
            </div>
          </div>

        </div>{/* /showcase-grid */}

        {/* ── Tabs ── */}
        <div className="profile-tabs">
          {TABS.map(tab => (
            <button
              key={tab}
              className={`profile-tab${activeTab === tab.toLowerCase().replace(' ', '-') ? ' active' : ''}`}
              onClick={() => setActiveTab(tab.toLowerCase().replace(' ', '-'))}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ── Tab Content ── */}

        {/* Overview */}
        {activeTab === 'overview' && (
          <div className="activity-list">
            {MOCK_RECENT_ACTIVITY.map(item => (
              <div key={item.id} className="activity-item">
                <div className="activity-icon-wrap" style={{ borderColor: `${item.color}30`, background: `${item.color}10` }}>
                  <span style={{ fontSize: '0.9rem' }}>{item.icon}</span>
                </div>
                <div className="activity-text">
                  {item.text}
                  {item.detail && <> · <span className="activity-detail">{item.detail}</span></>}
                </div>
                <span className="activity-time">{item.time}</span>
              </div>
            ))}
          </div>
        )}

        {/* Anime List */}
        {activeTab === 'anime-list' && (
          <div>
            <div className="filter-row">
              {['All', 'Watching', 'Completed', 'Plan to Watch', 'Dropped'].map(f => (
                <button
                  key={f}
                  className={`filter-btn${animeFilter === f ? ' active' : ''}`}
                  onClick={() => setAnimeFilter(f)}
                >
                  {f}
                </button>
              ))}
            </div>
            <div className="anime-list-grid">
              {filteredAnime.map(anime => {
                const statusColor = STATUS_COLORS[anime.status] || '#A89878'
                return (
                  <div key={anime.id} className="anime-list-item">
                    <div className="anime-list-cover" style={{ background: `${anime.color}18` }}>🎬</div>
                    <div className="anime-list-info">
                      <div className="anime-list-title">{anime.title}</div>
                      <div className="anime-list-meta">
                        <span
                          className="status-badge"
                          style={{
                            color: statusColor,
                            borderColor: `${statusColor}40`,
                            background: `${statusColor}12`,
                          }}
                        >
                          {anime.status}
                        </span>
                        <span className="ep-info">Ep {anime.ep}/{anime.total}</span>
                      </div>
                    </div>
                    {anime.score !== null ? (
                      <div className="score-val">
                        <span style={{ color: 'var(--gold)', fontSize: '0.7rem' }}>★ </span>
                        {anime.score}
                      </div>
                    ) : (
                      <span className="score-na">—</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Reviews */}
        {activeTab === 'reviews' && (
          <div className="reviews-list">
            {MOCK_REVIEWS.map(review => (
              <div key={review.id} className="review-card">
                <div className="review-cover" style={{ background: `${review.color}18` }}>📝</div>
                <div className="review-body">
                  <div className="review-title">{review.title}</div>
                  <div className="review-meta">
                    <div className="stars-row">
                      {[1, 2, 3, 4, 5].map(s => (
                        <span key={s} className={`star-icon${s <= Math.round(review.score / 2) ? '' : ' empty'}`}>★</span>
                      ))}
                    </div>
                    <span style={{ color: 'var(--gold)', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.85rem' }}>
                      {review.score}/10
                    </span>
                    <span className="review-date">{review.date}</span>
                  </div>
                  <p className="review-excerpt">{review.excerpt}</p>
                  <button className="helpful-btn">
                    <IconHeart size={12} />
                    Helpful ({review.helpful})
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Achievements */}
        {activeTab === 'achievements' && (
          <div className="achievements-grid">
            {MOCK_ACHIEVEMENTS.map(a => (
              <div key={a.id} className="achievement-card">
                <div className="achievement-card-icon">{a.icon}</div>
                <div className="achievement-card-name">{a.name}</div>
                <div className="achievement-card-desc">{a.desc}</div>
                <div className="achievement-card-xp">⚡ +{a.xp} XP</div>
                <div className="achievement-card-date">{a.date}</div>
              </div>
            ))}
          </div>
        )}

        {/* Activity */}
        {activeTab === 'activity' && (
          <div className="timeline-list">
            {MOCK_ACTIVITY_TIMELINE.map(item => (
              <div key={item.id} className="timeline-item">
                <div className="timeline-dot" style={{ background: item.color }} />
                <div className="timeline-content">
                  <div className="timeline-text">{item.text}</div>
                  <div className="timeline-date">{item.date}</div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>{/* /profile-content */}
    </div>
  )
}
