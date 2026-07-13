import { Link } from 'react-router-dom'
import { IconChevron } from './Icons'

export default function SectionHeader({ title, subtitle, icon, linkTo, linkLabel = 'View All' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18 }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {icon && <span style={{ flexShrink: 0 }}>{icon}</span>}
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            {title}
          </h2>
          <div style={{ width: 30, height: 2, background: 'linear-gradient(to right, var(--gold-dark), transparent)', borderRadius: 2 }} />
        </div>
        {subtitle && <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 3, paddingLeft: icon ? 28 : 0 }}>{subtitle}</p>}
      </div>
      {linkTo && (
        <Link to={linkTo} className="section-view-all">
          {linkLabel} <IconChevron size={14} />
        </Link>
      )}
      <style>{`
        .section-view-all {
          display: flex; align-items: center; gap: 2px;
          font-size: 0.75rem; color: var(--gold); font-weight: 600;
          opacity: 0.8; transition: all 0.2s ease; white-space: nowrap;
        }
        .section-view-all:hover { opacity: 1; gap: 5px; }
      `}</style>
    </div>
  )
}
