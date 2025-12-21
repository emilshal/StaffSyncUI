import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { loadDemoSops, saveDemoSops } from '../../lib/demoStore'
import { updateDemoRequest } from '../../lib/demoRequestsStore'
import { ACTION_TYPES } from '../../lib/events/eventContract'
import { sendEventToMake } from '../../lib/api/makeWebhook'
import { uploadMediaToCloudinary } from '../../lib/uploads/cloudinary'
import { debugLog, debugWarn } from '../../lib/debug'
import { useVideoRecorder } from '../../lib/recording/useVideoRecorder'

const categories = ['Front Desk', 'Housekeeping', 'Food & Beverage', 'Maintenance', 'Safety', 'Other']

const formatDuration = (seconds) => {
  if (!Number.isFinite(seconds) || seconds <= 0) return '—'
  const total = Math.round(seconds)
  const mins = Math.floor(total / 60)
  const secs = total % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const CreateSOPPage = () => {
  const [searchParams] = useSearchParams()
  const [taskName, setTaskName] = useState('')
  const [category, setCategory] = useState(categories[0])
  const [videoFile, setVideoFile] = useState(null)
  const [videoDuration, setVideoDuration] = useState('—')
  const [status, setStatus] = useState('idle') // idle | uploading | creating | processing | ready | error
  const [error, setError] = useState('')
  const [showRecorder, setShowRecorder] = useState(false)
  const uploadInputRef = useRef(null)
  const captureInputRef = useRef(null)
  const recorder = useVideoRecorder()

  useEffect(() => {
    const title = searchParams.get('title')
    if (title && !taskName) setTaskName(title)
  }, [searchParams, taskName])

  useEffect(() => {
    if (!videoFile) {
      setVideoDuration('—')
      return
    }

    let canceled = false
    const url = URL.createObjectURL(videoFile)
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.src = url

    const onLoaded = () => {
      if (canceled) return
      setVideoDuration(formatDuration(video.duration))
      URL.revokeObjectURL(url)
    }
    const onError = () => {
      if (canceled) return
      setVideoDuration('—')
      URL.revokeObjectURL(url)
    }

    video.addEventListener('loadedmetadata', onLoaded)
    video.addEventListener('error', onError)

    return () => {
      canceled = true
      video.removeEventListener('loadedmetadata', onLoaded)
      video.removeEventListener('error', onError)
      URL.revokeObjectURL(url)
    }
  }, [videoFile])

  const isBusy = useMemo(() => status !== 'idle' && status !== 'ready' && status !== 'error', [status])
  const canInteract = useMemo(() => !isBusy, [isBusy])

  const formattedElapsed = useMemo(() => {
    const totalSeconds = Math.floor((recorder.elapsedMs || 0) / 1000)
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }, [recorder.elapsedMs])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!taskName.trim() || !category || !videoFile) {
      setError('Task name, category, and video are required.')
      return
    }

    try {
      const sourceRequestId = searchParams.get('requestId')
      const hasMake = Boolean(import.meta.env.VITE_MAKE_WEBHOOK_URL)
      const hasCloudinary = Boolean(import.meta.env.VITE_CLOUDINARY_CLOUD_NAME && import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET)

      debugLog('Create SOP submit', { hasMake, hasCloudinary, taskName: taskName.trim(), category })

      if (!hasMake || !hasCloudinary) {
        const next = loadDemoSops()
        const id = `rec-demo-${Date.now()}`
        const url = URL.createObjectURL(videoFile)
        saveDemoSops([
          {
            id,
            taskName: taskName.trim(),
            category,
            duration: videoDuration,
            poster: '/sop-posters/default.svg',
            video: { url },
            steps: {
              en: 'Demo steps will appear here.\n(Connect Airtable to enable AI steps)',
              it: 'Passi demo qui.\n(Collega Airtable per abilitare i passi AI)',
              es: 'Pasos de demo aquí.\n(Conecta Airtable para habilitar pasos AI)',
            },
          },
          ...next,
        ])
        if (sourceRequestId) updateDemoRequest(sourceRequestId, { status: 'done' })
        setStatus('ready')
        return
      }

      setStatus('uploading')
      debugLog('Create SOP upload start', { name: videoFile.name, type: videoFile.type, bytes: videoFile.size })
      const uploaded = await uploadMediaToCloudinary(videoFile)
      if (!uploaded?.url) throw new Error('Could not upload video.')

      setStatus('creating')
      const response = await sendEventToMake({
        actionType: ACTION_TYPES.SOP_CREATE,
        payload: {
          taskName: taskName.trim(),
          category,
          sourceRequestId: sourceRequestId || '',
          video: {
            provider: 'cloudinary',
            url: uploaded.url,
            publicId: uploaded.publicId,
            durationSeconds: uploaded.durationSeconds,
            mimeType: uploaded.mimeType,
            originalFilename: uploaded.originalFilename,
          },
        },
        meta: { source: 'web' },
      })

      const makeSopId = response?.data?.sopId || response?.data?.recordId || response?.data?.sop?.id || ''

      const next = loadDemoSops()
      const id = makeSopId || `rec-demo-${Date.now()}`
      saveDemoSops([
        {
          id,
          taskName: taskName.trim(),
          category,
          duration: videoDuration,
          poster: '/sop-posters/default.svg',
          video: { url: uploaded.url },
          steps: { en: '', it: '', es: '' },
        },
        ...next,
      ])

      if (sourceRequestId) updateDemoRequest(sourceRequestId, { status: 'done' })
      setStatus('ready')
    } catch (err) {
      const message = err?.message || 'Unable to create SOP right now.'
      debugWarn('Create SOP failed', err)
      setError(message)
      setStatus('error')
    }
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 sm:py-12">
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-3">
          <Link
            to="/manager"
            aria-label="Back to Command Center"
            className="mt-1 flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-xl font-semibold text-slate-800 shadow-card transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            {'<'}
          </Link>
          <div className="space-y-1">
            <h1 className="font-display text-4xl font-semibold tracking-tight text-slate-900 dark:text-slate-50 sm:text-5xl">
              Create SOP
            </h1>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="glass flex flex-col gap-4 rounded-3xl border border-slate-200/80 p-5 shadow-card dark:border-slate-700"
      >
        <div className="space-y-1.5">
          <label className="text-base font-semibold text-slate-900 dark:text-slate-200">Task name</label>
          <input
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-base font-medium text-slate-900 outline-none ring-0 transition placeholder:text-slate-400 focus:border-slate-400 focus:shadow-card dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:border-slate-500"
            placeholder="e.g. Close out bar shift"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-base font-semibold text-slate-900 dark:text-slate-200">Category</label>
          <Dropdown
            value={category}
            options={categories}
            onChange={setCategory}
            buttonClassName="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-left text-base font-medium text-slate-900 outline-none transition hover:border-slate-300 focus:border-slate-400 focus:shadow-card dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-slate-500 dark:focus:border-slate-500"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-base font-semibold text-slate-900 dark:text-slate-200">Video upload</label>
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-5 text-base text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={!canInteract}
                  onClick={() => uploadInputRef.current?.click()}
                  className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-card transition hover:-translate-y-0.5 hover:shadow-lg disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-sky-500 dark:text-slate-950"
                >
                  Choose file
                </button>
                <button
                  type="button"
                  disabled={!canInteract}
                  onClick={async () => {
                    if (recorder.supported) {
                      setShowRecorder(true)
                      const result = await recorder.start()
                      if (!result.ok) setShowRecorder(true)
                      return
                    }
                    captureInputRef.current?.click()
                  }}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-card transition hover:-translate-y-0.5 hover:shadow-lg disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                >
                  Record video
                </button>
                {videoFile ? (
                  <button
                    type="button"
                    disabled={!canInteract}
                    onClick={() => setVideoFile(null)}
                    className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:border-red-300 disabled:cursor-not-allowed disabled:opacity-70 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200"
                  >
                    Remove
                  </button>
                ) : null}
              </div>
              {videoFile ? (
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {videoFile.name}
                </span>
              ) : null}
            </div>

            <input
              ref={uploadInputRef}
              type="file"
              accept="video/*"
              onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
              className="hidden"
            />

            <input
              ref={captureInputRef}
              type="file"
              accept="video/*"
              capture="environment"
              onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
              className="hidden"
            />

            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Upload from your phone or laptop. File is saved to Cloudinary.
            </p>
            {videoFile ? (
              <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                Duration: {videoDuration}
              </p>
            ) : null}

            {showRecorder ? (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex h-2.5 w-2.5 rounded-full ${
                        recorder.isRecording ? 'bg-red-500' : 'bg-slate-400'
                      }`}
                    />
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      {recorder.isRecording ? `Recording… ${formattedElapsed}` : 'Recorder'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {recorder.isRecording ? (
                      <button
                        type="button"
                        disabled={!canInteract}
                        onClick={async () => {
                          const result = await recorder.stop()
                          if (result.ok && result.file) {
                            setVideoFile(result.file)
                            setShowRecorder(false)
                          }
                        }}
                        className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-card transition hover:-translate-y-0.5 hover:shadow-lg disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        Stop
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={!canInteract}
                        onClick={async () => {
                          const result = await recorder.start()
                          if (!result.ok) setShowRecorder(true)
                        }}
                        className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-card transition hover:-translate-y-0.5 hover:shadow-lg disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-sky-500 dark:text-slate-950"
                      >
                        Start
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={!canInteract}
                      onClick={() => {
                        recorder.cancel()
                        setShowRecorder(false)
                      }}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                    >
                      Close
                    </button>
                  </div>
                </div>
                {recorder.permissionError ? (
                  <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200">
                    {recorder.permissionError}
                  </div>
                ) : null}
                {recorder.stream ? (
                  <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-black dark:border-slate-700">
                    <video
                      autoPlay
                      playsInline
                      muted
                      ref={(node) => {
                        if (!node) return
                        if (node.srcObject !== recorder.stream) node.srcObject = recorder.stream
                      }}
                      className="aspect-video w-full"
                    />
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isBusy}
          className="inline-flex items-center justify-center rounded-full bg-sky-600 px-5 py-3 text-base font-semibold text-white shadow-card transition hover:translate-y-[-1px] hover:shadow-lg disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-sky-500 dark:text-slate-950"
        >
          {isBusy ? 'Processing SOP…' : 'Create SOP'}
        </button>
      </form>
    </div>
  )
}

export default CreateSOPPage

const Dropdown = ({ value, options, onChange, buttonClassName = '' }) => {
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event) => {
      if (!containerRef.current) return
      if (!containerRef.current.contains(event.target)) setOpen(false)
    }
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex items-center justify-between gap-3 ${buttonClassName}`}
      >
        <span className="truncate">{value}</span>
        <span className="text-slate-500 dark:text-slate-300">▾</span>
      </button>

      {open ? (
        <div
          role="listbox"
          className="absolute left-0 right-0 z-30 mt-2 max-h-64 overflow-auto rounded-2xl border border-slate-200 bg-white p-1 shadow-card dark:border-slate-700 dark:bg-slate-900"
        >
          {options.map((option) => {
            const active = option === value
            return (
              <button
                key={option}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  onChange(option)
                  setOpen(false)
                }}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-semibold transition ${
                  active
                    ? 'bg-sky-500 text-slate-950'
                    : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                <span className="truncate">{option}</span>
                {active ? <span aria-hidden className="text-slate-950">✓</span> : null}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
