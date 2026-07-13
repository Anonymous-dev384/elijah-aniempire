export default function SkeletonCard({ variant = 'poster' }) {
  const isPoster = variant === 'poster'

  return (
    <div className="skeleton-card">
      {isPoster ? (
        <>
          <div className="skeleton-poster" />
          <div className="skeleton-info">
            <div className="skeleton-line skeleton-title" />
            <div className="skeleton-meta">
              <div className="skeleton-line skeleton-rating" />
              <div className="skeleton-line skeleton-year" />
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="skeleton-thumb" />
          <div className="skeleton-info">
            <div className="skeleton-line skeleton-title" />
            <div className="skeleton-line skeleton-subtitle" />
          </div>
        </>
      )}
    </div>
  )
}
