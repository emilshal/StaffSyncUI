import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { deleteDemoRequest, loadDemoRequests, subscribeDemoRequests } from '../../lib/demoRequestsStore'

const InboxPage = () => {
  const [requests, setRequests] = useState(loadDemoRequests)

  useEffect(() => {
    const unsubscribe = subscribeDemoRequests(() => setRequests(loadDemoRequests()))
    return unsubscribe
  }, [])

  const openRequests = useMemo(
    () => requests.filter((req) => req.status !== 'done'),
    [requests],
  )

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 pb-32 sm:py-12">
      <div className="flex items-center gap-3">
        <Link
          to="/manager"
          aria-label="Back to Command Center"
          className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-xl font-semibold text-slate-800 shadow-card transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          {'<'}
        </Link>
        <div className="space-y-1">
          <p className="text-base font-semibold text-slate-600 dark:text-slate-300">Inbox</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            Staff Requests
          </h1>
        </div>
      </div>

      {openRequests.length ? (
        <div className="grid gap-3">
          {openRequests.map((req) => (
            <div
              key={req.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-900"
            >
              {req.kind === 'feedback' ? (
                <Link to={req.sopId ? `/manager/sop/${req.sopId}` : '/manager'} className="block">
                  <p className="text-base font-semibold text-slate-900 dark:text-slate-50">
                    Issue reported: {req.sopTitle || 'SOP'}
                  </p>
                  {req.message ? (
                    <p className="mt-2 text-base text-slate-600 dark:text-slate-300">{req.message}</p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-300">
                    <span>{new Date(req.createdAt).toLocaleString()}</span>
                    {req.categoryHint ? (
                      <>
                        <span className="text-xs">•</span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                          {req.categoryHint}
                        </span>
                      </>
                    ) : null}
                  </div>
                </Link>
              ) : (
                <Link
                  to={`/manager/create-sop?title=${encodeURIComponent(req.text)}&requestId=${encodeURIComponent(req.id)}`}
                  className="block"
                >
                  <p className="text-base font-semibold text-slate-900 dark:text-slate-50">
                    Staff requested: {req.text}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-300">
                    <span>{new Date(req.createdAt).toLocaleString()}</span>
                    {req.categoryHint ? (
                      <>
                        <span className="text-xs">•</span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                          {req.categoryHint}
                        </span>
                      </>
                    ) : null}
                  </div>
                </Link>
              )}

              <div className="mt-3 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => deleteDemoRequest(req.id)}
                  className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-base font-semibold text-red-700 transition hover:border-red-300 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-base text-slate-600 shadow-card dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          No open requests right now.
        </div>
      )}
    </div>
  )
}

export default InboxPage
