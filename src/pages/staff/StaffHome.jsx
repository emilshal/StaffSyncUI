import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ProblemReportModal from '../../components/shared/ProblemReportModal'
import RequestGuideModal from '../../components/shared/RequestGuideModal'
import VideoThumbnail from '../../components/shared/VideoThumbnail'
import { loadDemoSops, subscribeDemoSops } from '../../lib/demoStore'
import { addDemoRequest } from '../../lib/demoRequestsStore'
import { createProblemReport, uploadAttachment } from '../../lib/airtable'

const StaffHome = () => {
  const [sops, setSops] = useState(loadDemoSops)
  const [showProblemModal, setShowProblemModal] = useState(false)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [submittingProblem, setSubmittingProblem] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedCategories, setSelectedCategories] = useState([])
  const [toast, setToast] = useState('')

  useEffect(() => {
    const unsubscribe = subscribeDemoSops(() => setSops(loadDemoSops()))
    return unsubscribe
  }, [])

  const categories = useMemo(() => {
    const set = new Set()
    sops.forEach((sop) => set.add(sop.category || 'Uncategorized'))
    return Array.from(set).sort()
  }, [sops])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return sops.filter((sop) => {
      const sopCategory = sop.category || 'Uncategorized'
      const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(sopCategory)
      const matchesQuery =
        !q ||
        (sop.taskName || '').toLowerCase().includes(q) ||
        (sop.category || '').toLowerCase().includes(q)
      return matchesCategory && matchesQuery
    })
  }, [sops, query, selectedCategories])

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }, [])

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 pb-28 sm:py-12">
      <section className="space-y-4">
        <div className="space-y-1">
          <p className="text-base font-semibold text-slate-600 dark:text-slate-300">{greeting}</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            SOP Library
          </h1>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search SOPs…"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-medium text-slate-900 shadow-card outline-none transition focus:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-600"
            />
          </div>
          <div className="text-sm font-semibold text-slate-500 dark:text-slate-300">
            {filtered.length} results
          </div>
        </div>

        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 hide-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedCategories([])}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-base font-semibold transition ${
              selectedCategories.length
                ? 'border border-sky-200 bg-sky-100 text-sky-900 shadow-card dark:border-sky-500/30 dark:bg-sky-500/15 dark:text-sky-200'
                : 'border border-sky-200 bg-sky-100 text-sky-900 shadow-card dark:border-sky-500/30 dark:bg-sky-500/15 dark:text-sky-200'
            }`}
          >
            {selectedCategories.length ? 'Clear' : 'All'}
          </button>
          {categories.map((cat) => {
            const selected = selectedCategories.includes(cat)
            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setSelectedCategories((prev) => {
                    if (prev.includes(cat)) return prev.filter((c) => c !== cat)
                    return [...prev, cat]
                  })
                }}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-base font-semibold transition ${
                  selected
                    ? 'border border-sky-200 bg-sky-100 text-sky-900 shadow-card dark:border-sky-500/30 dark:bg-sky-500/15 dark:text-sky-200'
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                {cat}
              </button>
            )
          })}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowRequestModal(true)}
            className="rounded-full bg-sky-600 px-5 py-3 text-base font-semibold text-white shadow-card transition hover:-translate-y-0.5 hover:shadow-lg dark:bg-sky-500 dark:text-slate-950"
          >
            Request a Guide
          </button>
          <button
            type="button"
            onClick={() => setShowProblemModal(true)}
            className="rounded-full bg-sky-600 px-5 py-3 text-base font-semibold text-white shadow-card transition hover:-translate-y-0.5 hover:shadow-lg dark:bg-sky-500 dark:text-slate-950"
          >
            I have a problem
          </button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((record) => (
          <Link
            key={record.id}
            to={`/staff/sop/${record.id}`}
            className="group flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="relative overflow-hidden rounded-xl border border-slate-100 bg-slate-100 dark:border-slate-800 dark:bg-slate-800/80">
              <VideoThumbnail
                src={record.video?.url || ''}
                fallbackSrc={record.poster || '/sop-posters/default.svg'}
                alt={record.taskName}
                className="h-52 w-full object-cover"
              />
              {record.video?.url ? (
                <span className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-950/70 text-sm font-semibold text-white backdrop-blur dark:bg-slate-900/70">
                  ▶
                </span>
              ) : null}
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{record.taskName}</h2>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-300">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {record.category}
                </span>
                <span className="text-xs">•</span>
                <span className="text-xs">{record.duration || '—'}</span>
              </div>
            </div>
          </Link>
        ))}
      </section>

      <ProblemReportModal
        open={showProblemModal}
        onClose={() => setShowProblemModal(false)}
        submitting={submittingProblem}
        onSubmit={async ({ note, category, locationName, media, reset }) => {
          setSubmittingProblem(true)
          try {
            if (import.meta.env.VITE_AIRTABLE_API_KEY && import.meta.env.VITE_AIRTABLE_BASE_ID) {
              const attachment = media ? await uploadAttachment(media) : null
              await createProblemReport({
                mediaAttachmentId: attachment?.id || '',
                note,
                category,
                locationName,
              })
            }

            addDemoRequest({
              kind: 'problem',
              categoryHint: category || '',
              text: note?.trim() ? note.trim() : 'Problem report',
              message: note?.trim() ? note.trim() : '',
              locationName: locationName || '',
              mediaName: media?.name || '',
            })

            reset?.()
            setShowProblemModal(false)
            setToast('Report sent')
            setTimeout(() => setToast(''), 2500)
          } catch {
            setToast('Could not send report')
            setTimeout(() => setToast(''), 2500)
          } finally {
            setSubmittingProblem(false)
          }
        }}
      />

      <RequestGuideModal
        open={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        categoryHint={selectedCategories.length === 1 ? selectedCategories[0] : ''}
        onSend={(text) => {
          addDemoRequest({
            text,
            categoryHint: selectedCategories.length === 1 ? selectedCategories[0] : '',
          })
          setShowRequestModal(false)
          setToast('Request sent')
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

export default StaffHome
