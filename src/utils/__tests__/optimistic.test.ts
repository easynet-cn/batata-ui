import { describe, it, expect, vi } from 'vitest'
import { optimisticUpdate } from '../optimistic'

describe('optimisticUpdate', () => {
  it('applies optimistic change and returns API result on success', async () => {
    const optimisticFn = vi.fn()
    const apiFn = vi.fn().mockResolvedValue({ id: 1, name: 'created' })
    const rollbackFn = vi.fn()

    const result = await optimisticUpdate({ optimisticFn, apiFn, rollbackFn })

    expect(optimisticFn).toHaveBeenCalledOnce()
    expect(apiFn).toHaveBeenCalledOnce()
    expect(rollbackFn).not.toHaveBeenCalled()
    expect(result).toEqual({ id: 1, name: 'created' })
  })

  it('calls optimisticFn before apiFn', async () => {
    const callOrder: string[] = []
    const optimisticFn = vi.fn(() => callOrder.push('optimistic'))
    const apiFn = vi.fn(async () => {
      callOrder.push('api')
      return 'done'
    })
    const rollbackFn = vi.fn()

    await optimisticUpdate({ optimisticFn, apiFn, rollbackFn })

    expect(callOrder).toEqual(['optimistic', 'api'])
  })

  it('rolls back on API failure', async () => {
    const optimisticFn = vi.fn()
    const apiFn = vi.fn().mockRejectedValue(new Error('API error'))
    const rollbackFn = vi.fn()

    await expect(optimisticUpdate({ optimisticFn, apiFn, rollbackFn })).rejects.toThrow('API error')

    expect(optimisticFn).toHaveBeenCalledOnce()
    expect(rollbackFn).toHaveBeenCalledOnce()
  })

  it('calls onError callback on failure', async () => {
    const error = new Error('Failed')
    const onError = vi.fn()
    const optimisticFn = vi.fn()
    const apiFn = vi.fn().mockRejectedValue(error)
    const rollbackFn = vi.fn()

    await expect(optimisticUpdate({ optimisticFn, apiFn, rollbackFn, onError })).rejects.toThrow(
      'Failed',
    )

    expect(onError).toHaveBeenCalledWith(error)
  })

  it('re-throws error after rollback and onError', async () => {
    const apiFn = vi.fn().mockRejectedValue(new Error('Network down'))
    const rollbackFn = vi.fn()
    const onError = vi.fn()

    await expect(
      optimisticUpdate({
        optimisticFn: vi.fn(),
        apiFn,
        rollbackFn,
        onError,
      }),
    ).rejects.toThrow('Network down')

    // Both rollback and onError should have been called before re-throw
    expect(rollbackFn).toHaveBeenCalledOnce()
    expect(onError).toHaveBeenCalledOnce()
  })

  it('works without onError callback', async () => {
    const apiFn = vi.fn().mockRejectedValue(new Error('err'))
    const rollbackFn = vi.fn()

    await expect(
      optimisticUpdate({
        optimisticFn: vi.fn(),
        apiFn,
        rollbackFn,
      }),
    ).rejects.toThrow('err')

    expect(rollbackFn).toHaveBeenCalledOnce()
  })
})
