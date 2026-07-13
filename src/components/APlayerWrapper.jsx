import { useState, useRef, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react'
import { useMusic } from '../context/MusicContext'

/**
 * A custom, lightweight Audio Player UI that uses the Global Audio Engine from MusicContext.
 * Features a high-performance draggable timeline with side-by-side time display.
 */
const APlayerWrapper = forwardRef(({ audio, autoplay, onPlay, onPause, onEnded }, ref) => {
  const { 
    isPlaying, 
    setIsPlaying, 
    audioCurrentTime, 
    audioDuration, 
    audioProgress,
    isAudioLoading,
    seekAudio
  } = useMusic()

  const timelineRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragProgress, setDragProgress] = useState(0)
  const [displayTime, setDisplayTime] = useState(0)

  // Sync display time with actual time when not dragging
  useEffect(() => {
    if (!isDragging) {
      setDisplayTime(audioCurrentTime)
    }
  }, [audioCurrentTime, isDragging])

  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds < 0) return '00:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getProgressFromEvent = (e) => {
    if (!timelineRef.current) return 0
    const rect = timelineRef.current.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width))
    return x / rect.width
  }

  const handleStart = (e) => {
    e.preventDefault(); // Prevent text selection/dragging
    setIsDragging(true)
    const progress = getProgressFromEvent(e)
    setDragProgress(progress * 100)
    if (audioDuration) setDisplayTime(progress * audioDuration)
  }

  const handleMove = useCallback((e) => {
    if (!isDragging) return
    const progress = getProgressFromEvent(e)
    setDragProgress(progress * 100)
    if (audioDuration) setDisplayTime(progress * audioDuration)
  }, [isDragging, audioDuration])

  const handleEnd = useCallback((e) => {
    if (!isDragging) return
    const progress = getProgressFromEvent(e)
    const newTime = progress * audioDuration
    
    if (audioDuration) {
      seekAudio(newTime)
      
      // The global sync engine in MusicContext will handle resuming playback
      // if isPlaying is true. No need to force it here.
    }
    setIsDragging(false)
  }, [isDragging, audioDuration, seekAudio, isPlaying])

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMove, { passive: true })
      window.addEventListener('mouseup', handleEnd)
      window.addEventListener('touchmove', handleMove, { passive: true })
      window.addEventListener('touchend', handleEnd)
    } else {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleEnd)
      window.removeEventListener('touchmove', handleMove)
      window.removeEventListener('touchend', handleEnd)
    }
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleEnd)
      window.removeEventListener('touchmove', handleMove)
      window.removeEventListener('touchend', handleEnd)
    }
  }, [isDragging, handleMove, handleEnd])

  // Mimic the APlayer API for parent components
  useImperativeHandle(ref, () => ({
    play: () => setIsPlaying(true),
    pause: () => setIsPlaying(false),
    toggle: () => setIsPlaying(!isPlaying),
    seek: (time) => seekAudio(time),
    replay: () => {
        seekAudio(0);
        setIsPlaying(true);
    }
  }))

  const finalProgress = isDragging ? dragProgress : audioProgress

  return (
    <div className="custom-audio-player">
      <div className="custom-player-controls-row">
        <div 
          ref={timelineRef}
          className="custom-player-timeline" 
          onMouseDown={handleStart}
          onTouchStart={handleStart}
        >
          <div className="custom-player-bar">
            <div 
              className="custom-player-progress" 
              style={{ width: `${finalProgress}%` }}
            />
            <div 
              className="custom-player-thumb"
              style={{ left: `${finalProgress}%` }}
            />
          </div>
        </div>
        
        <div className="custom-player-time">
          <span className="current-time">{formatTime(displayTime)}</span>
          <span className="divider">/</span>
          <span className="total-time">{formatTime(audioDuration)}</span>
        </div>
      </div>
    </div>
  )
})

export default APlayerWrapper
