import React, { lazy, Suspense } from 'react'
import { useParams } from 'react-router-dom'

const AnimeDetailPage = lazy(() => import('./AnimeDetailPage'))
const MangaDetailPage = lazy(() => import('./MangaDetailPage'))
const MusicDetailPage = lazy(() => import('./MusicDetailPage'))
const CharacterPage = lazy(() => import('./CharacterPage'))
const PersonPage = lazy(() => import('./PersonPage'))
const ProducerPage = lazy(() => import('./ProducerPage'))
const ArtistPage = lazy(() => import('./ArtistPage'))

const componentMap = {
  anime: AnimeDetailPage,
  manga: MangaDetailPage,
  music: MusicDetailPage,
  character: CharacterPage,
  person: PersonPage,
  producer: ProducerPage,
  artist: ArtistPage,
}

function LoadingFallback() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'var(--bg-primary)'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div className="skeleton-pulse" style={{
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          margin: '0 auto 20px',
          background: 'var(--bg-card)'
        }} />
        <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
      </div>
    </div>
  )
}

export default function DynamicDetailPage() {
  const { type } = useParams()
  const Component = componentMap[type]

  if (!Component) {
    return <div>Page not found</div>
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Component />
    </Suspense>
  )
}
