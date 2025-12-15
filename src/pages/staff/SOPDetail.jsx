import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { QRCodeCanvas } from 'qrcode.react'
import { loadDemoSops, subscribeDemoSops } from '../../lib/demoStore'
import FeedbackModal from '../../components/shared/FeedbackModal'
import { addDemoRequest } from '../../lib/demoRequestsStore'

const languages = [
  { code: 'en', label: 'English' },
  { code: 'it', label: 'Italiano' },
  { code: 'es', label: 'Español' },
]

const SOPDetail = ({ backTo = '/staff' }) => {
  const { recordId } = useParams()
  const [sops, setSops] = useState(loadDemoSops)
  const [showFeedback, setShowFeedback] = useState(false)
  const [toast, setToast] = useState('')
  useEffect(() => {
    const unsubscribe = subscribeDemoSops(() => setSops(loadDemoSops()))
    return unsubscribe
  }, [])

  const record = useMemo(() => sops.find((item) => item.id === recordId) || null, [sops, recordId])
  const [language, setLanguage] = useState('en')
  const stepsToShow = useMemo(() => record?.steps?.[language] || '', [record, language])
  const qrValue = `${window.location.origin}/staff/sop/${recordId}`

  if (!record) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 text-base text-slate-700 shadow-card dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
          SOP not found in demo data.
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 pb-32 sm:py-12">
      <div className="flex items-center gap-3">
        <Link
          to={backTo}
          aria-label="Back to SOPs"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-lg font-semibold text-slate-800 shadow-card transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
        >
          {'<'}
        </Link>
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">
            SOP detail
          </p>
          <h1 className="font-display text-3xl leading-tight text-slate-950 dark:text-slate-50 sm:text-4xl">
            {record.taskName}
          </h1>
          <div className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            {record.category}
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-900">
          {record.video?.url ? (
            <video
              src={record.video.url}
              poster={record.poster}
              autoPlay
              loop
              muted
              playsInline
              controls
              preload="metadata"
              className="aspect-video w-full rounded-2xl border border-slate-100 bg-slate-100 object-cover dark:border-slate-800 dark:bg-slate-800/80"
            />
          ) : (
            <div className="flex aspect-video items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-base text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              No video attached to this SOP.
            </div>
          )}
          <div className="mt-4 flex items-center justify-between gap-3">
            <label className="text-base font-semibold text-slate-800 dark:text-slate-200">Language</label>
            <LanguageDropdown value={language} onChange={setLanguage} />
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
            {stepsToShow ? (
              <ol className="space-y-3 text-[18px] text-slate-800 dark:text-slate-100">
                {stepsToShow
                  .split('\n')
                  .map((line) => line.trim())
                  .filter(Boolean)
                  .map((line, idx) => (
                    <li key={`${idx}-${line.slice(0, 8)}`} className="flex gap-3">
                      <span className="mt-0.5 grid h-6 w-6 place-items-center rounded-full bg-slate-900 text-xs font-semibold text-white dark:bg-sky-500 dark:text-slate-950">
                        {idx + 1}
                      </span>
                      <span className="leading-7">{line}</span>
                    </li>
                  ))}
              </ol>
            ) : (
              <p className="text-[18px] text-slate-500 dark:text-slate-300">Waiting for AI-generated steps in Airtable…</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-card dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-300">QR deep link</p>
            <p className="mt-2 text-base text-slate-600 dark:text-slate-300">
              Scan to open this SOP on any device. Link is also saved in Airtable.
            </p>
            <div className="mt-4 flex flex-col items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
              <QRCodeCanvas value={qrValue} size={164} includeMargin />
              <p className="break-all text-center text-xs text-slate-600 dark:text-slate-300">{qrValue}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowFeedback(true)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-semibold text-slate-900 shadow-card transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:text-slate-50 dark:hover:bg-slate-800"
          >
            Report Issue
          </button>

        </div>
      </div>

      <FeedbackModal
        open={showFeedback}
        title={record.taskName}
        onClose={() => setShowFeedback(false)}
        onSubmit={(message) => {
          addDemoRequest({
            kind: 'feedback',
            sopId: record.id,
            sopTitle: record.taskName,
            categoryHint: record.category || '',
            message,
            text: message,
          })
          setToast('Feedback sent')
          setTimeout(() => setToast(''), 2500)
        }}
      />

      {toast ? (
        <div className="fixed bottom-20 left-0 right-0 mx-auto w-fit rounded-full bg-slate-900 px-4 py-2 text-base font-semibold text-white shadow-card dark:bg-slate-800">
          {toast}
        </div>
      ) : null}
    </div>
  )
}

export default SOPDetail

const LanguageDropdown = ({ value, onChange }) => {
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event) => {
      if (!containerRef.current) return
      if (!containerRef.current.contains(event.target)) {
        setOpen(false)
      }
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

  const selected = languages.find((lang) => lang.code === value) || languages[0]

  return (
    <div ref={containerRef} className="relative w-44">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-card transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-slate-500"
      >
        <span>{selected.label}</span>
        <span className="text-slate-500 dark:text-slate-300">▾</span>
      </button>

      {open ? (
        <div
          role="listbox"
          className="absolute right-0 z-30 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 shadow-card dark:border-slate-700 dark:bg-slate-900"
        >
          {languages.map((lang) => {
            const active = lang.code === value
            return (
              <button
                key={lang.code}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  onChange(lang.code)
                  setOpen(false)
                }}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-semibold transition ${
                  active
                    ? 'bg-sky-500 text-slate-950'
                    : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                <span>{lang.label}</span>
                {active ? <span aria-hidden className="text-slate-950">✓</span> : null}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
