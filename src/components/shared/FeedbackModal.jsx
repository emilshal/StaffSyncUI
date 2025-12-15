import { useEffect, useState } from 'react'

const FeedbackModal = ({ open, title, onClose, onSubmit }) => {
  const [text, setText] = useState('')

  useEffect(() => {
    if (!open) return
    setText('')
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/60 p-4">
      <div className="glass w-full max-w-lg rounded-3xl border border-slate-200/80 shadow-2xl dark:border-slate-700">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">
              Feedback
            </p>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Report Issue</h3>
            {title ? (
              <p className="text-sm font-medium text-slate-500 dark:text-slate-300">{title}</p>
            ) : null}
          </div>
          <button
            onClick={onClose}
            className="rounded-full px-3 py-1 text-base font-semibold text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Close
          </button>
        </div>

        <div className="space-y-3 px-5 py-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            placeholder="What’s unclear or missing in this guide?"
            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-base font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-300 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-600"
          />

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                const trimmed = text.trim()
                if (!trimmed) return
                onSubmit(trimmed)
                onClose()
              }}
              className="flex-1 rounded-full bg-sky-600 px-5 py-3 text-base font-semibold text-white shadow-card transition hover:-translate-y-0.5 hover:shadow-lg dark:bg-sky-500 dark:text-slate-950"
            >
              Send feedback
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-200 bg-white px-5 py-3 text-base font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FeedbackModal

