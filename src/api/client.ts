import type {
  ChatMessageResponse,
  ContentItem,
  ContentType,
  ContentVisibility,
  ConversationLogEntry,
  DeathVerificationRequest,
  Legacy,
  MediaKind,
  Membership,
  MembershipRole,
  User,
} from './types'

export const API_URL = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:4000'

const TOKEN_KEY = 'legado-digital-token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(
  method: string,
  path: string,
  opts: { json?: unknown; form?: FormData } = {}
): Promise<T> {
  const headers: Record<string, string> = {}
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  let body: BodyInit | undefined
  if (opts.json !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(opts.json)
  } else if (opts.form) {
    body = opts.form
  }

  const res = await fetch(`${API_URL}${path}`, { method, headers, body })

  if (res.status === 204) return undefined as T

  const contentType = res.headers.get('content-type') || ''
  const data = contentType.includes('application/json') ? await res.json() : await res.text()

  if (!res.ok) {
    const message = typeof data === 'object' && data && 'error' in data ? (data as { error: string }).error : 'Ocurrió un error inesperado.'
    throw new ApiError(res.status, message)
  }
  return data as T
}

// --- Auth ---

export const authApi = {
  signup: (input: { email: string; password: string; name: string }) =>
    request<{ token: string; user: User }>('POST', '/auth/signup', { json: input }),
  login: (input: { email: string; password: string; totpCode?: string }) =>
    request<{ token: string; user: User }>('POST', '/auth/login', { json: input }),
  me: () => request<User>('GET', '/auth/me'),
}

// --- Legacies ---

export interface CreateLegacyInput {
  name: string
}

export interface UpdateLegacyInput {
  name?: string
  bio?: string
  humor?: string
  traits?: string[]
  values?: string[]
  phrases?: string[]
}

export const legaciesApi = {
  list: () => request<Legacy[]>('GET', '/legacies'),
  get: (legacyId: string) => request<Legacy>('GET', `/legacies/${legacyId}`),
  create: (input: CreateLegacyInput) => request<Legacy>('POST', '/legacies', { json: input }),
  update: (legacyId: string, input: UpdateLegacyInput) => request<Legacy>('PUT', `/legacies/${legacyId}`, { json: input }),
  invite: (legacyId: string, input: { email: string; role: MembershipRole; relationship?: string; minAccessAge?: number }) =>
    request<{ membershipId: string; inviteToken: string }>('POST', `/legacies/${legacyId}/invites`, { json: input }),
  listInvites: (legacyId: string) => request<Membership[]>('GET', `/legacies/${legacyId}/invites`),
}

export const invitesApi = {
  accept: (token: string) => request<Membership>('POST', `/invites/${token}/accept`),
}

// --- Content ---

export interface CreateContentInput {
  type: ContentType
  title: string
  category?: string
  textContent?: string
  transcript?: string
  mediaKind?: MediaKind
  visibility: ContentVisibility
  visibleFromDate?: string
  visibleFromAge?: number
  recipientMembershipId?: string
}

function toFormData(input: CreateContentInput, file?: { blob: Blob; filename: string }): FormData {
  const form = new FormData()
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined && value !== '') form.append(key, String(value))
  }
  if (file) form.append('media', file.blob, file.filename)
  return form
}

export const contentApi = {
  list: (legacyId: string) => request<ContentItem[]>('GET', `/legacies/${legacyId}/content`),
  create: (legacyId: string, input: CreateContentInput, file?: { blob: Blob; filename: string }) =>
    request<ContentItem>('POST', `/legacies/${legacyId}/content`, { form: toFormData(input, file) }),
  update: (legacyId: string, contentId: string, input: Partial<CreateContentInput>) =>
    request<ContentItem>('PUT', `/legacies/${legacyId}/content/${contentId}`, { json: input }),
  remove: (legacyId: string, contentId: string) => request<void>('DELETE', `/legacies/${legacyId}/content/${contentId}`),
  async fetchMedia(legacyId: string, contentId: string): Promise<Blob> {
    const token = getToken()
    const res = await fetch(`${API_URL}/legacies/${legacyId}/content/${contentId}/media`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!res.ok) throw new ApiError(res.status, 'No se pudo cargar el archivo.')
    return res.blob()
  },
}

// --- Death verification ---

export const deathVerificationApi = {
  list: (legacyId: string) => request<DeathVerificationRequest[]>('GET', `/legacies/${legacyId}/death-verification`),
  start: (legacyId: string, certificate: { blob: Blob; filename: string }, gracePeriodDays?: number) => {
    const form = new FormData()
    form.append('certificate', certificate.blob, certificate.filename)
    if (gracePeriodDays !== undefined) form.append('gracePeriodDays', String(gracePeriodDays))
    return request<DeathVerificationRequest>('POST', `/legacies/${legacyId}/death-verification`, { form })
  },
  confirm: (legacyId: string, requestId: string) =>
    request<DeathVerificationRequest>('POST', `/legacies/${legacyId}/death-verification/${requestId}/confirm`),
  cancel: (legacyId: string, requestId: string, reason?: string) =>
    request<{ ok: true }>('POST', `/legacies/${legacyId}/death-verification/${requestId}/cancel`, { json: { reason } }),
  reject: (legacyId: string, requestId: string) =>
    request<{ ok: true }>('POST', `/legacies/${legacyId}/death-verification/${requestId}/reject`),
}

// --- Chat ---

export const chatApi = {
  ask: (legacyId: string, question: string) =>
    request<ChatMessageResponse>('POST', `/legacies/${legacyId}/chat`, { json: { question } }),
  history: (legacyId: string) => request<ConversationLogEntry[]>('GET', `/legacies/${legacyId}/chat`),
  setPaused: (legacyId: string, paused: boolean) =>
    request<Membership>('PATCH', `/legacies/${legacyId}/chat/pause`, { json: { paused } }),
}
