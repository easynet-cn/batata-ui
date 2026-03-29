/**
 * SSE (Server-Sent Events) streaming utility for Copilot AI features.
 *
 * Uses native fetch + ReadableStream for chunked SSE parsing.
 * Supports THINKING, CONTENT, TOOL_CALL, and DONE event types.
 */

import type { StreamChunk, StreamResponseType } from '@/types/copilot'

export interface SSEStreamOptions {
  url: string
  payload: Record<string, unknown> | object
  headers?: Record<string, string>
  onThinking?: (chunk: string) => void
  onContent?: (chunk: string) => void
  onToolCall?: (chunk: string) => void
  onDone?: (data: StreamChunk) => void
  onError?: (error: string) => void
  onFinish?: () => void
}

export interface SSEStreamHandle {
  abort: () => void
}

/**
 * Build the full SSE URL with context path.
 * In development, the Vite proxy forwards /v3 to the backend.
 */
export function buildSSEUrl(path: string): string {
  const origin = window.location.origin
  // Path should start with /v3/console/copilot/...
  if (path.startsWith('/')) {
    return `${origin}${path}`
  }
  return `${origin}/${path}`
}

/**
 * Start an SSE stream using fetch + ReadableStream.
 *
 * Returns a handle with abort() to cancel the stream.
 */
export function startSSEStream(options: SSEStreamOptions): SSEStreamHandle {
  const controller = new AbortController()

  // Get auth token from localStorage
  const token = localStorage.getItem('accessToken') || ''
  const username = localStorage.getItem('username') || ''

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'text/event-stream',
    ...(token ? { accessToken: token } : {}),
    ...(username ? { username } : {}),
    ...options.headers,
  }

  // Start async streaming
  ;(async () => {
    try {
      const response = await fetch(options.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(options.payload),
        signal: controller.signal,
      })

      if (!response.ok) {
        const errorText = await response.text()
        options.onError?.(`HTTP ${response.status}: ${errorText.slice(0, 200)}`)
        options.onFinish?.()
        return
      }

      const reader = response.body?.getReader()
      if (!reader) {
        options.onError?.('Response body is not readable')
        options.onFinish?.()
        return
      }

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // Parse SSE events from buffer
        const events = buffer.split('\n\n')
        buffer = events.pop() || '' // Keep incomplete event in buffer

        for (const event of events) {
          if (!event.trim()) continue
          processSSEEvent(event, options)
        }
      }

      // Process any remaining data in buffer
      if (buffer.trim()) {
        processSSEEvent(buffer, options)
      }

      options.onFinish?.()
    } catch (error: unknown) {
      if ((error as Error).name === 'AbortError') {
        // Stream was cancelled
        options.onFinish?.()
        return
      }
      options.onError?.((error as Error).message || 'SSE stream failed')
      options.onFinish?.()
    }
  })()

  return {
    abort: () => controller.abort(),
  }
}

/**
 * Process a single SSE event block.
 */
function processSSEEvent(event: string, options: SSEStreamOptions): void {
  for (const line of event.split('\n')) {
    if (!line.startsWith('data: ')) continue

    const data = line.slice(6).trim()
    if (!data) continue

    // Try to parse as JSON StreamChunk
    try {
      const chunk = JSON.parse(data) as StreamChunk

      if (chunk.done) {
        options.onDone?.(chunk)
        return
      }

      switch (chunk.type as StreamResponseType) {
        case 'THINKING':
          options.onThinking?.(chunk.chunk)
          break
        case 'CONTENT':
          options.onContent?.(chunk.chunk)
          break
        case 'TOOL_CALL':
          options.onToolCall?.(chunk.chunk)
          break
        case 'DONE':
          options.onDone?.(chunk)
          break
      }
    } catch {
      // Non-JSON data line — treat as content
      if (data !== '[DONE]') {
        options.onContent?.(data)
      } else {
        options.onDone?.({ type: 'DONE', chunk: '', done: true })
      }
    }
  }
}

/**
 * Extract a JSON object from LLM response content.
 * Handles markdown code blocks and raw JSON.
 */
export function parseJsonFromContent<T>(content: string): T | null {
  if (!content.trim()) return null

  // Try direct JSON parse
  try {
    return JSON.parse(content) as T
  } catch {
    // Continue to other strategies
  }

  // Try extracting from markdown code block
  const codeBlockMatch = content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1]) as T
    } catch {
      // Continue
    }
  }

  // Try extracting JSON object by matching braces
  const firstBrace = content.indexOf('{')
  const lastBrace = content.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(content.slice(firstBrace, lastBrace + 1)) as T
    } catch {
      // Give up
    }
  }

  return null
}

/**
 * Filter SKILL.md from skill resources (matching Nacos behavior).
 */
export function filterSkillMdFromResources<T extends { resource?: Record<string, unknown> }>(
  skill: T,
): T {
  if (!skill.resource) return skill

  const filtered = { ...skill.resource }
  for (const key of Object.keys(filtered)) {
    if (key.toUpperCase().includes('SKILL.MD')) {
      delete filtered[key]
    }
  }

  return { ...skill, resource: filtered }
}
