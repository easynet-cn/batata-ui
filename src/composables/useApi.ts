import { computed } from 'vue'
import { useProvider } from './useProvider'
import { getProviderCapabilities } from '@/api/provider-factory'

/**
 * Composable that provides reactive provider capabilities.
 * Views use this for feature detection.
 */
export function useApi() {
  const { provider } = useProvider()

  const capabilities = computed(() => getProviderCapabilities(provider.value))

  return {
    capabilities,
  }
}
