import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function RouteProgressBar() {
  const { pathname } = useLocation()
  const [state, setState] = useState('idle') // idle → loading → done

  useEffect(() => {
    setState('loading')

    const finishTimer = setTimeout(() => setState('done'), 350)
    const resetTimer = setTimeout(() => setState('idle'), 800)

    return () => {
      clearTimeout(finishTimer)
      clearTimeout(resetTimer)
    }
  }, [pathname])

  if (state === 'idle') return null

  return (
    <div className="route-progress-bar">
      <div className={`route-progress-fill ${state}`} />
      <style>{`
        .route-progress-bar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: transparent;
          z-index: 9999;
          overflow: hidden;
          pointer-events: none;
        }
        .route-progress-fill {
          height: 100%;
          width: 0%;
          background: var(--gold);
          box-shadow: 0 0 8px rgba(212, 168, 67, 0.4);
          transition: none;
        }
        .route-progress-fill.loading {
          animation: route-progress-loading 0.6s ease-out forwards;
        }
        .route-progress-fill.done {
          width: 100% !important;
          opacity: 1;
          animation: route-progress-fade-out 0.45s ease-out forwards;
        }
        @keyframes route-progress-loading {
          0% { width: 0%; opacity: 1; }
          20% { width: 35%; }
          50% { width: 60%; }
          80% { width: 85%; }
          100% { width: 95%; opacity: 1; }
        }
        @keyframes route-progress-fade-out {
          0% { width: 100%; opacity: 1; }
          100% { width: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  )
}
