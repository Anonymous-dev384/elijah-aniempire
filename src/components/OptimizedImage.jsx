import React, { useState, useEffect, useRef } from 'react'
import { getOptimizedImageUrl } from '../lib/imageOptimizer'

export default function OptimizedImage({ 
  src, 
  alt, 
  className,
  width,
  height,
  placeholder = true,
  onLoad,
  ...props 
}) {
  const [imageSrc, setImageSrc] = useState(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const imgRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const optimizedUrl = getOptimizedImageUrl(src, width)
            setImageSrc(optimizedUrl)
            observer.unobserve(entry.target)
          }
        })
      },
      { rootMargin: '100px' }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current)
      }
    }
  }, [src, width])

  const handleLoad = () => {
    setIsLoaded(true)
    onLoad?.()
  }

  const handleError = () => {
    setHasError(true)
  }

  return (
    <div className="optimized-image-wrapper" style={{ position: 'relative' }}>
      {placeholder && !isLoaded && (
        <div 
          className="image-placeholder skeleton-pulse" 
          style={{
            width,
            height,
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
          }}
        />
      )}
      {!hasError ? (
        <img
          ref={imgRef}
          src={imageSrc}
          alt={alt}
          width={width}
          height={height}
          className={`${className} ${isLoaded ? 'loaded' : ''}`}
          loading="lazy"
          onLoad={handleLoad}
          onError={handleError}
          style={{
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease',
          }}
          {...props}
        />
      ) : (
        <div 
          style={{
            width,
            height,
            background: 'var(--bg-surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Image Failed</span>
        </div>
      )}
    </div>
  )
}
