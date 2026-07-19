/**
 * RPGHud — persistent heads-up display overlay.
 * Shows XP bar, level, faction badge, streak, and daily quest progress.
 * Fixed to the top of main content area; collapses on mobile.
 */
import { useState, useEffect } from 'react'
import { useRPGStore, FACTIONS, DAILY_QUEST_POOL } from '../../store/rpgStore'

function XPBar({ current, max, level }) {
  const pct = max > 0 ? Math.min(100, (current / max) * 100) : 0
  return (
    <div className="rpg-xp-wrap" title={`${current} / ${max} XP to level ${level + 1}`}>
      <div className="rpg-xp-labels">
        <span className="rpg-lv">Lv.{level}</span>
        <span className="rpg-xp-num">{current}<span className="rpg-xp-sep">/{max}</span></span>
      </div>
      <div className="rpg-xp-track">
        <div className="rpg-xp-fill" style={{ width: `${pct}%` }} />
        {/* Sparkle at fill edge */}
        <div className="rpg-xp-glow" style={{ left: `${pct}%` }} />
      </div>
    </div>
  )
}

function QuestDots({ quests }) {
  return (
    <div className="rpg-quest-dots" title="Daily Quests">
      {quests.map((q, i) => (
        <div
          key={q.id || i}
          className={`rpg-quest-dot ${q.completed ? 'done' : q.progress > 0 ? 'partial' : ''}`}
          title={`${q.label} (${q.progress}/${q.target})`}
        />
      ))}
    </div>
  )
}

export default function RPGHud() {
  const { level, xpIntoLevel, xpForNext, title, faction, streak, dailyQuests, credits, gems, checkDailyLogin, toasts, dismissToast } = useRPGStore()
  const [expanded, setExpanded] = useState(false)
  const factionData = faction ? FACTIONS[faction] : null

  useEffect(() => {
    checkDailyLogin()
  }, [])

  // Auto-dismiss toasts after 4s
  useEffect(() => {
    if (toasts.length === 0) return
    const t = setTimeout(() => dismissToast(toasts[0].id), 4000)
    return () => clearTimeout(t)
  }, [toasts])

  return (
    <>
      {/* ── HUD Bar ────────────────────────────────────────────────────── */}
      <div className={`rpg-hud ${expanded ? 'rpg-hud--open' : ''}`}>
        <button className="rpg-hud-toggle" onClick={() => setExpanded(e => !e)} title="RPG Status">
          <span className="rpg-avatar">
            {factionData
              ? <span style={{ fontSize: 16 }}>{factionData.icon}</span>
              : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            }
          </span>
          <XPBar current={xpIntoLevel} max={xpForNext} level={level} />
          {streak > 1 && (
            <span className="rpg-streak" title={`${streak}-day streak!`}>
              🔥 {streak}
            </span>
          )}
          {dailyQuests.length > 0 && <QuestDots quests={dailyQuests} />}
          <svg
            className={`rpg-chevron ${expanded ? 'up' : 'down'}`}
            width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {/* ── Expanded panel ─────────────────────────────────────────────── */}
        {expanded && (
          <div className="rpg-hud-panel glass-panel">
            <div className="rpg-panel-header">
              <div>
                <p className="rpg-panel-title">{title}</p>
                {factionData && (
                  <p className="rpg-panel-faction" style={{ color: factionData.color }}>
                    {factionData.icon} {factionData.label}
                  </p>
                )}
              </div>
              <div className="rpg-panel-currencies">
                <span className="rpg-currency" title="Credits">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>
                  {credits}
                </span>
                <span className="rpg-currency rpg-currency--gem" title="Gems">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/></svg>
                  {gems}
                </span>
              </div>
            </div>

            {/* Daily quests */}
            <div className="rpg-quests">
              <p className="rpg-quests-label">DAILY QUESTS</p>
              {dailyQuests.length > 0 ? dailyQuests.map((q, i) => (
                <div key={q.id || i} className={`rpg-quest-row ${q.completed ? 'rpg-quest-row--done' : ''}`}>
                  <span className="rpg-quest-icon">{q.icon}</span>
                  <div className="rpg-quest-info">
                    <p className="rpg-quest-name">{q.label}</p>
                    <div className="rpg-quest-bar-wrap">
                      <div
                        className="rpg-quest-bar-fill"
                        style={{ width: `${q.target > 0 ? (q.progress / q.target) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  <span className="rpg-quest-reward">+{q.xp} XP</span>
                </div>
              )) : (
                <p className="rpg-quests-empty">Log in daily to unlock quests</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Toast notifications ────────────────────────────────────────── */}
      <div className="rpg-toasts">
        {toasts.slice(0, 3).map(toast => (
          <div
            key={toast.id}
            className={`rpg-toast rpg-toast--${toast.type}`}
            onClick={() => dismissToast(toast.id)}
          >
            {toast.type === 'level_up' && (
              <span className="rpg-toast-icon">⬆</span>
            )}
            {toast.type === 'achievement' && (
              <span className="rpg-toast-icon">🏆</span>
            )}
            {toast.type === 'xp' && (
              <span className="rpg-toast-icon" style={{ color: 'var(--neon-cyan)' }}>✦</span>
            )}
            <span className="rpg-toast-msg">{toast.message}</span>
          </div>
        ))}
      </div>

      <style>{`
        /* ── HUD bar ────────────────────────────────────────────────── */
        .rpg-hud {
          position: fixed;
          top: 0; right: 0;
          z-index: 300;
          width: 280px;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }
        .rpg-hud-toggle {
          display: flex; align-items: center; gap: 8px;
          background: rgba(10, 9, 8, 0.82);
          border: 1px solid var(--border-default);
          border-top: none; border-right: none;
          border-radius: 0 0 0 var(--radius-lg);
          padding: 7px 14px 7px 10px;
          cursor: pointer;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          transition: border-color 0.2s, box-shadow 0.2s;
          width: 100%;
        }
        .rpg-hud-toggle:hover { border-color: var(--gold); box-shadow: var(--shadow-gold); }
        .rpg-hud--open .rpg-hud-toggle { border-color: var(--neon-cyan); box-shadow: var(--shadow-neon-cyan); }

        .rpg-avatar {
          width: 28px; height: 28px; border-radius: 50%;
          background: var(--bg-elevated); border: 1.5px solid var(--border-hover);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; color: var(--text-muted);
        }

        /* XP bar */
        .rpg-xp-wrap { flex: 1; min-width: 0; }
        .rpg-xp-labels {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 3px;
        }
        .rpg-lv { font-size: 0.7rem; font-weight: 800; color: var(--gold); letter-spacing: 0.06em; }
        .rpg-xp-num { font-size: 0.62rem; color: var(--text-muted); font-weight: 600; }
        .rpg-xp-sep { opacity: 0.5; }
        .rpg-xp-track {
          position: relative; height: 4px; border-radius: 9999px;
          background: var(--bg-surface); overflow: visible;
        }
        .rpg-xp-fill {
          height: 100%; border-radius: 9999px;
          background: linear-gradient(90deg, var(--neon-purple), var(--neon-cyan));
          box-shadow: 0 0 8px rgba(157,78,255,0.6);
          transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative; z-index: 1;
        }
        .rpg-xp-glow {
          position: absolute; top: 50%; transform: translateY(-50%);
          width: 8px; height: 8px; border-radius: 50%;
          background: var(--neon-cyan);
          box-shadow: 0 0 8px var(--neon-cyan), 0 0 16px var(--neon-cyan);
          margin-left: -4px;
          animation: neon-pulse 1.8s ease-in-out infinite;
          z-index: 2;
        }

        .rpg-streak {
          font-size: 0.72rem; font-weight: 700; color: #FF8C42;
          white-space: nowrap; flex-shrink: 0;
        }

        /* Quest dots */
        .rpg-quest-dots { display: flex; gap: 4px; align-items: center; flex-shrink: 0; }
        .rpg-quest-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: var(--bg-surface); border: 1.5px solid var(--border-default);
          transition: all 0.3s;
        }
        .rpg-quest-dot.partial { background: var(--gold); border-color: var(--gold); opacity: 0.6; }
        .rpg-quest-dot.done { background: var(--neon-green); border-color: var(--neon-green); box-shadow: 0 0 6px var(--neon-green); }

        .rpg-chevron { color: var(--text-muted); flex-shrink: 0; transition: transform 0.2s; }
        .rpg-chevron.up { transform: rotate(180deg); }

        /* ── Expanded panel ─────────────────────────────────────────── */
        .rpg-hud-panel {
          width: 100%; margin-top: 4px;
          border-radius: 0 0 0 var(--radius-lg);
          padding: 16px;
          border-right: none; border-top: none;
          animation: scale-in 0.25s cubic-bezier(0.34,1.56,0.64,1) both;
        }
        .rpg-panel-header {
          display: flex; justify-content: space-between; align-items: flex-start;
          margin-bottom: 14px;
        }
        .rpg-panel-title { font-size: 0.8rem; font-weight: 700; color: var(--text-primary); }
        .rpg-panel-faction { font-size: 0.7rem; font-weight: 600; margin-top: 2px; }
        .rpg-panel-currencies { display: flex; gap: 8px; align-items: center; }
        .rpg-currency {
          display: flex; align-items: center; gap: 4px;
          font-size: 0.72rem; font-weight: 700; color: var(--gold);
          background: var(--gold-glow-soft); border: 1px solid rgba(212,168,67,0.2);
          border-radius: var(--radius-sm); padding: 3px 7px;
        }
        .rpg-currency--gem { color: var(--neon-cyan); background: var(--neon-cyan-soft); border-color: rgba(0,217,255,0.2); }

        /* Quests */
        .rpg-quests { display: flex; flex-direction: column; gap: 8px; }
        .rpg-quests-label {
          font-size: 0.6rem; font-weight: 800; color: var(--text-muted);
          letter-spacing: 0.12em; margin-bottom: 2px;
        }
        .rpg-quests-empty { font-size: 0.75rem; color: var(--text-muted); font-style: italic; }
        .rpg-quest-row {
          display: flex; align-items: center; gap: 8px;
          padding: 8px; border-radius: var(--radius-sm);
          background: var(--bg-elevated); border: 1px solid var(--border-subtle);
          transition: border-color 0.2s;
        }
        .rpg-quest-row--done { border-color: rgba(57,255,133,0.3); background: rgba(57,255,133,0.05); }
        .rpg-quest-icon { font-size: 1rem; flex-shrink: 0; width: 20px; text-align: center; }
        .rpg-quest-info { flex: 1; min-width: 0; }
        .rpg-quest-name { font-size: 0.72rem; font-weight: 600; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px; }
        .rpg-quest-row--done .rpg-quest-name { color: var(--neon-green); text-decoration: line-through; opacity: 0.7; }
        .rpg-quest-bar-wrap { height: 3px; background: var(--bg-surface); border-radius: 9999px; overflow: hidden; }
        .rpg-quest-bar-fill { height: 100%; background: linear-gradient(90deg, var(--gold), var(--neon-cyan)); transition: width 0.4s ease; }
        .rpg-quest-reward { font-size: 0.65rem; font-weight: 800; color: var(--neon-cyan); white-space: nowrap; flex-shrink: 0; }

        /* ── Toasts ─────────────────────────────────────────────────── */
        .rpg-toasts {
          position: fixed; bottom: 80px; right: 16px;
          z-index: 9999; display: flex; flex-direction: column; gap: 8px;
          pointer-events: none;
        }
        .rpg-toast {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 16px; border-radius: var(--radius-md);
          background: rgba(10,9,8,0.92); backdrop-filter: blur(20px);
          border: 1px solid var(--border-hover);
          color: var(--text-primary); font-size: 0.8rem; font-weight: 600;
          pointer-events: auto; cursor: pointer;
          animation: slide-in-up 0.35s cubic-bezier(0.4,0,0.2,1) both;
          box-shadow: var(--shadow-card);
          max-width: 300px;
        }
        .rpg-toast--level_up { border-color: var(--gold); box-shadow: var(--shadow-gold); }
        .rpg-toast--achievement { border-color: var(--neon-purple); box-shadow: var(--shadow-neon-purple); }
        .rpg-toast--xp { border-color: rgba(0,217,255,0.3); }
        .rpg-toast-icon { font-size: 1rem; flex-shrink: 0; }
        .rpg-toast-msg { flex: 1; min-width: 0; }

        /* ── Mobile ──────────────────────────────────────────────────── */
        @media (max-width: 768px) {
          .rpg-hud { width: 200px; }
          .rpg-hud-panel { width: 280px; right: 0; }
          .rpg-toasts { bottom: 70px; right: 8px; }
          .rpg-toast { max-width: 260px; }
        }
      `}</style>
    </>
  )
}
