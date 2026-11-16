/**
 * Keeps only http(s) links. URLs from search results, read pages and imported history are
 * untrusted: a `javascript:` or `data:` URL opened from the page would run in its origin and
 * could read the stored API key and conversations.
 */
export const toSafeHttpUrl = (url: string | null | undefined): string | undefined => {
  if (!url) {
    return undefined
  }
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
      ? parsed.toString()
      : undefined
  } catch {
    return undefined
  }
}
