/**
 * Base64 encoding/decoding utilities with UTF-8 support.
 * Handles Unicode characters correctly (e.g., Chinese, emojis).
 */

const UTF8_DECODER = new TextDecoder('utf-8')
const UTF8_ENCODER = new TextEncoder()

/**
 * Decode base64 string with UTF-8 support.
 * @param base64String - The base64 encoded string
 * @returns The decoded UTF-8 string, or original string if decoding fails
 */
/**
 * Helper function to decode a base64 string to UTF-8
 */
function decodeBase64ToUTF8(base64String: string): string {
  const binaryString = atob(base64String)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return UTF8_DECODER.decode(bytes)
}

/**
 * Decode base64 string with UTF-8 support.
 * @param base64String - The base64 encoded string
 * @returns The decoded UTF-8 string, or original string if decoding fails
 */
export function decodeBase64(base64String: string | null | undefined): string {
  if (!base64String) return ''

  try {
    let decoded = decodeBase64ToUTF8(base64String)

    // Check if the result is still base64 encoded
    // Consul sometimes double-encodes values
    const looksLikeBase64 =
      /^[\w+/=]+$/.test(decoded.trim()) &&
      decoded.trim().length % 4 === 0 &&
      !decoded.includes('\n') &&
      !decoded.includes(' ') &&
      !decoded.includes('{') &&
      !decoded.includes('[')

    if (looksLikeBase64) {
      try {
        decoded = decodeBase64ToUTF8(decoded)
      } catch {
        // Second decode failed, use first result
      }
    }

    return decoded
  } catch {
    // Return original string if decoding fails
    return base64String
  }
}

/**
 * Encode string to base64 with UTF-8 support.
 * @param str - The string to encode
 * @returns The base64 encoded string
 */
export function encodeBase64(str: string): string {
  try {
    // Encode string to UTF-8 bytes
    const bytes = UTF8_ENCODER.encode(str)

    // Convert bytes to binary string
    let binaryString = ''
    for (let i = 0; i < bytes.length; i++) {
      binaryString += String.fromCharCode(bytes[i]!)
    }

    // Convert binary string to base64
    return btoa(binaryString)
  } catch {
    // Fallback to simple base64 if UTF-8 encoding fails
    return btoa(str)
  }
}

/**
 * Check if a string is likely base64 encoded.
 * @param str - The string to check
 * @returns True if the string appears to be base64 encoded
 */
export function isBase64(str: string): boolean {
  if (!str || str.length === 0) return false
  // Remove any whitespace and padding
  const cleaned = str.trim().replace(/=+$/, '')
  // Base64 regex pattern
  const base64Regex = /^[A-Za-z0-9+/]*$/
  return base64Regex.test(cleaned) && cleaned.length % 4 === 0
}
