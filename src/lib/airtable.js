import axios from 'axios'

const apiKey = import.meta.env.VITE_AIRTABLE_API_KEY
const baseId = import.meta.env.VITE_AIRTABLE_BASE_ID
const sopsTable = import.meta.env.VITE_AIRTABLE_SOPS_TABLE_NAME || 'SOPs'
const problemsTable =
  import.meta.env.VITE_AIRTABLE_PROBLEMS_TABLE_NAME || 'problem_reports'
const appBaseUrl =
  import.meta.env.VITE_APP_BASE_URL || (typeof window !== 'undefined'
    ? window.location.origin
    : '')

const client = axios.create({
  baseURL: `https://api.airtable.com/v0/${baseId}`,
  headers: {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  },
})

const ensureEnv = () => {
  if (!apiKey || !baseId) {
    throw new Error(
      'Missing Airtable credentials. Please set VITE_AIRTABLE_API_KEY and VITE_AIRTABLE_BASE_ID.',
    )
  }
}

const mapSOP = (record) => ({
  id: record.id,
  taskName: record.fields.task_name || 'Untitled task',
  category: record.fields.category || 'Uncategorized',
  video: record.fields.video?.[0],
  steps: {
    en: record.fields.steps_en || '',
    it: record.fields.steps_it || '',
    es: record.fields.steps_es || '',
  },
  qrLink: record.fields.qr_link || '',
  updatedAt: record.fields.updated_at || '',
  raw: record,
})

export const uploadAttachment = async (file) => {
  ensureEnv()

  const formData = new FormData()
  formData.append('file', file)

  const { data } = await axios.post(
    `https://api.airtable.com/v0/bases/${baseId}/attachments`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'multipart/form-data',
      },
    },
  )

  const attachment = data?.attachment || data?.attachments?.[0] || data
  if (!attachment?.id) {
    throw new Error('Airtable did not return an attachment id. Confirm attachments API access is enabled.')
  }
  return {
    id: attachment?.id,
    url: attachment?.url,
  }
}

export const createSOP = async ({ taskName, category, attachmentId }) => {
  ensureEnv()

  const payload = {
    fields: {
      task_name: taskName,
      category,
      video: attachmentId ? [{ id: attachmentId }] : [],
    },
  }

  const { data } = await client.post(`/${sopsTable}`, payload)
  return mapSOP(data)
}

export const updateSOP = async (recordId, fields) => {
  ensureEnv()
  const { data } = await client.patch(`/${sopsTable}/${recordId}`, { fields })
  return mapSOP(data)
}

export const fetchSOPs = async () => {
  ensureEnv()
  const { data } = await client.get(`/${sopsTable}`, {
    params: {
      'sort[0][field]': 'created_at',
      'sort[0][direction]': 'desc',
    },
  })

  return data.records.map(mapSOP)
}

export const fetchSOPById = async (recordId) => {
  ensureEnv()
  const { data } = await client.get(`/${sopsTable}/${recordId}`)
  return mapSOP(data)
}

export const pollSOPForSteps = async (recordId, { interval = 5000, timeout = 180000 } = {}) => {
  const startedAt = Date.now()

  while (Date.now() - startedAt < timeout) {
    const record = await fetchSOPById(recordId)
    const hasSteps = record.steps.en || record.steps.it || record.steps.es

    if (hasSteps) {
      return record
    }

    await new Promise((resolve) => setTimeout(resolve, interval))
  }

  throw new Error('Timed out waiting for AI-generated steps.')
}

export const createProblemReport = async ({
  mediaAttachmentId,
  note,
  category,
  locationName,
}) => {
  ensureEnv()
  const payload = {
    fields: {
      note: note || '',
      category,
      location_name: locationName || '',
      created_at: new Date().toISOString(),
      media: mediaAttachmentId ? [{ id: mediaAttachmentId }] : [],
    },
  }

  const { data } = await client.post(`/${problemsTable}`, payload)
  return data
}

export const ensureQrLinkOnRecord = async (recordId, existingLink = '') => {
  if (existingLink) return existingLink
  const link = `${appBaseUrl}/staff/sop/${recordId}`
  await updateSOP(recordId, { qr_link: link })
  return link
}
