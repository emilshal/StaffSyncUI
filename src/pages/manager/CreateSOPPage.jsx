import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { createSOP, ensureQrLinkOnRecord, pollSOPForSteps, uploadAttachment } from '../../lib/airtable'
import { loadDemoSops, saveDemoSops } from '../../lib/demoStore'
import { updateDemoRequest } from '../../lib/demoRequestsStore'

const categories = ['Front Desk', 'Housekeeping', 'Food & Beverage', 'Maintenance', 'Safety', 'Other']

const CreateSOPPage = () => {
  const [searchParams] = useSearchParams()
  const [taskName, setTaskName] = useState('')
  const [category, setCategory] = useState(categories[0])
  const [videoFile, setVideoFile] = useState(null)
  const [status, setStatus] = useState('idle') // idle | uploading | creating | processing | ready | error
  const [error, setError] = useState('')

  useEffect(() => {
    const title = searchParams.get('title')
    if (title && !taskName) setTaskName(title)
  }, [searchParams, taskName])

  const isBusy = useMemo(() => status !== 'idle' && status !== 'ready' && status !== 'error', [status])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!taskName.trim() || !category || !videoFile) {
      setError('Task name, category, and video are required.')
      return
    }

    try {
      const requestId = searchParams.get('requestId')
      if (!import.meta.env.VITE_AIRTABLE_API_KEY || !import.meta.env.VITE_AIRTABLE_BASE_ID) {
        const next = loadDemoSops()
        const id = `rec-demo-${Date.now()}`
        const url = URL.createObjectURL(videoFile)
        saveDemoSops([
          {
            id,
            taskName: taskName.trim(),
            category,
            video: { url },
            steps: {
              en: 'Demo steps will appear here.\n(Connect Airtable to enable AI steps)',
              it: 'Passi demo qui.\n(Collega Airtable per abilitare i passi AI)',
              es: 'Pasos de demo aquí.\n(Conecta Airtable para habilitar pasos AI)',
            },
          },
          ...next,
        ])
        if (requestId) updateDemoRequest(requestId, { status: 'done' })
        setStatus('ready')
        return
      }

      setStatus('uploading')
      const attachment = await uploadAttachment(videoFile)
      if (!attachment?.id) throw new Error('Could not upload video to Airtable.')

      setStatus('creating')
      const record = await createSOP({
        taskName: taskName.trim(),
        category,
        attachmentId: attachment.id,
      })

      await ensureQrLinkOnRecord(record.id, record.qrLink)

      setStatus('processing')
      await pollSOPForSteps(record.id, { interval: 5000, timeout: 240000 })

      if (requestId) updateDemoRequest(requestId, { status: 'done' })
      setStatus('ready')
    } catch (err) {
      setError(err.message || 'Unable to create SOP right now.')
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
            <input
              type="file"
              accept="video/*"
              onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
              className="w-full text-base file:mr-4 file:rounded-full file:border-0 file:bg-sky-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white dark:file:bg-sky-500 dark:file:text-slate-950"
            />
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Upload from your phone or laptop. File is saved directly to Airtable.
            </p>
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
