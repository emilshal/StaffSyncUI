const ConfirmDialog = ({ open, title, message, confirmText = 'Confirm', onCancel, onConfirm }) => {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-950/60 p-4 sm:items-center">
      <div className="glass w-full max-w-sm rounded-3xl border border-slate-200/80 p-5 shadow-2xl dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-950 dark:text-slate-50">{title}</h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{message}</p>
        <div className="mt-4 flex gap-2">
          <button
            onClick={onConfirm}
            className="flex-1 rounded-full bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-card transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            {confirmText}
          </button>
          <button
            onClick={onCancel}
            className="rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog

