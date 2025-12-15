const demoRoster = [
  { name: 'Ava Rossi', role: 'Staff', department: 'Housekeeping' },
  { name: 'Marco Bianchi', role: 'Staff', department: 'Food & Beverage' },
  { name: 'Sofia Conti', role: 'Manager', department: 'Front Desk' },
]

const Roster = () => {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 pb-28 sm:py-12">
      <header className="space-y-1">
        <p className="text-base font-semibold text-slate-600 dark:text-slate-300">Admin</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
          Roster
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-300">
          Demo-only screen for permissions and roles (no auth yet).
        </p>
      </header>

      <section className="grid gap-4">
        {demoRoster.map((person) => (
          <div
            key={person.name}
            className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="space-y-1">
              <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">{person.name}</p>
              <p className="text-base text-slate-600 dark:text-slate-300">{person.department}</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              {person.role}
            </span>
          </div>
        ))}
      </section>
    </div>
  )
}

export default Roster

