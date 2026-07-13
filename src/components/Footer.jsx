import { Link } from 'react-router-dom'
import { CrownIcon } from './Icons'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-cols">
        <div className="footer-brand-col">
          <div className="footer-logo-area">
            <img src="/assets/aniempire logo tranparent.svg" alt="AniEmpire" className="footer-logo-img" />
            <span className="footer-brand-text">AniEmpire</span>
          </div>
          <p className="footer-brand-desc">
            Your royal gateway to anime, manga, and anime music. Rule your watchlist. Conquer every season.
          </p>
        </div>
        {[
          { title: 'Explore', links: [['Anime', '/browse/anime'], ['Manga', '/browse/manga'], ['Music', '/browse/music'], ['Trending', '/browse?sort=trending']] },
          { title: 'Account', links: [['Login', '/login'], ['Sign Up', '/signup']] },
          { title: 'Empire', links: [['About', '#'], ['Contact', '#'], ['Discord', '#']] },
        ].map(group => (
          <div key={group.title} className="footer-col">
            <h4 className="footer-col-title">
              {group.title}
            </h4>
            <div className="footer-col-links">
              {group.links.map(([label, to]) => (
                <Link key={label} to={to} className="footer-link">{label}</Link>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="footer-bottom">
        <p>© 2025 AniEmpire. All rights reserved.</p>
        <p>Built for anime fans, by anime fans</p>
      </div>
      <style>{`
        .site-footer {
          border-top: 1px solid var(--border-subtle);
          background: var(--bg-secondary);
          padding: 36px 28px 20px;
          margin-top: 50px;
        }
        .footer-cols {
          display: flex;
          flex-wrap: wrap;
          gap: 36px;
          justify-content: space-between;
          margin-bottom: 28px;
        }
        .footer-brand-col {
          max-width: 250px;
        }
        .footer-logo-area {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }
        .footer-logo-img {
          width: 36px;
          height: 36px;
          object-fit: contain;
          border-radius: 6px;
        }
        .footer-brand-text {
          font-family: var(--font-brand);
          font-size: 1.25rem;
          color: var(--gold);
          font-weight: 700;
          letter-spacing: 0.02em;
        }
        .footer-brand-desc {
          font-size: 0.78rem;
          color: var(--text-muted);
          line-height: 1.7;
        }
        .footer-col-title {
          font-family: var(--font-heading);
          font-size: 0.72rem;
          color: var(--gold-dark);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 12px;
          font-weight: 700;
        }
        .footer-col-links {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .footer-link {
          font-size: 0.8rem;
          color: var(--text-muted);
          transition: color 0.2s;
        }
        .footer-link:hover {
          color: var(--text-primary);
        }
        .footer-bottom {
          border-top: 1px solid var(--border-subtle);
          padding-top: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
          font-size: 0.72rem;
          color: var(--text-muted);
        }

        @media (max-width: 768px) {
          .site-footer {
            padding: 30px 16px 85px; /* Extra padding bottom for mobile navigation bar! */
          }
          .footer-cols {
            flex-direction: column;
            gap: 28px;
          }
          .footer-brand-col {
            max-width: 100%;
          }
          .footer-bottom {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }
        }
      `}</style>
    </footer>
  )
}
