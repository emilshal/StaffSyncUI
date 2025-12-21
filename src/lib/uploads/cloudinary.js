import { debugLog, debugWarn } from '../debug'

const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
const defaultFolder = import.meta.env.VITE_CLOUDINARY_FOLDER || ''

const ensureCloudinaryEnv = () => {
  if (!cloudName) throw new Error('Missing VITE_CLOUDINARY_CLOUD_NAME.')
  if (!uploadPreset) throw new Error('Missing VITE_CLOUDINARY_UPLOAD_PRESET.')
}

export const uploadVideoToCloudinary = async (file, { folder = defaultFolder } = {}) => {
  ensureCloudinaryEnv()
  if (!file) throw new Error('Missing file.')

  debugLog('Cloudinary upload start', {
    name: file.name,
    type: file.type,
    bytes: file.size,
    folder: folder || '',
  })

  const form = new FormData()
  form.append('file', file)
  form.append('upload_preset', uploadPreset)
  if (folder) form.append('folder', folder)

  let response
  try {
    response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/video/upload`, {
      method: 'POST',
      body: form,
    })
  } catch (err) {
    debugWarn('Cloudinary upload network error', err)
    throw err
  }

  if (!response.ok) {
    let detail = ''
    try {
      const json = await response.json()
      detail = json?.error?.message ? ` (${json.error.message})` : ''
    } catch {
      // ignore
    }
    throw new Error(`Cloudinary upload failed${detail}`)
  }

  const data = await response.json()
  debugLog('Cloudinary upload success', { publicId: data.public_id || '', url: data.secure_url || data.url || '' })

  return {
    provider: 'cloudinary',
    url: data.secure_url || data.url || '',
    publicId: data.public_id || '',
    bytes: Number.isFinite(data.bytes) ? data.bytes : undefined,
    durationSeconds: Number.isFinite(data.duration) ? Math.round(data.duration) : undefined,
    mimeType: data.resource_type && data.format ? `${data.resource_type}/${data.format}` : undefined,
    originalFilename: data.original_filename || file.name || '',
    raw: data,
  }
}

export const uploadMediaToCloudinary = async (file, { folder = defaultFolder } = {}) => {
  ensureCloudinaryEnv()
  if (!file) throw new Error('Missing file.')

  const type = typeof file.type === 'string' ? file.type : ''
  const resourceType = type.startsWith('image/')
    ? 'image'
    : type.startsWith('video/')
      ? 'video'
      : 'raw'

  debugLog('Cloudinary media upload start', {
    resourceType,
    name: file.name,
    type,
    bytes: file.size,
    folder: folder || '',
  })

  const form = new FormData()
  form.append('file', file)
  form.append('upload_preset', uploadPreset)
  if (folder) form.append('folder', folder)

  let response
  try {
    response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
      method: 'POST',
      body: form,
    })
  } catch (err) {
    debugWarn('Cloudinary media upload network error', err)
    throw err
  }

  if (!response.ok) {
    let detail = ''
    try {
      const json = await response.json()
      detail = json?.error?.message ? ` (${json.error.message})` : ''
    } catch {
      // ignore
    }
    throw new Error(`Cloudinary upload failed${detail}`)
  }

  const data = await response.json()
  debugLog('Cloudinary media upload success', { publicId: data.public_id || '', url: data.secure_url || data.url || '' })

  return {
    provider: 'cloudinary',
    resourceType,
    url: data.secure_url || data.url || '',
    publicId: data.public_id || '',
    bytes: Number.isFinite(data.bytes) ? data.bytes : undefined,
    durationSeconds: Number.isFinite(data.duration) ? Math.round(data.duration) : undefined,
    mimeType: data.resource_type && data.format ? `${data.resource_type}/${data.format}` : type || undefined,
    originalFilename: data.original_filename || file.name || '',
    raw: data,
  }
}
