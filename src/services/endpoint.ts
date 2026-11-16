/**
 * Where chat requests go, and what that server can do.
 *
 * - `deepseek`: the DeepSeek API, with its extensions (Files API, web search, link reading,
 *   titles, `latest_reminder`, safety check, ASR / TTS).
 * - `compatible`: any server speaking the plain Anthropic Messages API, such as a local Ollama
 *   (`http://127.0.0.1:11434/v1`). Only standard features are used; the API key is optional.
 *
 * Build-time defaults come from `createConfig` in rspack.config.ts (or the `CHAT_API_*`
 * environment variables); the Settings dialog can override them per browser.
 */

export type ApiProvider = 'deepseek' | 'compatible'

export type Endpoint = {
  provider: ApiProvider
  /** Messages API base URL, without a trailing slash, e.g. `https://api.deepseek.com/anthropic/v1` */
  baseUrl: string
  /** Model sent in every request */
  model: string
}

/** What the configured server supports; the UI hides everything that is false. */
export type EndpointFeatures = {
  attachments: boolean
  search: boolean
  readUrl: boolean
  titles: boolean
  speech: boolean
  latestReminder: boolean
  safetyCheck: boolean
  apiKeyRequired: boolean
}

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])

/** True for addresses that never leave this machine. */
export const isLoopbackUrl = (url: URL): boolean =>
  LOOPBACK_HOSTS.has(url.hostname) || url.hostname.endsWith('.localhost')

/**
 * Validates a base URL: https anywhere, plain http only on this machine (an API key must not
 * travel in clear text). Returns the normalized URL without a trailing slash, or null.
 */
export const normalizeBaseUrl = (value: string): string | null => {
  let url: URL
  try {
    url = new URL(value.trim())
  } catch {
    return null
  }
  if (url.username || url.password || url.search || url.hash) {
    return null
  }
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && isLoopbackUrl(url))) {
    return null
  }
  return url.toString().replace(/\/+$/, '')
}

const isProvider = (value: unknown): value is ApiProvider =>
  value === 'deepseek' || value === 'compatible'

/** Build-time default, injected by rspack.config.ts */
export const DEFAULT_ENDPOINT: Endpoint = {
  provider: isProvider(__API_PROVIDER__) ? __API_PROVIDER__ : 'deepseek',
  baseUrl: normalizeBaseUrl(__API_BASE_URL__) ?? 'https://api.deepseek.com/anthropic/v1',
  model: __API_MODEL__ || 'deepseek-flash',
}

/** Reads a stored endpoint; anything invalid falls back to the build-time default. */
export const parseEndpoint = (raw: string | null): Endpoint => {
  if (!raw) {
    return DEFAULT_ENDPOINT
  }
  try {
    const value = JSON.parse(raw) as Partial<Endpoint>
    const baseUrl = typeof value.baseUrl === 'string' ? normalizeBaseUrl(value.baseUrl) : null
    const model = typeof value.model === 'string' ? value.model.trim() : ''
    if (!isProvider(value.provider) || !baseUrl || !model) {
      return DEFAULT_ENDPOINT
    }
    return { provider: value.provider, baseUrl, model }
  } catch {
    return DEFAULT_ENDPOINT
  }
}

export const getFeatures = ({ provider }: Endpoint): EndpointFeatures => {
  const deepseek = provider === 'deepseek'
  return {
    attachments: deepseek,
    search: deepseek,
    readUrl: deepseek,
    titles: deepseek,
    speech: deepseek,
    latestReminder: deepseek,
    safetyCheck: deepseek,
    apiKeyRequired: deepseek,
  }
}

/** Origin of the DeepSeek API, for its non-Messages endpoints (models, ASR / TTS). */
export const apiOrigin = ({ baseUrl }: Endpoint): string => new URL(baseUrl).origin

/** The public DeepSeek API, offered when the build default is another server. */
export const DEEPSEEK_ENDPOINT: Endpoint = {
  provider: 'deepseek',
  baseUrl: 'https://api.deepseek.com/anthropic/v1',
  model: 'deepseek-flash',
}
