/**
 * KeyboardShortcutsModal — Press Ctrl+? (or Cmd+?) anywhere to open.
 * Lists every keyboard shortcut in the app.
 */
import { useEffect } from 'react'

const SHORTCUT_GROUPS = [
  {
    label: 'Navigation',
    shortcuts: [
      { keys: ['G', 'H'],       desc: 'Go to Home'          },
      { keys: ['G', 'A'],       desc: 'Go to Anime Browse'  },
      { keys: ['G', 'M'],       desc: 'Go to Manga'         },
      { keys: ['G', 'S'],       desc: 'Go to Community'     },
      { keys: ['G', 'G'],       desc: 'Go to Guilds'        },
      { keys: ['G', 'L'],       desc: 'Go to Leaderboard'   },
      { keys: ['G', 'P'],       desc: 'Go to Profile'       },
    ],
  },
  {
    label: 'Search & Discovery',
    shortcuts: [
      { keys: ['Ctrl', 'K'],    desc: 'Open search'         },
      { keys: ['Ctrl', '/'],    desc: 'Focus search bar'    },
      { keys: ['R'],            desc: 'Random anime'        },
      { keys: ['Esc'],          desc: 'Close modal/drawer'  },
    ],
  },
  {
    label: 'Media Playback',
    shortcuts: [
      { keys: ['Space'],        desc: 'Play / Pause'        },
      { keys: ['←'],            desc: 'Seek back 10s'       },
      { keys: ['→'],            desc: 'Seek forward 10s'    },
      { keys: ['↑'],            desc: 'Volume up'           },
      { keys: ['↓'],            desc: 'Volume down'         },
      { keys: ['M'],            desc: 'Mute / Unmute'       },
      { keys: ['F'],            desc: 'Toggle fullscreen'   },
    ],
  },
  {
    label: 'Appearance',
    shortcuts: [
      { keys: ['T'],            desc: 'Cycle theme (Dark → Light → OLED)' },
      { keys: ['Ctrl', '?'],   desc: 'Show shortcuts'      },
    ],
  },
]

export default function KeyboardShortcutsModal({ isOpen, onClose }) {
  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="ks-overlay" onClick={onClose}>
      <div className="ks-modal" onClick={e => e.stopPropagation()}>
        <div className="ks-header">
          <div>
            <h2 className="ks-title">Keyboard Shortcuts</h2>
            <p className="ks-sub">Master AniEmpire with your keyboard</p>
          </div>
          <button className="ks-close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="ks-body">
          {SHORTCUT_GROUPS.map(group => (
            <div key={group.label} className="ks-group">
              <h3 className="ks-group-label">{group.label}</h3>
              <div className="ks-list">
                {group.shortcuts.map((s, i) => (
                  <div key={i} className="ks-row">
                    <span className="ks-desc">{s.desc}</span>
                    <div className="ks-keys">
                      {s.keys.map((k, j) => (
                        <>
                          <kbd key={k} className="ks-key">{k}</kbd>
                          {j < s.keys.length - 1 && <span key={`sep-${j}`} className="ks-sep">+</span>}
                        </>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="ks-footer">
          <span>Press</span>
          <kbd className="ks-key">Esc</kbd>
          <span>to close</span>
        </div>
      </div>

      <style>{`
        .ks-overlay {
          position: fixed; inset: 0; z-index: 9999;
          background: rgba(0,0,0,0.75);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
          animation: ks-fade-in 0.2s ease;
        }
        @keyframes ks-fade-in { from { opacity: 0; } to { opacity: 1; } }

        .ks-modal {
          background: var(--bg-card);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-xl);
          width: 100%; max-width: 640px;
          max-height: 85vh; overflow: hidden;
          display: flex; flex-direction: column;
          box-shadow: 0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(212,168,67,0.06);
          animation: ks-slide-in 0.25s cubic-bezier(0.34,1.56,0.64,1);
        }
        @keyframes ks-slide-in { from { transform: scale(0.94) translateY(8px); opacity: 0; } to { transform: none; opacity: 1; } }

        .ks-header {
          display: flex; align-items: flex-start; justify-content: space-between;
          padding: 24px 28px 18px;
          border-bottom: 1px solid var(--border-subtle);
        }
        .ks-title {
          font-family: var(--font-heading); font-size: 1.15rem;
          background: linear-gradient(135deg, var(--gold), var(--gold-light));
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .ks-sub { color: var(--text-muted); font-size: 0.82rem; margin-top: 2px; }
        .ks-close {
          width: 32px; height: 32px; border-radius: var(--radius-sm);
          background: var(--bg-elevated); border: 1px solid var(--border-subtle);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: var(--text-muted);
          transition: all var(--transition-fast);
        }
        .ks-close:hover { border-color: var(--border-default); color: var(--text-primary); }

        .ks-body {
          overflow-y: auto; padding: 20px 28px; display: flex; flex-direction: column; gap: 24px;
        }
        .ks-group-label {
          font-size: 0.7rem; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.1em; color: var(--gold); margin-bottom: 10px;
        }
        .ks-list { display: flex; flex-direction: column; gap: 2px; }
        .ks-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 7px 0; border-bottom: 1px solid var(--border-subtle);
        }
        .ks-row:last-child { border-bottom: none; }
        .ks-desc { font-size: 0.88rem; color: var(--text-secondary); }
        .ks-keys { display: flex; align-items: center; gap: 4px; }
        .ks-sep { color: var(--text-muted); font-size: 0.8rem; }
        .ks-key {
          display: inline-flex; align-items: center; justify-content: center;
          min-width: 28px; height: 24px; padding: 0 7px;
          background: var(--bg-elevated); border: 1px solid var(--border-default);
          border-bottom: 2px solid var(--border-hover);
          border-radius: 5px; font-family: 'SF Mono', 'Fira Code', monospace;
          font-size: 0.72rem; font-weight: 600; color: var(--text-primary);
          letter-spacing: 0;
        }

        .ks-footer {
          padding: 14px 28px; border-top: 1px solid var(--border-subtle);
          display: flex; align-items: center; gap: 6px;
          color: var(--text-muted); font-size: 0.8rem;
        }

        @media (max-width: 640px) {
          .ks-modal { max-height: 95vh; border-radius: var(--radius-lg) var(--radius-lg) 0 0; align-self: flex-end; }
          .ks-header, .ks-body, .ks-footer { padding-left: 20px; padding-right: 20px; }
        }
      `}</style>
    </div>
  )
}
