/**
 * Image Optimization Utilities
 * Handles lazy loading, WebP conversion, and responsive images
 */

export const getOptimizedImageUrl = (imageUrl, width = 300, format = 'webp') => {
  if (!imageUrl) return null
  
  // For external CDNs, append query parameters
  if (imageUrl.includes('cdn.myanimelist.net')) {
    return `${imageUrl}?w=${width}&f=${format}`
  }
  
  if (imageUrl.includes('animethemes.moe') || imageUrl.includes('v.animethemes.moe')) {
    return imageUrl // Already optimized
  }
  
  return imageUrl
}

export const generateSrcSet = (imageUrl, sizes = [300, 600, 900]) => {
  if (!imageUrl) return ''
  return sizes.map(size => `${getOptimizedImageUrl(imageUrl, size)} ${size}w`).join(', ')
}

export const shouldUseWebP = () => {
  if (typeof window === 'undefined') return false
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  return canvas.toDataURL('image/webp').indexOf('webp') === 5
}

export const LazyImage = ({ src, alt, srcSet, sizes, className, ...props }) => {
  const [imageSrc, setImageSrc] = React.useState(null)
  const imgRef = React.useRef(null)

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setImageSrc(src)
            observer.unobserve(entry.target)
          }
        })
      },
      { rootMargin: '50px' }
    )
    if (imgRef.current) observer.observe(imgRef.current)
    return () => observer.disconnect()
  }, [src])

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      srcSet={srcSet}
      sizes={sizes}
      className={className}
      loading="lazy"
      {...props}
    />
  )
}
