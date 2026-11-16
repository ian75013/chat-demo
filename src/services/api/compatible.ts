import type { CreateMessageRequest, MessageParam } from './types.js'

/**
 * Turns a DeepSeek request into a plain Anthropic Messages request, for servers that only
 * implement the standard API (Ollama, llama.cpp, vLLM…).
 *
 * Dropped: the DeepSeek identity prompt, `safety_check`, `title`, server tools (web search,
 * link reading) and their history blocks, files referenced by DeepSeek `file_id`s, and the
 * user's location. The last `latest_reminder` (date, weekday, reply language) moves into the
 * system prompt, since `latest_reminder` is not a standard role.
 */

/** Anthropic requires max_tokens; DeepSeek does not. */
export const COMPATIBLE_MAX_TOKENS = 8192
/** Reasoning budget when deep thinking is on; must stay below max_tokens. */
export const COMPATIBLE_THINKING_BUDGET = 4096

const SYSTEM_PROMPT = 'You are a helpful assistant.'
const MISSING_ATTACHMENT = '[Attachment not available on this server]'

export type CompatibleRequest = {
  model: string
  system: string
  max_tokens: number
  messages: Exclude<MessageParam, { role: 'latest_reminder' }>[]
  thinking: { type: 'enabled'; budget_tokens: number } | { type: 'disabled' }
}

/**
 * `latest_reminder` is "date,weekday,location,Web,language" (see latestReminder.ts).
 * The location is left out: it is not needed to answer and should not leave the browser.
 */
const reminderContext = (reminder: string): string => {
  const parts = reminder.split(',')
  if (parts.length < 5) {
    return ''
  }
  const [date, weekday] = parts
  const language = parts.at(-1) ?? ''
  return `Current date: ${date} (${weekday}). ${language}`.trim()
}

export const toCompatibleRequest = (
  body: CreateMessageRequest,
  model: string
): CompatibleRequest => {
  const messages: CompatibleRequest['messages'] = []
  let reminder = ''
  for (const message of body.messages) {
    if (message.role === 'latest_reminder') {
      reminder = message.content
      continue
    }
    if (message.role === 'user') {
      if (typeof message.content === 'string') {
        messages.push(message)
        continue
      }
      const hasFile = message.content.some((block) => block.type !== 'text')
      const content = message.content.filter((block) => block.type === 'text')
      messages.push({
        role: 'user',
        content: hasFile ? [...content, { type: 'text', text: MISSING_ATTACHMENT }] : content,
      })
      continue
    }
    const content = message.content.filter(
      (block) => block.type === 'text' || block.type === 'thinking'
    )
    // A reply made only of DeepSeek tool blocks has nothing a standard server can replay.
    if (content.length > 0) {
      messages.push({ role: 'assistant', content })
    }
  }
  const context = reminder ? reminderContext(reminder) : ''
  return {
    model,
    system: context ? `${SYSTEM_PROMPT}\n\n${context}` : SYSTEM_PROMPT,
    max_tokens: COMPATIBLE_MAX_TOKENS,
    messages,
    thinking:
      body.thinking.type === 'enabled'
        ? { type: 'enabled', budget_tokens: COMPATIBLE_THINKING_BUDGET }
        : { type: 'disabled' },
  }
}
