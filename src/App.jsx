import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, NavLink, Link, useLocation, useNavigate } from 'react-router-dom'
import ManagerHome from './pages/manager/ManagerHome'
import CreateSOPPage from './pages/manager/CreateSOPPage'
import InboxPage from './pages/manager/InboxPage'
import StaffHome from './pages/staff/StaffHome'
import SOPDetail from './pages/staff/SOPDetail'
import Roster from './pages/admin/Roster'
import Login from './pages/auth/Login'
import { clearDemoSession, loadDemoSession, subscribeDemoSession } from './lib/demoSessionStore'
import { loadDemoUsers, subscribeDemoUsers } from './lib/demoUsersStore'

const Shell = ({ children, theme, setTheme }) => (
  <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-50 flex flex-col transition-colors">
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
        <NavLink to="/" className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight">
          <span className="h-9 w-9 rounded-xl bg-gradient-to-br from-lagoon to-sky-600 text-white grid place-items-center shadow-card">
            SS
          </span>
          StaffSync
        </NavLink>
        <AccountMenu />
      </div>
    </header>
    <main className="flex-1">{children}</main>

    <ThemeToggle theme={theme} setTheme={setTheme} />
    <BottomTabs />
  </div>
)

const getInitialTheme = () => {
  if (typeof window === 'undefined') return 'light'
  const stored = localStorage.getItem('theme')
  if (stored === 'light' || stored === 'dark') return stored
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  return prefersDark ? 'dark' : 'light'
}

function App() {
  const [theme, setTheme] = useState(getInitialTheme)
  const [users, setUsers] = useState(loadDemoUsers)
  const [session, setSession] = useState(loadDemoSession)

  useEffect(() => {
    const root = document.documentElement
    const body = document.body
    if (theme === 'dark') {
      root.classList.add('dark')
      body.classList.add('dark')
    } else {
      root.classList.remove('dark')
      body.classList.remove('dark')
    }
    localStorage.setItem('theme', theme)
  }, [theme])

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
  const loggedIn = Boolean(session.activeUserId)
  const activeRole = loggedIn ? activeUser?.role || 'Staff' : 'Guest'

  return (
    <BrowserRouter>
      <RoleContext.Provider value={{ user: activeUser, role: activeRole, loggedIn }}>
        <Shell theme={theme} setTheme={setTheme}>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Navigate to={loggedIn ? '/staff' : '/login'} replace />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/manager"
              element={
                <RequireRole minRole="Manager">
                  <ManagerHome />
                </RequireRole>
              }
            />
            <Route
              path="/manager/inbox"
              element={
                <RequireRole minRole="Manager">
                  <InboxPage />
                </RequireRole>
              }
            />
            <Route
              path="/manager/create-sop"
              element={
                <RequireRole minRole="Manager">
                  <CreateSOPPage />
                </RequireRole>
              }
            />
            <Route
              path="/manager/sop/:recordId"
              element={
                <RequireRole minRole="Manager">
                  <SOPDetail backTo="/manager" />
                </RequireRole>
              }
            />
            <Route
              path="/staff"
              element={
                <RequireRole minRole="Staff">
                  <StaffHome />
                </RequireRole>
              }
            />
            <Route
              path="/staff/sop/:recordId"
              element={
                <RequireRole minRole="Staff">
                  <SOPDetail />
                </RequireRole>
              }
            />
            <Route path="/admin" element={<Navigate to="/admin/roster" replace />} />
            <Route
              path="/admin/roster"
              element={
                <RequireRole minRole="Admin">
                  <Roster />
                </RequireRole>
              }
            />
            <Route path="*" element={<Navigate to={loggedIn ? '/staff' : '/login'} replace />} />
          </Routes>
        </Shell>
      </RoleContext.Provider>
    </BrowserRouter>
  )
}

const RoleContext = createContext({ user: null, role: 'Guest', loggedIn: false })
const useRole = () => useContext(RoleContext)

const roleRank = {
  Guest: 0,
  Staff: 1,
  Manager: 2,
  Admin: 3,
}

const RequireRole = ({ minRole, children }) => {
  const { role, loggedIn } = useRole()
  if (!loggedIn) return <Navigate to="/login" replace />
  const allowed = (roleRank[role] || 0) >= (roleRank[minRole] || 0)

  if (allowed) return children
  if ((roleRank[role] || 0) >= roleRank.Manager) return <Navigate to="/manager" replace />
  return <Navigate to="/staff" replace />
}

const AccountMenu = () => {
  const { user, role, loggedIn } = useRole()
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  if (!loggedIn) return null

  const label = user?.name ? user.name.split(' ')[0] : 'Account'

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-card transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="hidden sm:inline">{label}</span>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          {role}
        </span>
        <span className="text-slate-500 dark:text-slate-300">▾</span>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-2 w-48 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 shadow-card dark:border-slate-700 dark:bg-slate-900"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => navigate('/login')}
            className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <span>Switch account</span>
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              clearDemoSession()
              navigate('/login', { replace: true })
            }}
            className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-semibold text-red-700 transition hover:bg-red-50 dark:text-red-200 dark:hover:bg-red-950/40"
          >
            <span>Log out</span>
          </button>
        </div>
      ) : null}
    </div>
  )
}

const ScrollToTop = () => {
  const location = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  return null
}

const ThemeToggle = ({ theme, setTheme }) => {
  const [open, setOpen] = useState(false)
  const toggle = () => setOpen((prev) => !prev)
  const chooseTheme = (value) => {
    setTheme(value)
    setOpen(false)
  }

  return (
    <div className="fixed bottom-20 right-4 z-30">
      <div className="relative">
        <button
          onClick={toggle}
          aria-label="Toggle theme menu"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-base shadow-card transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        >
          {theme === 'dark' ? '🌙' : '☀️'}
        </button>
        {open ? (
          <div className="absolute bottom-12 right-0 w-32 rounded-2xl border border-slate-200 bg-white p-2 text-base shadow-card dark:border-slate-700 dark:bg-slate-900">
            <button
              onClick={() => chooseTheme('light')}
              className={`flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left transition hover:bg-slate-100 dark:hover:bg-slate-800 ${
                theme === 'light' ? 'font-semibold text-slate-900 dark:text-slate-50' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              ☀️ Light
            </button>
            <button
              onClick={() => chooseTheme('dark')}
              className={`mt-1 flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left transition hover:bg-slate-100 dark:hover:bg-slate-800 ${
                theme === 'dark' ? 'font-semibold text-slate-900 dark:text-slate-50' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              🌙 Dark
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

const BottomTabs = () => {
  const location = useLocation()
  const { role, loggedIn } = useRole()
  if (!loggedIn) return null

  const items = [
    { label: 'Library', to: '/staff', match: (p) => p.startsWith('/staff') },
    { label: 'Command', to: '/manager', match: (p) => p.startsWith('/manager') },
    { label: 'Roster', to: '/admin/roster', match: (p) => p.startsWith('/admin') },
  ]
  const visibleItems = items.filter((item) => {
    if (item.label === 'Roster') return role === 'Admin'
    if (item.label === 'Command') return role === 'Admin' || role === 'Manager'
    return true
  })
  const currentIndex = visibleItems.findIndex((item) => item.match(location.pathname))

  return (
    <nav
      aria-label="Primary tabs"
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90"
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-around px-2 py-2">
        {visibleItems.map((item, index) => {
          const active = index === currentIndex
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex w-full max-w-[180px] flex-col items-center justify-center gap-1 rounded-2xl px-3 py-2 text-sm font-semibold transition ${
                active
                  ? 'bg-sky-600 text-white shadow-card dark:bg-sky-500 dark:text-slate-950'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
              }`}
            >
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export default App
