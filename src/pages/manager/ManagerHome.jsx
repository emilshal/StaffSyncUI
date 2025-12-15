import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ConfirmDialog from '../../components/shared/ConfirmDialog'
import SOPEditModal from '../../components/shared/SOPEditModal'
import VideoThumbnail from '../../components/shared/VideoThumbnail'
import { loadDemoSops, saveDemoSops, subscribeDemoSops } from '../../lib/demoStore'
import { loadDemoRequests, subscribeDemoRequests } from '../../lib/demoRequestsStore'

const ManagerHome = () => {
  const [sops, setSops] = useState(loadDemoSops)
  const [editing, setEditing] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [requests, setRequests] = useState(loadDemoRequests)

  useEffect(() => {
    const unsubscribe = subscribeDemoSops(() => setSops(loadDemoSops()))
    return unsubscribe
  }, [])

  useEffect(() => {
    const unsubscribe = subscribeDemoRequests(() => setRequests(loadDemoRequests()))
    return unsubscribe
  }, [])

  const categories = useMemo(() => {
    const set = new Set()
    sops.forEach((sop) => set.add(sop.category || 'Uncategorized'))
    return ['All', ...Array.from(set).sort()]
  }, [sops])

  const openRequests = useMemo(
    () => requests.filter((req) => req.status !== 'done'),
    [requests],
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return sops.filter((sop) => {
      const matchesCategory =
        activeCategory === 'All' || (sop.category || 'Uncategorized') === activeCategory
      const matchesQuery =
        !q ||
        (sop.taskName || '').toLowerCase().includes(q) ||
        (sop.category || '').toLowerCase().includes(q)
      return matchesCategory && matchesQuery
    })
  }, [sops, query, activeCategory])

  const handleSave = (updated) => {
    const next = sops.map((item) => (item.id === updated.id ? updated : item))
    saveDemoSops(next)
    setEditing(null)
  }

  const requestDelete = (sop) => setConfirmDelete(sop)
  const handleDelete = () => {
    if (!confirmDelete) return
    const next = sops.filter((item) => item.id !== confirmDelete.id)
    saveDemoSops(next)
    setConfirmDelete(null)
  }

  const MailIcon = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M4 6.75C4 6.33579 4.33579 6 4.75 6H19.25C19.6642 6 20 6.33579 20 6.75V17.25C20 17.6642 19.6642 18 19.25 18H4.75C4.33579 18 4 17.6642 4 17.25V6.75Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M6 8.5L12 12.75L18 8.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 pb-28 sm:py-12">
      <section className="space-y-4">
        <div className="space-y-1">
          <p className="text-base font-semibold text-slate-600 dark:text-slate-300">Manager</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            Command Center
          </h1>
        </div>

        <Link
          to="/manager/create-sop"
          className="flex w-full items-center justify-between gap-3 rounded-2xl bg-sky-600 px-5 py-4 text-base font-semibold text-white shadow-card transition hover:-translate-y-0.5 hover:shadow-lg dark:bg-sky-500 dark:text-slate-950"
        >
          <span className="flex items-center gap-3">
            <span aria-hidden className="text-2xl leading-none">
              +
            </span>
            <span>Record New SOP</span>
          </span>
          <span aria-hidden className="text-xl leading-none opacity-90">
            {'>'}
          </span>
        </Link>

        <Link
          to="/manager/inbox"
          className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-card transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100">
              <MailIcon className="h-5 w-5" />
            </span>
            <div className="space-y-0.5">
              <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">Inbox</p>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-300">Staff requests</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              {openRequests.length}
            </span>
            <span className="text-xl font-semibold text-slate-400 dark:text-slate-500">{'>'}</span>
          </div>
        </Link>

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
          {categories.map((cat) => {
            const selected = cat === activeCategory
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
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
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((record) => (
          <Link
            key={record.id}
            to={`/manager/sop/${record.id}`}
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
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{record.taskName}</h2>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setEditing(record)
                    }}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      requestDelete(record)
                    }}
                    className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 transition hover:border-red-300 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
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

      <SOPEditModal
        open={Boolean(editing)}
        sop={editing}
        onClose={() => setEditing(null)}
        onSave={handleSave}
        onDelete={(sop) => {
          setEditing(null)
          requestDelete(sop)
        }}
      />
      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Delete SOP?"
        message={`This will remove “${confirmDelete?.taskName || ''}” from the demo list.`}
        confirmText="Delete"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}

export default ManagerHome
