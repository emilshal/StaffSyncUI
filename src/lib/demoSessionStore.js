import { loadDemoUsers } from './demoUsersStore'

const STORAGE_KEY = 'staffsync_demo_session_v1'
const EVENT_NAME = 'staffsync-demo-session-updated'

const getSeedSession = () => {
  return { activeUserId: '' }
}

export const loadDemoSession = () => {
  if (typeof window === 'undefined') return getSeedSession()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return getSeedSession()
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return getSeedSession()
    const activeUserId = typeof parsed.activeUserId === 'string' ? parsed.activeUserId : ''
    return { activeUserId }
  } catch {
    return getSeedSession()
  }
}

export const saveDemoSession = (session) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  window.dispatchEvent(new Event(EVENT_NAME))
}

export const subscribeDemoSession = (callback) => {
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

export const setActiveUserId = (activeUserId) => {
  const next = { ...loadDemoSession(), activeUserId }
  saveDemoSession(next)
}

export const clearDemoSession = () => {
  saveDemoSession(getSeedSession())
}
