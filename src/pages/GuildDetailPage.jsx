import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { FACTIONS } from '../store/rpgStore'
import {
  IconUsers, IconShield, IconStar, IconTrophy, IconZap, IconTarget,
  IconFire, IconCheck, IconLock, IconCoins, IconCalendar, IconSend,
  IconAward, IconGem, IconTrendUp, IconClock, IconUser, CrownIcon
} from '../components/Icons'

// ── Mock guild data ──────────────────────────────────────────────────────────
const MOCK_GUILD = {
  id: 'g1', name: 'Dragon Flame Vanguard', faction: 'shonen',
  level: 12, xp: 68, xpForNext: 100,
  members: 48, maxMembers: 100,
  weeklyXP: 2450, rank: 8, treasury: 12500,
  description: 'Elite warriors who conquer every arc with unmatched tenacity. We push our limits daily, tackle the hardest raids together, and welcome those who share the burning spirit of a true shonen protagonist. Season veterans only — if you\'re ready to grind, you\'ve found your home.',
  master: { name: 'FlameKaiser', level: 47, avatar: '🔥', role: 'Guild Master' },
  founded: '2024-01-15',
  allies: [
    { id: 'a1', name: 'Iron Will Brotherhood', faction: 'shonen', level: 14, members: 67 },
    { id: 'a2', name: 'Arcane Realm Seekers',  faction: 'fantasy', level: 21, members: 72 },
  ],
}

const MOCK_MEMBERS = [
  { rank: 1,  name: 'FlameKaiser',    role: 'Master',  level: 47, weeklyXP: 890, joined: '2024-01-15', avatar: '🔥' },
  { rank: 2,  name: 'StormBlade99',   role: 'Officer', level: 38, weeklyXP: 720, joined: '2024-02-03', avatar: '⚡' },
  { rank: 3,  name: 'NightSerpent',   role: 'Officer', level: 35, weeklyXP: 610, joined: '2024-02-10', avatar: '🌙' },
  { rank: 4,  name: 'IronFistPulse',  role: 'Member',  level: 29, weeklyXP: 450, joined: '2024-03-01', avatar: '👊' },
  { rank: 5,  name: 'CrimsonArc',     role: 'Member',  level: 26, weeklyXP: 380, joined: '2024-03-14', avatar: '🌀' },
  { rank: 6,  name: 'VoidWalkerX',    role: 'Member',  level: 24, weeklyXP: 310, joined: '2024-04-02', avatar: '🌑' },
  { rank: 7,  name: 'SakuraBlade',    role: 'Member',  level: 22, weeklyXP: 270, joined: '2024-04-18', avatar: '🌸' },
  { rank: 8,  name: 'ThunderFang',    role: 'Member',  level: 20, weeklyXP: 240, joined: '2024-05-05', avatar: '🦁' },
  { rank: 9,  name: 'EchoMirage',     role: 'Member',  level: 18, weeklyXP: 190, joined: '2024-05-20', avatar: '🪞' },
  { rank: 10, name: 'PixelKnight',    role: 'Member',  level: 15, weeklyXP: 140, joined: '2024-06-08', avatar: '🛡️' },
  { rank: 11, name: 'StardustRift',   role: 'Member',  level: 13, weeklyXP: 110, joined: '2024-06-22', avatar: '⭐' },
  { rank: 12, name: 'NewRecruit_777', role: 'Member',  level: 6,  weeklyXP: 45,  joined: '2024-07-10', avatar: '🌱' },
]

const MOCK_QUESTS = {
  active: [
    { id: 'q1', name: 'Episode Marathon', desc: 'Watch 100 episodes collectively as a guild this week.', reward: '2,500 XP', rewardType: 'xp', progress: 73, deadline: '3d 14h', icon: '▶️' },
    { id: 'q2', name: 'Review Blitz',     desc: 'Submit 20 anime reviews across all members.',           reward: '1,200 XP', rewardType: 'xp', progress: 45, deadline: '5d 8h',  icon: '✍️' },
    { id: 'q3', name: 'Raid the Rankings', desc: 'Have 10 members reach the Top 500 leaderboard.',       reward: '500 Gems',  rewardType: 'gem', progress: 60, deadline: '6d 2h', icon: '🏆' },
  ],
  completed: [
    { id: 'qc1', name: 'Faction Loyalty',   desc: 'Complete 50 shonen-tagged anime across members.', reward: '3,000 XP' },
    { id: 'qc2', name: 'Chat Champions',    desc: 'Send 500 messages in the guild chat.',            reward: '800 XP'  },
    { id: 'qc3', name: 'Streak Warriors',   desc: 'Maintain a 7-day streak for 20 members.',         reward: '1,500 XP' },
  ],
}

const MOCK_MESSAGES = [
  { id: 1,  user: 'FlameKaiser',  avatar: '🔥', text: 'Great raid last night everyone! Let\'s keep the momentum going this week 💪', time: '2h ago',  system: false },
  { id: 2,  user: 'StormBlade99', avatar: '⚡', text: 'Just finished the new arc — absolutely insane ending. No spoilers but... wow.',  time: '3h ago',  system: false },
  { id: 3,  user: null,           avatar: null, text: 'NightSerpent promoted to Officer',                                              time: '5h ago',  system: true  },
  { id: 4,  user: 'NightSerpent', avatar: '🌙', text: 'Thanks for the promotion! Won\'t let the guild down ⚔️',                        time: '5h ago',  system: false },
  { id: 5,  user: 'IronFistPulse',avatar: '👊', text: 'Anyone up for the Episode Marathon quest later tonight?',                       time: '7h ago',  system: false },
  { id: 6,  user: 'CrimsonArc',   avatar: '🌀', text: 'I\'m in! Let\'s grind those 100 episodes. Who else?',                          time: '7h ago',  system: false },
  { id: 7,  user: 'SakuraBlade',  avatar: '🌸', text: 'Count me in. I have like 15 episodes queued already 😄',                       time: '8h ago',  system: false },
  { id: 8,  user: null,           avatar: null, text: 'Guild reached Level 12! New buff unlocked: +10% XP',                           time: '1d ago',  system: true  },
  { id: 9,  user: 'ThunderFang',  avatar: '🦁', text: 'Level 12 let\'s go!! We\'re unstoppable 🔥',                                   time: '1d ago',  system: false },
  { id: 10, user: 'FlameKaiser',  avatar: '🔥', text: 'Aim for Rank #5 this season. I believe in every one of you.',                  time: '1d ago',  system: false },
]

const WEEKLY_ACTIVITY = [
  { day: 'Mon', xp: 280 }, { day: 'Tue', xp: 420 }, { day: 'Wed', xp: 310 },
  { day: 'Thu', xp: 580 }, { day: 'Fri', xp: 390 }, { day: 'Sat', xp: 260 }, { day: 'Sun', xp: 210 },
]

const ACHIEVEMENTS = [
  { icon: '🏆', name: 'First Victory',   desc: 'Won the first guild war',          date: '2024-02-20' },
  { icon: '🔥', name: 'Week on Fire',    desc: '7 consecutive days of top-10 XP',  date: '2024-04-05' },
  { icon: '🌟', name: 'Century Members', desc: 'Reached 50 guild members',         date: '2024-06-12' },
]

const BUFFS = [
  { name: '+10% XP Gain',      icon: '⚡', timer: '1d 14h', color: 'var(--gold)' },
  { name: '+5% Credit Drop',   icon: '💰', timer: '2d 8h',  color: 'var(--green)' },
]

const LOCKED_FEATURES = [
  { name: 'Guild Treasury Vault', level: 15, icon: '🏦' },
  { name: 'War Matchmaking',      level: 18, icon: '⚔️' },
  { name: 'Alliance Network',     level: 20, icon: '🤝' },
]

const ROLE_COLORS = { Master: 'var(--gold)', Officer: 'var(--blue)', Member: 'var(--text-secondary)' }
const RANK_BORDERS = { 1: 'var(--gold)', 2: '#C0C0C0', 3: '#CD7F32' }

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div className="guild-stat-card glass-panel">
      <div style={{ color: color || 'var(--gold)', marginBottom: 8 }}>{icon}</div>
      <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{value}</div>
      {sub && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>{sub}</div>}
      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-heading)', fontWeight: 600, letterSpacing: '0.04em' }}>{label}</div>
    </div>
  )
}

function TabButton({ id, label, active, onClick }) {
  return (
    <button
      onClick={() => onClick(id)}
      style={{
        padding: '10px 18px', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-heading)',
        fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', border: 'none',
        background: active ? 'var(--gold-glow)' : 'transparent',
        color: active ? 'var(--gold)' : 'var(--text-muted)',
        borderBottom: active ? '2px solid var(--gold)' : '2px solid transparent',
        transition: 'all var(--transition-fast)',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'var(--text-secondary)' }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'var(--text-muted)' }}
    >
      {label}
    </button>
  )
}

// ── Tab: Overview ─────────────────────────────────────────────────────────────
function TabOverview({ guild }) {
  const maxXP = Math.max(...WEEKLY_ACTIVITY.map(d => d.xp))
  const f = FACTIONS[guild.faction]
  return (
    <div className="tab-content-grid">
      {/* Left column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Description */}
        <div className="glass-panel" style={{ padding: 22 }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.9rem', color: 'var(--gold)', marginBottom: 12, letterSpacing: '0.06em', textTransform: 'uppercase' }}>About</h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.9rem' }}>{guild.description}</p>
        </div>

        {/* Guild Master */}
        <div className="glass-panel" style={{ padding: 22 }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.9rem', color: 'var(--gold)', marginBottom: 14, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Guild Master</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: `${f.color}22`, border: `2px solid ${f.color}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
              {guild.master.avatar}
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3 }}>{guild.master.name}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--gold)', background: 'var(--gold-glow-soft)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-full)', padding: '2px 8px', fontFamily: 'var(--font-heading)', fontWeight: 700 }}>
                  👑 Guild Master
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', background: 'var(--bg-surface)', borderRadius: 'var(--radius-full)', padding: '2px 8px' }}>
                  Lv.{guild.master.level}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Allied Guilds */}
        <div className="glass-panel" style={{ padding: 22 }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.9rem', color: 'var(--gold)', marginBottom: 14, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Allied Guilds</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {guild.allies.map(ally => {
              const af = FACTIONS[ally.faction]
              return (
                <Link to={`/guild/${ally.id}`} key={ally.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', transition: 'border-color var(--transition-fast)', textDecoration: 'none' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-hover)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${af.color}22`, border: `2px solid ${af.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>{af.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ally.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{ally.members} members · Lv.{ally.level}</div>
                  </div>
                  <span style={{ fontSize: '0.65rem', color: af.color, background: `${af.color}18`, border: `1px solid ${af.color}33`, borderRadius: 'var(--radius-full)', padding: '2px 7px', fontFamily: 'var(--font-heading)', fontWeight: 700, flexShrink: 0 }}>{af.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* Right column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Achievements */}
        <div className="glass-panel" style={{ padding: 22 }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.9rem', color: 'var(--gold)', marginBottom: 14, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Recent Achievements</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {ACHIEVEMENTS.map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '1.4rem' }}>{a.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: 2 }}>{a.name}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{a.desc}</div>
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{a.date}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Activity Chart */}
        <div className="glass-panel" style={{ padding: 22 }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.9rem', color: 'var(--gold)', marginBottom: 18, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Weekly Activity</h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 100 }}>
            {WEEKLY_ACTIVITY.map((d, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{ width: '100%', borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0', height: `${(d.xp / maxXP) * 80}px`, background: `linear-gradient(180deg, var(--gold) 0%, ${FACTIONS[MOCK_GUILD.faction].color}88 100%)`, transition: 'height 0.6s ease', minHeight: 4 }} />
                <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontFamily: 'var(--font-heading)' }}>{d.day}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center' }}>Total this week: <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{WEEKLY_ACTIVITY.reduce((s, d) => s + d.xp, 0).toLocaleString()} XP</span></div>
        </div>
      </div>
    </div>
  )
}

// ── Tab: Members ──────────────────────────────────────────────────────────────
function TabMembers() {
  const [sort, setSort] = useState('rank')
  const sorted = [...MOCK_MEMBERS].sort((a, b) => {
    if (sort === 'rank') return a.rank - b.rank
    if (sort === 'level') return b.level - a.level
    if (sort === 'xp') return b.weeklyXP - a.weeklyXP
    return 0
  })
  return (
    <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
        <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--text-primary)' }}>Members ({MOCK_MEMBERS.length})</span>
        <select value={sort} onChange={e => setSort(e.target.value)} style={{ padding: '6px 10px', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: '0.8rem', outline: 'none', cursor: 'pointer' }}>
          <option value="rank">By Rank</option>
          <option value="level">By Level</option>
          <option value="xp">By Weekly XP</option>
        </select>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-surface)' }}>
              {['#', 'Member', 'Role', 'Level', 'Weekly XP', 'Joined'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '0.7rem', fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map(m => (
              <tr key={m.rank} style={{ borderTop: '1px solid var(--border-subtle)', borderLeft: `3px solid ${RANK_BORDERS[m.rank] || 'transparent'}`, transition: 'background var(--transition-fast)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: '12px 16px', fontFamily: 'var(--font-heading)', fontWeight: 700, color: RANK_BORDERS[m.rank] ? RANK_BORDERS[m.rank] : 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {m.rank <= 3 ? ['🥇','🥈','🥉'][m.rank-1] : `#${m.rank}`}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>{m.avatar}</div>
                    <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{m.name}</span>
                  </div>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-heading)', fontWeight: 700, color: ROLE_COLORS[m.role], background: `${ROLE_COLORS[m.role]}18`, border: `1px solid ${ROLE_COLORS[m.role]}33`, borderRadius: 'var(--radius-full)', padding: '2px 9px' }}>
                    {m.role === 'Master' ? '👑' : m.role === 'Officer' ? '⚔️' : '•'} {m.role}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{m.level}</td>
                <td style={{ padding: '12px 16px', fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--gold)', fontSize: '0.85rem' }}>{m.weeklyXP.toLocaleString()}</td>
                <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>{m.joined}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Tab: Quests ───────────────────────────────────────────────────────────────
function TabQuests() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', color: 'var(--text-primary)', marginBottom: 16 }}>
          ⚡ Active Quests
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {MOCK_QUESTS.active.map(q => (
            <div key={q.id} className="glass-panel" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <span style={{ fontSize: '1.5rem' }}>{q.icon}</span>
                  <div>
                    <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{q.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{q.desc}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                  <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-heading)', fontWeight: 700, color: q.rewardType === 'gem' ? 'var(--purple)' : 'var(--gold)', background: q.rewardType === 'gem' ? 'rgba(139,82,196,0.15)' : 'var(--gold-glow-soft)', border: `1px solid ${q.rewardType === 'gem' ? 'rgba(139,82,196,0.35)' : 'var(--border-default)'}`, borderRadius: 'var(--radius-full)', padding: '3px 10px' }}>
                    {q.rewardType === 'gem' ? '💎' : '⭐'} {q.reward}
                  </span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <IconClock size={11} /> {q.deadline}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1, height: 6, borderRadius: 99, background: 'var(--bg-surface)', overflow: 'hidden' }}>
                  <div className="xp-bar-fill" style={{ width: `${q.progress}%`, height: '100%' }} />
                </div>
                <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--gold)' }}>{q.progress}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
          ✓ Completed
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {MOCK_QUESTS.completed.map(q => (
            <div key={q.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', opacity: 0.6 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--green)22', border: '2px solid var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <IconCheck size={14} color="var(--green)" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-secondary)', textDecoration: 'line-through' }}>{q.name}</div>
                <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>{q.desc}</div>
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-heading)' }}>{q.reward}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Tab: Chat ─────────────────────────────────────────────────────────────────
function TabChat() {
  return (
    <div className="glass-panel" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)', fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
        💬 Guild Chat
        <span style={{ fontSize: '0.7rem', color: 'var(--green)', fontWeight: 600 }}>● Live</span>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 460 }}>
        {[...MOCK_MESSAGES].reverse().map(msg => (
          msg.system ? (
            <div key={msg.id} style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--gold)', background: 'var(--gold-glow-soft)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-full)', padding: '3px 12px' }}>
                ⚡ {msg.text}
              </span>
            </div>
          ) : (
            <div key={msg.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>{msg.avatar}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 3 }}>
                  <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.82rem', color: 'var(--gold)' }}>{msg.user}</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{msg.time}</span>
                </div>
                <div style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5, background: 'var(--bg-surface)', padding: '8px 12px', borderRadius: '0 var(--radius-md) var(--radius-md) var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  {msg.text}
                </div>
              </div>
            </div>
          )
        ))}
      </div>
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 10, alignItems: 'center' }}>
        <div style={{ flex: 1, background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '10px 14px', color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
          Login to chat with your guild...
        </div>
        <button disabled style={{ padding: '10px 14px', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', opacity: 0.5, cursor: 'not-allowed' }}>
          <IconSend size={16} />
        </button>
      </div>
    </div>
  )
}

// ── Tab: Hall ─────────────────────────────────────────────────────────────────
function TabHall({ guild }) {
  const f = FACTIONS[guild.faction]
  const treasury = { anime: 45, events: 30, upgrades: 25 }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Level XP */}
      <div className="glass-panel" style={{ padding: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.9rem', color: 'var(--gold)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Guild Level Progress</h3>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--gold)' }}>Lv.{guild.level}</span>
        </div>
        <div style={{ height: 10, borderRadius: 99, background: 'var(--bg-surface)', overflow: 'hidden', marginBottom: 8 }}>
          <div className="xp-bar-fill" style={{ width: `${guild.xp}%`, height: '100%' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          <span>{guild.xp}% to Lv.{guild.level + 1}</span>
          <span>{guild.xpForNext - Math.round(guild.xpForNext * guild.xp / 100)} XP remaining</span>
        </div>
      </div>

      {/* Active Buffs */}
      <div className="glass-panel" style={{ padding: 22 }}>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.9rem', color: 'var(--gold)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14 }}>Active Buffs</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {BUFFS.map((b, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: `1px solid ${b.color}33` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '1.2rem' }}>{b.icon}</span>
                <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: b.color, fontSize: '0.88rem' }}>{b.name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                <IconClock size={12} /> {b.timer}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Locked Features */}
      <div className="glass-panel" style={{ padding: 22 }}>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.9rem', color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14 }}>Locked Features</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {LOCKED_FEATURES.map((feat, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', opacity: 0.6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <IconLock size={14} color="var(--text-muted)" />
                <span style={{ fontSize: '1.1rem' }}>{feat.icon}</span>
                <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.88rem' }}>{feat.name}</span>
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', background: 'var(--bg-card)', borderRadius: 'var(--radius-full)', padding: '2px 8px', border: '1px solid var(--border-subtle)' }}>Lv.{feat.level}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Treasury */}
      <div className="glass-panel" style={{ padding: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.9rem', color: 'var(--gold)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Treasury Allocation</h3>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--gold)' }}>💰 {guild.treasury.toLocaleString()}cr</span>
        </div>
        {Object.entries(treasury).map(([key, pct]) => (
          <div key={key} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: '0.78rem' }}>
              <span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{key}</span>
              <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{pct}%</span>
            </div>
            <div style={{ height: 6, borderRadius: 99, background: 'var(--bg-surface)', overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg, var(--gold), ${f.color})`, borderRadius: 99 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Tab: Wars ─────────────────────────────────────────────────────────────────
function TabWars({ guild }) {
  const f = FACTIONS[guild.faction]
  const hasWar = false
  if (!hasWar) {
    return (
      <div className="glass-panel" style={{ padding: 48, textAlign: 'center' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>⚔️</div>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: 8 }}>No Active Wars</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: 340, margin: '0 auto' }}>
          Your guild is currently at peace. Challenge another guild to begin a war and earn exclusive rewards.
        </p>
        <button className="btn btn-primary" style={{ marginTop: 24, opacity: 0.5, cursor: 'not-allowed' }} disabled>
          Declare War (Lv.18 required)
        </button>
      </div>
    )
  }
  // War scoreboard (shown when hasWar = true)
  return null
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview', label: '📜 Overview' },
  { id: 'members',  label: '👥 Members' },
  { id: 'quests',   label: '⚡ Quests' },
  { id: 'chat',     label: '💬 Chat' },
  { id: 'hall',     label: '🏛️ Hall' },
  { id: 'wars',     label: '⚔️ Wars' },
]

export default function GuildDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const guild = MOCK_GUILD
  const f = FACTIONS[guild.faction] || FACTIONS.shonen

  return (
    <>
      <style>{`
        .guild-banner {
          position: relative;
          height: 200px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 12px;
        }
        .guild-banner-bg {
          position: absolute;
          inset: 0;
          animation: bannerShift 8s ease-in-out infinite alternate;
        }
        @keyframes bannerShift {
          from { background-position: 0% 50%; }
          to   { background-position: 100% 50%; }
        }
        .guild-banner-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(10,9,8,0.1) 0%, rgba(10,9,8,0.7) 100%);
        }
        .guild-banner-content {
          position: relative;
          z-index: 2;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }
        .guild-banner-emblem {
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 30px rgba(0,0,0,0.6);
        }
        .guild-banner-actions {
          position: absolute;
          top: 16px;
          right: 20px;
          z-index: 3;
        }

        .guild-stats-row {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 14px;
          padding: 24px 40px;
        }
        @media (max-width: 1100px) {
          .guild-stats-row { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 768px) {
          .guild-stats-row { grid-template-columns: repeat(2, 1fr); padding: 16px 20px; }
          .guild-detail-body { padding: 0 20px 80px !important; }
          .tab-content-grid { grid-template-columns: 1fr !important; }
        }

        .guild-stat-card {
          padding: 16px;
          text-align: center;
          border-radius: var(--radius-lg);
          transition: transform var(--transition-fast), box-shadow var(--transition-fast);
        }
        .guild-stat-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-gold);
        }

        .guild-tabs-bar {
          display: flex;
          gap: 4px;
          padding: 0 40px;
          border-bottom: 1px solid var(--border-subtle);
          margin-bottom: 28px;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .guild-tabs-bar::-webkit-scrollbar { display: none; }

        .guild-detail-body { padding: 0 40px 80px; }

        .tab-content-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
      `}</style>

      {/* Banner */}
      <div className="guild-banner">
        <div className="guild-banner-bg" style={{
          background: `linear-gradient(135deg, ${f.color}44 0%, var(--bg-primary) 40%, ${f.color}22 70%, var(--bg-card) 100%)`,
          backgroundSize: '200% 200%',
        }} />
        <div className="guild-banner-overlay" />
        <div className="guild-banner-content">
          <div className="guild-banner-emblem" style={{ width: 72, height: 72, fontSize: '2rem', background: `radial-gradient(circle at 35% 35%, ${f.color}55, ${f.color}22)`, border: `3px solid ${f.color}88` }}>
            {f.icon}
          </div>
          <div>
            <h1 style={{ fontFamily: 'var(--font-brand)', fontSize: 'clamp(1.2rem,3vw,1.8rem)', color: 'var(--text-primary)', textShadow: '0 2px 12px rgba(0,0,0,0.8)', marginBottom: 4 }}>
              {guild.name}
            </h1>
            <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-heading)', fontWeight: 700, color: f.color, background: `${f.color}22`, border: `1px solid ${f.color}44`, borderRadius: 'var(--radius-full)', padding: '3px 12px' }}>
              {f.icon} {f.label}
            </span>
          </div>
        </div>
        <div className="guild-banner-actions">
          <button className="btn btn-primary btn-sm" style={{ fontSize: '0.8rem' }}>
            Apply to Join
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="guild-stats-row">
        <StatCard icon={<IconUsers size={20} />} label="Members" value={`${guild.members}/${guild.maxMembers}`} color="var(--blue)" />
        <StatCard icon={<IconStar size={20} />} label="Level" value={guild.level} color="var(--gold)" />
        <StatCard icon={<IconZap size={20} />} label="Weekly XP" value={guild.weeklyXP.toLocaleString()} color="var(--green)" />
        <StatCard icon={<IconTrophy size={20} />} label="Rank" value={`#${guild.rank}`} color="var(--purple)" />
        <StatCard icon={<IconCoins size={20} />} label="Treasury" value={`${(guild.treasury/1000).toFixed(1)}k`} sub="credits" color="var(--gold)" />
      </div>

      {/* Tabs */}
      <div className="guild-tabs-bar">
        {TABS.map(t => (
          <TabButton key={t.id} id={t.id} label={t.label} active={activeTab === t.id} onClick={setActiveTab} />
        ))}
      </div>

      {/* Tab Content */}
      <div className="guild-detail-body">
        {activeTab === 'overview' && <TabOverview guild={guild} />}
        {activeTab === 'members'  && <TabMembers />}
        {activeTab === 'quests'   && <TabQuests />}
        {activeTab === 'chat'     && <TabChat />}
        {activeTab === 'hall'     && <TabHall guild={guild} />}
        {activeTab === 'wars'     && <TabWars guild={guild} />}
      </div>
    </>
  )
}
