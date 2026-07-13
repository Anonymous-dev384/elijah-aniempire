import { useState } from 'react'

export default function DetailInfo({ fields = [] }) {
  const [isCollapsed, setIsCollapsed] = useState(true)

  const toggleCollapse = () => {
    setIsCollapsed(prev => !prev)
  }

  return (
    <div className={`detail-info-card ${isCollapsed ? 'is-collapsed' : ''}`}>
      <h3 className="di-heading" onClick={toggleCollapse}>
        <span>Information</span>
        <span className="di-toggle-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </span>
      </h3>
      <div className="di-fields">
        {fields.map((field, i) => (
          field.value ? (
            <div key={i} className="di-field">
              <span className="di-label">{field.label}</span>
              <span className="di-value">{field.value}</span>
            </div>
          ) : null
        ))}
      </div>
    </div>
  )
}

