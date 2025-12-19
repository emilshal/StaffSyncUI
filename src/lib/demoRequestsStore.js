const STORAGE_KEY = 'staffsync_demo_requests_v1'
const EVENT_NAME = 'staffsync-demo-requests-updated'

export const loadDemoRequests = () => {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
  } catch {
    return []
  }
}

export const saveDemoRequests = (requests) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(requests))
  window.dispatchEvent(new Event(EVENT_NAME))
}

export const subscribeDemoRequests = (callback) => {
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

export const addDemoRequest = ({
  text,
  categoryHint = '',
  kind = 'guide', // guide | feedback | problem
  sopId = '',
  sopTitle = '',
  message = '',
  locationName = '',
  mediaName = '',
} = {}) => {
  const requests = loadDemoRequests()
  const next = [
    {
      id: `req-${Date.now()}`,
      text,
      categoryHint,
      kind,
      sopId,
      sopTitle,
      message,
      locationName,
      mediaName,
      status: 'open', // open | done
      createdAt: new Date().toISOString(),
    },
    ...requests,
  ]
  saveDemoRequests(next)
  return next[0]
}

export const updateDemoRequest = (id, patch) => {
  const requests = loadDemoRequests()
  const next = requests.map((item) => (item.id === id ? { ...item, ...patch } : item))
  saveDemoRequests(next)
}

export const deleteDemoRequest = (id) => {
  const requests = loadDemoRequests()
  const next = requests.filter((item) => item.id !== id)
  saveDemoRequests(next)
}
