import { useState, useEffect } from 'react'
import { IconTrophy, IconFire, IconStar, IconShield, IconZap, IconUsers, IconSword, IconTarget, IconAward, IconTrendUp, IconClock, CrownIcon } from '../components/Icons'
import { FACTIONS } from '../store/rpgStore'

// ── Mock Data ─────────────────────────────────────────────────────────────────
const FACTION_LIST = Object.values(FACTIONS)

const GLOBAL_USERS = [
  { rank: 1,  name: 'ShadowReaper',   faction: 'shonen',  level: 78, xp: 142300, change: +5,  avatar: '🐉' },
  { rank: 2,  name: 'NeonProphet',    faction: 'cyber',   level: 74, xp: 138900, change: -1,  avatar: '⚡' },
  { rank: 3,  name: 'MysticKaede',    faction: 'mystic',  level: 71, xp: 131200, change: +2,  avatar: '✨' },
  { rank: 4,  name: 'IronHunter',     faction: 'seinen',  level: 69, xp: 124800, change: 0,   avatar: '🧠' },
  { rank: 5,  name: 'BlossomQueen',   faction: 'shoujo',  level: 65, xp: 118400, change: +3,  avatar: '🌸' },
  { rank: 6,  name: 'VoidWalker',     faction: 'isekai',  level: 62, xp: 112900, change: -2,  avatar: '🌀' },
  { rank: 7,  name: 'GearKnight',     faction: 'mecha',   level: 60, xp: 106700, change: +1,  avatar: '🤖' },
  { rank: 8,  name: 'SolSurfer',      faction: 'sol',     level: 58, xp:  99200, change: -3,  avatar: '☀️' },
  { rank: 9,  name: 'CrimsonLore',    faction: 'fantasy', level: 55, xp:  94100, change: +4,  avatar: '🔮' },
  { rank: 10, name: 'NightHarvest',   faction: 'horror',  level: 52, xp:  89800, change: +1,  avatar: '👁️' },
  { rank: 11, name: 'ArcaneKing',     faction: 'mystic',  level: 50, xp:  85300, change: -1,  avatar: '🌙' },
  { rank: 12, name: 'ThunderBlade',   faction: 'shonen',  level: 48, xp:  81200, change: +2,  avatar: '⚔️' },
  { rank: 13, name: 'PixelDrifter',   faction: 'cyber',   level: 46, xp:  77600, change: 0,   avatar: '💻' },
  { rank: 14, name: 'SakuraSage',     faction: 'shoujo',  level: 44, xp:  74100, change: +6,  avatar: '🌺' },
  { rank: 15, name: 'IronClad',       faction: 'mecha',   level: 42, xp:  70800, change: -2,  avatar: '🛡️' },
  { rank: 16, name: 'RuneKeeper',     faction: 'fantasy', level: 40, xp:  67300, change: +1,  avatar: '📜' },
  { rank: 17, name: 'ChaosRider',     faction: 'isekai',  level: 38, xp:  63900, change: -4,  avatar: '🌪️' },
  { rank: 18, name: 'SilentWarden',   faction: 'seinen',  level: 35, xp:  59400, change: 0,   avatar: '🗡️' },
  { rank: 19, name: 'DuskCaller',     faction: 'horror',  level: 32, xp:  55100, change: +3,  avatar: '🌑' },
  { rank: 20, name: 'SunriseHero',    faction: 'sol',     level: 28, xp:  51800, change: +2,  avatar: '🌄' },
]

const FACTION_RANKS = [
  { rank: 1,  id: 'shonen',  members: 4821, totalXP: 9820400, avgLevel: 42, weekly: [60,72,85,91,88,95,99], leading: true },
  { rank: 2,  id: 'cyber',   members: 3912, totalXP: 8740200, avgLevel: 39, weekly: [55,68,70,82,86,90,95], leading: false },
  { rank: 3,  id: 'mystic',  members: 3540, totalXP: 7910600, avgLevel: 37, weekly: [50,60,65,70,80,82,90], leading: false },
  { rank: 4,  id: 'seinen',  members: 3280, totalXP: 7120300, avgLevel: 35, weekly: [48,55,60,68,72,78,85], leading: false },
  { rank: 5,  id: 'fantasy', members: 2990, totalXP: 6580100, avgLevel: 33, weekly: [40,50,58,62,70,74,80], leading: false },
  { rank: 6,  id: 'isekai',  members: 2740, totalXP: 5990800, avgLevel: 31, weekly: [38,45,52,58,65,70,76], leading: false },
  { rank: 7,  id: 'shoujo',  members: 2610, totalXP: 5430200, avgLevel: 29, weekly: [35,42,48,55,60,66,72], leading: false },
  { rank: 8,  id: 'mecha',   members: 2310, totalXP: 4870500, avgLevel: 27, weekly: [30,38,44,50,55,60,68], leading: false },
  { rank: 9,  id: 'sol',     members: 2100, totalXP: 4220300, avgLevel: 25, weekly: [28,34,40,46,50,56,62], leading: false },
  { rank: 10, id: 'horror',  members: 1890, totalXP: 3710100, avgLevel: 23, weekly: [22,28,34,40,45,50,57], leading: false },
]

const FRIENDS = [
  { rank: 1,  name: 'KiritoFan99',  faction: 'shonen',  level: 45, xp: 88400,  change: +2,  avatar: '⚔️' },
  { rank: 2,  name: 'MisakaMikoto', faction: 'cyber',   level: 38, xp: 72100,  change: +1,  avatar: '⚡' },
  { rank: 3,  name: 'TanjiroMain',  faction: 'shonen',  level: 34, xp: 61800,  change: -1,  avatar: '🌊' },
  { rank: 4,  name: 'YuriOnIce',    faction: 'sol',     level: 29, xp: 52300,  change: +3,  avatar: '⛸️' },
  { rank: 5,  name: 'RemFan',       faction: 'fantasy', level: 25, xp: 44200,  change: 0,   avatar: '🔮' },
  { rank: 6,  name: 'GojoSatoru',   faction: 'mystic',  level: 22, xp: 38100,  change: -2,  avatar: '✨' },
  { rank: 7,  name: 'LuffyGang',    faction: 'shonen',  level: 19, xp: 31400,  change: +4,  avatar: '🌀' },
  { rank: 8,  name: 'ZeroTwo',      faction: 'mecha',   level: 16, xp: 24900,  change: +1,  avatar: '🌸' },
]

const WEEKLY_TOP = [
  { rank: 1,  name: 'ShadowReaper',  faction: 'shonen',  level: 78, xp: 4200,  change: +8,  avatar: '🐉' },
  { rank: 2,  name: 'ArcaneKing',    faction: 'mystic',  level: 50, xp: 3800,  change: +12, avatar: '🌙' },
  { rank: 3,  name: 'SakuraSage',    faction: 'shoujo',  level: 44, xp: 3500,  change: +18, avatar: '🌺' },
  { rank: 4,  name: 'PixelDrifter',  faction: 'cyber',   level: 46, xp: 3200,  change: +3,  avatar: '💻' },
  { rank: 5,  name: 'RuneKeeper',    faction: 'fantasy', level: 40, xp: 2900,  change: +6,  avatar: '📜' },
  { rank: 6,  name: 'IronHunter',    faction: 'seinen',  level: 69, xp: 2700,  change: -1,  avatar: '🧠' },
  { rank: 7,  name: 'MysticKaede',   faction: 'mystic',  level: 71, xp: 2500,  change: +2,  avatar: '✨' },
  { rank: 8,  name: 'SunriseHero',   faction: 'sol',     level: 28, xp: 2300,  change: +15, avatar: '🌄' },
  { rank: 9,  name: 'GearKnight',    faction: 'mecha',   level: 60, xp: 2100,  change: -2,  avatar: '🤖' },
  { rank: 10, name: 'CrimsonLore',   faction: 'fantasy', level: 55, xp: 1900,  change: +7,  avatar: '🔮' },
]

const GUILDS = [
  { rank: 1,  name: 'Eternal Blaze',   emblem: '🔥', level: 18, members: 48, weeklyXP: 284000 },
  { rank: 2,  name: 'Shadow Nexus',    emblem: '🌑', level: 16, members: 45, weeklyXP: 261000 },
  { rank: 3,  name: 'Crystal Vanguard',emblem: '💎', level: 15, members: 42, weeklyXP: 239000 },
  { rank: 4,  name: 'Storm Riders',    emblem: '⚡', level: 14, members: 40, weeklyXP: 218000 },
  { rank: 5,  name: 'Arcane Circle',   emblem: '🔮', level: 13, members: 38, weeklyXP: 196000 },
  { rank: 6,  name: 'Iron Covenant',   emblem: '🛡️', level: 12, members: 35, weeklyXP: 174000 },
  { rank: 7,  name: 'Sakura Order',    emblem: '🌸', level: 11, members: 33, weeklyXP: 155000 },
  { rank: 8,  name: 'Void Seekers',    emblem: '🌀', level: 10, members: 30, weeklyXP: 137000 },
  { rank: 9,  name: 'Sun Chorus',      emblem: '☀️', level: 9,  members: 28, weeklyXP: 118000 },
  { rank: 10, name: 'Night Watchers',  emblem: '🌙', level: 8,  members: 25, weeklyXP:  99000 },
]

const TABS = ['Global', 'Faction', 'Friends', 'Weekly', 'Guilds']

function ChangeArrow({ val }) {
  if (val === 0) return <span className="lb-change neutral">—</span>
  if (val > 0) return <span className="lb-change up">▲{val}</span>
  return <span className="lb-change down">▼{Math.abs(val)}</span>
}

function RankNum({ rank }) {
  let style = {}
  if (rank === 1) style = { color: '#D4A843', fontWeight: 800 }
  else if (rank === 2) style = { color: '#C0C0C0', fontWeight: 700 }
  else if (rank === 3) style = { color: '#CD7F32', fontWeight: 700 }
  else if (rank <= 10) style = { color: '#C0C0C0', fontWeight: 600 }
  else style = { color: 'var(--text-muted)', fontWeight: 500 }
  return <span className="lb-rank-num" style={style}>#{rank}</span>
}

function FactionTag({ factionId }) {
  const f = FACTIONS[factionId]
  if (!f) return null
  return (
    <span className="lb-faction-tag" style={{ color: f.color, background: f.color + '18', borderColor: f.color + '40' }}>
      {f.icon} {f.label.split(' ')[0]}
    </span>
  )
}

function UserRow({ user, isTop = false }) {
  return (
    <div className={`lb-row glass-panel ${isTop ? 'lb-row-top' : ''}`}>
      <RankNum rank={user.rank} />
      <div className="lb-avatar">{user.avatar}</div>
      <div className="lb-user-info">
        <span className="lb-username">{user.name}</span>
        <FactionTag factionId={user.faction} />
      </div>
      <span className="lb-level-badge">Lv.{user.level}</span>
      <span className="lb-xp">{user.xp.toLocaleString()} XP</span>
      <ChangeArrow val={user.change} />
    </div>
  )
}

function Podium({ users }) {
  const [second, first, third] = [users[1], users[0], users[2]]
  return (
    <div className="lb-podium">
      {/* 2nd */}
      <div className="lb-podium-slot lb-podium-second">
        <div className="lb-podium-avatar" style={{ borderColor: '#C0C0C0' }}>
          <span style={{ fontSize: '1.8rem' }}>{second.avatar}</span>
        </div>
        <div className="lb-podium-trophy" style={{ color: '#C0C0C0' }}>🥈</div>
        <div className="lb-podium-name">{second.name}</div>
        <div className="lb-podium-xp">{second.xp.toLocaleString()} XP</div>
        <div className="lb-podium-base lb-podium-base-2nd" />
      </div>

      {/* 1st */}
      <div className="lb-podium-slot lb-podium-first">
        <div className="lb-podium-crown"><CrownIcon size={28} color="#D4A843" /></div>
        <div className="lb-podium-avatar lb-podium-avatar-1st" style={{ borderColor: '#D4A843' }}>
          <span style={{ fontSize: '2.2rem' }}>{first.avatar}</span>
        </div>
        <div className="lb-podium-name lb-podium-name-1st gradient-text">{first.name}</div>
        <div className="lb-podium-xp">{first.xp.toLocaleString()} XP</div>
        <div className="lb-podium-base lb-podium-base-1st" />
      </div>

      {/* 3rd */}
      <div className="lb-podium-slot lb-podium-third">
        <div className="lb-podium-avatar" style={{ borderColor: '#CD7F32' }}>
          <span style={{ fontSize: '1.8rem' }}>{third.avatar}</span>
        </div>
        <div className="lb-podium-trophy" style={{ color: '#CD7F32' }}>🥉</div>
        <div className="lb-podium-name">{third.name}</div>
        <div className="lb-podium-xp">{third.xp.toLocaleString()} XP</div>
        <div className="lb-podium-base lb-podium-base-3rd" />
      </div>
    </div>
  )
}

function WeeklyBar({ data }) {
  const max = Math.max(...data)
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  return (
    <div className="lb-weekly-chart">
      {data.map((v, i) => (
        <div key={i} className="lb-bar-col">
          <div className="lb-bar-track">
            <div className="lb-bar-fill" style={{ height: `${(v / max) * 100}%` }} />
          </div>
          <span className="lb-bar-day">{days[i]}</span>
        </div>
      ))}
    </div>
  )
}

function CountdownTimer({ label, seconds }) {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return (
    <span className="lb-countdown">
      <IconClock size={13} color="var(--gold)" />
      {label} {d}d {h}h {m}m
    </span>
  )
}

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState('Global')
  const [seasonSecs] = useState(14 * 24 * 3600)
  const [weekSecs] = useState(3 * 24 * 3600 + 14 * 3600 + 22 * 60)
  const seasonPct = ((30 - 14) / 30) * 100

  return (
    <div className="lb-page">
      <style>{`
        .lb-page {
          min-height: 100vh;
          padding: 32px 24px 100px;
          max-width: 1100px;
          margin: 0 auto;
        }

        /* ── Header ── */
        .lb-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 32px;
        }
        .lb-title-group {}
        .lb-page-title {
          font-family: var(--font-heading);
          font-size: clamp(1.8rem, 4vw, 2.6rem);
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 10px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .lb-season-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(212,168,67,0.1);
          border: 1px solid rgba(212,168,67,0.25);
          border-radius: var(--radius-full);
          padding: 5px 14px;
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--gold);
        }
        .lb-season-bar-wrap {
          margin-top: 8px;
          height: 3px;
          width: 220px;
          background: var(--bg-surface);
          border-radius: var(--radius-full);
          overflow: hidden;
        }
        .lb-season-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--gold-dark), var(--gold));
          border-radius: var(--radius-full);
        }
        .lb-countdown {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 0.78rem;
          color: var(--text-muted);
        }

        /* ── Tabs ── */
        .lb-tabs {
          display: flex;
          gap: 4px;
          background: var(--bg-card);
          padding: 5px;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-subtle);
          margin-bottom: 28px;
          flex-wrap: wrap;
        }
        .lb-tab {
          flex: 1;
          min-width: 70px;
          padding: 8px 16px;
          border-radius: var(--radius-md);
          border: none;
          background: transparent;
          color: var(--text-secondary);
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
          white-space: nowrap;
          text-align: center;
        }
        .lb-tab:hover { background: var(--bg-hover); color: var(--text-primary); }
        .lb-tab.active {
          background: linear-gradient(135deg, rgba(212,168,67,0.2), rgba(212,168,67,0.06));
          color: var(--gold);
          border: 1px solid rgba(212,168,67,0.28);
        }

        /* ── Podium ── */
        .lb-podium {
          display: flex;
          align-items: flex-end;
          justify-content: center;
          gap: 0;
          margin-bottom: 36px;
          padding: 20px 0 0;
        }
        .lb-podium-slot {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          position: relative;
          flex: 1;
          max-width: 180px;
        }
        .lb-podium-crown {
          filter: drop-shadow(0 0 12px rgba(212,168,67,0.7));
          animation: floatCrown 2.5s ease-in-out infinite;
        }
        @keyframes floatCrown {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .lb-podium-avatar {
          width: 66px;
          height: 66px;
          border-radius: 50%;
          background: var(--bg-elevated);
          border: 2.5px solid;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 0 4px rgba(0,0,0,0.3);
        }
        .lb-podium-avatar-1st {
          width: 84px;
          height: 84px;
          box-shadow: 0 0 24px rgba(212,168,67,0.4), 0 0 0 4px rgba(0,0,0,0.3);
          animation: goldPulse 2.5s ease-in-out infinite;
        }
        @keyframes goldPulse {
          0%, 100% { box-shadow: 0 0 24px rgba(212,168,67,0.4), 0 0 0 4px rgba(0,0,0,0.3); }
          50% { box-shadow: 0 0 40px rgba(212,168,67,0.6), 0 0 0 4px rgba(0,0,0,0.3); }
        }
        .lb-podium-trophy { font-size: 1.3rem; line-height: 1; }
        .lb-podium-name {
          font-family: var(--font-heading);
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--text-primary);
          text-align: center;
        }
        .lb-podium-name-1st { font-size: 1rem; }
        .lb-podium-xp {
          font-size: 0.72rem;
          color: var(--text-muted);
        }
        .lb-podium-base {
          width: 100%;
          border-radius: var(--radius-md) var(--radius-md) 0 0;
          margin-top: 4px;
        }
        .lb-podium-base-1st {
          height: 72px;
          background: linear-gradient(180deg, rgba(212,168,67,0.18), rgba(212,168,67,0.04));
          border: 1px solid rgba(212,168,67,0.25);
        }
        .lb-podium-base-2nd {
          height: 52px;
          background: linear-gradient(180deg, rgba(192,192,192,0.12), rgba(192,192,192,0.02));
          border: 1px solid rgba(192,192,192,0.18);
        }
        .lb-podium-base-3rd {
          height: 36px;
          background: linear-gradient(180deg, rgba(205,127,50,0.12), rgba(205,127,50,0.02));
          border: 1px solid rgba(205,127,50,0.18);
        }
        .lb-podium-second { padding-bottom: 20px; }
        .lb-podium-third  { padding-bottom: 36px; }

        /* ── List rows ── */
        .lb-list { display: flex; flex-direction: column; gap: 6px; }
        .lb-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: var(--radius-md);
          transition: transform var(--transition-fast), background var(--transition-fast);
        }
        .lb-row:hover { transform: translateX(3px); background: var(--bg-hover); }
        .lb-row-top { border-color: rgba(212,168,67,0.18); }
        .lb-rank-num {
          font-family: var(--font-heading);
          font-size: 0.88rem;
          min-width: 42px;
          text-align: right;
        }
        .lb-avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: var(--bg-surface);
          border: 1.5px solid var(--border-subtle);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          flex-shrink: 0;
        }
        .lb-user-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .lb-username {
          font-family: var(--font-heading);
          font-size: 0.88rem;
          font-weight: 700;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .lb-faction-tag {
          font-size: 0.68rem;
          font-weight: 600;
          padding: 1px 7px;
          border-radius: var(--radius-full);
          border: 1px solid;
          width: fit-content;
        }
        .lb-level-badge {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-secondary);
          background: var(--bg-surface);
          padding: 3px 8px;
          border-radius: var(--radius-full);
          border: 1px solid var(--border-subtle);
          white-space: nowrap;
        }
        .lb-xp {
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--gold);
          min-width: 90px;
          text-align: right;
          white-space: nowrap;
        }
        .lb-change {
          font-size: 0.75rem;
          font-weight: 700;
          min-width: 36px;
          text-align: right;
        }
        .lb-change.up   { color: var(--green); }
        .lb-change.down { color: var(--red); }
        .lb-change.neutral { color: var(--text-muted); }

        /* ── Faction tab ── */
        .lb-faction-list { display: flex; flex-direction: column; gap: 8px; }
        .lb-faction-row {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 18px;
          border-radius: var(--radius-md);
          transition: transform var(--transition-fast);
        }
        .lb-faction-row.glass-panel:hover { transform: translateX(3px); }
        .lb-faction-circle {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.4rem;
          flex-shrink: 0;
        }
        .lb-faction-info { flex: 1; min-width: 0; }
        .lb-faction-name {
          font-family: var(--font-heading);
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--text-primary);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .lb-leading-badge {
          font-size: 0.65rem;
          font-weight: 700;
          color: var(--gold);
          background: rgba(212,168,67,0.12);
          border: 1px solid rgba(212,168,67,0.3);
          padding: 2px 7px;
          border-radius: var(--radius-full);
          letter-spacing: 0.08em;
        }
        .lb-faction-stats {
          display: flex;
          gap: 14px;
          margin-top: 3px;
          flex-wrap: wrap;
        }
        .lb-faction-stat {
          font-size: 0.72rem;
          color: var(--text-muted);
        }
        .lb-faction-stat strong { color: var(--text-secondary); }
        .lb-weekly-chart {
          display: flex;
          gap: 3px;
          align-items: flex-end;
          height: 36px;
        }
        .lb-bar-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }
        .lb-bar-track {
          width: 6px;
          height: 28px;
          background: var(--bg-surface);
          border-radius: var(--radius-full);
          display: flex;
          align-items: flex-end;
          overflow: hidden;
        }
        .lb-bar-fill {
          width: 100%;
          background: linear-gradient(180deg, var(--gold), var(--gold-dark));
          border-radius: var(--radius-full);
          transition: height 0.6s ease;
        }
        .lb-bar-day {
          font-size: 0.58rem;
          color: var(--text-muted);
        }

        /* ── Guild tab ── */
        .lb-guild-list { display: flex; flex-direction: column; gap: 8px; }
        .lb-guild-row {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 18px;
          border-radius: var(--radius-md);
          transition: transform var(--transition-fast);
        }
        .lb-guild-row.glass-panel:hover { transform: translateX(3px); }
        .lb-guild-emblem {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-md);
          background: var(--bg-surface);
          border: 1.5px solid var(--border-default);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.4rem;
          flex-shrink: 0;
        }
        .lb-guild-info { flex: 1; min-width: 0; }
        .lb-guild-name {
          font-family: var(--font-heading);
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        .lb-guild-stats {
          display: flex;
          gap: 14px;
          margin-top: 3px;
          flex-wrap: wrap;
        }
        .lb-guild-stat {
          font-size: 0.72rem;
          color: var(--text-muted);
        }
        .lb-guild-stat strong { color: var(--text-secondary); }
        .lb-guild-weekly-xp {
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--gold);
          white-space: nowrap;
        }

        /* ── Weekly header ── */
        .lb-weekly-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 10px;
        }
        .lb-weekly-title {
          font-family: var(--font-heading);
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        /* ── Sticky My Rank bar ── */
        .lb-my-rank {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 50;
          background: linear-gradient(180deg, rgba(10,9,8,0) 0%, rgba(10,9,8,0.98) 25%);
          padding: 20px 24px 16px;
          display: flex;
          justify-content: center;
        }
        .lb-my-rank-inner {
          display: flex;
          align-items: center;
          gap: 16px;
          background: var(--bg-elevated);
          border: 1px solid rgba(212,168,67,0.25);
          border-radius: var(--radius-xl);
          padding: 12px 22px;
          box-shadow: var(--shadow-gold);
          flex-wrap: wrap;
          justify-content: center;
          max-width: 700px;
          width: 100%;
        }
        .lb-my-rank-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--text-secondary);
          white-space: nowrap;
        }
        .lb-my-rank-item.highlight { color: var(--gold); }
        .lb-my-rank-sep {
          width: 1px;
          height: 18px;
          background: var(--border-subtle);
        }
        .lb-my-rank-pct {
          font-size: 0.75rem;
          color: var(--text-muted);
          background: var(--bg-surface);
          padding: 3px 9px;
          border-radius: var(--radius-full);
          border: 1px solid var(--border-subtle);
        }

        @media (max-width: 640px) {
          .lb-page { padding: 20px 12px 90px; }
          .lb-xp { min-width: 70px; font-size: 0.72rem; }
          .lb-level-badge { display: none; }
          .lb-faction-row, .lb-guild-row { flex-wrap: wrap; }
          .lb-weekly-chart { display: none; }
          .lb-podium { gap: 4px; }
          .lb-podium-avatar { width: 52px; height: 52px; }
          .lb-podium-avatar-1st { width: 66px; height: 66px; }
        }
      `}</style>

      {/* ── Page Header ── */}
      <div className="lb-header">
        <div className="lb-title-group">
          <h1 className="lb-page-title">
            <IconTrophy size={30} color="var(--gold)" />
            Empire Rankings
          </h1>
          <span className="lb-season-badge">
            🏆 Season 3 &nbsp;•&nbsp; 14 days remaining
          </span>
          <div className="lb-season-bar-wrap">
            <div className="lb-season-bar-fill" style={{ width: `${seasonPct}%` }} />
          </div>
        </div>
        <CountdownTimer label="Season ends in" seconds={seasonSecs} />
      </div>

      {/* ── Tabs ── */}
      <div className="lb-tabs">
        {TABS.map(tab => (
          <button key={tab} className={`lb-tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
            {tab}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}

      {activeTab === 'Global' && (
        <div>
          <Podium users={GLOBAL_USERS} />
          <div className="lb-list">
            {GLOBAL_USERS.slice(3).map(u => <UserRow key={u.rank} user={u} />)}
          </div>
        </div>
      )}

      {activeTab === 'Faction' && (
        <div className="lb-faction-list">
          {FACTION_RANKS.map(fr => {
            const f = FACTIONS[fr.id]
            return (
              <div key={fr.id} className="lb-faction-row glass-panel">
                <span className="lb-rank-num" style={{ color: fr.rank <= 3 ? 'var(--gold)' : 'var(--text-muted)', minWidth: 42, textAlign: 'right', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.88rem' }}>#{fr.rank}</span>
                <div className="lb-faction-circle" style={{ background: f.color + '20', border: `1.5px solid ${f.color}44` }}>
                  {f.icon}
                </div>
                <div className="lb-faction-info">
                  <div className="lb-faction-name">
                    {f.label}
                    {fr.leading && <span className="lb-leading-badge">👑 LEADING</span>}
                  </div>
                  <div className="lb-faction-stats">
                    <span className="lb-faction-stat"><strong>{fr.members.toLocaleString()}</strong> members</span>
                    <span className="lb-faction-stat"><strong>{(fr.totalXP / 1000000).toFixed(2)}M</strong> total XP</span>
                    <span className="lb-faction-stat">Avg Lv.<strong>{fr.avgLevel}</strong></span>
                  </div>
                </div>
                <WeeklyBar data={fr.weekly} />
              </div>
            )
          })}
        </div>
      )}

      {activeTab === 'Friends' && (
        <div className="lb-list">
          {FRIENDS.map(u => <UserRow key={u.rank} user={u} />)}
        </div>
      )}

      {activeTab === 'Weekly' && (
        <div>
          <div className="lb-weekly-header">
            <span className="lb-weekly-title">⚡ Top XP Earners This Week</span>
            <CountdownTimer label="Resets in" seconds={weekSecs} />
          </div>
          <div className="lb-list">
            {WEEKLY_TOP.map(u => <UserRow key={u.rank} user={u} />)}
          </div>
        </div>
      )}

      {activeTab === 'Guilds' && (
        <div className="lb-guild-list">
          {GUILDS.map(g => (
            <div key={g.rank} className="lb-guild-row glass-panel">
              <span className="lb-rank-num" style={{ color: g.rank <= 3 ? 'var(--gold)' : 'var(--text-muted)', minWidth: 42, textAlign: 'right', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.88rem' }}>#{g.rank}</span>
              <div className="lb-guild-emblem">{g.emblem}</div>
              <div className="lb-guild-info">
                <div className="lb-guild-name">{g.name}</div>
                <div className="lb-guild-stats">
                  <span className="lb-guild-stat">Lv.<strong>{g.level}</strong></span>
                  <span className="lb-guild-stat"><strong>{g.members}</strong> members</span>
                </div>
              </div>
              <div className="lb-guild-weekly-xp">{g.weeklyXP.toLocaleString()} XP</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Sticky My Rank Bar ── */}
      <div className="lb-my-rank">
        <div className="lb-my-rank-inner">
          <div className="lb-my-rank-item highlight">
            <IconSword size={14} color="var(--gold)" />
            Your Rank: #1,247
          </div>
          <div className="lb-my-rank-sep" />
          <div className="lb-my-rank-item" style={{ color: 'var(--green)' }}>
            ▲ Up 23 this week
          </div>
          <div className="lb-my-rank-sep" />
          <div className="lb-my-rank-item">
            <IconZap size={14} color="var(--gold)" />
            2,340 XP
          </div>
          <div className="lb-my-rank-sep" />
          <span className="lb-my-rank-pct">Top 23%</span>
        </div>
      </div>
    </div>
  )
}
