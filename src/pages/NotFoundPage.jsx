import { Link } from 'react-router-dom'
import { IconSearch } from '../components/Icons'

export default function NotFoundPage() {
  return (
    <div className="not-found-container">
      <div className="not-found-lost anim-fade-up">
        {/* Simple cartoon 'Lost' corner with cobwebs */}
        <div className="not-found-lost-graphic">
          <img 
            src="/cartoon_lost_corner_crates_1775592227188-removebg-preview.png" 
            alt="Lost corner" 
            className="not-found-lost-img"
          />
        </div>

        <div className="not-found-lost-text">
          <h1 className="not-found-lost-title">END</h1>
          <p className="not-found-lost-msg">You've reached a dead end. This page doesn't exist.</p>
          
          <div className="not-found-lost-links">
            <Link to="/" className="btn btn-primary btn-sm">Take Me Back</Link>
            <Link to="/browse" className="btn btn-ghost btn-sm">Browse Anime</Link>
          </div>
        </div>
      </div>

      <style>{`
        .not-found-container {
          min-height: 70vh; display: flex; align-items: center; justify-content: center;
          padding: 32px;
        }
        .not-found-lost {
          display: flex; flex-direction: column; align-items: center;
          max-width: 420px; width: 100%;
        }
        
        .not-found-lost-graphic {
          width: 240px; height: 240px; margin-bottom: 24px;
          display: flex; align-items: center; justify-content: center;
        }
        .not-found-lost-img {
          width: 100%; height: 100%; object-fit: contain;
          opacity: 0.85; filter: contrast(1.1);
        }

        .not-found-lost-text { text-align: center; }
        .not-found-lost-title {
          font-family: var(--font-heading); font-size: 3.5rem; font-weight: 900;
          color: var(--gold); margin-bottom: 8px; letter-spacing: 4px;
        }
        .not-found-lost-msg { 
          color: var(--text-muted); font-size: 0.95rem; margin-bottom: 32px; 
          max-width: 280px; margin-left: auto; margin-right: auto;
          line-height: 1.5;
        }
        
        .not-found-lost-links { display: flex; gap: 12px; justify-content: center; }

        @media (max-width: 600px) {
          .not-found-lost-graphic { width: 180px; height: 180px; }
          .not-found-lost-title { font-size: 2.8rem; }
        }
      `}</style>
    </div>
  )
}
