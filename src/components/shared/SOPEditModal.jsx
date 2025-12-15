import { useEffect, useMemo, useRef, useState } from 'react'

const defaultCategories = ['Front Desk', 'Housekeeping', 'Food & Beverage', 'Maintenance', 'Safety', 'Other']

const SOPEditModal = ({ open, sop, onClose, onSave, onDelete }) => {
  const categories = useMemo(() => defaultCategories, [])
  const [taskName, setTaskName] = useState('')
  const [category, setCategory] = useState(categories[0])

  useEffect(() => {
    if (!open || !sop) return
    setTaskName(sop.taskName || '')
    setCategory(sop.category || categories[0])
  }, [open, sop, categories])

  if (!open || !sop) return null

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/60 p-4">
      <div className="glass flex h-[calc(88vh-140px)] min-h-[380px] w-full max-w-2xl flex-col rounded-3xl border border-slate-200/80 shadow-2xl dark:border-slate-700">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300">
              Edit SOP
            </p>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{sop.taskName}</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full px-3 py-1 text-base font-semibold text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Close
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            onSave({ ...sop, taskName: taskName.trim(), category })
          }}
          className="flex min-h-0 flex-1 flex-col px-5 py-4"
        >
          <div className="min-h-0 flex-1 space-y-3 overflow-auto pb-4">
            <div className="space-y-1">
              <label className="text-base font-semibold text-slate-900 dark:text-slate-200">Task name</label>
              <input
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-base font-medium text-slate-900 outline-none transition focus:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-500"
                placeholder="Task name"
              />
            </div>

            <div className="space-y-1">
              <label className="text-base font-semibold text-slate-900 dark:text-slate-200">Category</label>
              <Dropdown
                value={category}
                options={categories}
                onChange={setCategory}
                buttonClassName="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-left text-base font-medium text-slate-900 outline-none transition hover:border-slate-300 focus:border-slate-300 focus:shadow-card dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-slate-500 dark:focus:border-slate-500"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              className="flex-1 rounded-full bg-sky-600 px-4 py-3 text-base font-semibold text-white shadow-card transition hover:-translate-y-0.5 hover:shadow-lg dark:bg-sky-500 dark:text-slate-950"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => onDelete(sop)}
              className="rounded-full border border-red-200 bg-red-50 px-4 py-3 text-base font-semibold text-red-700 transition hover:border-red-300 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200"
            >
              Delete
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SOPEditModal

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
          className="absolute left-0 right-0 z-40 mt-2 max-h-64 overflow-auto rounded-2xl border border-slate-200 bg-white p-1 shadow-card dark:border-slate-700 dark:bg-slate-900"
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
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-base font-semibold transition ${
                  active
                    ? 'bg-sky-600 text-white dark:bg-sky-500 dark:text-slate-950'
                    : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                <span className="truncate">{option}</span>
                {active ? <span aria-hidden>✓</span> : null}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
