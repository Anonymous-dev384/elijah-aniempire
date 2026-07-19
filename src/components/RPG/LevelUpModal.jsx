/**
 * LevelUpModal — celebratory overlay shown when a user gains a level.
 * Triggered by RPGHud when a level_up toast is in the queue.
 */
import { useEffect, useState } from 'react'
import { useRPGStore } from '../../store/rpgStore'

export default function LevelUpModal({ level, title, onClose }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setShow(true))
    const t = setTimeout(onClose, 5000)
    return () => clearTimeout(t)
  }, [])

  if (!show) return null

  return (
    <div className="levelup-overlay" onClick={onClose}>
      <div className="levelup-modal">
        {/* Burst rings */}
        <div className="levelup-ring r1" />
        <div className="levelup-ring r2" />
        <div className="levelup-ring r3" />

        <div className="levelup-badge">
          <span className="levelup-up">▲</span>
          <span className="levelup-num">{level}</span>
        </div>
        <h2 className="levelup-headline">Level Up!</h2>
        <p className="levelup-title">"{title}"</p>
        <p className="levelup-sub">You're getting stronger every day.</p>
        <button className="btn btn-primary levelup-btn" onClick={onClose}>Keep Going</button>
      </div>

      <style>{`
        @keyframes burst { 0% { transform: scale(0.6); opacity:1; } 100% { transform: scale(2.2); opacity:0; } }
        .levelup-overlay {
          position: fixed; inset: 0; z-index: 10000;
          background: rgba(0,0,0,0.85); backdrop-filter: blur(12px);
          display: flex; align-items: center; justify-content: center;
        }
        .levelup-modal {
          position: relative;
          display: flex; flex-direction: column; align-items: center; gap: 12px;
          padding: 48px 40px;
          animation: scale-in 0.45s cubic-bezier(0.34,1.56,0.64,1) both;
          text-align: center; max-width: 360px;
        }
        .levelup-ring {
          position: absolute; border-radius: 50%;
          border: 2px solid var(--gold);
          animation: burst 1.6s ease-out forwards;
        }
        .r1 { width: 120px; height: 120px; animation-delay: 0s; }
        .r2 { width: 120px; height: 120px; animation-delay: 0.2s; opacity: 0.6; }
        .r3 { width: 120px; height: 120px; animation-delay: 0.4s; opacity: 0.3; }
        .levelup-badge {
          width: 90px; height: 90px; border-radius: 50%;
          background: linear-gradient(135deg, var(--gold-dark), var(--gold));
          border: 3px solid var(--gold);
          box-shadow: 0 0 40px rgba(212,168,67,0.7), 0 0 80px rgba(212,168,67,0.3);
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          z-index: 1; animation: neon-pulse 1s ease-in-out 3;
        }
        .levelup-up { font-size: 1rem; color: rgba(0,0,0,0.7); line-height: 1; }
        .levelup-num { font-size: 2rem; font-weight: 900; color: #000; line-height: 1; font-family: var(--font-heading); }
        .levelup-headline { font-size: 2rem; font-weight: 900; color: var(--gold); font-family: var(--font-heading); text-shadow: 0 0 20px rgba(212,168,67,0.6); margin: 0; }
        .levelup-title { font-size: 1rem; color: var(--neon-cyan); font-weight: 700; font-style: italic; }
        .levelup-sub { color: var(--text-muted); font-size: 0.85rem; }
        .levelup-btn { margin-top: 8px; }
      `}</style>
    </div>
  )
}
