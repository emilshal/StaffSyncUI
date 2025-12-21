const isDev = Boolean(import.meta.env?.DEV)
const rawFlag = (import.meta.env?.VITE_DEBUG_LOGS || '').toString().trim().toLowerCase()
const enabled =
  isDev ||
  rawFlag === '1' ||
  rawFlag === 'true' ||
  rawFlag === 'yes' ||
  rawFlag === 'on'

export const debugEnabled = () => enabled

export const debugLog = (...args) => {
  if (!enabled) return
  // eslint-disable-next-line no-console
  console.log('[StaffSync]', ...args)
}

export const debugWarn = (...args) => {
  if (!enabled) return
  // eslint-disable-next-line no-console
  console.warn('[StaffSync]', ...args)
}

let didInit = false
export const debugInit = () => {
  if (didInit) return
  didInit = true
  if (!enabled) return
  // eslint-disable-next-line no-console
  console.log('[StaffSync]', 'Debug logging enabled', {
    DEV: Boolean(import.meta.env?.DEV),
    VITE_DEBUG_LOGS: import.meta.env?.VITE_DEBUG_LOGS,
  })
}
