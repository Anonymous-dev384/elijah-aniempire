/**
 * DailyQuestPanel — standalone expandable panel showing daily quests.
 * Can be embedded in the sidebar or opened from RPGHud.
 */
import { useRPGStore } from '../../store/rpgStore'

export default function DailyQuestPanel({ style }) {
  const { dailyQuests, streak } = useRPGStore()
  const completed = dailyQuests.filter(q => q.completed).length
  const allDone = completed === dailyQuests.length && dailyQuests.length > 0

  return (
    <div className="dqp glass-panel" style={style}>
      <div className="dqp-header">
        <div>
          <h3 className="dqp-title">Daily Quests</h3>
          <p className="dqp-sub">{completed}/{dailyQuests.length} complete {allDone && '🎉'}</p>
        </div>
        {streak > 0 && (
          <div className="dqp-streak">
            <span>🔥</span>
            <span className="dqp-streak-num">{streak}</span>
            <span className="dqp-streak-label">day streak</span>
          </div>
        )}
      </div>

      {/* Overall progress bar */}
      <div className="dqp-progress-wrap">
        <div
          className="dqp-progress-fill"
          style={{ width: dailyQuests.length ? `${(completed / dailyQuests.length) * 100}%` : '0%' }}
        />
      </div>

      <div className="dqp-list">
        {dailyQuests.length === 0 ? (
          <p className="dqp-empty">Log in daily to unlock quests and earn XP.</p>
        ) : dailyQuests.map((q, i) => (
          <div key={q.id || i} className={`dqp-item ${q.completed ? 'done' : ''}`}>
            <div className="dqp-item-icon">{q.icon}</div>
            <div className="dqp-item-body">
              <p className="dqp-item-label">{q.label}</p>
              <div className="dqp-item-bar">
                <div className="dqp-item-fill" style={{ width: `${q.target > 0 ? (q.progress / q.target) * 100 : 0}%` }} />
              </div>
              <span className="dqp-item-count">{q.progress}/{q.target}</span>
            </div>
            <div className="dqp-item-reward">
              {q.completed
                ? <span className="dqp-check">✓</span>
                : <span className="dqp-xp">+{q.xp} XP</span>
              }
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .dqp { padding: 16px; }
        .dqp-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
        .dqp-title { font-size: 0.9rem; font-weight: 800; color: var(--text-primary); }
        .dqp-sub { font-size: 0.72rem; color: var(--text-muted); margin-top: 2px; }
        .dqp-streak { display: flex; align-items: center; gap: 4px; background: rgba(255,140,66,0.1); border: 1px solid rgba(255,140,66,0.25); border-radius: var(--radius-sm); padding: 4px 8px; }
        .dqp-streak-num { font-size: 1rem; font-weight: 900; color: #FF8C42; }
        .dqp-streak-label { font-size: 0.6rem; color: var(--text-muted); font-weight: 600; }
        .dqp-progress-wrap { height: 3px; background: var(--bg-surface); border-radius: 9999px; overflow: hidden; margin-bottom: 14px; }
        .dqp-progress-fill { height: 100%; background: linear-gradient(90deg, var(--neon-purple), var(--neon-cyan)); transition: width 0.6s ease; }
        .dqp-list { display: flex; flex-direction: column; gap: 8px; }
        .dqp-empty { font-size: 0.78rem; color: var(--text-muted); font-style: italic; text-align: center; padding: 12px 0; }
        .dqp-item { display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: var(--radius-sm); background: var(--bg-elevated); border: 1px solid var(--border-subtle); transition: border-color 0.2s; }
        .dqp-item.done { border-color: rgba(57,255,133,0.25); background: rgba(57,255,133,0.04); }
        .dqp-item-icon { font-size: 1.1rem; width: 24px; text-align: center; flex-shrink: 0; }
        .dqp-item-body { flex: 1; min-width: 0; }
        .dqp-item-label { font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .dqp-item.done .dqp-item-label { color: var(--neon-green); text-decoration: line-through; opacity: 0.7; }
        .dqp-item-bar { height: 3px; background: var(--bg-surface); border-radius: 9999px; overflow: hidden; margin-bottom: 3px; }
        .dqp-item-fill { height: 100%; background: linear-gradient(90deg, var(--gold), var(--neon-cyan)); transition: width 0.4s ease; }
        .dqp-item-count { font-size: 0.6rem; color: var(--text-muted); }
        .dqp-item-reward { flex-shrink: 0; }
        .dqp-check { color: var(--neon-green); font-size: 0.9rem; font-weight: 800; }
        .dqp-xp { font-size: 0.65rem; font-weight: 800; color: var(--neon-cyan); }
      `}</style>
    </div>
  )
}
