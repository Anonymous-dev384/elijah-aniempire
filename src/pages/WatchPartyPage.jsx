/**
 * WatchPartyPage — synchronized anime watching with friends.
 * Supports room creation/joining, live chat, reactions, queue, and
 * synchronized playback controls.
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useRPGStore, FACTIONS } from '../store/rpgStore'
import {
  IconPlay, IconPause, IconUsers, IconSend, IconPlus, IconX,
  IconTv, IconMusic, IconFire, IconStar, IconCopy, IconCheck,
  IconHeart, IconLaugh, IconShock, IconZap, IconEye,
} from '../components/Icons'

// ── Reaction emoji set ────────────────────────────────────────────────────────
const REACTIONS = [
  { id: 'hype',   emoji: '🔥', label: 'Hype'    },
  { id: 'love',   emoji: '❤️', label: 'Love'    },
  { id: 'lol',    emoji: '😂', label: 'LOL'     },
  { id: 'wow',    emoji: '😱', label: 'Wow'     },
  { id: 'sad',    emoji: '😭', label: 'Sad'     },
  { id: 'based',  emoji: '👑', label: 'Based'   },
  { id: 'skill',  emoji: '⚔️', label: 'Skill'   },
  { id: 'mid',    emoji: '😐', label: 'Mid'     },
]

// ── Mock queue for demo ───────────────────────────────────────────────────────
const DEMO_QUEUE = [
  { id: 1, title: 'Frieren: Beyond Journey\'s End', episode: 'Ep 1 — Graduation', duration: '24:10', thumb: 'https://cdn.myanimelist.net/images/anime/1015/138006l.jpg' },
  { id: 2, title: 'Frieren: Beyond Journey\'s End', episode: 'Ep 2 — The Struggle to the Top', duration: '23:45', thumb: 'https://cdn.myanimelist.net/images/anime/1015/138006l.jpg' },
  { id: 3, title: 'Dungeon Meshi', episode: 'Ep 1 — Roasted Basilisk / Tart de Basilic', duration: '23:50', thumb: 'https://cdn.myanimelist.net/images/anime/1914/139036l.jpg' },
]

// ── Fake room members ─────────────────────────────────────────────────────────
const DEMO_MEMBERS = [
  { id: 1, name: 'You',         initial: 'Y', faction: 'shonen', isHost: true, isYou: true  },
  { id: 2, name: 'SakuraBlade', initial: 'S', faction: 'shoujo', isHost: false              },
  { id: 3, name: 'NeonKaito',   initial: 'N', faction: 'cyber',  isHost: false              },
  { id: 4, name: 'DragonPact',  initial: 'D', faction: 'fantasy',isHost: false              },
]

// ── Demo messages ─────────────────────────────────────────────────────────────
const DEMO_MESSAGES = [
  { id: 1, user: 'SakuraBlade', initial: 'S', faction: 'shoujo', text: 'Ready to watch! 🌸', time: '9:00 PM' },
  { id: 2, user: 'NeonKaito',   initial: 'N', faction: 'cyber',  text: 'Let\'s gooo ⚡',      time: '9:01 PM' },
  { id: 3, user: 'DragonPact',  initial: 'D', faction: 'fantasy',text: 'I heard this episode is amazing', time: '9:01 PM' },
]

// ── Floating reaction bubble ──────────────────────────────────────────────────
function ReactionBubble({ reaction, id }) {
  const [visible, setVisible] = useState(true)
  const style = {
    position: 'absolute',
    bottom: '80px',
    right: `${20 + Math.random() * 120}px`,
    fontSize: '2rem',
    animation: 'reaction-float 2.5s ease forwards',
    pointerEvents: 'none',
    zIndex: 10,
  }
  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 2500)
    return () => clearTimeout(t)
  }, [])
  if (!visible) return null
  return <div style={style}>{reaction.emoji}</div>
}

// ── Room Lobby (before joining a room) ────────────────────────────────────────
function RoomLobby({ onCreate, onJoin }) {
  const [roomCode, setRoomCode] = useState('')
  const [creating, setCreating] = useState(false)

  const handleCreate = () => {
    setCreating(true)
    setTimeout(() => onCreate(), 600)
  }

  return (
    <div className="wp-lobby">
      <div className="wp-lobby__icon">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5" strokeLinecap="round">
          <rect x="2" y="7" width="20" height="15" rx="2"/>
          <polyline points="17 2 12 7 7 2"/>
          <circle cx="12" cy="14" r="2" fill="var(--gold)" stroke="none"/>
        </svg>
      </div>
      <h1 className="wp-lobby__title">Watch Party</h1>
      <p className="wp-lobby__sub">Watch anime in sync with friends. React together in real time.</p>

      <div className="wp-lobby__cards">
        <div className="wp-lobby__card">
          <div className="wp-lobby__card-icon">✨</div>
          <h3>Create a Room</h3>
          <p>Start a new watch party and invite friends with a code.</p>
          <button className="btn btn-primary" onClick={handleCreate} disabled={creating}>
            {creating ? 'Creating…' : '+ Create Room'}
          </button>
        </div>

        <div className="wp-lobby__divider">OR</div>

        <div className="wp-lobby__card">
          <div className="wp-lobby__card-icon">🔗</div>
          <h3>Join a Room</h3>
          <p>Enter a room code to join an existing watch party.</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="input"
              placeholder="Enter room code…"
              value={roomCode}
              onChange={e => setRoomCode(e.target.value.toUpperCase())}
              maxLength={6}
              style={{ fontFamily: 'monospace', letterSpacing: 4, textTransform: 'uppercase' }}
            />
            <button
              className="btn btn-secondary"
              disabled={roomCode.length < 4}
              onClick={() => onJoin(roomCode)}
            >
              Join
            </button>
          </div>
        </div>
      </div>

      <div className="wp-lobby__features">
        {[
          { icon: '⚡', label: 'Real-time sync' },
          { icon: '💬', label: 'Live chat' },
          { icon: '🔥', label: 'Reactions' },
          { icon: '📋', label: 'Shared queue' },
          { icon: '👑', label: 'Host controls' },
          { icon: '🎯', label: 'Episode voting' },
        ].map(f => (
          <div key={f.label} className="wp-lobby__feature">
            <span>{f.icon}</span>
            <span>{f.label}</span>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes reaction-float {
          0%   { transform: translateY(0) scale(1);    opacity: 1; }
          80%  { transform: translateY(-120px) scale(1.3); opacity: 0.8; }
          100% { transform: translateY(-160px) scale(0.8); opacity: 0; }
        }
        .wp-lobby {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; min-height: 80vh; gap: 24px;
          padding: 40px 24px; text-align: center;
        }
        .wp-lobby__icon {
          width: 96px; height: 96px; border-radius: 50%;
          background: rgba(212,168,67,0.08);
          border: 1px solid var(--border-default);
          display: flex; align-items: center; justify-content: center;
          backdrop-filter: blur(12px);
          box-shadow: 0 0 40px rgba(212,168,67,0.12), inset 0 0 20px rgba(212,168,67,0.04);
        }
        .wp-lobby__title {
          font-family: var(--font-brand); font-size: 2.2rem;
          background: linear-gradient(135deg, var(--gold), var(--gold-light), #fff8dc);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .wp-lobby__sub { color: var(--text-secondary); max-width: 400px; line-height: 1.6; }
        .wp-lobby__cards {
          display: flex; align-items: center; gap: 20px; flex-wrap: wrap;
          justify-content: center; width: 100%; max-width: 700px;
        }
        .wp-lobby__card {
          flex: 1; min-width: 240px; max-width: 300px;
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
          padding: 28px 24px; display: flex; flex-direction: column;
          gap: 12px; align-items: center; text-align: center;
          backdrop-filter: blur(12px);
          transition: border-color var(--transition-base), box-shadow var(--transition-base);
        }
        .wp-lobby__card:hover { border-color: var(--border-hover); box-shadow: var(--shadow-gold); }
        .wp-lobby__card-icon { font-size: 2rem; }
        .wp-lobby__card h3 { font-family: var(--font-heading); font-size: 1rem; }
        .wp-lobby__card p { color: var(--text-secondary); font-size: 0.85rem; line-height: 1.5; }
        .wp-lobby__divider {
          color: var(--text-muted); font-weight: 700; font-size: 0.8rem;
          letter-spacing: 0.1em; padding: 8px 0;
        }
        .wp-lobby__features {
          display: flex; flex-wrap: wrap; gap: 10px; justify-content: center;
          max-width: 500px;
        }
        .wp-lobby__feature {
          display: flex; align-items: center; gap: 6px;
          padding: 6px 14px; border-radius: var(--radius-full);
          background: var(--bg-elevated); border: 1px solid var(--border-subtle);
          font-size: 0.8rem; color: var(--text-secondary);
        }
      `}</style>
    </div>
  )
}

// ── Main Watch Party Room ──────────────────────────────────────────────────────
function PartyRoom({ roomCode, onLeave }) {
  const { faction } = useRPGStore()
  const [messages, setMessages] = useState(DEMO_MESSAGES)
  const [input, setInput]       = useState('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress]   = useState(0) // 0–100
  const [currentItem, setCurrentItem] = useState(DEMO_QUEUE[0])
  const [queue, setQueue]         = useState(DEMO_QUEUE)
  const [activeReactions, setActiveReactions] = useState([])
  const [copied, setCopied]       = useState(false)
  const [tab, setTab]             = useState('chat') // 'chat' | 'queue' | 'members'
  const [showReactionPicker, setShowReactionPicker] = useState(false)
  const chatEndRef = useRef(null)
  const timerRef   = useRef(null)

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Simulated playback timer
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setProgress(p => {
          if (p >= 100) { clearInterval(timerRef.current); setIsPlaying(false); return 100 }
          return p + (100 / (24 * 60)) // ~24 min video
        })
      }, 1000)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [isPlaying])

  const sendMessage = () => {
    if (!input.trim()) return
    const msg = { id: Date.now(), user: 'You', initial: 'Y', faction: faction || 'shonen', text: input.trim(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    setMessages(m => [...m, msg])
    setInput('')
  }

  const fireReaction = (reaction) => {
    const id = Date.now()
    setActiveReactions(r => [...r, { ...reaction, id }])
    setTimeout(() => setActiveReactions(r => r.filter(x => x.id !== id)), 2600)
    // Also send to chat
    const msg = { id, user: 'You', initial: 'Y', faction: faction || 'shonen', text: reaction.emoji, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), isReaction: true }
    setMessages(m => [...m, msg])
    setShowReactionPicker(false)
  }

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatProgress = (pct) => {
    const totalSecs = 24 * 60
    const secs = Math.floor((pct / 100) * totalSecs)
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="wp-room">
      {/* Header */}
      <div className="wp-room__header">
        <div className="wp-room__header-left">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round">
            <rect x="2" y="7" width="20" height="15" rx="2"/>
            <polyline points="17 2 12 7 7 2"/>
          </svg>
          <span className="wp-room__title">Watch Party</span>
          <span className="wp-room__live">● LIVE</span>
        </div>
        <div className="wp-room__code-row">
          <span className="wp-room__code-label">Room Code</span>
          <button className="wp-room__code-btn" onClick={copyCode}>
            <span style={{ fontFamily: 'monospace', letterSpacing: 3 }}>{roomCode}</span>
            {copied ? <IconCheck size={14} /> : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>}
          </button>
          <span className="wp-room__members-chip">
            <IconUsers size={13} />
            {DEMO_MEMBERS.length} watching
          </span>
        </div>
        <button className="wp-room__leave" onClick={onLeave}>Leave Party</button>
      </div>

      <div className="wp-room__body">
        {/* Player area */}
        <div className="wp-room__player-col">
          {/* Video area */}
          <div className="wp-room__video">
            <div className="wp-room__video-placeholder">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(212,168,67,0.4)" strokeWidth="1.5" strokeLinecap="round">
                <rect x="2" y="7" width="20" height="15" rx="2"/>
                <polyline points="17 2 12 7 7 2"/>
              </svg>
              <p style={{ color: 'var(--text-muted)', marginTop: 12, fontSize: '0.9rem' }}>
                Synchronized player active
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: 4 }}>
                All party members see the same frame
              </p>
            </div>

            {/* Floating reactions */}
            <div className="wp-room__reaction-floats" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
              {activeReactions.map(r => <ReactionBubble key={r.id} reaction={r} id={r.id} />)}
            </div>

            {/* Now playing info */}
            <div className="wp-room__now-playing">
              <div style={{ minWidth: 0 }}>
                <p className="wp-room__np-title">{currentItem.title}</p>
                <p className="wp-room__np-ep">{currentItem.episode}</p>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="wp-room__controls">
            <div className="wp-room__progress-row">
              <span className="wp-room__time">{formatProgress(progress)}</span>
              <div className="wp-room__progress-track" onClick={e => {
                const rect = e.currentTarget.getBoundingClientRect()
                setProgress(Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)))
              }}>
                <div className="wp-room__progress-fill" style={{ width: `${progress}%` }} />
                <div className="wp-room__progress-thumb" style={{ left: `${progress}%` }} />
              </div>
              <span className="wp-room__time">{currentItem.duration}</span>
            </div>

            <div className="wp-room__btns">
              <button className="wp-room__ctrl-btn" onClick={() => setProgress(0)} title="Restart">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/></svg>
              </button>

              <button className="wp-room__play-btn" onClick={() => setIsPlaying(p => !p)}>
                {isPlaying
                  ? <><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></>
                  : <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" stroke="none"/>
                }
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  {isPlaying
                    ? <><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></>
                    : <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" stroke="none"/>
                  }
                </svg>
              </button>

              <span className="wp-room__host-tag">👑 You're the host</span>

              {/* Reaction picker trigger */}
              <div style={{ position: 'relative', marginLeft: 'auto' }}>
                <button
                  className="wp-room__ctrl-btn"
                  onClick={() => setShowReactionPicker(p => !p)}
                  title="React"
                >
                  🔥
                </button>
                {showReactionPicker && (
                  <div className="wp-room__reaction-picker">
                    {REACTIONS.map(r => (
                      <button key={r.id} className="wp-room__reaction-opt" onClick={() => fireReaction(r)} title={r.label}>
                        {r.emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sync indicator */}
            <div className="wp-room__sync">
              <span className="wp-room__sync-dot" />
              <span>All {DEMO_MEMBERS.length} members in sync</span>
            </div>
          </div>
        </div>

        {/* Side panel */}
        <div className="wp-room__side">
          <div className="wp-room__tabs">
            {[
              { id: 'chat',    label: 'Chat',    badge: null },
              { id: 'queue',   label: 'Queue',   badge: queue.length },
              { id: 'members', label: 'Members', badge: DEMO_MEMBERS.length },
            ].map(t => (
              <button
                key={t.id}
                className={`wp-room__tab ${tab === t.id ? 'active' : ''}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
                {t.badge != null && <span className="wp-room__tab-badge">{t.badge}</span>}
              </button>
            ))}
          </div>

          {/* CHAT */}
          {tab === 'chat' && (
            <div className="wp-room__chat">
              <div className="wp-room__messages">
                {messages.map(msg => (
                  <div key={msg.id} className={`wp-room__msg ${msg.user === 'You' ? 'is-you' : ''}`}>
                    {msg.user !== 'You' && (
                      <div
                        className="wp-room__msg-avatar"
                        style={{ background: FACTIONS[msg.faction]?.color + '33', border: `1.5px solid ${FACTIONS[msg.faction]?.color}55` }}
                      >
                        {msg.initial}
                      </div>
                    )}
                    <div className="wp-room__msg-body">
                      {msg.user !== 'You' && (
                        <span className="wp-room__msg-name" style={{ color: FACTIONS[msg.faction]?.color }}>{msg.user}</span>
                      )}
                      <div className={`wp-room__msg-bubble ${msg.isReaction ? 'is-reaction' : ''}`}>
                        {msg.text}
                      </div>
                      <span className="wp-room__msg-time">{msg.time}</span>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Quick reactions */}
              <div className="wp-room__quick-reactions">
                {REACTIONS.slice(0, 4).map(r => (
                  <button key={r.id} className="wp-room__quick-btn" onClick={() => fireReaction(r)}>{r.emoji}</button>
                ))}
              </div>

              <div className="wp-room__input-row">
                <input
                  className="input"
                  placeholder="Say something…"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  style={{ flex: 1 }}
                />
                <button className="btn btn-primary btn-sm" onClick={sendMessage} disabled={!input.trim()}>
                  <IconSend size={14} />
                </button>
              </div>
            </div>
          )}

          {/* QUEUE */}
          {tab === 'queue' && (
            <div className="wp-room__queue">
              <div className="wp-room__queue-header">
                <span>Up Next ({queue.length})</span>
                <button className="btn btn-secondary btn-sm" style={{ gap: 6 }}>
                  <IconPlus size={13} /> Add Episode
                </button>
              </div>
              {queue.map((item, i) => (
                <div
                  key={item.id}
                  className={`wp-room__queue-item ${currentItem.id === item.id ? 'is-current' : ''}`}
                  onClick={() => { setCurrentItem(item); setProgress(0); setIsPlaying(false) }}
                >
                  <img src={item.thumb} alt={item.title} className="wp-room__queue-thumb"
                    onError={e => { e.target.style.background = 'var(--bg-elevated)'; e.target.style.display = 'none' }} />
                  <div className="wp-room__queue-info">
                    <p className="wp-room__queue-title">{item.episode}</p>
                    <p className="wp-room__queue-sub">{item.title}</p>
                    <span className="wp-room__queue-dur">{item.duration}</span>
                  </div>
                  {currentItem.id === item.id && (
                    <span className="wp-room__queue-now">▶ Now</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* MEMBERS */}
          {tab === 'members' && (
            <div className="wp-room__members">
              {DEMO_MEMBERS.map(m => {
                const f = FACTIONS[m.faction]
                return (
                  <div key={m.id} className="wp-room__member">
                    <div
                      className="wp-room__member-avatar"
                      style={{ background: f?.color + '22', border: `2px solid ${f?.color}55` }}
                    >
                      {m.initial}
                      <span className="wp-room__member-online" />
                    </div>
                    <div className="wp-room__member-info">
                      <span className="wp-room__member-name">{m.name}</span>
                      <span className="wp-room__member-faction" style={{ color: f?.color }}>{f?.icon} {f?.label}</span>
                    </div>
                    {m.isHost && <span className="wp-room__member-badge">👑 Host</span>}
                    {m.isYou && !m.isHost && <span className="wp-room__member-badge" style={{ background: 'var(--bg-elevated)' }}>You</span>}
                  </div>
                )
              })}
              <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', textAlign: 'center', marginTop: 16 }}>
                Share code <strong style={{ color: 'var(--gold)', fontFamily: 'monospace' }}>{roomCode}</strong> to invite more friends
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .wp-room { display: flex; flex-direction: column; min-height: 100vh; padding: 0; }

        .wp-room__header {
          display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
          padding: 14px 28px; border-bottom: 1px solid var(--border-subtle);
          background: rgba(10,9,8,0.6); backdrop-filter: blur(20px);
          position: sticky; top: 0; z-index: 20;
        }
        .wp-room__header-left { display: flex; align-items: center; gap: 10px; }
        .wp-room__title { font-family: var(--font-heading); font-weight: 700; }
        .wp-room__live { font-size: 0.72rem; font-weight: 700; color: var(--red); letter-spacing: 0.1em; animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }

        .wp-room__code-row { display: flex; align-items: center; gap: 8px; margin-left: auto; }
        .wp-room__code-label { color: var(--text-muted); font-size: 0.78rem; }
        .wp-room__code-btn {
          display: flex; align-items: center; gap: 6px;
          background: var(--bg-elevated); border: 1px solid var(--border-default);
          border-radius: var(--radius-sm); padding: 5px 10px;
          color: var(--gold); font-size: 0.85rem; cursor: pointer;
          transition: all var(--transition-fast);
        }
        .wp-room__code-btn:hover { border-color: var(--gold); }
        .wp-room__members-chip {
          display: flex; align-items: center; gap: 5px;
          background: rgba(212,168,67,0.08); border: 1px solid var(--border-subtle);
          border-radius: var(--radius-full); padding: 4px 10px;
          font-size: 0.78rem; color: var(--text-secondary);
        }
        .wp-room__leave {
          background: transparent; border: 1px solid var(--border-default);
          border-radius: var(--radius-md); padding: 6px 14px;
          color: var(--text-secondary); font-size: 0.82rem; cursor: pointer;
          transition: all var(--transition-fast);
        }
        .wp-room__leave:hover { border-color: var(--red); color: var(--red); }

        .wp-room__body {
          display: flex; gap: 0; flex: 1;
        }

        .wp-room__player-col {
          flex: 1; display: flex; flex-direction: column; gap: 0;
          border-right: 1px solid var(--border-subtle);
        }

        .wp-room__video {
          position: relative; background: #000;
          aspect-ratio: 16/9; width: 100%;
          display: flex; align-items: center; justify-content: center;
          overflow: hidden;
        }
        .wp-room__video-placeholder {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; gap: 8px; opacity: 0.7;
        }
        .wp-room__now-playing {
          position: absolute; bottom: 0; left: 0; right: 0;
          background: linear-gradient(transparent, rgba(0,0,0,0.85));
          padding: 32px 20px 14px; display: flex; align-items: flex-end; gap: 12px;
        }
        .wp-room__np-title { font-family: var(--font-heading); font-size: 0.95rem; color: #fff; }
        .wp-room__np-ep { font-size: 0.78rem; color: rgba(255,255,255,0.6); margin-top: 2px; }

        .wp-room__controls { padding: 18px 24px; display: flex; flex-direction: column; gap: 12px; background: var(--bg-secondary); }

        .wp-room__progress-row { display: flex; align-items: center; gap: 10px; }
        .wp-room__time { font-size: 0.78rem; color: var(--text-muted); font-family: monospace; white-space: nowrap; }
        .wp-room__progress-track {
          flex: 1; height: 5px; background: var(--bg-surface); border-radius: 99px;
          position: relative; cursor: pointer;
        }
        .wp-room__progress-track:hover { height: 7px; }
        .wp-room__progress-fill {
          position: absolute; left: 0; top: 0; bottom: 0;
          background: var(--gold); border-radius: 99px;
          transition: width 0.5s linear;
        }
        .wp-room__progress-thumb {
          position: absolute; top: 50%; transform: translate(-50%,-50%);
          width: 13px; height: 13px; background: var(--gold);
          border-radius: 50%; opacity: 0; transition: opacity var(--transition-fast);
        }
        .wp-room__progress-track:hover .wp-room__progress-thumb { opacity: 1; }

        .wp-room__btns { display: flex; align-items: center; gap: 12px; }
        .wp-room__ctrl-btn {
          width: 36px; height: 36px; border-radius: 50%;
          background: var(--bg-elevated); border: 1px solid var(--border-default);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all var(--transition-fast); font-size: 1rem;
        }
        .wp-room__ctrl-btn:hover { border-color: var(--gold); color: var(--gold); }
        .wp-room__play-btn {
          width: 48px; height: 48px; border-radius: 50%; background: var(--gold);
          border: none; display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: #0A0908;
          box-shadow: 0 0 20px rgba(212,168,67,0.35);
          transition: all var(--transition-fast);
        }
        .wp-room__play-btn:hover { background: var(--gold-light); transform: scale(1.08); }
        .wp-room__host-tag { font-size: 0.78rem; color: var(--text-muted); }
        .wp-room__reaction-picker {
          position: absolute; bottom: 44px; right: 0;
          background: var(--bg-elevated); border: 1px solid var(--border-default);
          border-radius: var(--radius-md); padding: 8px;
          display: flex; gap: 4px; flex-wrap: wrap; width: 180px;
          backdrop-filter: blur(12px); z-index: 30;
          box-shadow: var(--shadow-card);
        }
        .wp-room__reaction-opt {
          width: 36px; height: 36px; border-radius: var(--radius-sm);
          background: var(--bg-surface); border: none;
          font-size: 1.1rem; cursor: pointer;
          transition: all var(--transition-fast);
        }
        .wp-room__reaction-opt:hover { background: var(--bg-hover); transform: scale(1.15); }

        .wp-room__sync {
          display: flex; align-items: center; gap: 6px;
          font-size: 0.75rem; color: var(--green);
        }
        .wp-room__sync-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: var(--green); animation: pulse 1.5s infinite;
        }

        /* Side panel */
        .wp-room__side {
          width: 320px; min-width: 280px; display: flex; flex-direction: column;
          background: var(--bg-secondary);
        }
        .wp-room__tabs {
          display: flex; border-bottom: 1px solid var(--border-subtle);
        }
        .wp-room__tab {
          flex: 1; padding: 12px 8px; background: none; border: none;
          color: var(--text-muted); font-size: 0.82rem; font-weight: 600;
          cursor: pointer; border-bottom: 2px solid transparent;
          transition: all var(--transition-fast);
          display: flex; align-items: center; justify-content: center; gap: 5px;
        }
        .wp-room__tab.active { color: var(--gold); border-bottom-color: var(--gold); }
        .wp-room__tab-badge {
          background: var(--bg-elevated); border-radius: 99px;
          padding: 1px 6px; font-size: 0.7rem; color: var(--text-secondary);
        }

        /* Chat */
        .wp-room__chat { display: flex; flex-direction: column; flex: 1; height: 0; min-height: 500px; }
        .wp-room__messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 10px; }
        .wp-room__msg { display: flex; gap: 8px; }
        .wp-room__msg.is-you { flex-direction: row-reverse; }
        .wp-room__msg-avatar {
          width: 28px; height: 28px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.7rem; font-weight: 700; flex-shrink: 0;
        }
        .wp-room__msg-body { display: flex; flex-direction: column; gap: 2px; max-width: 70%; }
        .wp-room__msg.is-you .wp-room__msg-body { align-items: flex-end; }
        .wp-room__msg-name { font-size: 0.7rem; font-weight: 700; }
        .wp-room__msg-bubble {
          background: var(--bg-elevated); border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md); padding: 7px 11px;
          font-size: 0.85rem; line-height: 1.5; word-break: break-word;
        }
        .wp-room__msg.is-you .wp-room__msg-bubble {
          background: rgba(212,168,67,0.12); border-color: rgba(212,168,67,0.2);
        }
        .wp-room__msg-bubble.is-reaction { background: none; border: none; font-size: 1.6rem; padding: 0; }
        .wp-room__msg-time { font-size: 0.65rem; color: var(--text-muted); }
        .wp-room__quick-reactions { display: flex; gap: 6px; padding: 8px 16px; border-top: 1px solid var(--border-subtle); }
        .wp-room__quick-btn { font-size: 1.2rem; background: none; border: none; cursor: pointer; transition: transform var(--transition-fast); }
        .wp-room__quick-btn:hover { transform: scale(1.3); }
        .wp-room__input-row { display: flex; gap: 8px; padding: 10px 16px 14px; border-top: 1px solid var(--border-subtle); }

        /* Queue */
        .wp-room__queue { display: flex; flex-direction: column; gap: 0; overflow-y: auto; }
        .wp-room__queue-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid var(--border-subtle); font-size: 0.85rem; font-weight: 600; }
        .wp-room__queue-item {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 16px; border-bottom: 1px solid var(--border-subtle);
          cursor: pointer; transition: background var(--transition-fast);
        }
        .wp-room__queue-item:hover { background: var(--bg-hover); }
        .wp-room__queue-item.is-current { background: rgba(212,168,67,0.07); border-left: 3px solid var(--gold); }
        .wp-room__queue-thumb { width: 56px; height: 36px; object-fit: cover; border-radius: 4px; background: var(--bg-elevated); flex-shrink: 0; }
        .wp-room__queue-info { flex: 1; min-width: 0; }
        .wp-room__queue-title { font-size: 0.82rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .wp-room__queue-sub { font-size: 0.72rem; color: var(--text-muted); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .wp-room__queue-dur { font-size: 0.7rem; color: var(--text-muted); }
        .wp-room__queue-now { font-size: 0.72rem; color: var(--gold); font-weight: 700; white-space: nowrap; }

        /* Members */
        .wp-room__members { display: flex; flex-direction: column; gap: 0; overflow-y: auto; padding: 8px 0; }
        .wp-room__member { display: flex; align-items: center; gap: 12px; padding: 10px 16px; transition: background var(--transition-fast); }
        .wp-room__member:hover { background: var(--bg-hover); }
        .wp-room__member-avatar { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 700; position: relative; flex-shrink: 0; }
        .wp-room__member-online { position: absolute; bottom: 0; right: 0; width: 10px; height: 10px; border-radius: 50%; background: var(--green); border: 2px solid var(--bg-secondary); }
        .wp-room__member-info { flex: 1; }
        .wp-room__member-name { font-size: 0.88rem; font-weight: 600; display: block; }
        .wp-room__member-faction { font-size: 0.72rem; }
        .wp-room__member-badge { font-size: 0.7rem; background: rgba(212,168,67,0.15); border: 1px solid rgba(212,168,67,0.25); color: var(--gold); padding: 2px 8px; border-radius: var(--radius-full); white-space: nowrap; }

        @media (max-width: 900px) {
          .wp-room__body { flex-direction: column; }
          .wp-room__side { width: 100%; min-width: unset; border-top: 1px solid var(--border-subtle); border-right: none; }
          .wp-room__chat { min-height: 320px; }
        }
        @media (max-width: 600px) {
          .wp-room__header { padding: 10px 16px; gap: 8px; }
          .wp-room__code-row { margin-left: 0; }
          .wp-room__controls { padding: 12px 16px; }
        }
      `}</style>
    </div>
  )
}

// ── Page entry point ──────────────────────────────────────────────────────────
function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export default function WatchPartyPage() {
  const [searchParams] = useSearchParams()
  const [room, setRoom] = useState(null) // null = lobby, string = in room

  useEffect(() => {
    // Allow joining via URL ?room=ABCDEF
    const code = searchParams.get('room')
    if (code) setRoom(code.toUpperCase())
  }, [searchParams])

  const handleCreate = () => setRoom(generateRoomCode())
  const handleJoin   = (code) => setRoom(code)
  const handleLeave  = () => setRoom(null)

  if (!room) return <RoomLobby onCreate={handleCreate} onJoin={handleJoin} />
  return <PartyRoom roomCode={room} onLeave={handleLeave} />
}
