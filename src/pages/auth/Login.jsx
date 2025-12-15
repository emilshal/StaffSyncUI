import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadDemoSession, setActiveUserId, subscribeDemoSession } from '../../lib/demoSessionStore'
import { loadDemoUsers, subscribeDemoUsers } from '../../lib/demoUsersStore'

const getLandingPath = (role) => {
  if (role === 'Admin' || role === 'Manager') return '/manager'
  return '/staff'
}

const Login = () => {
  const [users, setUsers] = useState(loadDemoUsers)
  const [session, setSession] = useState(loadDemoSession)
  const [selectedId, setSelectedId] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const unsubscribe = subscribeDemoUsers(() => setUsers(loadDemoUsers()))
    return unsubscribe
  }, [])

  useEffect(() => {
    const unsubscribe = subscribeDemoSession(() => setSession(loadDemoSession()))
    return unsubscribe
  }, [])

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedId) || null,
    [users, selectedId],
  )

  useEffect(() => {
    if (!session.activeUserId) return
    const user = users.find((u) => u.id === session.activeUserId)
    if (!user) return
    navigate(getLandingPath(user.role), { replace: true })
  }, [session.activeUserId, users, navigate])

  return (
    <div className="mx-auto flex min-h-[calc(100vh-64px)] max-w-5xl flex-col justify-center gap-8 px-4 py-10 pb-28">
      <header className="space-y-2">
        <p className="text-base font-semibold text-slate-600 dark:text-slate-300">Welcome</p>
        <h1 className="font-display text-4xl font-semibold tracking-tight text-slate-900 dark:text-slate-50 sm:text-5xl">
          Choose an account
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-300">
          Demo login only. No password required.
        </p>
      </header>

      <section className="grid gap-3">
        {users.map((user) => {
          const selected = user.id === selectedId
          return (
            <button
              key={user.id}
              type="button"
              onClick={() => setSelectedId(user.id)}
              className={`flex items-center justify-between gap-4 rounded-2xl border p-4 text-left shadow-card transition hover:-translate-y-0.5 hover:shadow-lg ${
                selected
                  ? 'border-sky-200 bg-sky-50 text-slate-900 dark:border-sky-500/40 dark:bg-sky-500/15 dark:text-slate-50'
                  : 'border-slate-200 bg-white text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-50'
              }`}
            >
              <div className="min-w-0 space-y-1">
                <p className="truncate text-lg font-semibold">{user.name}</p>
                <p className="truncate text-base text-slate-600 dark:text-slate-300">{user.email}</p>
              </div>
              <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {user.role}
              </span>
            </button>
          )
        })}
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          disabled={!selectedUser}
          onClick={() => {
            if (!selectedUser) return
            setActiveUserId(selectedUser.id)
            navigate(getLandingPath(selectedUser.role))
          }}
          className="inline-flex items-center justify-center rounded-full bg-sky-600 px-6 py-3 text-base font-semibold text-white shadow-card transition hover:-translate-y-0.5 hover:shadow-lg disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-sky-500 dark:text-slate-950"
        >
          Continue
        </button>
        <p className="text-sm text-slate-500 dark:text-slate-300">
          You can switch accounts any time from the top bar.
        </p>
      </div>
    </div>
  )
}

export default Login

