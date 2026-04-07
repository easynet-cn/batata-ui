import { reactive, ref, computed, watch, type UnwrapRef } from 'vue'
import { z } from 'zod'

export interface FormValidationOptions {
  // Auto-validate fields when they change
  validateOnChange?: boolean
}

/**
 * Get a nested value from an object using dot notation path.
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce(
    (acc: Record<string, unknown> | undefined, key) => {
      return (acc as Record<string, unknown> | undefined)?.[key] as
        | Record<string, unknown>
        | undefined
    },
    obj as Record<string, unknown> | undefined,
  )
}

/**
 * Set a nested value on an object using dot notation path.
 */
function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.split('.')
  const last = keys.pop()!
  const target = keys.reduce((acc: Record<string, unknown>, key) => {
    if (acc[key] === undefined || acc[key] === null) {
      acc[key] = {}
    }
    return acc[key] as Record<string, unknown>
  }, obj)
  target[last] = value
}

/**
 * Flatten Zod error map into dot-notation keyed record.
 * e.g. { dataId: ['required'], nested: { field: ['too short'] } }
 * becomes { 'dataId': 'required', 'nested.field': 'too short' }
 */
function flattenErrors(errors: z.ZodFormattedError<unknown>, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {}

  for (const [key, value] of Object.entries(errors)) {
    if (key === '_errors') continue

    const path = prefix ? `${prefix}.${key}` : key
    const node = value as z.ZodFormattedError<unknown>

    // If it has _errors with messages, use the first one
    if (node?._errors?.length) {
      result[path] = node._errors[0]
    }

    // Recurse into nested objects (skip _errors array)
    if (node && typeof node === 'object' && !Array.isArray(node)) {
      Object.assign(result, flattenErrors(node, path))
    }
  }

  return result
}

/**
 * Deep clone a plain object (sufficient for form values).
 */
function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

/**
 * Lightweight form validation composable powered by Zod + Vue reactivity.
 *
 * @param schema - A Zod object schema describing the form shape.
 * @param initialValues - Initial values matching the schema shape.
 * @param options - Optional configuration.
 */
export function useFormValidation<T extends z.ZodObject<z.ZodRawShape>>(
  schema: T,
  initialValues: z.input<T>,
  options: FormValidationOptions = {},
) {
  type FormValues = z.input<T>

  const { validateOnChange = false } = options

  // Reactive form field values
  const fields = reactive(deepClone(initialValues)) as UnwrapRef<FormValues>

  // Error messages keyed by field path (dot notation)
  const errors = ref<Record<string, string>>({})

  // Snapshot of initial values for dirty checking and reset
  const _initialValues = ref(deepClone(initialValues))

  // Whether the full form is valid (no errors present)
  const isValid = computed(() => Object.keys(errors.value).length === 0)

  // Whether any field differs from its initial value
  const isDirty = computed(() => {
    return JSON.stringify(fields) !== JSON.stringify(_initialValues.value)
  })

  /**
   * Validate the entire form against the schema.
   * Returns true if valid, false otherwise.
   */
  function validate(): boolean {
    const result = schema.safeParse(fields)

    if (result.success) {
      errors.value = {}
      return true
    }

    const formatted = result.error.format()
    errors.value = flattenErrors(formatted)
    return false
  }

  /**
   * Validate a single field by its path (supports dot notation).
   * Returns true if the field is valid, false otherwise.
   */
  function validateField(name: string): boolean {
    // Run full parse to get field-specific errors
    const result = schema.safeParse(fields)

    if (result.success) {
      // Clear error for this field
      const newErrors = { ...errors.value }
      delete newErrors[name]
      errors.value = newErrors
      return true
    }

    const formatted = result.error.format()
    const allErrors = flattenErrors(formatted)
    const newErrors = { ...errors.value }

    if (allErrors[name]) {
      newErrors[name] = allErrors[name]
    } else {
      delete newErrors[name]
    }

    errors.value = newErrors
    return !allErrors[name]
  }

  /**
   * Reset form to initial values and clear all errors.
   */
  function reset(): void {
    const fresh = deepClone(_initialValues.value)
    Object.assign(fields, fresh)
    errors.value = {}
  }

  /**
   * Set multiple field values at once. Supports partial updates.
   */
  function setValues(values: Partial<FormValues>): void {
    Object.assign(fields, values)
  }

  /**
   * Get the value of a field by dot-notation path.
   */
  function getFieldValue(path: string): unknown {
    return getNestedValue(fields as Record<string, unknown>, path)
  }

  /**
   * Set the value of a field by dot-notation path.
   */
  function setFieldValue(path: string, value: unknown): void {
    setNestedValue(fields as Record<string, unknown>, path, value)
  }

  /**
   * Get the error message for a specific field (or undefined if none).
   */
  function getFieldError(path: string): string | undefined {
    return errors.value[path]
  }

  // Auto-validate on field changes when enabled
  if (validateOnChange) {
    watch(
      () => deepClone(fields),
      () => {
        validate()
      },
      { deep: true },
    )
  }

  return {
    fields,
    errors,
    isValid,
    isDirty,
    validate,
    validateField,
    reset,
    setValues,
    getFieldValue,
    setFieldValue,
    getFieldError,
  }
}
