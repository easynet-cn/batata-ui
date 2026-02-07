import { ref, type Ref } from 'vue'
import { toast } from '@/utils/error'

interface UseAsyncDataReturn<T> {
  data: Ref<T | undefined>
  loading: Ref<boolean>
  error: Ref<Error | undefined>
  execute: (...args: unknown[]) => Promise<T | undefined>
}

/**
 * Composable for unified async data fetching with loading/error states and toast notifications.
 *
 * @param fetcher - Async function that returns data
 * @param options - Optional configuration
 * @param options.immediate - Whether to execute immediately (default: false)
 * @param options.showErrorToast - Whether to show toast on error (default: true)
 * @param options.errorMessage - Custom error message for toast
 */
export function useAsyncData<T>(
  fetcher: (...args: unknown[]) => Promise<T>,
  options: {
    immediate?: boolean
    showErrorToast?: boolean
    errorMessage?: string
  } = {},
): UseAsyncDataReturn<T> {
  const { showErrorToast = true, errorMessage } = options

  const data = ref<T>() as Ref<T | undefined>
  const loading = ref(false)
  const error = ref<Error>()

  const execute = async (...args: unknown[]): Promise<T | undefined> => {
    loading.value = true
    error.value = undefined
    try {
      const result = await fetcher(...args)
      data.value = result
      return result
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e))
      error.value = err
      if (showErrorToast) {
        toast.error(errorMessage || err.message)
      }
      return undefined
    } finally {
      loading.value = false
    }
  }

  if (options.immediate) {
    execute()
  }

  return { data, loading, error, execute }
}

/**
 * Composable for async operations (mutations) with loading state and toast notifications.
 * Unlike useAsyncData, this is for actions like create/update/delete.
 *
 * @param operation - Async operation function
 * @param options - Optional configuration
 */
export function useAsyncOperation<TArgs extends unknown[], TResult = void>(
  operation: (...args: TArgs) => Promise<TResult>,
  options: {
    successMessage?: string
    errorMessage?: string
    showSuccessToast?: boolean
    showErrorToast?: boolean
    onSuccess?: (result: TResult) => void
    onError?: (error: Error) => void
  } = {},
) {
  const {
    showSuccessToast = false,
    showErrorToast = true,
    successMessage,
    errorMessage,
    onSuccess,
    onError,
  } = options

  const loading = ref(false)
  const error = ref<Error>()

  const execute = async (...args: TArgs): Promise<TResult | undefined> => {
    loading.value = true
    error.value = undefined
    try {
      const result = await operation(...args)
      if (showSuccessToast && successMessage) {
        toast.success(successMessage)
      }
      onSuccess?.(result)
      return result
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e))
      error.value = err
      if (showErrorToast) {
        toast.error(errorMessage || err.message)
      }
      onError?.(err)
      return undefined
    } finally {
      loading.value = false
    }
  }

  return { loading, error, execute }
}
