import { useEffect, useState } from 'react'

const thumbnailCache = new Map()

const captureFrame = async (src) => {
  const cached = thumbnailCache.get(src)
  if (cached) return cached

  const video = document.createElement('video')
  video.muted = true
  video.playsInline = true
  video.preload = 'metadata'
  video.src = src

  const cleanup = () => {
    video.removeAttribute('src')
    video.load()
  }

  try {
    await new Promise((resolve, reject) => {
      const onLoadedMeta = () => resolve()
      const onError = () => reject(new Error('Failed to load video metadata'))
      video.addEventListener('loadedmetadata', onLoadedMeta, { once: true })
      video.addEventListener('error', onError, { once: true })
    })

    const seekTo = Number.isFinite(video.duration) && video.duration > 0 ? Math.min(1, video.duration * 0.1) : 0

    await new Promise((resolve, reject) => {
      const onSeeked = () => resolve()
      const onError = () => reject(new Error('Failed to seek video'))
      video.addEventListener('seeked', onSeeked, { once: true })
      video.addEventListener('error', onError, { once: true })
      video.currentTime = seekTo
    })

    const canvas = document.createElement('canvas')
    const width = video.videoWidth || 1280
    const height = video.videoHeight || 720
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('No canvas context')
    ctx.drawImage(video, 0, 0, width, height)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.78)
    thumbnailCache.set(src, dataUrl)
    return dataUrl
  } finally {
    cleanup()
  }
}

const VideoThumbnail = ({ src, alt, className = '', fallbackSrc = '/sop-posters/default.svg' }) => {
  const [thumb, setThumb] = useState(() => (src ? thumbnailCache.get(src) || '' : ''))

  useEffect(() => {
    if (!src) {
      setThumb('')
      return
    }

    let canceled = false
    const run = () => {
      captureFrame(src)
        .then((dataUrl) => {
          if (canceled) return
          setThumb(dataUrl)
        })
        .catch(() => {
          if (canceled) return
          setThumb('')
        })
    }

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      window.requestIdleCallback(run, { timeout: 1200 })
    } else {
      setTimeout(run, 0)
    }

    return () => {
      canceled = true
    }
  }, [src])

  return <img src={thumb || fallbackSrc} alt={alt} loading="lazy" className={className} />
}

export default VideoThumbnail

