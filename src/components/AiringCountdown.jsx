import { useState, useEffect } from 'react'
import { IconPlay } from './Icons'

export default function AiringCountdown({ airingData }) {
  const [timeLeft, setTimeLeft] = useState(null)

  useEffect(() => {
    if (!airingData) return

    const calculateTime = () => {
      const now = Math.floor(Date.now() / 1000)
      const diff = airingData.airingAt - now
      
      if (diff <= 0) return 'Airing Now'

      const days = Math.floor(diff / (3600 * 24))
      const hours = Math.floor((diff % (3600 * 24)) / 3600)
      const mins = Math.floor((diff % 3600) / 60)
      
      let str = ''
      if (days > 0) str += `${days}d `
      if (hours > 0) str += `${hours}h `
      str += `${mins}m`
      return str
    }

    setTimeLeft(calculateTime())
    const timer = setInterval(() => setTimeLeft(calculateTime()), 60000)
    return () => clearInterval(timer)
  }, [airingData])

  if (!airingData) return null

  return (
    <div className="airing-card anim-fade-in">
      <div className="airing-header">
        <div className="airing-status">
          <span className="airing-dot"></span>
          <span className="airing-label">NEXT EPISODE</span>
        </div>
        <div className="airing-ep">EP {airingData.episode}</div>
      </div>
      <div className="airing-time">
        <IconPlay size={18} />
        <span className="airing-timer">{timeLeft}</span>
      </div>
      <style>{`
        .airing-card {
          background: linear-gradient(135deg, rgba(212, 168, 67, 0.15) 0%, rgba(10, 9, 8, 0.4) 100%);
          border: 1px solid rgba(212, 168, 67, 0.3);
          border-radius: var(--radius-md);
          padding: 16px;
          margin-bottom: 24px;
          backdrop-filter: blur(8px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
          position: relative;
          overflow: hidden;
        }
        .airing-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(212, 168, 67, 0.5), transparent);
        }
        .airing-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        .airing-status {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .airing-dot {
          width: 8px;
          height: 8px;
          background: #27ae60;
          border-radius: 50%;
          box-shadow: 0 0 8px #27ae60;
          animation: pulse-green 2s infinite;
        }
        .airing-label {
          font-size: 0.7rem;
          font-weight: 800;
          color: var(--text-muted);
          letter-spacing: 1px;
        }
        .airing-ep {
          font-size: 0.85rem;
          font-weight: 800;
          color: var(--gold);
        }
        .airing-time {
          display: flex;
          align-items: center;
          gap: 12px;
          color: var(--text-primary);
        }
        .airing-timer {
          font-size: 1.4rem;
          font-weight: 800;
          font-family: var(--font-heading);
          letter-spacing: -0.5px;
        }
        @keyframes pulse-green {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(39, 174, 96, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(39, 174, 96, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(39, 174, 96, 0); }
        }
      `}</style>
    </div>
  )
}
