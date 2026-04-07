import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { useFormValidation } from '../useFormValidation'

const schema = z.object({
  dataId: z.string().min(1, 'dataId is required'),
  group: z.string().min(1, 'group is required'),
  content: z.string().min(1, 'content is required'),
})

const initialValues = {
  dataId: '',
  group: 'DEFAULT_GROUP',
  content: '',
}

describe('useFormValidation', () => {
  describe('basic validation', () => {
    it('returns false for invalid data and populates errors', () => {
      const { validate, errors, isValid } = useFormValidation(schema, initialValues)

      const result = validate()

      expect(result).toBe(false)
      expect(isValid.value).toBe(false)
      expect(errors.value).toHaveProperty('dataId')
      expect(errors.value).toHaveProperty('content')
    })

    it('returns true for valid data and clears errors', () => {
      const { fields, validate, errors, isValid } = useFormValidation(schema, initialValues)

      fields.dataId = 'test.yaml'
      fields.content = 'key: value'

      const result = validate()

      expect(result).toBe(true)
      expect(isValid.value).toBe(true)
      expect(Object.keys(errors.value)).toHaveLength(0)
    })

    it('shows correct error messages', () => {
      const { validate, errors } = useFormValidation(schema, initialValues)

      validate()

      expect(errors.value['dataId']).toBe('dataId is required')
      expect(errors.value['content']).toBe('content is required')
      // group has a default value so it should not have an error
      expect(errors.value['group']).toBeUndefined()
    })
  })

  describe('field-level validation', () => {
    it('validates a single field', () => {
      const { validateField, errors } = useFormValidation(schema, initialValues)

      const result = validateField('dataId')

      expect(result).toBe(false)
      expect(errors.value['dataId']).toBe('dataId is required')
      // Other field errors should not be set by single-field validation
      expect(errors.value['content']).toBeUndefined()
    })

    it('clears error for a valid field', () => {
      const { fields, validate, validateField, errors } = useFormValidation(schema, initialValues)

      // First validate all to populate errors
      validate()
      expect(errors.value['dataId']).toBeDefined()

      // Fix the field and validate just that field
      fields.dataId = 'test.yaml'
      const result = validateField('dataId')

      expect(result).toBe(true)
      expect(errors.value['dataId']).toBeUndefined()
      // Other errors should remain
      expect(errors.value['content']).toBeDefined()
    })
  })

  describe('getFieldError', () => {
    it('returns error message for a field with errors', () => {
      const { validate, getFieldError } = useFormValidation(schema, initialValues)

      validate()

      expect(getFieldError('dataId')).toBe('dataId is required')
    })

    it('returns undefined for a field without errors', () => {
      const { validate, getFieldError } = useFormValidation(schema, initialValues)

      validate()

      expect(getFieldError('group')).toBeUndefined()
    })
  })

  describe('reset', () => {
    it('resets fields to initial values', () => {
      const { fields, reset } = useFormValidation(schema, initialValues)

      fields.dataId = 'changed'
      fields.group = 'CHANGED_GROUP'

      reset()

      expect(fields.dataId).toBe('')
      expect(fields.group).toBe('DEFAULT_GROUP')
    })

    it('clears all errors on reset', () => {
      const { validate, reset, errors } = useFormValidation(schema, initialValues)

      validate()
      expect(Object.keys(errors.value).length).toBeGreaterThan(0)

      reset()
      expect(Object.keys(errors.value)).toHaveLength(0)
    })
  })

  describe('isDirty', () => {
    it('is false initially', () => {
      const { isDirty } = useFormValidation(schema, initialValues)

      expect(isDirty.value).toBe(false)
    })

    it('becomes true when a field changes', () => {
      const { fields, isDirty } = useFormValidation(schema, initialValues)

      fields.dataId = 'modified'

      expect(isDirty.value).toBe(true)
    })

    it('becomes false after reset', () => {
      const { fields, isDirty, reset } = useFormValidation(schema, initialValues)

      fields.dataId = 'modified'
      expect(isDirty.value).toBe(true)

      reset()
      expect(isDirty.value).toBe(false)
    })
  })

  describe('setValues', () => {
    it('sets multiple field values at once', () => {
      const { fields, setValues } = useFormValidation(schema, initialValues)

      setValues({ dataId: 'new-id', content: 'new-content' })

      expect(fields.dataId).toBe('new-id')
      expect(fields.content).toBe('new-content')
      expect(fields.group).toBe('DEFAULT_GROUP') // unchanged
    })
  })

  describe('getFieldValue / setFieldValue', () => {
    it('gets a field value by path', () => {
      const { fields, getFieldValue } = useFormValidation(schema, initialValues)

      fields.dataId = 'test'
      expect(getFieldValue('dataId')).toBe('test')
    })

    it('sets a field value by path', () => {
      const { fields, setFieldValue } = useFormValidation(schema, initialValues)

      setFieldValue('dataId', 'set-via-path')
      expect(fields.dataId).toBe('set-via-path')
    })
  })

  describe('nested schema', () => {
    const nestedSchema = z.object({
      name: z.string().min(1, 'name required'),
      address: z.object({
        city: z.string().min(1, 'city required'),
      }),
    })

    it('validates nested fields and uses dot-notation errors', () => {
      const { validate, errors } = useFormValidation(nestedSchema, {
        name: '',
        address: { city: '' },
      })

      validate()

      expect(errors.value['name']).toBe('name required')
      expect(errors.value['address.city']).toBe('city required')
    })
  })
})
