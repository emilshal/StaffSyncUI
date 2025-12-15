import { useEffect, useMemo, useRef, useState } from 'react'
import ConfirmDialog from '../../components/shared/ConfirmDialog'
import { loadDemoSession, subscribeDemoSession } from '../../lib/demoSessionStore'
import { loadDemoUsers, subscribeDemoUsers, updateDemoUser } from '../../lib/demoUsersStore'

const roles = ['Staff', 'Manager', 'Admin']

const Roster = () => {
  const [users, setUsers] = useState(loadDemoUsers)
  const [session, setSession] = useState(loadDemoSession)
  const [confirmRole, setConfirmRole] = useState(null)

  useEffect(() => {
    const unsubscribe = subscribeDemoUsers(() => setUsers(loadDemoUsers()))
    return unsubscribe
  }, [])

  useEffect(() => {
    const unsubscribe = subscribeDemoSession(() => setSession(loadDemoSession()))
    return unsubscribe
  }, [])

  const activeUser = useMemo(
    () => users.find((user) => user.id === session.activeUserId) || users[0] || null,
    [users, session.activeUserId],
  )

  const canManageRoles = activeUser?.role === 'Admin'

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 pb-28 sm:py-12">
      <header className="space-y-1">
        <p className="text-base font-semibold text-slate-600 dark:text-slate-300">Admin</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
          Roster
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-300">
          Permission control: manage who is allowed to record SOPs.
        </p>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-base text-slate-600 shadow-card dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
        Signed in as <span className="font-semibold text-slate-900 dark:text-slate-50">{activeUser?.name || '—'}</span>{' '}
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          {activeUser?.role || '—'}
        </span>
      </div>

      <section className="grid gap-3">
        {users.map((user) => {
          const isSelf = user.id === session.activeUserId
          return (
            <div
              key={user.id}
              className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-lg font-semibold text-slate-900 dark:text-slate-50">
                    {user.name}
                  </p>
                  {isSelf ? (
                    <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-900 dark:bg-sky-500/15 dark:text-sky-200">
                      You
                    </span>
                  ) : null}
                </div>
                <p className="truncate text-base text-slate-600 dark:text-slate-300">{user.email}</p>
              </div>

              {canManageRoles ? (
                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <span className="text-sm font-semibold text-slate-500 dark:text-slate-300">Role</span>
                  <RoleDropdown
                    value={user.role}
                    options={roles}
                    onChange={(nextRole) => {
                      if (nextRole === user.role) return
                      if (nextRole === 'Admin') {
                        setConfirmRole({ user, nextRole })
                        return
                      }
                      updateDemoUser(user.id, { role: nextRole })
                    }}
                  />
                </div>
              ) : (
                <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {user.role}
                </span>
              )}
            </div>
          )
        })}
      </section>

      <ConfirmDialog
        open={Boolean(confirmRole)}
        title="Promote to Admin?"
        message={`This gives “${confirmRole?.user?.name || ''}” full access to manage roles.`}
        confirmText="Promote"
        confirmTone="success"
        onCancel={() => setConfirmRole(null)}
        onConfirm={() => {
          if (!confirmRole) return
          updateDemoUser(confirmRole.user.id, { role: confirmRole.nextRole })
          setConfirmRole(null)
        }}
      />
    </div>
  )
}

export default Roster

const RoleDropdown = ({ value, options, onChange }) => {
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
        className="flex min-w-[160px] items-center justify-between gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-card transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        <span className="truncate">{value}</span>
        <span className="text-slate-500 dark:text-slate-300">▾</span>
      </button>

      {open ? (
        <div
          role="listbox"
          className="absolute right-0 z-30 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 shadow-card dark:border-slate-700 dark:bg-slate-900"
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
                <span>{option}</span>
                {active ? <span aria-hidden className="text-slate-950">✓</span> : null}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
