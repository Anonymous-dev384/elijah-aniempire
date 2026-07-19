/**
 * FactionSelector — modal/overlay to pick a faction during onboarding or from profile.
 * Shows all 10 factions with their colors, icons, and descriptions.
 */
import { useState } from 'react'
import { useRPGStore, FACTIONS } from '../../store/rpgStore'

const FACTION_DESCRIPTIONS = {
  shonen:  'Bold, passionate fighters. Powered by friendship and grit.',
  seinen:  'Strategic minds. They think before they strike.',
  shoujo:  'Heart-led adventurers. Emotions are their greatest weapon.',
  cyber:   'Tech-savvy rebels. The future belongs to those who code it.',
  fantasy: 'Ancient magic users. They walk between worlds.',
  mecha:   'Iron-clad warriors. Steel and skill in perfect harmony.',
  sol:     'Life enjoyers. Joy, warmth, and everyday magic.',
  horror:  'Darkness dwellers. Fear is their power.',
  isekai:  'World-hoppers. Every dimension is their playground.',
  mystic:  'Scholars of the arcane. Knowledge is infinite power.',
}

export default function FactionSelector({ onClose, onSelect }) {
  const { faction: currentFaction, setFaction } = useRPGStore()
  const [hovered, setHovered] = useState(null)
  const factions = Object.values(FACTIONS)

  const handleSelect = (id) => {
    setFaction(id)
    onSelect?.(id)
    onClose?.()
  }

  return (
    <div className="faction-overlay" onClick={onClose}>
      <div className="faction-modal glass-panel" onClick={e => e.stopPropagation()}>
        <h2 className="faction-modal-title gradient-text">Choose Your Faction</h2>
        <p className="faction-modal-sub">Your faction shapes your quests, chat rooms, and exclusive rewards.</p>

        <div className="faction-grid">
          {factions.map(f => (
            <button
              key={f.id}
              className={`faction-card ${currentFaction === f.id ? 'active' : ''}`}
              style={{ '--fc': f.color }}
              onMouseEnter={() => setHovered(f.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => handleSelect(f.id)}
            >
              <span className="faction-card-icon">{f.icon}</span>
              <span className="faction-card-name">{f.label}</span>
              {(hovered === f.id || currentFaction === f.id) && (
                <span className="faction-card-desc">{FACTION_DESCRIPTIONS[f.id]}</span>
              )}
              {currentFaction === f.id && (
                <span className="faction-card-active-dot" />
              )}
            </button>
          ))}
        </div>

        <button className="btn btn-secondary" style={{ marginTop: 16, width: '100%' }} onClick={onClose}>
          Cancel
        </button>
      </div>

      <style>{`
        .faction-overlay {
          position: fixed; inset: 0; z-index: 9000;
          background: rgba(0,0,0,0.75); backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
          animation: scale-in 0.25s cubic-bezier(0.4,0,0.2,1) both;
        }
        .faction-modal {
          width: 100%; max-width: 640px; max-height: 85vh;
          overflow-y: auto; padding: 28px;
        }
        .faction-modal-title { font-size: 1.5rem; font-weight: 900; text-align: center; margin-bottom: 6px; }
        .faction-modal-sub { color: var(--text-muted); font-size: 0.85rem; text-align: center; margin-bottom: 24px; }
        .faction-grid {
          display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;
        }
        @media (min-width: 480px) { .faction-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (min-width: 600px) { .faction-grid { grid-template-columns: repeat(5, 1fr); } }
        .faction-card {
          position: relative;
          display: flex; flex-direction: column; align-items: center; gap: 6px;
          padding: 14px 8px; border-radius: var(--radius-md);
          background: var(--bg-elevated);
          border: 1.5px solid var(--border-subtle);
          cursor: pointer; transition: all 0.2s;
          min-height: 90px;
        }
        .faction-card:hover, .faction-card.active {
          border-color: var(--fc);
          background: color-mix(in srgb, var(--fc) 10%, transparent);
          box-shadow: 0 0 20px color-mix(in srgb, var(--fc) 25%, transparent);
          transform: translateY(-2px);
        }
        .faction-card-icon { font-size: 1.6rem; line-height: 1; }
        .faction-card-name { font-size: 0.62rem; font-weight: 800; color: var(--fc); letter-spacing: 0.04em; text-align: center; line-height: 1.2; }
        .faction-card-desc { font-size: 0.6rem; color: var(--text-muted); text-align: center; line-height: 1.3; position: absolute; bottom: -34px; left: 0; right: 0; background: var(--bg-card); border: 1px solid var(--border-default); border-radius: var(--radius-sm); padding: 4px 6px; z-index: 10; pointer-events: none; }
        .faction-card-active-dot {
          position: absolute; top: 6px; right: 6px;
          width: 7px; height: 7px; border-radius: 50%;
          background: var(--fc);
          box-shadow: 0 0 6px var(--fc);
        }
      `}</style>
    </div>
  )
}
