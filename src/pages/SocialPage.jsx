import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { IconHeart, IconMessage, IconSend, IconPlus, IconFire, IconStar, IconShield, IconTrophy, IconZap, IconX } from '../components/Icons'
import { FACTIONS } from '../store/rpgStore'

// ── Mock Data ────────────────────────────────────────────────────────────────

const STORIES = [
  { id: 0, username: 'Your Story', initial: '+', faction: 'shonen', isOwn: true },
  { id: 1, username: 'SakuraBlade', initial: 'S', faction: 'shoujo' },
  { id: 2, username: 'NeonKaito', initial: 'N', faction: 'cyber' },
  { id: 3, username: 'DragonPact', initial: 'D', faction: 'fantasy' },
  { id: 4, username: 'MechLord99', initial: 'M', faction: 'mecha' },
  { id: 5, username: 'IsekaiRei', initial: 'I', faction: 'isekai' },
]

const FEED_POSTS = [
  {
    id: 1, type: 'anime_rated', username: 'SakuraBlade', initial: 'S', faction: 'shoujo', time: '2h ago',
    action: 'rated an anime',
    anime: 'Violet Evergarden', score: 9.5,
    comment: 'Absolutely beautiful. The animation and story had me in tears multiple times.',
    likes: 34, comments: 7,
  },
  {
    id: 2, type: 'review_written', username: 'NeonKaito', initial: 'N', faction: 'cyber', time: '3h ago',
    action: 'wrote a review',
    anime: 'Cyberpunk: Edgerunners',
    excerpt: `"This show redefined what anime can be in 2022. David's arc is one of the most tragic and compelling stories I've ever witnessed in any medium…"`,
    likes: 61, comments: 14,
  },
  {
    id: 3, type: 'achievement_earned', username: 'DragonPact', initial: 'D', faction: 'fantasy', time: '5h ago',
    action: 'earned an achievement',
    achievement: 'Binge Master', emoji: '🏆', xp: 100,
    likes: 28, comments: 3,
  },
  {
    id: 4, type: 'episode_watched', username: 'MechLord99', initial: 'M', faction: 'mecha', time: '6h ago',
    action: 'is watching',
    anime: 'Gurren Lagann', episode: 14, total: 27,
    likes: 12, comments: 2,
  },
  {
    id: 5, type: 'guild_joined', username: 'IsekaiRei', initial: 'I', faction: 'isekai', time: '8h ago',
    action: 'joined a guild',
    guild: "Dragon's Roar",
    likes: 45, comments: 9,
  },
  {
    id: 6, type: 'anime_rated', username: 'VoidWatcher', initial: 'V', faction: 'seinen', time: '10h ago',
    action: 'rated an anime',
    anime: 'Berserk (1997)', score: 9.8,
    comment: 'A dark masterpiece that stands the test of time. Guts\'s journey is unparalleled.',
    likes: 88, comments: 21,
  },
  {
    id: 7, type: 'review_written', username: 'MysticYuki', initial: 'Y', faction: 'mystic', time: '12h ago',
    action: 'wrote a review',
    anime: 'Made in Abyss',
    excerpt: '"Every layer deeper into the Abyss pulls you into darkness you can\'t escape. Riko and Reg carry the heart of this world through impossible odds…"',
    likes: 53, comments: 11,
  },
  {
    id: 8, type: 'achievement_earned', username: 'SolKira', initial: 'K', faction: 'sol', time: '1d ago',
    action: 'earned an achievement',
    achievement: 'Slice of Life Champion', emoji: '☀️', xp: 150,
    likes: 19, comments: 4,
  },
]

const TRENDING = [
  { rank: 1, title: 'Frieren: Beyond Journey\'s End', score: 9.4 },
  { rank: 2, title: 'Vinland Saga S2', score: 9.2 },
  { rank: 3, title: 'Jujutsu Kaisen S2', score: 8.9 },
  { rank: 4, title: 'Mushoku Tensei S2', score: 8.7 },
  { rank: 5, title: 'Oshi no Ko', score: 8.6 },
]

const ACTIVE_GUILDS = [
  { name: "Dragon's Roar", online: 23, color: '#FF6B6B' },
  { name: 'Cyber Syndicate', online: 17, color: '#00D9FF' },
  { name: 'Mystic Academy', online: 11, color: '#20B2AA' },
]

const FILTER_TABS = ['All', 'Following', 'Trending', 'Anime News']

// ── Sub-components ───────────────────────────────────────────────────────────

function Avatar({ initial, faction, size = 48, fontSize = 18 }) {
  const color = FACTIONS[faction]?.color || '#D4A843'
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `${color}22`,
      border: `2.5px solid ${color}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize, fontWeight: 700, color,
      flexShrink: 0, fontFamily: 'var(--font-heading)',
    }}>
      {initial}
    </div>
  )
}

function PostCard({ post, liked, onLike }) {
  const factionColor = FACTIONS[post.faction]?.color || '#D4A843'

  return (
    <div className="glass-panel sp-post-card">
      {/* Header */}
      <div className="sp-post-header">
        <Avatar initial={post.initial} faction={post.faction} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p className="sp-post-meta">
            <span className="sp-post-username">{post.username}</span>
            {' '}<span className="sp-post-action">{post.action}</span>
            {' '}<span className="sp-post-time">• {post.time}</span>
          </p>
          <span className="sp-faction-tag" style={{ background: `${factionColor}22`, color: factionColor, borderColor: `${factionColor}44` }}>
            {FACTIONS[post.faction]?.icon} {FACTIONS[post.faction]?.label}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="sp-post-content">
        {post.type === 'anime_rated' && (
          <div className="sp-rated-block">
            <div className="sp-cover-placeholder">
              <span style={{ fontSize: 28 }}>🎬</span>
            </div>
            <div style={{ flex: 1 }}>
              <p className="sp-anime-title">{post.anime}</p>
              <div className="sp-star-row">
                {[1,2,3,4,5].map(i => (
                  <IconStar key={i} size={15} fill={i <= Math.round(post.score / 2) ? '#D4A843' : 'none'} />
                ))}
                <span className="sp-score-text">{post.score}/10</span>
              </div>
              <p className="sp-comment-text">{post.comment}</p>
            </div>
          </div>
        )}

        {post.type === 'review_written' && (
          <div className="sp-review-block">
            <p className="sp-review-title">{post.anime}</p>
            <p className="sp-review-excerpt">{post.excerpt}</p>
            <Link to="#" className="sp-read-more">Read full review →</Link>
          </div>
        )}

        {post.type === 'achievement_earned' && (
          <div className="sp-achievement-block">
            <div className="sp-achievement-emoji">{post.emoji}</div>
            <div>
              <p className="sp-achievement-name">{post.achievement}</p>
              <span className="sp-xp-badge">+{post.xp} XP</span>
            </div>
          </div>
        )}

        {post.type === 'episode_watched' && (
          <div className="sp-episode-block">
            <span className="sp-ep-badge">Now on Ep {post.episode}/{post.total}</span>
            <p className="sp-anime-title" style={{ marginTop: 8 }}>{post.anime}</p>
          </div>
        )}

        {post.type === 'guild_joined' && (
          <div className="sp-guild-block">
            <div className="sp-guild-icon-wrap">
              <IconShield size={32} color="#D4A843" />
            </div>
            <p className="sp-guild-text">
              <span style={{ color: 'var(--text-primary)' }}>{post.username}</span>
              {' joined '}
              <span style={{ color: 'var(--gold)' }}>{post.guild}</span>!
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="sp-post-actions">
        <button className={`sp-action-btn${liked ? ' sp-action-liked' : ''}`} onClick={() => onLike(post.id)}>
          <IconHeart size={15} fill={liked ? '#D93B3B' : 'none'} color={liked ? '#D93B3B' : 'currentColor'} />
          <span>{liked ? post.likes + 1 : post.likes}</span>
        </button>
        <button className="sp-action-btn">
          <IconMessage size={15} />
          <span>{post.comments}</span>
        </button>
        <button className="sp-action-btn">
          <IconSend size={15} />
          <span>Share</span>
        </button>
      </div>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function SocialPage() {
  const [activeTab, setActiveTab] = useState('All')
  const [liked, setLiked] = useState({})
  const [composeOpen, setComposeOpen] = useState(false)
  const [composeText, setComposeText] = useState('')
  const storiesRef = useRef(null)

  function toggleLike(id) {
    setLiked(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="sp-root">
      <style>{`
        .sp-root {
          max-width: 1200px;
          margin: 0 auto;
          padding: 32px 20px 100px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* Stories */
        .sp-stories-scroll {
          display: flex;
          gap: 16px;
          overflow-x: auto;
          padding: 4px 2px 8px;
          scrollbar-width: none;
        }
        .sp-stories-scroll::-webkit-scrollbar { display: none; }
        .sp-story-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          flex-shrink: 0;
        }
        .sp-story-ring {
          width: 62px; height: 62px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          padding: 2.5px;
          transition: transform var(--transition-fast);
        }
        .sp-story-ring:hover { transform: scale(1.08); }
        .sp-story-inner {
          width: 54px; height: 54px;
          border-radius: 50%;
          background: var(--bg-card);
          border: 2px solid var(--bg-primary);
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 18px;
          font-family: var(--font-heading);
        }
        .sp-story-name {
          font-size: 0.72rem;
          color: var(--text-secondary);
          max-width: 62px;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          text-align: center;
        }

        /* Layout */
        .sp-layout {
          display: grid;
          grid-template-columns: 65% 35%;
          gap: 24px;
          align-items: start;
        }
        @media (max-width: 900px) {
          .sp-layout { grid-template-columns: 1fr; }
          .sp-sidebar { display: none; }
        }

        /* Filter Tabs */
        .sp-tabs {
          display: flex;
          gap: 4px;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-full);
          padding: 4px;
          width: fit-content;
        }
        .sp-tab {
          padding: 7px 18px;
          border-radius: var(--radius-full);
          border: none;
          background: transparent;
          color: var(--text-secondary);
          font-size: 0.88rem;
          font-family: var(--font-body);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .sp-tab:hover { color: var(--text-primary); }
        .sp-tab.active {
          background: var(--gold);
          color: #0A0908;
          font-weight: 700;
        }

        /* Feed */
        .sp-feed {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        /* Post Card */
        .sp-post-card {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          transition: transform var(--transition-fast), box-shadow var(--transition-fast);
        }
        .sp-post-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-gold);
        }
        .sp-post-header {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }
        .sp-post-meta { margin: 0; font-size: 0.9rem; line-height: 1.4; }
        .sp-post-username { color: var(--text-primary); font-weight: 700; }
        .sp-post-action { color: var(--gold); font-weight: 600; }
        .sp-post-time { color: var(--text-muted); font-size: 0.82rem; }
        .sp-faction-tag {
          display: inline-block;
          margin-top: 4px;
          padding: 2px 10px;
          border-radius: var(--radius-full);
          border: 1px solid;
          font-size: 0.75rem;
          font-weight: 600;
        }

        /* Content types */
        .sp-rated-block {
          display: flex;
          gap: 14px;
          align-items: flex-start;
        }
        .sp-cover-placeholder {
          width: 64px; height: 90px;
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .sp-anime-title {
          margin: 0 0 6px;
          font-weight: 700;
          color: var(--text-primary);
          font-size: 0.95rem;
        }
        .sp-star-row {
          display: flex;
          align-items: center;
          gap: 3px;
          margin-bottom: 6px;
        }
        .sp-score-text {
          color: var(--gold);
          font-weight: 700;
          font-size: 0.85rem;
          margin-left: 4px;
        }
        .sp-comment-text {
          margin: 0;
          color: var(--text-secondary);
          font-size: 0.88rem;
          line-height: 1.5;
        }

        .sp-review-block { display: flex; flex-direction: column; gap: 8px; }
        .sp-review-title { margin: 0; font-weight: 700; color: var(--text-primary); font-size: 0.95rem; }
        .sp-review-excerpt {
          margin: 0;
          font-style: italic;
          color: var(--text-secondary);
          font-size: 0.88rem;
          line-height: 1.6;
          border-left: 3px solid var(--gold);
          padding-left: 12px;
        }
        .sp-read-more { color: var(--gold); font-size: 0.85rem; font-weight: 600; text-decoration: none; }
        .sp-read-more:hover { text-decoration: underline; }

        .sp-achievement-block {
          display: flex;
          align-items: center;
          gap: 20px;
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 16px 20px;
        }
        .sp-achievement-emoji { font-size: 72px; line-height: 1; }
        .sp-achievement-name {
          margin: 0 0 8px;
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        .sp-xp-badge {
          background: rgba(212,168,67,0.15);
          color: var(--gold);
          border: 1px solid rgba(212,168,67,0.35);
          border-radius: var(--radius-full);
          padding: 3px 12px;
          font-size: 0.82rem;
          font-weight: 700;
        }

        .sp-episode-block {}
        .sp-ep-badge {
          display: inline-block;
          background: rgba(74,143,204,0.15);
          color: var(--blue);
          border: 1px solid rgba(74,143,204,0.35);
          border-radius: var(--radius-full);
          padding: 4px 14px;
          font-size: 0.85rem;
          font-weight: 700;
        }

        .sp-guild-block {
          display: flex;
          align-items: center;
          gap: 16px;
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 14px 18px;
        }
        .sp-guild-icon-wrap {
          width: 52px; height: 52px;
          background: rgba(212,168,67,0.12);
          border: 1px solid rgba(212,168,67,0.3);
          border-radius: var(--radius-md);
          display: flex; align-items: center; justify-content: center;
        }
        .sp-guild-text { margin: 0; font-size: 1rem; color: var(--text-secondary); }

        /* Actions */
        .sp-post-actions {
          display: flex;
          gap: 8px;
          padding-top: 10px;
          border-top: 1px solid var(--border-subtle);
        }
        .sp-action-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: var(--radius-full);
          border: 1px solid var(--border-subtle);
          background: transparent;
          color: var(--text-secondary);
          font-size: 0.85rem;
          cursor: pointer;
          transition: all var(--transition-fast);
          font-family: var(--font-body);
        }
        .sp-action-btn:hover {
          border-color: var(--border-hover);
          color: var(--text-primary);
          background: var(--bg-hover);
        }
        .sp-action-liked { color: #D93B3B !important; border-color: rgba(217,59,59,0.4) !important; }

        /* Sidebar */
        .sp-sidebar {
          display: flex;
          flex-direction: column;
          gap: 16px;
          position: sticky;
          top: 90px;
        }
        .sp-sidebar-card {
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .sp-sidebar-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        /* Trending */
        .sp-trending-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 0;
          border-bottom: 1px solid var(--border-subtle);
        }
        .sp-trending-item:last-child { border-bottom: none; }
        .sp-trending-rank {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--text-muted);
          width: 20px;
          text-align: center;
          flex-shrink: 0;
        }
        .sp-trending-cover {
          width: 36px; height: 50px;
          background: var(--bg-surface);
          border-radius: var(--radius-sm);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          font-size: 16px;
        }
        .sp-trending-info { flex: 1; min-width: 0; }
        .sp-trending-name {
          font-size: 0.83rem;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          margin: 0 0 3px;
        }
        .sp-trending-score {
          font-size: 0.78rem;
          color: var(--gold);
          display: flex; align-items: center; gap: 3px;
        }

        /* Active Guilds */
        .sp-guild-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 0;
          border-bottom: 1px solid var(--border-subtle);
        }
        .sp-guild-row:last-child { border-bottom: none; }
        .sp-guild-dot {
          width: 36px; height: 36px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px;
          flex-shrink: 0;
        }
        .sp-guild-row-name { margin: 0; font-size: 0.88rem; font-weight: 600; color: var(--text-primary); }
        .sp-guild-row-online { margin: 0; font-size: 0.78rem; color: var(--text-muted); }
        .sp-online-dot {
          display: inline-block;
          width: 7px; height: 7px;
          background: #45A35E;
          border-radius: 50%;
          margin-right: 4px;
        }

        /* Community Goal */
        .sp-goal-desc { margin: 0; font-size: 0.9rem; color: var(--text-primary); font-weight: 600; }
        .sp-goal-sub { margin: 4px 0 0; font-size: 0.8rem; color: var(--text-muted); }
        .sp-progress-track {
          width: 100%;
          height: 8px;
          background: var(--bg-surface);
          border-radius: var(--radius-full);
          overflow: hidden;
        }
        .sp-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--gold-dark), var(--gold));
          border-radius: var(--radius-full);
          transition: width 0.6s ease;
          box-shadow: 0 0 8px rgba(212,168,67,0.5);
        }
        .sp-goal-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.8rem;
        }
        .sp-goal-pct { color: var(--gold); font-weight: 700; }
        .sp-goal-dead { color: var(--text-muted); }

        /* Compose */
        .sp-compose-btn {
          position: fixed;
          bottom: 90px;
          right: 28px;
          width: 56px; height: 56px;
          border-radius: 50%;
          background: var(--gold);
          border: none;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          box-shadow: var(--shadow-gold-lg);
          z-index: 50;
          transition: transform var(--transition-fast), box-shadow var(--transition-fast);
          font-size: 24px;
          color: #0A0908;
        }
        .sp-compose-btn:hover {
          transform: scale(1.1);
          box-shadow: 0 0 30px rgba(212,168,67,0.6);
        }

        .sp-compose-panel {
          position: fixed;
          bottom: 158px;
          right: 28px;
          width: 340px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-gold);
          z-index: 50;
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          animation: slide-in-up 0.2s ease both;
        }
        .sp-compose-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .sp-compose-title { margin: 0; font-size: 0.95rem; font-weight: 700; color: var(--text-primary); }
        .sp-compose-close {
          background: none; border: none; color: var(--text-muted);
          cursor: pointer; padding: 2px;
          display: flex; align-items: center; justify-content: center;
          border-radius: var(--radius-sm);
          transition: color var(--transition-fast);
        }
        .sp-compose-close:hover { color: var(--text-primary); }
        .sp-compose-textarea {
          width: 100%;
          min-height: 90px;
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-md);
          padding: 10px 12px;
          color: var(--text-primary);
          font-family: var(--font-body);
          font-size: 0.9rem;
          resize: vertical;
          outline: none;
          box-sizing: border-box;
          transition: border-color var(--transition-fast);
        }
        .sp-compose-textarea:focus { border-color: var(--gold); }
        .sp-compose-textarea::placeholder { color: var(--text-muted); }
        .sp-compose-footer { display: flex; justify-content: flex-end; }
      `}</style>

      {/* Stories */}
      <div className="sp-stories-scroll" ref={storiesRef}>
        {STORIES.map(s => {
          const color = s.isOwn ? '#D4A843' : (FACTIONS[s.faction]?.color || '#D4A843')
          return (
            <div key={s.id} className="sp-story-item">
              <div
                className="sp-story-ring"
                style={{ background: s.isOwn ? 'rgba(212,168,67,0.25)' : `linear-gradient(135deg, ${color}, ${color}88)` }}
              >
                <div className="sp-story-inner" style={{ color, fontSize: s.isOwn ? 24 : 18 }}>
                  {s.isOwn ? '+' : s.initial}
                </div>
              </div>
              <span className="sp-story-name">{s.username}</span>
            </div>
          )
        })}
      </div>

      {/* Main layout */}
      <div className="sp-layout">
        {/* Feed */}
        <div>
          <div className="sp-tabs" style={{ marginBottom: 20 }}>
            {FILTER_TABS.map(tab => (
              <button
                key={tab}
                className={`sp-tab${activeTab === tab ? ' active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="sp-feed">
            {FEED_POSTS.map(post => (
              <PostCard key={post.id} post={post} liked={!!liked[post.id]} onLike={toggleLike} />
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="sp-sidebar">
          {/* Trending */}
          <div className="glass-panel sp-sidebar-card">
            <p className="sp-sidebar-title">
              <IconFire size={16} color="#D4A843" /> Trending This Week
            </p>
            {TRENDING.map(item => (
              <div key={item.rank} className="sp-trending-item">
                <span className="sp-trending-rank">#{item.rank}</span>
                <div className="sp-trending-cover">🎬</div>
                <div className="sp-trending-info">
                  <p className="sp-trending-name">{item.title}</p>
                  <div className="sp-trending-score">
                    <IconStar size={11} fill="#D4A843" /> {item.score}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Active Guilds */}
          <div className="glass-panel sp-sidebar-card">
            <p className="sp-sidebar-title">
              <IconShield size={16} color="#D4A843" /> Active Guilds
            </p>
            {ACTIVE_GUILDS.map(g => (
              <div key={g.name} className="sp-guild-row">
                <div className="sp-guild-dot" style={{ background: `${g.color}22`, color: g.color }}>
                  🛡️
                </div>
                <div>
                  <p className="sp-guild-row-name">{g.name}</p>
                  <p className="sp-guild-row-online">
                    <span className="sp-online-dot" />
                    {g.online} online
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Community Goal */}
          <div className="glass-panel sp-sidebar-card">
            <p className="sp-sidebar-title">
              <IconTrophy size={16} color="#D4A843" /> Community Goal
            </p>
            <p className="sp-goal-desc">Watch 10,000 Episodes Together!</p>
            <p className="sp-goal-sub">Season Challenge — ends in 4 days</p>
            <div className="sp-progress-track">
              <div className="sp-progress-fill" style={{ width: '67%' }} />
            </div>
            <div className="sp-goal-row">
              <span className="sp-goal-pct">67% complete</span>
              <span className="sp-goal-dead">6,700 / 10,000</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Compose Panel */}
      {composeOpen && (
        <div className="sp-compose-panel">
          <div className="sp-compose-header">
            <p className="sp-compose-title">New Post</p>
            <button className="sp-compose-close" onClick={() => setComposeOpen(false)}>
              <IconX size={16} />
            </button>
          </div>
          <textarea
            className="sp-compose-textarea"
            placeholder="Share something with the community…"
            value={composeText}
            onChange={e => setComposeText(e.target.value)}
          />
          <div className="sp-compose-footer">
            <button
              className="btn btn-primary btn-sm"
              onClick={() => { setComposeOpen(false); setComposeText('') }}
            >
              <IconSend size={14} /> Post
            </button>
          </div>
        </div>
      )}

      {/* Compose FAB */}
      <button className="sp-compose-btn" onClick={() => setComposeOpen(v => !v)} title="New Post">
        <IconPlus size={26} color="#0A0908" />
      </button>
    </div>
  )
}
