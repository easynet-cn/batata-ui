/**
 * Convert a plain object to URLSearchParams, skipping undefined/null values.
 */
export function toFormData(
  data: Record<string, string | number | boolean | undefined | null>,
): URLSearchParams {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value))
    }
  }
  return params
}

/**
 * Headers for form-urlencoded POST requests.
 */
export const FORM_HEADERS = {
  'Content-Type': 'application/x-www-form-urlencoded',
} as const
