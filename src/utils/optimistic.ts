/**
 * Helper for optimistic UI updates.
 *
 * Applies a local change immediately, then executes the real API call.
 * If the API call fails, the local change is rolled back automatically.
 */
export async function optimisticUpdate<T>(options: {
  optimisticFn: () => void
  apiFn: () => Promise<T>
  rollbackFn: () => void
  onError?: (error: unknown) => void
}): Promise<T> {
  const { optimisticFn, apiFn, rollbackFn, onError } = options

  // Apply optimistic change immediately
  optimisticFn()

  try {
    return await apiFn()
  } catch (error) {
    // Rollback on failure
    rollbackFn()

    if (onError) {
      onError(error)
    }

    throw error
  }
}
