import { demoSops as seedSops } from './demoData'

const STORAGE_KEY = 'staffsync_demo_sops_v1'
const EVENT_NAME = 'staffsync-demo-sops-updated'
const DEFAULT_VIDEO_URL =
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'

export const loadDemoSops = () => {
  if (typeof window === 'undefined') return seedSops
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return seedSops
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return seedSops
    return parsed.map((item) => {
      const seed = seedSops.find((sop) => sop.id === item?.id)
      if (!seed) return item

      const itemVideoUrl = item?.video?.url || ''
      const keepItemVideo =
        itemVideoUrl.startsWith('blob:') ||
        itemVideoUrl.startsWith('/sop-videos/') ||
        (itemVideoUrl && itemVideoUrl !== DEFAULT_VIDEO_URL)

      return {
        ...seed,
        ...item,
        poster: item.poster ?? seed.poster,
        duration: item.duration ?? seed.duration,
        video: keepItemVideo ? item.video : seed.video,
      }
    })
  } catch {
    return seedSops
  }
}

export const saveDemoSops = (sops) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sops))
  window.dispatchEvent(new Event(EVENT_NAME))
}

export const subscribeDemoSops = (callback) => {
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
