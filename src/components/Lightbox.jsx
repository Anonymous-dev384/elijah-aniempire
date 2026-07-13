import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { IconChevronLeft, IconChevronRight, IconX, IconRefresh } from './Icons'

// Custom Magnifying Glass Zoom In / Out icons since they aren't in Icons.jsx
function IconZoomIn({ size = 18, ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="11" y1="8" x2="11" y2="14" />
      <line x1="8" y1="11" x2="19" y2="11" />
    </svg>
  )
}

function IconZoomOut({ size = 18, ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  )
}

export default function Lightbox({ isOpen, images = [], initialIndex = 0, onClose }) {
  const [index, setIndex] = useState(initialIndex)
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)

  const imgRef = useRef(null)
  const dragStart = useRef({ x: 0, y: 0 })
  const clickStart = useRef({ x: 0, y: 0, time: 0 })

  // Sync index with initialIndex when lightbox opens
  useEffect(() => {
    if (isOpen) {
      setIndex(initialIndex)
      setScale(1)
      setOffset({ x: 0, y: 0 })
    }
  }, [isOpen, initialIndex])

  // Lock body scroll when open and handle keyboard navigation
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') onClose()
        if (e.key === 'ArrowRight' && images.length > 1) {
          handleNext()
        }
        if (e.key === 'ArrowLeft' && images.length > 1) {
          handlePrev()
        }
        if (e.key === '=' || e.key === '+') {
          e.preventDefault()
          handleZoomIn()
        }
        if (e.key === '-' || e.key === '_') {
          e.preventDefault()
          handleZoomOut()
        }
        if (e.key === '0' || e.key === 'r' || e.key === 'R') {
          e.preventDefault()
          handleResetZoom()
        }
      }
      window.addEventListener('keydown', handleKeyDown)
      return () => {
        document.body.style.overflow = ''
        window.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [isOpen, images.length, index, scale])

  if (!isOpen || !images.length) return null

  const handlePrev = () => {
    setIndex(prev => (prev - 1 + images.length) % images.length)
    setScale(1)
    setOffset({ x: 0, y: 0 })
  }

  const handleNext = () => {
    setIndex(prev => (prev + 1) % images.length)
    setScale(1)
    setOffset({ x: 0, y: 0 })
  }

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.5, 5))
  }

  const handleZoomOut = () => {
    setScale(prev => {
      const next = Math.max(prev - 0.5, 1)
      if (next === 1) setOffset({ x: 0, y: 0 })
      return next
    })
  }

  const handleResetZoom = () => {
    setScale(1)
    setOffset({ x: 0, y: 0 })
  }

  // Handle click-to-zoom / toggle behavior and panning drag
  const handleImageMouseDown = (e) => {
    e.preventDefault()
    // Record starting positions for dragging and clicking
    dragStart.current = { x: e.clientX - offset.x, y: e.clientY - offset.y }
    clickStart.current = { x: e.clientX, y: e.clientY, time: Date.now() }
    setIsDragging(true)
  }

  const handleImageMouseMove = (e) => {
    if (!isDragging) return
    e.preventDefault()
    if (scale > 1) {
      const newX = e.clientX - dragStart.current.x
      const newY = e.clientY - dragStart.current.y
      setOffset({ x: newX, y: newY })
    }
  }

  const handleImageMouseUp = (e) => {
    if (!isDragging) return
    setIsDragging(false)

    // Check if it was a click (small distance and short duration)
    const deltaX = Math.abs(e.clientX - clickStart.current.x)
    const deltaY = Math.abs(e.clientY - clickStart.current.y)
    const duration = Date.now() - clickStart.current.time

    if (deltaX < 5 && deltaY < 5 && duration < 250) {
      // Toggle Zoom: if 1x -> 2.5x, if >1x -> 1x
      if (scale === 1) {
        setScale(2.5)
        // Zoom centered around the click point if possible
        const rect = imgRef.current.getBoundingClientRect()
        const clickX = e.clientX - rect.left - rect.width / 2
        const clickY = e.clientY - rect.top - rect.height / 2
        setOffset({ x: -clickX * 1.5, y: -clickY * 1.5 })
      } else {
        handleResetZoom()
      }
    }
  }

  // Touch Support for Mobile devices
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0]
      dragStart.current = { x: touch.clientX - offset.x, y: touch.clientY - offset.y }
      clickStart.current = { x: touch.clientX, y: touch.clientY, time: Date.now() }
      setIsDragging(true)
    }
  }

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return
    if (scale > 1) {
      const touch = e.touches[0]
      const newX = touch.clientX - dragStart.current.x
      const newY = touch.clientY - dragStart.current.y
      setOffset({ x: newX, y: newY })
    }
  }

  const handleTouchEnd = (e) => {
    if (!isDragging) return
    setIsDragging(false)
    if (e.changedTouches.length === 1) {
      const touch = e.changedTouches[0]
      const deltaX = Math.abs(touch.clientX - clickStart.current.x)
      const deltaY = Math.abs(touch.clientY - clickStart.current.y)
      const duration = Date.now() - clickStart.current.time

      if (deltaX < 5 && deltaY < 5 && duration < 250) {
        if (scale === 1) {
          setScale(2.5)
        } else {
          handleResetZoom()
        }
      }
    }
  }

  // Mouse wheel scroll-to-zoom
  const handleWheel = (e) => {
    const zoomFactor = 0.15
    let nextScale = scale + (e.deltaY < 0 ? zoomFactor : -zoomFactor)
    nextScale = Math.max(1, Math.min(5, nextScale))
    
    if (nextScale === 1) {
      setOffset({ x: 0, y: 0 })
    } else {
      // Zoom centered at cursor position
      const rect = imgRef.current.getBoundingClientRect()
      const cursorX = e.clientX - rect.left - rect.width / 2
      const cursorY = e.clientY - rect.top - rect.height / 2
      const scaleRatio = nextScale / scale
      
      setOffset(prev => ({
        x: cursorX - (cursorX - prev.x) * scaleRatio,
        y: cursorY - (cursorY - prev.y) * scaleRatio
      }))
    }
    setScale(nextScale)
  }

  // Determine cursor styles based on state
  let cursorClass = 'cursor-zoom-in'
  if (scale > 1) {
    cursorClass = isDragging ? 'cursor-grabbing' : 'cursor-grab'
  }

  return createPortal(
    <div className="lightbox-overlay" onClick={onClose}>
      {/* Top Premium Toolbar */}
      <div className="lightbox-toolbar" onClick={e => e.stopPropagation()}>
        <div className="lb-title-sec">
          Image {index + 1} of {images.length}
          {scale > 1 && <span className="lb-scale-badge">{Math.round(scale * 100)}%</span>}
        </div>
        <div className="lb-controls-sec">
          <button className="lb-tool-btn" onClick={handleZoomIn} title="Zoom In (+)">
            <IconZoomIn size={18} />
          </button>
          <button className="lb-tool-btn" onClick={handleZoomOut} disabled={scale === 1} title="Zoom Out (-)">
            <IconZoomOut size={18} />
          </button>
          <button className="lb-tool-btn" onClick={handleResetZoom} disabled={scale === 1} title="Reset Zoom (R)">
            <IconRefresh size={18} />
          </button>
          <button className="lb-tool-btn lb-close-tool" onClick={onClose} title="Close (Esc)">
            <IconX size={18} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="lightbox-viewport" onClick={onClose}>
        <div 
          className="lightbox-content" 
          onClick={e => e.stopPropagation()}
        >
          <img 
            ref={imgRef}
            src={images[index]} 
            alt="Full size" 
            className={`lightbox-img ${cursorClass}`}
            onMouseDown={handleImageMouseDown}
            onMouseMove={handleImageMouseMove}
            onMouseUp={handleImageMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheel}
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
              transition: isDragging ? 'none' : 'transform 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              transformOrigin: 'center center',
            }}
          />
        </div>

        {images.length > 1 && (
          <>
            <button 
              className="lb-nav-btn prev" 
              onClick={(e) => { e.stopPropagation(); handlePrev() }}
              title="Previous Image (ArrowLeft)"
            >
              <IconChevronLeft size={24} />
            </button>
            <button 
              className="lb-nav-btn next" 
              onClick={(e) => { e.stopPropagation(); handleNext() }}
              title="Next Image (ArrowRight)"
            >
              <IconChevronRight size={24} />
            </button>
          </>
        )}
      </div>
    </div>,
    document.body
  )
}
