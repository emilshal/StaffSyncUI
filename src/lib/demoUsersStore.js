const STORAGE_KEY = 'staffsync_demo_users_v1'
const EVENT_NAME = 'staffsync-demo-users-updated'

const seedUsers = [
  { id: 'usr-1', name: 'Emil Shalamberidze', email: 'emil@example.com', role: 'Admin' },
  { id: 'usr-2', name: 'Sofia Conti', email: 'sofia@staffsync.demo', role: 'Manager' },
  { id: 'usr-3', name: 'Marco Bianchi', email: 'marco@staffsync.demo', role: 'Staff' },
  { id: 'usr-4', name: 'Ava Rossi', email: 'ava@staffsync.demo', role: 'Staff' },
]

export const loadDemoUsers = () => {
  if (typeof window === 'undefined') return seedUsers
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return seedUsers
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || !parsed.length) return seedUsers
    return parsed
  } catch {
    return seedUsers
  }
}

export const saveDemoUsers = (users) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(users))
  window.dispatchEvent(new Event(EVENT_NAME))
}

export const subscribeDemoUsers = (callback) => {
  if (typeof window === 'undefined') return () => {}

  const onCustom = () => callback()
  const onStorage = (event) => {
    if (event.key === STORAGE_KEY) callback()
  }

  window.addEventListener(EVENT_NAME, onCustom)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(EVENT_NAME, onCustom)
    window.removeEventListener('storage', onStorage)
  }
}

export const updateDemoUser = (id, patch) => {
  const users = loadDemoUsers()
  const next = users.map((user) => (user.id === id ? { ...user, ...patch } : user))
  saveDemoUsers(next)
}

