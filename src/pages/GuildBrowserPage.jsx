import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FACTIONS } from '../store/rpgStore'
import {
  IconSearch, IconUsers, IconShield, IconPlus, IconX, IconFire,
  IconStar, IconTrophy, IconZap, IconTarget, IconCheck, CrownIcon
} from '../components/Icons'

// ── Mock data ────────────────────────────────────────────────────────────────
const FEATURED_GUILDS = [
  {
    id: 'fg1', name: 'Dragon Flame Vanguard', faction: 'shonen',
    members: 87, maxMembers: 100, level: 24,
    description: 'Elite warriors who conquer every arc with unmatched tenacity. Season veterans only.',
    tags: ['Active', 'Competitive', 'Weekly Raids'],
    xp: 78,
  },
  {
    id: 'fg2', name: 'Cyber Phantom Protocol', faction: 'cyber',
    members: 62, maxMembers: 80, level: 19,
    description: 'High-tech tacticians pushing the boundaries of the digital frontier. Always recruiting prodigies.',
    tags: ['Recruiting', 'Chill', 'Events'],
    xp: 55,
  },
  {
    id: 'fg3', name: 'Mystic Arcane Circle', faction: 'mystic',
    members: 44, maxMembers: 75, level: 16,
    description: 'Scholars and seers dedicated to unraveling every hidden lore in the anime universe.',
    tags: ['Welcoming', 'Lore', 'Social'],
    xp: 62,
  },
]

const GUILD_GRID = [
  { id: 'g1',  name: 'Iron Will Brotherhood',   faction: 'shonen',  members: 67, maxMembers: 100, level: 14, xp: 44, tags: ['Active','Recruiting'],     description: 'Shonen warriors training every day to surpass their limits and claim the top.' },
  { id: 'g2',  name: 'Silent Minds Collective',  faction: 'seinen',  members: 38, maxMembers:  60, level: 11, xp: 70, tags: ['Chill','Mature'],           description: 'Deep thinkers who dissect psychological thrillers and complex narratives.' },
  { id: 'g3',  name: 'Sakura Bloom Society',     faction: 'shoujo',  members: 55, maxMembers:  80, level: 9,  xp: 30, tags: ['Welcoming','Social'],       description: 'A warm community celebrating romance, drama, and beautiful storytelling.' },
  { id: 'g4',  name: 'Neon Circuit Syndicate',   faction: 'cyber',   members: 29, maxMembers:  50, level: 17, xp: 88, tags: ['Competitive','Tech'],        description: 'Cyberpunk aficionados dominating the digital battlefield.' },
  { id: 'g5',  name: 'Arcane Realm Seekers',     faction: 'fantasy', members: 72, maxMembers: 100, level: 21, xp: 58, tags: ['Active','Events'],          description: 'Fantasy explorers conquering every magic-filled world together.' },
  { id: 'g6',  name: 'Steel Titan Alliance',     faction: 'mecha',   members: 41, maxMembers:  75, level: 13, xp: 35, tags: ['Recruiting','Raids'],       description: 'Pilots of mighty mechs, united by the roar of engines and honor.' },
  { id: 'g7',  name: 'Daily Life Dreamers',      faction: 'sol',     members: 58, maxMembers:  80, level: 8,  xp: 20, tags: ['Chill','Welcoming'],        description: 'Laid-back adventurers enjoying the small beautiful moments of every day.' },
  { id: 'g8',  name: 'Crimson Dread Order',      faction: 'horror',  members: 33, maxMembers:  50, level: 15, xp: 65, tags: ['Active','Hardcore'],        description: 'Horror connoisseurs who thrive in darkness and face every terror head-on.' },
  { id: 'g9',  name: 'World-Hop Federation',     faction: 'isekai',  members: 81, maxMembers: 100, level: 18, xp: 50, tags: ['Recruiting','Social'],      description: 'Isekai veterans leaping through worlds in search of the ultimate adventure.' },
  { id: 'g10', name: 'Verdant Pulse Enclave',    faction: 'mystic',  members: 47, maxMembers:  75, level: 12, xp: 42, tags: ['Lore','Events'],            description: 'Mystic scholars decoding every hidden symbol in the anime cosmos.' },
  { id: 'g11', name: 'Rising Sun Dojo',          faction: 'shonen',  members: 60, maxMembers:  80, level: 10, xp: 75, tags: ['Active','Training'],        description: 'Disciples who train relentlessly to become the strongest in the empire.' },
  { id: 'g12', name: 'Echo Protocol Unit',       faction: 'cyber',   members: 22, maxMembers:  40, level: 7,  xp: 28, tags: ['Recruiting','Chill'],       description: 'New-gen cyber guild always looking for fresh talent to join the grid.' },
]

const TAG_COLORS = {
  Active: 'var(--green)', Recruiting: 'var(--gold)', Competitive: 'var(--red)',
  Chill: 'var(--blue)', Welcoming: 'var(--pink)', Events: 'var(--purple)',
  'Weekly Raids': 'var(--red)', Raids: 'var(--red)', Hardcore: 'var(--red)',
  Tech: 'var(--blue)', Mature: 'var(--text-muted)', Social: 'var(--pink)',
  Lore: 'var(--purple)', Training: 'var(--gold)', Lore2: 'var(--purple)',
}

function GuildEmblem({ faction, size = 52 }) {
  const f = FACTIONS[faction] || FACTIONS.shonen
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `radial-gradient(circle at 35% 35%, ${f.color}33, ${f.color}11)`,
      border: `2px solid ${f.color}55`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.4, flexShrink: 0, boxShadow: `0 0 12px ${f.color}33`,
    }}>
      {f.icon}
    </div>
  )
}

function MemberBar({ current, max, color }) {
  const pct = Math.round((current / max) * 100)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 4, borderRadius: 99, background: 'var(--bg-surface)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 99, background: color || 'var(--gold)', transition: 'width 0.6s' }} />
      </div>
      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', whiteSpace: 'nowrap' }}>
        {current}/{max}
      </span>
    </div>
  )
}

function GuildCard({ guild }) {
  const f = FACTIONS[guild.faction] || FACTIONS.shonen
  return (
    <div className="glass-panel guild-grid-card">
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
        <GuildEmblem faction={guild.faction} size={48} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {guild.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '0.68rem', fontFamily: 'var(--font-heading)', fontWeight: 700, color: f.color, background: `${f.color}18`, border: `1px solid ${f.color}33`, borderRadius: 'var(--radius-full)', padding: '2px 8px' }}>
              {f.icon} {f.label}
            </span>
            <span style={{ fontSize: '0.68rem', color: 'var(--gold)', fontFamily: 'var(--font-heading)', fontWeight: 700, background: 'var(--gold-glow-soft)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-full)', padding: '2px 7px' }}>
              Lv.{guild.level}
            </span>
          </div>
        </div>
      </div>

      {/* XP bar */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Guild XP</span>
          <span style={{ fontSize: '0.68rem', color: 'var(--gold)' }}>{guild.xp}%</span>
        </div>
        <div style={{ height: 3, borderRadius: 99, background: 'var(--bg-surface)', overflow: 'hidden' }}>
          <div className="xp-bar-fill" style={{ width: `${guild.xp}%`, height: '100%' }} />
        </div>
      </div>

      {/* Members */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <IconUsers size={12} /> Members
          </span>
        </div>
        <MemberBar current={guild.members} max={guild.maxMembers} color={FACTIONS[guild.faction]?.color} />
      </div>

      {/* Tags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
        {guild.tags.map(tag => (
          <span key={tag} style={{ fontSize: '0.62rem', fontWeight: 700, padding: '2px 7px', borderRadius: 'var(--radius-full)', background: `${TAG_COLORS[tag] || 'var(--text-muted)'}18`, color: TAG_COLORS[tag] || 'var(--text-muted)', border: `1px solid ${TAG_COLORS[tag] || 'var(--text-muted)'}33` }}>
            {tag}
          </span>
        ))}
      </div>

      {/* Description */}
      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 14, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {guild.description}
      </p>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8 }}>
        <Link to={`/guild/${guild.id}`} className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: 'center', fontSize: '0.78rem' }}>
          View
        </Link>
        <button className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center', fontSize: '0.78rem' }}>
          Join
        </button>
      </div>
    </div>
  )
}

function FeaturedCard({ guild }) {
  const f = FACTIONS[guild.faction] || FACTIONS.shonen
  return (
    <div className="featured-guild-card" style={{ borderColor: `${f.color}55` }}>
      <div style={{ position: 'absolute', top: 12, right: 12, fontSize: '0.62rem', fontFamily: 'var(--font-heading)', fontWeight: 800, letterSpacing: '0.1em', color: 'var(--gold)', background: 'var(--gold-glow)', border: '1px solid var(--gold)', borderRadius: 'var(--radius-full)', padding: '3px 9px' }}>
        ★ FEATURED
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        <GuildEmblem faction={guild.faction} size={72} />
        <div>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: 6 }}>
            {guild.name}
          </div>
          <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-heading)', fontWeight: 700, color: f.color, background: `${f.color}18`, border: `1px solid ${f.color}40`, borderRadius: 'var(--radius-full)', padding: '3px 10px' }}>
            {f.icon} {f.label}
          </span>
        </div>
      </div>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
        {guild.description}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
          <IconUsers size={14} />
          <span>{guild.members}/{guild.maxMembers} members</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--gold)', fontSize: '0.8rem' }}>
          <IconStar size={14} />
          <span>Lv.{guild.level}</span>
        </div>
      </div>
      <MemberBar current={guild.members} max={guild.maxMembers} color={f.color} />
      <div style={{ marginTop: 16 }}>
        <Link to={`/guild/${guild.id}`} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
          View Guild
        </Link>
      </div>
    </div>
  )
}

function CreateGuildModal({ onClose }) {
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [selectedFaction, setSelectedFaction] = useState('')

  return (
    <div className="guild-modal-backdrop" onClick={onClose}>
      <div className="guild-modal glass-panel" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', color: 'var(--text-primary)' }}>
            ⚔️ Create Guild
          </h2>
          <button onClick={onClose} style={{ color: 'var(--text-muted)', padding: 4, transition: 'color var(--transition-fast)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
            <IconX size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 'var(--radius-md)', background: 'rgba(212,168,67,0.08)', border: '1px solid var(--border-default)', marginBottom: 20 }}>
          <IconShield size={14} color="var(--gold)" />
          <span style={{ fontSize: '0.78rem', color: 'var(--gold)' }}>Requires Level 5+</span>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6, fontFamily: 'var(--font-heading)' }}>
            Guild Name
          </label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Enter guild name..."
            style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none', fontFamily: 'var(--font-body)', transition: 'border-color var(--transition-fast)' }}
            onFocus={e => e.target.style.borderColor = 'var(--border-active)'}
            onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6, fontFamily: 'var(--font-heading)' }}>
            Description
          </label>
          <textarea
            value={desc}
            onChange={e => setDesc(e.target.value)}
            placeholder="Describe your guild's purpose..."
            rows={3}
            style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none', fontFamily: 'var(--font-body)', resize: 'vertical', transition: 'border-color var(--transition-fast)' }}
            onFocus={e => e.target.style.borderColor = 'var(--border-active)'}
            onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 10, fontFamily: 'var(--font-heading)' }}>
            Choose Faction
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
            {Object.values(FACTIONS).map(f => (
              <button
                key={f.id}
                onClick={() => setSelectedFaction(f.id)}
                title={f.label}
                style={{
                  padding: '8px 4px', borderRadius: 'var(--radius-md)', fontSize: '1.2rem',
                  border: `2px solid ${selectedFaction === f.id ? f.color : 'var(--border-subtle)'}`,
                  background: selectedFaction === f.id ? `${f.color}22` : 'var(--bg-surface)',
                  cursor: 'pointer', transition: 'all var(--transition-fast)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                }}>
                <span>{f.icon}</span>
                <span style={{ fontSize: '0.55rem', color: selectedFaction === f.id ? f.color : 'var(--text-muted)', fontFamily: 'var(--font-heading)', fontWeight: 700, lineHeight: 1.2, textAlign: 'center' }}>
                  {f.label.split(' ')[0]}
                </span>
              </button>
            ))}
          </div>
        </div>

        <button
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center', opacity: (!name || !selectedFaction) ? 0.5 : 1, cursor: (!name || !selectedFaction) ? 'not-allowed' : 'pointer' }}
          disabled={!name || !selectedFaction}
        >
          <IconShield size={16} /> Create Guild
        </button>
      </div>
    </div>
  )
}

export default function GuildBrowserPage() {
  const [search, setSearch] = useState('')
  const [factionFilter, setFactionFilter] = useState('all')
  const [sortBy, setSortBy] = useState('members')
  const [showCreate, setShowCreate] = useState(false)

  const filtered = GUILD_GRID
    .filter(g => {
      const matchSearch = g.name.toLowerCase().includes(search.toLowerCase()) || g.description.toLowerCase().includes(search.toLowerCase())
      const matchFaction = factionFilter === 'all' || g.faction === factionFilter
      return matchSearch && matchFaction
    })
    .sort((a, b) => {
      if (sortBy === 'members') return b.members - a.members
      if (sortBy === 'level') return b.level - a.level
      if (sortBy === 'activity') return b.xp - a.xp
      return 0
    })

  return (
    <>
      <style>{`
        .guild-hero {
          padding: 72px 40px 48px;
          text-align: center;
          position: relative;
        }
        @media (max-width: 768px) {
          .guild-hero { padding: 56px 20px 36px; }
          .guild-filter-row { flex-direction: column !important; }
          .featured-scroll { padding: 0 20px 20px !important; }
          .guild-browser-content { padding: 0 20px 80px !important; }
          .guild-grid { grid-template-columns: 1fr !important; }
        }

        .guild-hero-title {
          font-family: var(--font-brand);
          font-size: clamp(1.8rem, 4vw, 3rem);
          background: linear-gradient(135deg, var(--gold) 0%, #e8c060 50%, #4ECDC4 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 12px;
        }
        .guild-search-bar {
          display: flex;
          align-items: center;
          gap: 12px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
          padding: 12px 18px;
          max-width: 600px;
          margin: 28px auto 0;
          transition: border-color var(--transition-fast);
        }
        .guild-search-bar:focus-within {
          border-color: var(--border-active);
          box-shadow: var(--shadow-gold);
        }
        .guild-search-bar input {
          flex: 1;
          background: none;
          border: none;
          outline: none;
          color: var(--text-primary);
          font-family: var(--font-body);
          font-size: 0.95rem;
        }
        .guild-search-bar input::placeholder { color: var(--text-muted); }

        .featured-section { margin-top: 48px; }
        .featured-scroll {
          display: flex;
          gap: 20px;
          overflow-x: auto;
          padding: 0 40px 20px;
          scrollbar-width: thin;
        }
        .featured-guild-card {
          min-width: 320px;
          max-width: 340px;
          flex-shrink: 0;
          background: var(--bg-card);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-xl);
          padding: 22px;
          position: relative;
          transition: transform var(--transition-base), box-shadow var(--transition-base), border-color var(--transition-base);
          backdrop-filter: blur(12px);
        }
        .featured-guild-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-gold-lg);
        }

        .guild-filter-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 40px;
          margin-bottom: 32px;
          flex-wrap: wrap;
        }
        .guild-select {
          padding: 9px 14px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          font-family: var(--font-body);
          font-size: 0.85rem;
          outline: none;
          cursor: pointer;
          transition: border-color var(--transition-fast);
        }
        .guild-select:focus { border-color: var(--border-active); }

        .guild-browser-content { padding: 0 40px 80px; }
        .guild-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
        }
        @media (max-width: 1100px) {
          .guild-grid { grid-template-columns: repeat(2, 1fr); }
        }

        .guild-grid-card {
          padding: 18px;
          border-radius: var(--radius-lg);
          transition: transform var(--transition-base), box-shadow var(--transition-base), border-color var(--transition-base);
        }
        .guild-grid-card:hover {
          transform: translateY(-3px);
          box-shadow: var(--shadow-gold);
          border-color: var(--border-hover);
        }

        .create-guild-fab {
          position: fixed;
          bottom: 32px;
          right: 32px;
          z-index: 50;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 22px;
          background: var(--gold);
          color: #0A0908;
          border-radius: var(--radius-full);
          font-family: var(--font-heading);
          font-weight: 700;
          font-size: 0.88rem;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 24px rgba(212,168,67,0.45);
          transition: all var(--transition-base);
        }
        .create-guild-fab:hover {
          background: var(--gold-light);
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(212,168,67,0.6);
        }

        .guild-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(5,4,3,0.85);
          backdrop-filter: blur(6px);
          z-index: 200;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .guild-modal {
          width: 100%;
          max-width: 520px;
          max-height: 90vh;
          overflow-y: auto;
          padding: 28px;
          border-radius: var(--radius-xl);
          animation: modalIn 0.25s ease;
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }

        .section-label {
          font-family: var(--font-heading);
          font-size: 0.7rem;
          font-weight: 800;
          letter-spacing: 0.12em;
          color: var(--gold);
          text-transform: uppercase;
          margin-bottom: 6px;
        }
        .section-title {
          font-family: var(--font-heading);
          font-size: 1.4rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 20px;
        }
      `}</style>

      {/* Hero */}
      <div className="guild-hero">
        <div className="section-label">AniEmpire</div>
        <h1 className="guild-hero-title">Find Your Guild</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: 500, margin: '0 auto' }}>
          Join a faction, forge bonds, conquer quests — find the guild that matches your spirit.
        </p>
        <div className="guild-search-bar">
          <IconSearch size={18} color="var(--text-muted)" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search guilds by name or vibe..."
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ color: 'var(--text-muted)', padding: 0 }}>
              <IconX size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Featured */}
      <section className="featured-section">
        <div style={{ padding: '0 40px', marginBottom: 20 }}>
          <div className="section-label">Top Picks</div>
          <div className="section-title">Featured Guilds</div>
        </div>
        <div className="featured-scroll">
          {FEATURED_GUILDS.map(g => <FeaturedCard key={g.id} guild={g} />)}
        </div>
      </section>

      {/* Filter row */}
      <div className="guild-filter-row" style={{ marginTop: 48, padding: '0 40px', marginBottom: 20 }}>
        <div className="section-title" style={{ marginBottom: 0, flex: 1 }}>All Guilds</div>
        <select className="guild-select" value={factionFilter} onChange={e => setFactionFilter(e.target.value)}>
          <option value="all">All Factions</option>
          {Object.values(FACTIONS).map(f => (
            <option key={f.id} value={f.id}>{f.icon} {f.label}</option>
          ))}
        </select>
        <select className="guild-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="members">Sort: Members</option>
          <option value="level">Sort: Level</option>
          <option value="activity">Sort: Activity</option>
        </select>
      </div>

      {/* Guild Grid */}
      <div className="guild-browser-content">
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>🔍</div>
            <p style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem' }}>No guilds match your search</p>
          </div>
        ) : (
          <div className="guild-grid">
            {filtered.map(g => <GuildCard key={g.id} guild={g} />)}
          </div>
        )}
      </div>

      {/* FAB */}
      <button className="create-guild-fab" onClick={() => setShowCreate(true)}>
        <IconPlus size={18} /> Create Guild
      </button>

      {/* Modal */}
      {showCreate && <CreateGuildModal onClose={() => setShowCreate(false)} />}
    </>
  )
}
