import { useState } from 'react'
import { IconTrophy, IconStar, IconShield, IconZap, IconFire, IconAward, IconBook, IconUsers, IconSword, IconTarget, IconLock, IconCheck, IconEye } from '../components/Icons'

// ── Mock achievement data ─────────────────────────────────────────────────────
const ACHIEVEMENTS = [
  // Watcher
  { id: 1, category: 'Watcher', name: 'First Episode', desc: 'Watch your very first anime episode', xp: 50, rarity: 'Common', emoji: '▶️', unlocked: true, date: 'Jan 12, 2025' },
  { id: 2, category: 'Watcher', name: 'Binge Master', desc: 'Watch 10 episodes in a single day', xp: 200, rarity: 'Rare', emoji: '🍿', unlocked: true, date: 'Feb 3, 2025' },
  { id: 3, category: 'Watcher', name: 'Season Slayer', desc: 'Complete an entire anime season', xp: 150, rarity: 'Rare', emoji: '⚔️', unlocked: true, date: 'Feb 18, 2025' },
  { id: 4, category: 'Watcher', name: 'Episode Addict', desc: 'Watch 1,000 total episodes', xp: 500, rarity: 'Epic', emoji: '📺', unlocked: false, progress: 847, total: 1000 },
  { id: 5, category: 'Watcher', name: 'Marathon Runner', desc: 'Complete 100 different anime series', xp: 750, rarity: 'Epic', emoji: '🏃', unlocked: false, progress: 50, total: 100 },
  { id: 6, category: 'Watcher', name: 'Night Owl', desc: 'Watch anime past 2 AM three times', xp: 100, rarity: 'Common', emoji: '🦉', unlocked: false, progress: null },
  { id: 7, category: 'Watcher', name: 'Legendary Viewer', desc: 'Reach 10,000 total episodes watched', xp: 2000, rarity: 'Legendary', emoji: '👑', unlocked: false, progress: null },
  // Reader
  { id: 8, category: 'Reader', name: 'First Chapter', desc: 'Read your first manga chapter', xp: 50, rarity: 'Common', emoji: '📖', unlocked: true, date: 'Jan 15, 2025' },
  { id: 9, category: 'Reader', name: 'Page Turner', desc: 'Read 500 manga chapters', xp: 300, rarity: 'Rare', emoji: '📚', unlocked: false, progress: 89, total: 500 },
  { id: 10, category: 'Reader', name: 'Manga Veteran', desc: 'Complete 20 manga series', xp: 400, rarity: 'Rare', emoji: '🗡️', unlocked: false, progress: null },
  { id: 11, category: 'Reader', name: 'Chapter Master', desc: 'Read 5,000 manga chapters', xp: 1000, rarity: 'Epic', emoji: '🏆', unlocked: false, progress: null },
  // Social
  { id: 12, category: 'Social', name: 'Social Butterfly', desc: 'Send your first chat message', xp: 50, rarity: 'Common', emoji: '🦋', unlocked: true, date: 'Jan 13, 2025' },
  { id: 13, category: 'Social', name: 'Critic', desc: 'Write 10 anime reviews', xp: 200, rarity: 'Rare', emoji: '✍️', unlocked: false, progress: 3, total: 10 },
  { id: 14, category: 'Social', name: 'Influencer', desc: 'Get 100 followers on your profile', xp: 350, rarity: 'Rare', emoji: '📣', unlocked: false, progress: null },
  { id: 15, category: 'Social', name: 'Party Host', desc: 'Create and host a watch party', xp: 150, rarity: 'Common', emoji: '🎉', unlocked: false, progress: null },
  { id: 16, category: 'Social', name: 'Guild Diplomat', desc: 'Join 3 different guilds', xp: 250, rarity: 'Rare', emoji: '🤝', unlocked: false, progress: null },
  // Guild
  { id: 17, category: 'Guild', name: 'Guild Member', desc: 'Join your first guild', xp: 100, rarity: 'Common', emoji: '🏰', unlocked: true, date: 'Jan 20, 2025' },
  { id: 18, category: 'Guild', name: 'War Hero', desc: 'Win 5 guild wars', xp: 500, rarity: 'Rare', emoji: '⚔️', unlocked: false, progress: null },
  { id: 19, category: 'Guild', name: 'Guild Master', desc: 'Lead a guild to the top 10 rankings', xp: 1500, rarity: 'Epic', emoji: '👑', unlocked: false, progress: null },
  // RPG
  { id: 20, category: 'RPG', name: 'Rookie', desc: 'Reach level 5 in the RPG system', xp: 50, rarity: 'Common', emoji: '🌱', unlocked: true, date: 'Jan 12, 2025' },
  { id: 21, category: 'RPG', name: 'Veteran', desc: 'Reach level 25 in the RPG system', xp: 200, rarity: 'Rare', emoji: '🛡️', unlocked: true, date: 'Mar 1, 2025' },
  { id: 22, category: 'RPG', name: 'Legend', desc: 'Reach level 75 in the RPG system', xp: 2000, rarity: 'Legendary', emoji: '⚡', unlocked: false, progress: null },
  { id: 23, category: 'RPG', name: 'Streak King', desc: 'Maintain a 30-day login streak', xp: 500, rarity: 'Epic', emoji: '🔥', unlocked: false, progress: 14, total: 30 },
  { id: 24, category: 'RPG', name: 'Prestige', desc: 'Reach the maximum prestige level', xp: 5000, rarity: 'Legendary', emoji: '💎', unlocked: false, progress: null },
  // Hidden
  { id: 25, category: 'Hidden', name: '???', desc: 'Mystery Achievement', xp: 0, rarity: 'Hidden', emoji: '❓', unlocked: false, hidden: true },
  { id: 26, category: 'Hidden', name: '???', desc: 'Mystery Achievement', xp: 0, rarity: 'Hidden', emoji: '❓', unlocked: false, hidden: true },
]

const TABS = ['All', 'Watcher', 'Reader', 'Social', 'Guild', 'RPG', 'Hidden', 'Legendary']
const SORTS = ['By Category', 'By Rarity', 'Recently Earned', 'Completion %']

const RARITY_CONFIG = {
  Common:    { color: '#8B949E', bg: 'rgba(139,148,158,0.15)', label: 'Common' },
  Rare:      { color: '#4A8FCC', bg: 'rgba(74,143,204,0.15)',  label: 'Rare' },
  Epic:      { color: '#8B52C4', bg: 'rgba(139,82,196,0.15)', label: 'Epic' },
  Legendary: { color: '#D4A843', bg: 'rgba(212,168,67,0.15)', label: 'Legendary' },
  Hidden:    { color: '#665C46', bg: 'rgba(102,92,70,0.15)',  label: 'Hidden' },
}

const RARITY_ORDER = { Common: 0, Rare: 1, Epic: 2, Legendary: 3, Hidden: 4 }

function CircularProgress({ percentage, unlocked, total }) {
  const r = 52
  const circ = 2 * Math.PI * r
  const offset = circ - (percentage / 100) * circ
  return (
    <div className="ach-ring-wrap">
      <svg width="130" height="130" viewBox="0 0 130 130">
        <circle cx="65" cy="65" r={r} fill="none" stroke="var(--bg-surface)" strokeWidth="10" />
        <circle
          cx="65" cy="65" r={r} fill="none"
          stroke="url(#goldGrad)" strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform="rotate(-90 65 65)"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
        <defs>
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#D4A843" />
            <stop offset="100%" stopColor="#F0C060" />
          </linearGradient>
        </defs>
      </svg>
      <div className="ach-ring-inner">
        <span className="ach-ring-count">{unlocked} / {total}</span>
        <span className="ach-ring-label">Unlocked</span>
      </div>
    </div>
  )
}

function AchievementCard({ ach }) {
  const rarity = RARITY_CONFIG[ach.rarity] || RARITY_CONFIG.Common
  const isHidden = ach.hidden
  const isUnlocked = ach.unlocked

  return (
    <div className={`ach-card glass-panel ${isUnlocked ? 'ach-unlocked' : 'ach-locked'} ${isHidden ? 'ach-hidden' : ''}`}>
      {isUnlocked && (
        <div className="ach-check">
          <IconCheck size={12} color="#45A35E" />
        </div>
      )}
      <div className="ach-icon-wrap" style={{ background: isUnlocked ? rarity.bg : 'rgba(30,28,24,0.6)', borderColor: isUnlocked ? rarity.color + '44' : 'var(--border-subtle)' }}>
        {isHidden ? (
          <span className="ach-emoji" style={{ filter: 'grayscale(1) opacity(0.4)' }}>❓</span>
        ) : (
          <>
            <span className="ach-emoji" style={{ filter: isUnlocked ? 'none' : 'grayscale(1) opacity(0.35)' }}>{ach.emoji}</span>
            {!isUnlocked && (
              <div className="ach-lock-overlay">
                <IconLock size={14} color="var(--text-muted)" />
              </div>
            )}
          </>
        )}
      </div>
      <div className="ach-body">
        <div className="ach-name" style={{ color: isHidden ? 'var(--text-muted)' : isUnlocked ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
          {isHidden ? '???' : ach.name}
        </div>
        <div className="ach-desc">{isHidden ? 'Complete a secret objective to reveal this achievement.' : ach.desc}</div>

        {!isHidden && ach.progress != null && !isUnlocked && (
          <div className="ach-progress-wrap">
            <div className="ach-progress-bar">
              <div className="ach-progress-fill" style={{ width: `${Math.min(100, (ach.progress / ach.total) * 100)}%` }} />
            </div>
            <span className="ach-progress-label">{ach.progress}/{ach.total}</span>
          </div>
        )}

        <div className="ach-footer">
          {!isHidden && (
            <span className="ach-xp" style={{ opacity: isUnlocked ? 1 : 0.4 }}>+{ach.xp} XP</span>
          )}
          {!isHidden && (
            <span className="ach-rarity-pill" style={{ color: rarity.color, background: rarity.bg, borderColor: rarity.color + '44' }}>
              {ach.rarity}
            </span>
          )}
        </div>
        {isUnlocked && ach.date && (
          <div className="ach-date">Earned {ach.date}</div>
        )}
      </div>
    </div>
  )
}

export default function AchievementsPage() {
  const [activeTab, setActiveTab] = useState('All')
  const [activeSort, setActiveSort] = useState('By Category')

  const unlocked = ACHIEVEMENTS.filter(a => a.unlocked).length
  const total = ACHIEVEMENTS.length
  const pct = Math.round((unlocked / total) * 100)

  const rarityCount = {
    Common:    ACHIEVEMENTS.filter(a => a.unlocked && a.rarity === 'Common').length,
    Rare:      ACHIEVEMENTS.filter(a => a.unlocked && a.rarity === 'Rare').length,
    Epic:      ACHIEVEMENTS.filter(a => a.unlocked && a.rarity === 'Epic').length,
    Legendary: ACHIEVEMENTS.filter(a => a.unlocked && a.rarity === 'Legendary').length,
  }

  const totalXP = ACHIEVEMENTS.filter(a => a.unlocked).reduce((s, a) => s + a.xp, 0)

  let filtered = activeTab === 'All'
    ? ACHIEVEMENTS
    : activeTab === 'Legendary'
    ? ACHIEVEMENTS.filter(a => a.rarity === 'Legendary')
    : ACHIEVEMENTS.filter(a => a.category === activeTab)

  if (activeSort === 'By Rarity') {
    filtered = [...filtered].sort((a, b) => RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity])
  } else if (activeSort === 'Recently Earned') {
    filtered = [...filtered].sort((a, b) => (b.unlocked ? 1 : 0) - (a.unlocked ? 1 : 0))
  } else if (activeSort === 'Completion %') {
    filtered = [...filtered].sort((a, b) => {
      const pa = a.unlocked ? 1 : a.progress != null ? a.progress / a.total : 0
      const pb = b.unlocked ? 1 : b.progress != null ? b.progress / b.total : 0
      return pb - pa
    })
  }

  return (
    <div className="ach-page">
      <style>{`
        .ach-page {
          min-height: 100vh;
          padding: 32px 24px 120px;
          max-width: 1280px;
          margin: 0 auto;
        }

        /* Header */
        .ach-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
          margin-bottom: 40px;
          text-align: center;
        }
        .ach-title-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .ach-page-title {
          font-family: var(--font-heading);
          font-size: clamp(1.8rem, 4vw, 2.6rem);
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }
        .ach-ring-wrap {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          filter: drop-shadow(0 0 20px rgba(212,168,67,0.3));
        }
        .ach-ring-inner {
          position: absolute;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
        }
        .ach-ring-count {
          font-family: var(--font-heading);
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1;
        }
        .ach-ring-label {
          font-size: 0.65rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .ach-rarity-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: center;
        }
        .ach-rarity-pill-lg {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          border-radius: var(--radius-full);
          font-size: 0.78rem;
          font-weight: 600;
          border: 1px solid;
        }
        .ach-total-xp {
          font-family: var(--font-heading);
          font-size: 0.95rem;
          color: var(--gold);
          background: rgba(212,168,67,0.08);
          border: 1px solid rgba(212,168,67,0.2);
          padding: 6px 18px;
          border-radius: var(--radius-full);
        }

        /* Tabs */
        .ach-tabs {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          margin-bottom: 16px;
          background: var(--bg-card);
          padding: 6px;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-subtle);
        }
        .ach-tab {
          padding: 7px 16px;
          border-radius: var(--radius-md);
          border: none;
          background: transparent;
          color: var(--text-secondary);
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
          white-space: nowrap;
        }
        .ach-tab:hover { background: var(--bg-hover); color: var(--text-primary); }
        .ach-tab.active {
          background: linear-gradient(135deg, rgba(212,168,67,0.2), rgba(212,168,67,0.08));
          color: var(--gold);
          border: 1px solid rgba(212,168,67,0.3);
        }

        /* Sort bar */
        .ach-sort-bar {
          display: flex;
          gap: 8px;
          margin-bottom: 28px;
          flex-wrap: wrap;
        }
        .ach-sort-btn {
          padding: 6px 14px;
          border-radius: var(--radius-full);
          border: 1px solid var(--border-subtle);
          background: transparent;
          color: var(--text-muted);
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .ach-sort-btn:hover { border-color: var(--border-hover); color: var(--text-secondary); }
        .ach-sort-btn.active {
          background: var(--bg-surface);
          border-color: var(--gold);
          color: var(--gold);
        }

        /* Grid */
        .ach-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
          gap: 16px;
        }

        /* Cards */
        .ach-card {
          position: relative;
          padding: 18px;
          border-radius: var(--radius-lg);
          display: flex;
          flex-direction: column;
          gap: 12px;
          transition: transform var(--transition-fast), box-shadow var(--transition-fast);
          cursor: default;
        }
        .ach-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-card); }
        .ach-locked { opacity: 0.55; }
        .ach-hidden { opacity: 0.45; }
        .ach-check {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: rgba(69,163,94,0.15);
          border: 1.5px solid rgba(69,163,94,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .ach-icon-wrap {
          width: 60px;
          height: 60px;
          border-radius: var(--radius-md);
          border: 1px solid;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          flex-shrink: 0;
        }
        .ach-emoji { font-size: 1.7rem; line-height: 1; }
        .ach-lock-overlay {
          position: absolute;
          bottom: -4px;
          right: -4px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .ach-body { display: flex; flex-direction: column; gap: 6px; flex: 1; }
        .ach-name {
          font-family: var(--font-heading);
          font-size: 0.92rem;
          font-weight: 700;
          line-height: 1.2;
        }
        .ach-desc {
          font-size: 0.78rem;
          color: var(--text-muted);
          line-height: 1.45;
        }
        .ach-progress-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 2px;
        }
        .ach-progress-bar {
          flex: 1;
          height: 4px;
          background: var(--bg-surface);
          border-radius: var(--radius-full);
          overflow: hidden;
        }
        .ach-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--gold-dark), var(--gold));
          border-radius: var(--radius-full);
          transition: width 0.6s ease;
        }
        .ach-progress-label {
          font-size: 0.72rem;
          color: var(--text-muted);
          white-space: nowrap;
        }
        .ach-footer {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: auto;
          flex-wrap: wrap;
        }
        .ach-xp {
          font-size: 0.78rem;
          font-weight: 700;
          color: var(--gold);
          background: rgba(212,168,67,0.1);
          padding: 2px 8px;
          border-radius: var(--radius-full);
        }
        .ach-rarity-pill {
          font-size: 0.7rem;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: var(--radius-full);
          border: 1px solid;
          margin-left: auto;
        }
        .ach-date {
          font-size: 0.7rem;
          color: var(--text-muted);
        }

        @media (max-width: 600px) {
          .ach-page { padding: 20px 14px 100px; }
          .ach-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; }
          .ach-tabs { gap: 4px; }
          .ach-tab { padding: 6px 10px; font-size: 0.78rem; }
        }
      `}</style>

      {/* ── Header ── */}
      <div className="ach-header">
        <div className="ach-title-row">
          <IconTrophy size={30} color="var(--gold)" />
          <h1 className="ach-page-title">Achievements</h1>
        </div>

        <CircularProgress percentage={pct} unlocked={unlocked} total={120} />

        <div className="ach-rarity-pills">
          <span className="ach-rarity-pill-lg" style={{ color: '#8B949E', background: 'rgba(139,148,158,0.1)', borderColor: '#8B949E44' }}>
            {rarityCount.Common} Common
          </span>
          <span className="ach-rarity-pill-lg" style={{ color: '#4A8FCC', background: 'rgba(74,143,204,0.1)', borderColor: '#4A8FCC44' }}>
            {rarityCount.Rare} Rare
          </span>
          <span className="ach-rarity-pill-lg" style={{ color: '#8B52C4', background: 'rgba(139,82,196,0.1)', borderColor: '#8B52C444' }}>
            {rarityCount.Epic} Epic
          </span>
          <span className="ach-rarity-pill-lg" style={{ color: '#D4A843', background: 'rgba(212,168,67,0.1)', borderColor: '#D4A84344' }}>
            {rarityCount.Legendary} Legendary
          </span>
        </div>

        <div className="ach-total-xp">✦ {totalXP.toLocaleString()} XP earned from achievements</div>
      </div>

      {/* ── Tabs ── */}
      <div className="ach-tabs">
        {TABS.map(tab => (
          <button key={tab} className={`ach-tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
            {tab}
          </button>
        ))}
      </div>

      {/* ── Sort bar ── */}
      <div className="ach-sort-bar">
        {SORTS.map(s => (
          <button key={s} className={`ach-sort-btn ${activeSort === s ? 'active' : ''}`} onClick={() => setActiveSort(s)}>
            {s}
          </button>
        ))}
      </div>

      {/* ── Grid ── */}
      <div className="ach-grid">
        {filtered.map(ach => (
          <AchievementCard key={ach.id} ach={ach} />
        ))}
      </div>
    </div>
  )
}
