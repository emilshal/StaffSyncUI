const STORAGE_KEY = 'staffsync_demo_feedback_v1'
const EVENT_NAME = 'staffsync-demo-feedback-updated'

export const loadDemoFeedback = () => {
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

export const addDemoFeedback = ({ sopId, sopTitle, message }) => {
  const list = loadDemoFeedback()
  const next = [
    {
      id: `fb-${Date.now()}`,
      sopId,
      sopTitle,
      message,
      createdAt: new Date().toISOString(),
    },
    ...list,
  ]
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  window.dispatchEvent(new Event(EVENT_NAME))
  return next[0]
}

