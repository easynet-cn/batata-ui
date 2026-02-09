import type { ConfigType } from '@/types'
import * as yaml from 'yaml'
import * as TOML from 'smol-toml'

export interface FormatResult {
  success: boolean
  result: string
  error?: string
}

export interface ValidateResult {
  valid: boolean
  error?: string
}

export function formatContent(content: string, type: ConfigType): FormatResult {
  if (!content.trim()) {
    return { success: true, result: content }
  }

  try {
    switch (type) {
      case 'json': {
        const parsed = JSON.parse(content)
        return { success: true, result: JSON.stringify(parsed, null, 2) }
      }
      case 'xml':
      case 'html': {
        return { success: true, result: formatXml(content) }
      }
      case 'yaml': {
        const parsed = yaml.parse(content)
        return { success: true, result: yaml.stringify(parsed) }
      }
      case 'toml': {
        const parsed = TOML.parse(content)
        return { success: true, result: TOML.stringify(parsed) }
      }
      case 'properties': {
        return { success: true, result: formatProperties(content) }
      }
      case 'text':
      default:
        return { success: true, result: content }
    }
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e)
    return { success: false, result: content, error }
  }
}

export function validateContent(content: string, type: ConfigType): ValidateResult {
  if (!content.trim()) {
    return { valid: true }
  }

  try {
    switch (type) {
      case 'json': {
        JSON.parse(content)
        return { valid: true }
      }
      case 'xml': {
        const parser = new DOMParser()
        const doc = parser.parseFromString(content, 'application/xml')
        const errorNode = doc.querySelector('parsererror')
        if (errorNode) {
          return { valid: false, error: errorNode.textContent || 'Invalid XML' }
        }
        return { valid: true }
      }
      case 'html': {
        const parser = new DOMParser()
        parser.parseFromString(content, 'text/html')
        return { valid: true }
      }
      case 'yaml': {
        yaml.parse(content)
        return { valid: true }
      }
      case 'toml': {
        TOML.parse(content)
        return { valid: true }
      }
      case 'properties': {
        return validateProperties(content)
      }
      case 'text':
      default:
        return { valid: true }
    }
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e)
    return { valid: false, error }
  }
}

function formatXml(xml: string): string {
  let formatted = ''
  let indent = 0
  const lines = xml.replace(/(>)\s*(<)/g, '$1\n$2').split('\n')

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) continue

    if (line.startsWith('</')) {
      indent = Math.max(indent - 1, 0)
    }

    formatted += '  '.repeat(indent) + line + '\n'

    if (
      line.startsWith('<') &&
      !line.startsWith('</') &&
      !line.startsWith('<?') &&
      !line.endsWith('/>') &&
      !/<\/[^>]+>$/.test(line)
    ) {
      indent++
    }
  }

  return formatted.trimEnd()
}

function formatProperties(content: string): string {
  const lines = content.split('\n')
  const entries: { key: string; value: string; comment?: boolean }[] = []

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) continue
    if (line.startsWith('#') || line.startsWith('!')) {
      entries.push({ key: line, value: '', comment: true })
      continue
    }
    const separatorIdx = line.search(/[=:]/)
    if (separatorIdx > 0) {
      const key = line.substring(0, separatorIdx).trim()
      const value = line.substring(separatorIdx + 1).trim()
      entries.push({ key, value })
    } else {
      entries.push({ key: line, value: '', comment: true })
    }
  }

  return entries.map((e) => (e.comment ? e.key : `${e.key}=${e.value}`)).join('\n')
}

function validateProperties(content: string): ValidateResult {
  const lines = content.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i]
    if (rawLine === undefined) continue
    const line = rawLine.trim()
    if (!line || line.startsWith('#') || line.startsWith('!')) continue
    if (line.search(/[=:]/) <= 0) {
      return { valid: false, error: `Line ${i + 1}: missing key=value separator` }
    }
  }
  return { valid: true }
}
