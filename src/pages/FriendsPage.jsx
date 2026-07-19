import { useState } from 'react'
import { IconSearch, IconMessage, IconUsers, IconUser, IconHeart, IconX, IconCheck, IconPlus } from '../components/Icons'
import { FACTIONS } from '../store/rpgStore'

// ── Mock Data ────────────────────────────────────────────────────────────────

const FRIENDS_ONLINE = [
  { id: 1, username: 'SakuraBlade', initial: 'S', faction: 'shoujo', online: true,  lastSeen: 'Online now' },
  { id: 2, username: 'NeonKaito',   initial: 'N', faction: 'cyber',  online: true,  lastSeen: 'Online now' },
  { id: 3, username: 'DragonPact',  initial: 'D', faction: 'fantasy',online: true,  lastSeen: 'Online now' },
  { id: 4, username: 'VoidWatcher', initial: 'V', faction: 'seinen', online: true,  lastSeen: 'Online now' },
]

const RECENT_ACTIVITY = [
  { id: 1, username: 'MechLord99',  initial: 'M', faction: 'mecha',  action: 'is watching Gurren Lagann Ep 14' },
  { id: 2, username: 'MysticYuki',  initial: 'Y', faction: 'mystic', action: 'rated Frieren 9.5 ⭐' },
  { id: 3, username: 'IsekaiRei',   initial: 'I', faction: 'isekai', action: 'joined Dragon\'s Roar guild' },
]

const FRIEND_REQUESTS = [
  { id: 1, username: 'SolKira',    initial: 'K', faction: 'sol',    mutual: 3, reason: 'Same faction' },
  { id: 2, username: 'HorrorAce',  initial: 'H', faction: 'horror', mutual: 1, reason: '2 mutual friends' },
]

const ALL_FRIENDS = [
  { id: 1,  username: 'SakuraBlade', initial: 'S', faction: 'shoujo',  level: 22, title: 'Season Veteran', lastSeen: 'Online now',  online: true  },
  { id: 2,  username: 'NeonKaito',   initial: 'N', faction: 'cyber',   level: 31, title: 'Arc Master',     lastSeen: 'Online now',  online: true  },
  { id: 3,  username: 'DragonPact',  initial: 'D', faction: 'fantasy', level: 18, title: 'Episode Hunter', lastSeen: 'Online now',  online: true  },
  { id: 4,  username: 'VoidWatcher', initial: 'V', faction: 'seinen',  level: 45, title: 'Saga Champion',  lastSeen: 'Online now',  online: true  },
  { id: 5,  username: 'MechLord99',  initial: 'M', faction: 'mecha',   level: 14, title: 'Episode Hunter', lastSeen: '2h ago',      online: false },
  { id: 6,  username: 'MysticYuki',  initial: 'Y', faction: 'mystic',  level: 27, title: 'Arc Master',     lastSeen: '5h ago',      online: false },
  { id: 7,  username: 'IsekaiRei',   initial: 'I', faction: 'isekai',  level: 9,  title: 'Anime Initiate', lastSeen: '1d ago',      online: false },
  { id: 8,  username: 'SolKira',     initial: 'K', faction: 'sol',     level: 33, title: 'Arc Master',     lastSeen: '2d ago',      online: false },
]

const FOLLOWING = [
  { id: 1, username: 'AnimeLord',   initial: 'A', faction: 'shonen',  level: 52, lastSeen: '1h ago' },
  { id: 2, username: 'CyberSage',   initial: 'C', faction: 'cyber',   level: 38, lastSeen: '3h ago' },
  { id: 3, username: 'FantasyKing', initial: 'F', faction: 'fantasy', level: 41, lastSeen: 'Online now' },
  { id: 4, username: 'SeinenPro',   initial: 'P', faction: 'seinen',  level: 67, lastSeen: '2d ago' },
]

const FOLLOWERS = [
  { id: 1, username: 'RookieWave',  initial: 'R', faction: 'shonen',  level: 5,  lastSeen: '30m ago' },
  { id: 2, username: 'BladeRunner', initial: 'B', faction: 'mecha',   level: 12, lastSeen: 'Online now' },
  { id: 3, username: 'StargazerAi', initial: 'A', faction: 'mystic',  level: 19, lastSeen: '6h ago' },
  { id: 4, username: 'NightOwl99',  initial: 'N', faction: 'horror',  level: 8,  lastSeen: '1d ago' },
  { id: 5, username: 'SunsetMoe',   initial: 'S', faction: 'sol',     level: 3,  lastSeen: '2h ago' },
]

const SUGGESTIONS = [
  { id: 1, username: 'ShonenKing',  initial: 'K', faction: 'shonen',  level: 24, reason: 'Same faction • Shonen Empire' },
  { id: 2, username: 'CyberGhost',  initial: 'G', faction: 'cyber',   level: 17, reason: '4 mutual friends' },
  { id: 3, username: 'MagicRealm',  initial: 'M', faction: 'fantasy', level: 36, reason: 'Watches similar anime' },
  { id: 4, username: 'IronFist42',  initial: 'F', faction: 'mecha',   level: 29, reason: 'Same guild' },
  { id: 5, username: 'SakuraDream', initial: 'D', faction: 'shoujo',  level: 11, reason: 'Watches similar anime' },
  { id: 6, username: 'IsekaiHero',  initial: 'H', faction: 'isekai',  level: 22, reason: '2 mutual friends' },
]

const TABS = ['Friends', 'Following', 'Followers', 'Suggestions']

// ── Sub-components ───────────────────────────────────────────────────────────

function Avatar({ initial, faction, size = 48, fontSize = 18, online = false }) {
  const color = FACTIONS[faction]?.color || '#D4A843'
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: `${color}22`,
        border: `2.5px solid ${color}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize, fontWeight: 700, color,
        fontFamily: 'var(--font-heading)',
      }}>
        {initial}
      </div>
      {online && (
        <div style={{
          position: 'absolute', bottom: 1, right: 1,
          width: 11, height: 11, borderRadius: '50%',
          background: '#45A35E',
          border: '2px solid var(--bg-card)',
        }} />
      )}
    </div>
  )
}

function FriendCard({ friend, onRemove }) {
  const faction = FACTIONS[friend.faction]
  const factionColor = faction?.color || '#D4A843'
  return (
    <div className="glass-panel fp-friend-card">
      <Avatar initial={friend.initial} faction={friend.faction} size={52} online={friend.online} />
      <div className="fp-card-body">
        <p className="fp-username">{friend.username}</p>
        <div className="fp-meta-row">
          <span className="fp-level-badge">Lv {friend.level}</span>
          <span className="fp-title-text">{friend.title}</span>
        </div>
        <p className="fp-lastseen">{friend.online ? '🟢 Online now' : `🕐 ${friend.lastSeen}`}</p>
        <span className="fp-faction-tag" style={{ background: `${factionColor}18`, color: factionColor, borderColor: `${factionColor}44` }}>
          {faction?.icon} {faction?.label}
        </span>
      </div>
      <div className="fp-card-actions">
        <button className="btn btn-sm btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <IconMessage size={13} /> Message
        </button>
        <button
          className="btn btn-sm btn-ghost"
          style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}
          onClick={() => onRemove(friend.id)}
        >
          <IconX size={13} /> Remove
        </button>
      </div>
    </div>
  )
}

function SuggestionCard({ s, followed, onFollow }) {
  const faction = FACTIONS[s.faction]
  const factionColor = faction?.color || '#D4A843'
  return (
    <div className="glass-panel fp-suggest-card">
      <Avatar initial={s.initial} faction={s.faction} size={48} />
      <p className="fp-username" style={{ marginTop: 8, marginBottom: 4 }}>{s.username}</p>
      <div className="fp-meta-row" style={{ justifyContent: 'center', marginBottom: 6 }}>
        <span className="fp-level-badge">Lv {s.level}</span>
      </div>
      <span className="fp-reason-tag">{s.reason}</span>
      <span className="fp-faction-tag" style={{ background: `${factionColor}18`, color: factionColor, borderColor: `${factionColor}44`, marginTop: 8 }}>
        {faction?.icon} {faction?.label}
      </span>
      <button
        className={`btn btn-sm${followed ? ' btn-secondary' : ' btn-primary'}`}
        style={{ marginTop: 12, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
        onClick={() => onFollow(s.id)}
      >
        {followed ? <><IconCheck size={13} /> Following</> : <><IconPlus size={13} /> Follow</>}
      </button>
    </div>
  )
}

function ListCard({ person, showFollowBack = false, showUnfollow = false, followed, onToggle }) {
  const faction = FACTIONS[person.faction]
  const factionColor = faction?.color || '#D4A843'
  return (
    <div className="glass-panel fp-list-card">
      <Avatar initial={person.initial} faction={person.faction} size={44} />
      <div className="fp-list-body">
        <p className="fp-username">{person.username}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span className="fp-level-badge">Lv {person.level}</span>
          <span className="fp-faction-tag" style={{ background: `${factionColor}18`, color: factionColor, borderColor: `${factionColor}44` }}>
            {faction?.icon} {faction?.label}
          </span>
        </div>
        <p className="fp-lastseen">{person.lastSeen === 'Online now' ? '🟢 Online now' : `🕐 ${person.lastSeen}`}</p>
      </div>
      <div>
        {showFollowBack && (
          <button
            className={`btn btn-sm${followed ? ' btn-secondary' : ' btn-primary'}`}
            style={{ display: 'flex', alignItems: 'center', gap: 5 }}
            onClick={() => onToggle(person.id)}
          >
            {followed ? 'Following' : 'Follow Back'}
          </button>
        )}
        {showUnfollow && (
          <button
            className="btn btn-sm btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: 5 }}
            onClick={() => onToggle(person.id)}
          >
            {followed ? 'Unfollow' : 'Follow'}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function FriendsPage() {
  const [activeTab, setActiveTab] = useState('Friends')
  const [search, setSearch]       = useState('')
  const [friends, setFriends]     = useState(ALL_FRIENDS)
  const [requests, setRequests]   = useState(FRIEND_REQUESTS)
  const [followed, setFollowed]   = useState({})
  const [followingState, setFollowingState] = useState({})

  function removeFriend(id) {
    setFriends(prev => prev.filter(f => f.id !== id))
  }

  function handleRequest(id, accept) {
    setRequests(prev => prev.filter(r => r.id !== id))
    if (accept) setFriends(prev => {
      const req = FRIEND_REQUESTS.find(r => r.id === id)
      if (!req) return prev
      return [...prev, { ...req, level: 6, title: 'Anime Initiate', lastSeen: 'Online now', online: true }]
    })
  }

  function toggleSuggestionFollow(id) {
    setFollowed(prev => ({ ...prev, [id]: !prev[id] }))
  }

  function toggleFollowing(id) {
    setFollowingState(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const filteredFriends = friends.filter(f =>
    f.username.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="fp-root">
      <style>{`
        .fp-root {
          max-width: 1100px;
          margin: 0 auto;
          padding: 32px 20px 80px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* Page title */
        .fp-page-title {
          margin: 0 0 4px;
          font-size: 1.6rem;
          font-weight: 800;
          font-family: var(--font-heading);
          color: var(--text-primary);
        }

        /* Search */
        .fp-search-wrap {
          position: relative;
          max-width: 380px;
        }
        .fp-search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          pointer-events: none;
        }
        .fp-search-input {
          width: 100%;
          padding: 10px 14px 10px 38px;
          background: var(--bg-card);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-full);
          color: var(--text-primary);
          font-family: var(--font-body);
          font-size: 0.9rem;
          outline: none;
          transition: border-color var(--transition-fast);
          box-sizing: border-box;
        }
        .fp-search-input:focus { border-color: var(--gold); }
        .fp-search-input::placeholder { color: var(--text-muted); }

        /* Top row cards */
        .fp-top-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        @media (max-width: 700px) {
          .fp-top-row { grid-template-columns: 1fr; }
        }
        .fp-top-card {
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .fp-top-card-title {
          margin: 0;
          font-size: 0.88rem;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .fp-mini-user {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .fp-mini-name {
          margin: 0;
          font-size: 0.88rem;
          font-weight: 600;
          color: var(--text-primary);
        }
        .fp-mini-sub {
          margin: 0;
          font-size: 0.78rem;
          color: var(--text-muted);
        }
        .fp-online-dot {
          display: inline-block;
          width: 8px; height: 8px;
          background: #45A35E;
          border-radius: 50%;
          margin-right: 4px;
        }
        .fp-req-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .fp-req-actions { display: flex; gap: 6px; margin-left: auto; }
        .fp-req-accept {
          padding: 5px 11px;
          border-radius: var(--radius-full);
          border: none;
          background: var(--gold);
          color: #0A0908;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          transition: all var(--transition-fast);
          display: flex; align-items: center; gap: 4px;
        }
        .fp-req-accept:hover { background: var(--gold-dark); }
        .fp-req-decline {
          padding: 5px 11px;
          border-radius: var(--radius-full);
          border: 1px solid var(--border-default);
          background: transparent;
          color: var(--text-muted);
          font-size: 0.8rem;
          cursor: pointer;
          transition: all var(--transition-fast);
          display: flex; align-items: center; gap: 4px;
        }
        .fp-req-decline:hover { border-color: var(--red); color: var(--red); }
        .fp-req-reason {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-left: auto;
          white-space: nowrap;
        }

        /* Tabs */
        .fp-tabs {
          display: flex;
          gap: 4px;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-full);
          padding: 4px;
          width: fit-content;
        }
        .fp-tab {
          padding: 7px 20px;
          border-radius: var(--radius-full);
          border: none;
          background: transparent;
          color: var(--text-secondary);
          font-size: 0.88rem;
          font-family: var(--font-body);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .fp-tab:hover { color: var(--text-primary); }
        .fp-tab.active { background: var(--gold); color: #0A0908; font-weight: 700; }

        /* Friends Grid */
        .fp-friends-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 16px;
        }
        .fp-friend-card {
          padding: 18px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 10px;
          transition: transform var(--transition-fast), box-shadow var(--transition-fast);
        }
        .fp-friend-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-gold); }
        .fp-card-body { width: 100%; }
        .fp-username {
          margin: 0 0 5px;
          font-size: 0.97rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        .fp-meta-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 5px; }
        .fp-level-badge {
          background: rgba(212,168,67,0.15);
          color: var(--gold);
          border: 1px solid rgba(212,168,67,0.35);
          border-radius: var(--radius-full);
          padding: 2px 9px;
          font-size: 0.75rem;
          font-weight: 700;
        }
        .fp-title-text { color: var(--text-secondary); font-size: 0.8rem; }
        .fp-lastseen { margin: 0 0 6px; font-size: 0.78rem; color: var(--text-muted); }
        .fp-faction-tag {
          display: inline-block;
          padding: 2px 10px;
          border-radius: var(--radius-full);
          border: 1px solid;
          font-size: 0.74rem;
          font-weight: 600;
        }
        .fp-card-actions {
          display: flex;
          gap: 8px;
          width: 100%;
          margin-top: 4px;
          flex-wrap: wrap;
        }

        /* Suggestions Grid */
        .fp-suggest-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(175px, 1fr));
          gap: 16px;
        }
        .fp-suggest-card {
          padding: 20px 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          transition: transform var(--transition-fast), box-shadow var(--transition-fast);
        }
        .fp-suggest-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-gold); }
        .fp-reason-tag {
          font-size: 0.74rem;
          color: var(--text-muted);
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-full);
          padding: 2px 10px;
        }

        /* List view */
        .fp-list { display: flex; flex-direction: column; gap: 10px; }
        .fp-list-card {
          padding: 14px 18px;
          display: flex;
          align-items: center;
          gap: 14px;
          transition: all var(--transition-fast);
        }
        .fp-list-card:hover { transform: translateX(3px); box-shadow: var(--shadow-gold); }
        .fp-list-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }

        /* Section sub-title */
        .fp-section-title {
          margin: 0 0 16px;
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        .fp-count-badge {
          display: inline-block;
          margin-left: 8px;
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-full);
          padding: 1px 8px;
          font-size: 0.78rem;
          color: var(--text-muted);
        }
      `}</style>

      {/* Page Header */}
      <div>
        <h1 className="fp-page-title">Friends</h1>
      </div>

      {/* Search */}
      <div className="fp-search-wrap">
        <span className="fp-search-icon"><IconSearch size={16} /></span>
        <input
          className="fp-search-input"
          placeholder="Search friends…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Top Row */}
      <div className="fp-top-row">
        {/* Online Friends */}
        <div className="glass-panel fp-top-card">
          <p className="fp-top-card-title"><span className="fp-online-dot" />Friends Online <span style={{ color: 'var(--gold)' }}>{FRIENDS_ONLINE.length}</span></p>
          {FRIENDS_ONLINE.map(f => {
            const fcolor = FACTIONS[f.faction]?.color || '#D4A843'
            return (
              <div key={f.id} className="fp-mini-user">
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  background: `${fcolor}22`, border: `2px solid ${fcolor}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, color: fcolor, position: 'relative',
                }}>
                  {f.initial}
                  <div style={{ position: 'absolute', bottom: -1, right: -1, width: 9, height: 9, borderRadius: '50%', background: '#45A35E', border: '2px solid var(--bg-card)' }} />
                </div>
                <div>
                  <p className="fp-mini-name">{f.username}</p>
                  <p className="fp-mini-sub" style={{ color: '#45A35E' }}>● Online</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Recent Activity */}
        <div className="glass-panel fp-top-card">
          <p className="fp-top-card-title"><IconUsers size={13} /> Recent Activity</p>
          {RECENT_ACTIVITY.map(a => {
            const fcolor = FACTIONS[a.faction]?.color || '#D4A843'
            return (
              <div key={a.id} className="fp-mini-user">
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  background: `${fcolor}22`, border: `2px solid ${fcolor}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, color: fcolor,
                }}>
                  {a.initial}
                </div>
                <div>
                  <p className="fp-mini-name">{a.username}</p>
                  <p className="fp-mini-sub">{a.action}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Friend Requests */}
        <div className="glass-panel fp-top-card">
          <p className="fp-top-card-title"><IconUser size={13} /> Friend Requests <span style={{ color: 'var(--gold)' }}>{requests.length}</span></p>
          {requests.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>No pending requests</p>}
          {requests.map(r => {
            const fcolor = FACTIONS[r.faction]?.color || '#D4A843'
            return (
              <div key={r.id} className="fp-req-row">
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  background: `${fcolor}22`, border: `2px solid ${fcolor}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, color: fcolor,
                }}>
                  {r.initial}
                </div>
                <div>
                  <p className="fp-mini-name">{r.username}</p>
                  <p className="fp-mini-sub">{r.reason}</p>
                </div>
                <div className="fp-req-actions">
                  <button className="fp-req-accept" onClick={() => handleRequest(r.id, true)}>
                    <IconCheck size={11} /> Accept
                  </button>
                  <button className="fp-req-decline" onClick={() => handleRequest(r.id, false)}>
                    <IconX size={11} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Main Tabs */}
      <div className="fp-tabs">
        {TABS.map(t => (
          <button key={t} className={`fp-tab${activeTab === t ? ' active' : ''}`} onClick={() => setActiveTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'Friends' && (
        <div>
          <p className="fp-section-title">
            Your Friends <span className="fp-count-badge">{filteredFriends.length}</span>
          </p>
          <div className="fp-friends-grid">
            {filteredFriends.map(f => (
              <FriendCard key={f.id} friend={f} onRemove={removeFriend} />
            ))}
          </div>
        </div>
      )}

      {activeTab === 'Suggestions' && (
        <div>
          <p className="fp-section-title">People You May Know</p>
          <div className="fp-suggest-grid">
            {SUGGESTIONS.map(s => (
              <SuggestionCard
                key={s.id}
                s={s}
                followed={!!followed[s.id]}
                onFollow={toggleSuggestionFollow}
              />
            ))}
          </div>
        </div>
      )}

      {activeTab === 'Following' && (
        <div>
          <p className="fp-section-title">
            Following <span className="fp-count-badge">{FOLLOWING.length}</span>
          </p>
          <div className="fp-list">
            {FOLLOWING.map(p => (
              <ListCard
                key={p.id}
                person={p}
                showUnfollow
                followed={followingState[p.id] !== false}
                onToggle={toggleFollowing}
              />
            ))}
          </div>
        </div>
      )}

      {activeTab === 'Followers' && (
        <div>
          <p className="fp-section-title">
            Followers <span className="fp-count-badge">{FOLLOWERS.length}</span>
          </p>
          <div className="fp-list">
            {FOLLOWERS.map(p => (
              <ListCard
                key={p.id}
                person={p}
                showFollowBack
                followed={!!followingState[`fb-${p.id}`]}
                onToggle={id => setFollowingState(prev => ({ ...prev, [`fb-${id}`]: !prev[`fb-${id}`] }))}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
