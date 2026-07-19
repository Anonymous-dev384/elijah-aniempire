import { useState } from 'react'
import { IconUser, IconHeart, IconMessage, IconTrophy, IconAward, IconZap, IconShield, IconInfo, IconCheck } from '../components/Icons'

// ── Mock Data ────────────────────────────────────────────────────────────────

const INITIAL_NOTIFICATIONS = [
  // Today
  { id: 1,  group: 'Today',     type: 'social', icon: 'follow',      text: 'SakuraBlade started following you',                        time: '2m ago',   read: false },
  { id: 2,  group: 'Today',     type: 'rpg',    icon: 'levelup',     text: 'Level Up! You reached Level 24 — Arc Master!',             time: '1h ago',   read: false },
  { id: 3,  group: 'Today',     type: 'guild',  icon: 'invite',      text: "Guild invite from Dragon's Roar — join the battle!",       time: '1h ago',   read: false },
  { id: 4,  group: 'Today',     type: 'social', icon: 'like',        text: 'NeonKaito liked your review of Cyberpunk: Edgerunners',    time: '3h ago',   read: false },
  { id: 5,  group: 'Today',     type: 'rpg',    icon: 'achievement', text: 'Achievement unlocked: Binge Master — +100 XP earned!',     time: '5h ago',   read: false },
  // This Week
  { id: 6,  group: 'This Week', type: 'social', icon: 'comment',     text: 'DragonPact commented on your post: "Totally agree!"',      time: '1d ago',   read: true  },
  { id: 7,  group: 'This Week', type: 'guild',  icon: 'quest',       text: 'Guild quest completed: 100 Episodes Watched — rewards ready!', time: '1d ago', read: true },
  { id: 8,  group: 'This Week', type: 'rpg',    icon: 'login',       text: 'Daily login bonus: +25 XP added to your account',          time: '2d ago',   read: true  },
  { id: 9,  group: 'This Week', type: 'system', icon: 'new',         text: 'New seasonal anime added: 24 titles for Winter 2025!',      time: '2d ago',   read: true  },
  { id: 10, group: 'This Week', type: 'guild',  icon: 'war',         text: "Guild War starting in 2 hours — defend Dragon's Roar!",    time: '3d ago',   read: true  },
  // Earlier
  { id: 11, group: 'Earlier',   type: 'system', icon: 'maintenance', text: 'Scheduled maintenance on Sunday 3–5 AM UTC',               time: '5d ago',   read: true  },
  { id: 12, group: 'Earlier',   type: 'system', icon: 'features',    text: 'New features available: Social Feed, Guilds & RPG Quests!', time: '1w ago',   read: true  },
]

const FILTER_TABS = ['All', 'Social', 'RPG', 'Guild', 'System']

const TYPE_CONFIG = {
  social: { color: 'var(--blue)',   bg: 'rgba(74,143,204,0.15)',   label: 'Social' },
  rpg:    { color: 'var(--gold)',   bg: 'rgba(212,168,67,0.15)',   label: 'RPG'    },
  guild:  { color: 'var(--purple)', bg: 'rgba(139,82,196,0.15)',  label: 'Guild'  },
  system: { color: '#8B949E',        bg: 'rgba(139,148,158,0.15)', label: 'System' },
}

function NotifIcon({ icon, type }) {
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.system
  const iconEl = {
    follow:      <IconUser size={16} color={cfg.color} />,
    like:        <IconHeart size={16} color={cfg.color} />,
    comment:     <IconMessage size={16} color={cfg.color} />,
    levelup:     <IconZap size={16} color={cfg.color} />,
    achievement: <IconAward size={16} color={cfg.color} />,
    login:       <IconTrophy size={16} color={cfg.color} />,
    invite:      <IconShield size={16} color={cfg.color} />,
    quest:       <IconShield size={16} color={cfg.color} />,
    war:         <IconShield size={16} color={cfg.color} />,
    new:         <IconInfo size={16} color={cfg.color} />,
    maintenance: <IconInfo size={16} color={cfg.color} />,
    features:    <IconInfo size={16} color={cfg.color} />,
  }[icon] || <IconInfo size={16} color={cfg.color} />

  return (
    <div style={{
      width: 38, height: 38,
      borderRadius: '50%',
      background: cfg.bg,
      border: `1px solid ${cfg.color}44`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      {iconEl}
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS)
  const [activeTab, setActiveTab] = useState('All')

  const filtered = activeTab === 'All'
    ? notifications
    : notifications.filter(n => n.type === activeTab.toLowerCase())

  const groups = ['Today', 'This Week', 'Earlier']

  function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  function toggleRead(id) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: !n.read } : n))
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="np-root">
      <style>{`
        .np-root {
          max-width: 760px;
          margin: 0 auto;
          padding: 32px 20px 80px;
        }

        /* Header */
        .np-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 12px;
        }
        .np-title-wrap { display: flex; align-items: center; gap: 12px; }
        .np-title {
          margin: 0;
          font-size: 1.6rem;
          font-weight: 800;
          font-family: var(--font-heading);
          color: var(--text-primary);
        }
        .np-unread-badge {
          background: var(--gold);
          color: #0A0908;
          font-size: 0.75rem;
          font-weight: 800;
          border-radius: var(--radius-full);
          padding: 2px 9px;
          line-height: 1.6;
        }
        .np-mark-all {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: var(--radius-full);
          border: 1px solid var(--border-default);
          background: transparent;
          color: var(--text-secondary);
          font-size: 0.85rem;
          font-family: var(--font-body);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .np-mark-all:hover {
          border-color: var(--gold);
          color: var(--gold);
          background: rgba(212,168,67,0.08);
        }

        /* Tabs */
        .np-tabs {
          display: flex;
          gap: 4px;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-full);
          padding: 4px;
          margin-bottom: 28px;
          width: fit-content;
          flex-wrap: wrap;
        }
        .np-tab {
          padding: 7px 18px;
          border-radius: var(--radius-full);
          border: none;
          background: transparent;
          color: var(--text-secondary);
          font-size: 0.88rem;
          font-family: var(--font-body);
          cursor: pointer;
          transition: all var(--transition-fast);
          white-space: nowrap;
        }
        .np-tab:hover { color: var(--text-primary); }
        .np-tab.active {
          background: var(--gold);
          color: #0A0908;
          font-weight: 700;
        }

        /* Groups */
        .np-group-label {
          font-size: 0.78rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-muted);
          margin: 0 0 10px;
          padding: 0 4px;
        }
        .np-group { margin-bottom: 28px; }

        /* Notification row */
        .np-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-subtle);
          background: var(--bg-card);
          margin-bottom: 8px;
          cursor: pointer;
          transition: all var(--transition-fast);
          position: relative;
        }
        .np-item:hover {
          border-color: var(--border-hover);
          background: var(--bg-elevated);
          transform: translateX(3px);
        }
        .np-item.unread {
          background: var(--bg-elevated);
          border-color: var(--border-default);
        }
        .np-item-body { flex: 1; min-width: 0; }
        .np-item-text {
          margin: 0 0 4px;
          font-size: 0.9rem;
          color: var(--text-primary);
          line-height: 1.4;
        }
        .np-item.read .np-item-text { color: var(--text-secondary); }
        .np-item-time {
          margin: 0;
          font-size: 0.78rem;
          color: var(--text-muted);
        }
        .np-unread-dot {
          width: 9px; height: 9px;
          border-radius: 50%;
          background: var(--gold);
          flex-shrink: 0;
          box-shadow: 0 0 6px rgba(212,168,67,0.6);
        }
        .np-type-chip {
          font-size: 0.72rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: var(--radius-full);
          border: 1px solid;
          flex-shrink: 0;
          white-space: nowrap;
        }

        .np-empty {
          text-align: center;
          color: var(--text-muted);
          padding: 60px 20px;
          font-size: 0.95rem;
        }
      `}</style>

      {/* Header */}
      <div className="np-header">
        <div className="np-title-wrap">
          <h1 className="np-title">Notifications</h1>
          {unreadCount > 0 && <span className="np-unread-badge">{unreadCount} new</span>}
        </div>
        <button className="np-mark-all" onClick={markAllRead}>
          <IconCheck size={14} /> Mark all read
        </button>
      </div>

      {/* Tabs */}
      <div className="np-tabs">
        {FILTER_TABS.map(tab => (
          <button
            key={tab}
            className={`np-tab${activeTab === tab ? ' active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Grouped notifications */}
      {filtered.length === 0 ? (
        <div className="np-empty">No notifications here yet.</div>
      ) : (
        groups.map(group => {
          const items = filtered.filter(n => n.group === group)
          if (!items.length) return null
          return (
            <div key={group} className="np-group">
              <p className="np-group-label">{group}</p>
              {items.map(n => {
                const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.system
                return (
                  <div
                    key={n.id}
                    className={`np-item${n.read ? ' read' : ' unread'}`}
                    onClick={() => toggleRead(n.id)}
                  >
                    <NotifIcon icon={n.icon} type={n.type} />
                    <div className="np-item-body">
                      <p className="np-item-text">{n.text}</p>
                      <p className="np-item-time">{n.time}</p>
                    </div>
                    <span
                      className="np-type-chip"
                      style={{ color: cfg.color, borderColor: `${cfg.color}44`, background: cfg.bg }}
                    >
                      {cfg.label}
                    </span>
                    {!n.read && <div className="np-unread-dot" />}
                  </div>
                )
              })}
            </div>
          )
        })
      )}
    </div>
  )
}
