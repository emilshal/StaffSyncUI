import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const pickBestMimeType = () => {
  const candidates = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
    'video/mp4',
  ]

  if (typeof MediaRecorder === 'undefined') return ''
  if (typeof MediaRecorder.isTypeSupported !== 'function') return ''

  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) return type
  }
  return ''
}

const getExtensionForMimeType = (mimeType) => {
  const t = (mimeType || '').toLowerCase()
  if (t.includes('mp4')) return 'mp4'
  if (t.includes('webm')) return 'webm'
  return 'webm'
}

export const useVideoRecorder = () => {
  const [permissionError, setPermissionError] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [stream, setStream] = useState(null)
  const [elapsedMs, setElapsedMs] = useState(0)

  const recorderRef = useRef(null)
  const chunksRef = useRef([])
  const startedAtRef = useRef(0)
  const timerRef = useRef(null)

  const supported = useMemo(() => {
    return (
      typeof navigator !== 'undefined' &&
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function' &&
      typeof MediaRecorder !== 'undefined'
    )
  }, [])

  const stopTimer = () => {
    if (timerRef.current) window.clearInterval(timerRef.current)
    timerRef.current = null
  }

  const cleanupStream = useCallback(() => {
    if (!stream) return
    stream.getTracks().forEach((t) => t.stop())
    setStream(null)
  }, [stream])

  useEffect(() => {
    return () => {
      stopTimer()
      cleanupStream()
    }
  }, [cleanupStream])

  const start = useCallback(async () => {
    setPermissionError('')
    if (!supported) {
      setPermissionError('Recording is not supported in this browser.')
      return { ok: false, error: 'unsupported' }
    }

    try {
      const nextStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: true,
      })
      setStream(nextStream)

      const mimeType = pickBestMimeType()
      const recorder = new MediaRecorder(nextStream, mimeType ? { mimeType } : undefined)

      chunksRef.current = []
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) chunksRef.current.push(event.data)
      }

      recorderRef.current = recorder
      startedAtRef.current = Date.now()
      setElapsedMs(0)
      stopTimer()
      timerRef.current = window.setInterval(() => {
        setElapsedMs(Date.now() - startedAtRef.current)
      }, 250)

      recorder.start()
      setIsRecording(true)
      return { ok: true }
    } catch (err) {
      const msg =
        err?.name === 'NotAllowedError'
          ? 'Camera/microphone permission denied.'
          : err?.name === 'NotFoundError'
            ? 'No camera/microphone found.'
            : 'Could not start recording.'
      setPermissionError(msg)
      return { ok: false, error: msg }
    }
  }, [supported])

  const stop = useCallback(async () => {
    const recorder = recorderRef.current
    if (!recorder || !isRecording) return { ok: false, error: 'not-recording' }

    const stopped = new Promise((resolve) => {
      recorder.onstop = () => resolve(true)
    })

    try {
      recorder.stop()
      await stopped
    } finally {
      stopTimer()
      setIsRecording(false)
      cleanupStream()
      recorderRef.current = null
    }

    const mimeType = recorder.mimeType || pickBestMimeType() || 'video/webm'
    const blob = new Blob(chunksRef.current, { type: mimeType })
    chunksRef.current = []

    const ext = getExtensionForMimeType(mimeType)
    const filename = `sop-recording-${new Date().toISOString().replaceAll(':', '-')}.${ext}`
    const file = new File([blob], filename, { type: mimeType })

    return { ok: true, file, mimeType, durationMs: elapsedMs }
  }, [cleanupStream, elapsedMs, isRecording])

  const cancel = useCallback(() => {
    const recorder = recorderRef.current
    try {
      if (recorder && recorder.state !== 'inactive') recorder.stop()
    } catch {
      // ignore
    }
    chunksRef.current = []
    stopTimer()
    setIsRecording(false)
    cleanupStream()
    recorderRef.current = null
    setElapsedMs(0)
  }, [cleanupStream])

  return {
    supported,
    isRecording,
    stream,
    elapsedMs,
    permissionError,
    start,
    stop,
    cancel,
  }
}

