import { describe, it, expect, vi, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { useAsyncData, useAsyncOperation } from '../useAsyncData'
import { toast } from '@/utils/error'

vi.mock('@/utils/error', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

describe('useAsyncData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches data successfully', async () => {
    const fetcher = vi.fn().mockResolvedValue('test data')
    const { data, loading, error, execute } = useAsyncData(fetcher)

    expect(data.value).toBeUndefined()
    expect(loading.value).toBe(false)

    const result = await execute()

    expect(result).toBe('test data')
    expect(data.value).toBe('test data')
    expect(loading.value).toBe(false)
    expect(error.value).toBeUndefined()
  })

  it('handles errors with toast notification', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('fetch failed'))
    const { data, loading, error, execute } = useAsyncData(fetcher)

    await execute()

    expect(data.value).toBeUndefined()
    expect(loading.value).toBe(false)
    expect(error.value).toBeInstanceOf(Error)
    expect(error.value?.message).toBe('fetch failed')
    expect(toast.error).toHaveBeenCalledWith('fetch failed')
  })

  it('uses custom error message', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('original'))
    const { execute } = useAsyncData(fetcher, { errorMessage: 'Custom error' })

    await execute()

    expect(toast.error).toHaveBeenCalledWith('Custom error')
  })

  it('suppresses error toast when showErrorToast is false', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('silent'))
    const { execute } = useAsyncData(fetcher, { showErrorToast: false })

    await execute()

    expect(toast.error).not.toHaveBeenCalled()
  })

  it('sets loading state during execution', async () => {
    let resolvePromise: (value: string) => void
    const fetcher = vi.fn().mockImplementation(
      () =>
        new Promise<string>((resolve) => {
          resolvePromise = resolve
        }),
    )
    const { loading, execute } = useAsyncData(fetcher)

    const promise = execute()
    await nextTick()
    expect(loading.value).toBe(true)

    resolvePromise!('done')
    await promise
    expect(loading.value).toBe(false)
  })

  it('handles non-Error thrown values', async () => {
    const fetcher = vi.fn().mockRejectedValue('string error')
    const { error, execute } = useAsyncData(fetcher)

    await execute()

    expect(error.value).toBeInstanceOf(Error)
    expect(error.value?.message).toBe('string error')
  })
})

describe('useAsyncOperation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('executes operation successfully', async () => {
    const operation = vi.fn().mockResolvedValue('result')
    const { loading, error, execute } = useAsyncOperation(operation)

    const result = await execute()

    expect(result).toBe('result')
    expect(loading.value).toBe(false)
    expect(error.value).toBeUndefined()
  })

  it('shows success toast when configured', async () => {
    const operation = vi.fn().mockResolvedValue(undefined)
    const { execute } = useAsyncOperation(operation, {
      showSuccessToast: true,
      successMessage: 'Done!',
    })

    await execute()

    expect(toast.success).toHaveBeenCalledWith('Done!')
  })

  it('calls onSuccess callback', async () => {
    const onSuccess = vi.fn()
    const operation = vi.fn().mockResolvedValue('value')
    const { execute } = useAsyncOperation(operation, { onSuccess })

    await execute()

    expect(onSuccess).toHaveBeenCalledWith('value')
  })

  it('handles errors and calls onError callback', async () => {
    const onError = vi.fn()
    const operation = vi.fn().mockRejectedValue(new Error('op failed'))
    const { error, execute } = useAsyncOperation(operation, { onError })

    await execute()

    expect(error.value?.message).toBe('op failed')
    expect(toast.error).toHaveBeenCalledWith('op failed')
    expect(onError).toHaveBeenCalledWith(expect.any(Error))
  })

  it('passes arguments to operation', async () => {
    const operation = vi.fn().mockResolvedValue(undefined)
    const { execute } = useAsyncOperation(operation)

    await execute('arg1', 'arg2')

    expect(operation).toHaveBeenCalledWith('arg1', 'arg2')
  })
})
