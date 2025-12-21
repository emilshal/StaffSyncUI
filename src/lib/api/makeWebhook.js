import { createEventEnvelope, validateEventEnvelope } from '../events/eventContract'
import { loadDemoSession } from '../demoSessionStore'
import { loadDemoUsers } from '../demoUsersStore'
import { debugLog, debugWarn } from '../debug'

const webhookUrl = import.meta.env.VITE_MAKE_WEBHOOK_URL
const webhookKey = import.meta.env.VITE_MAKE_WEBHOOK_KEY
const webhookKeyMode = (import.meta.env.VITE_MAKE_WEBHOOK_KEY_MODE || 'header').toString().toLowerCase()
const webhookKeyHeader = (import.meta.env.VITE_MAKE_WEBHOOK_KEY_HEADER || 'x-staffsync-key').toString()
const webhookKeyQueryParam = (import.meta.env.VITE_MAKE_WEBHOOK_KEY_QUERY_PARAM || 'key').toString()

const ensureMakeEnv = () => {
  if (!webhookUrl) throw new Error('Missing VITE_MAKE_WEBHOOK_URL.')
}

const getDefaultActor = () => {
  if (typeof window === 'undefined') return { userId: '', role: 'Guest' }
  const session = loadDemoSession()
  const users = loadDemoUsers()
  const active = users.find((u) => u.id === session.activeUserId) || users[0] || null
  return {
    userId: active?.id || '',
    role: (active?.role || 'Guest').toString().toLowerCase(),
    name: active?.name || '',
    email: active?.email || '',
  }
}

export const sendEventToMake = async ({
  actionType,
  payload = {},
  organizationId = import.meta.env.VITE_ORGANIZATION_ID || 'org-demo',
  actor = getDefaultActor(),
  meta,
  requestId,
} = {}) => {
  ensureMakeEnv()

  const event = createEventEnvelope({
    actionType,
    actor: { userId: actor.userId, role: actor.role, ...(actor.email ? { email: actor.email } : {}) },
    organizationId,
    payload,
    meta,
    requestId,
  })

  const validation = validateEventEnvelope(event)
  if (!validation.ok) {
    throw new Error(`Invalid event envelope: ${validation.errors.join(', ')}`)
  }

  debugLog('Make webhook send', {
    url: webhookUrl,
    actionType: event.actionType,
    requestId: event.requestId,
    hasKeyHeader: Boolean(webhookKey),
    keyMode: webhookKey ? webhookKeyMode : 'none',
    keyHeader: webhookKey ? webhookKeyHeader : '',
    keyLength: webhookKey ? webhookKey.length : 0,
  })

  let response
  try {
    const url = (() => {
      if (!webhookKey || webhookKeyMode !== 'query') return webhookUrl
      const u = new URL(webhookUrl)
      u.searchParams.set(webhookKeyQueryParam, webhookKey)
      return u.toString()
    })()

    const headers = {
      'Content-Type': 'application/json',
    }

    if (webhookKey) {
      if (webhookKeyMode === 'bearer') {
        headers.Authorization = `Bearer ${webhookKey}`
      } else if (webhookKeyMode === 'header') {
        headers[webhookKeyHeader] = webhookKey
      }
    }

    response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(event),
    })
  } catch (err) {
    debugWarn('Make webhook network error', err)
    const message =
      err instanceof TypeError
        ? 'Could not reach Make webhook (often CORS/preflight). Check the browser console network errors, and confirm your Make webhook allows browser requests.'
        : 'Could not reach Make webhook.'
    throw new Error(message)
  }

  if (!response.ok) {
    let bodyText = ''
    try {
      bodyText = await response.text()
    } catch {
      // ignore
    }
    debugWarn('Make webhook non-200', {
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type') || '',
      body: bodyText,
    })
    throw new Error(`Make webhook request failed (HTTP ${response.status})`)
  }

  try {
    const bodyText = await response.text()
    const contentType = response.headers.get('content-type') || ''

    let parsed = null
    try {
      parsed = bodyText ? JSON.parse(bodyText) : null
    } catch {
      parsed = null
    }

    debugLog('Make webhook response', {
      status: response.status,
      contentType,
      body: bodyText,
      parsed,
    })

    return parsed ?? (bodyText ? { ok: true, body: bodyText } : { ok: true })
  } catch (err) {
    debugWarn('Make webhook response read error', err)
    return { ok: true }
  }
}
