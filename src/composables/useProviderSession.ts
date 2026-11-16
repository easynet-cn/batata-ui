import { useRouter } from 'vue-router'
import type { ProviderType } from '@/types'
import { useProvider } from './useProvider'
import { useAuthStore } from '@/stores/auth'
import { switchProviderRoutes } from '@/router'

/** Default landing route for each provider after an authenticated entry. */
export function homeForProvider(provider: ProviderType): string {
  switch (provider) {
    case 'consul':
      return '/consul/dashboard'
    case 'apollo':
      return '/apollo/apps'
    default:
      return '/'
  }
}

/**
 * Single entry point for a user-initiated provider switch. It persists the new
 * provider, swaps the route tree and rebuilds `currentUser` from THAT
 * provider's own stored credentials, so switching back to an already signed-in
 * provider enters directly instead of asking for credentials again.
 */
export function useProviderSession() {
  const router = useRouter()
  const { provider, setProvider } = useProvider()
  const authStore = useAuthStore()

  function switchToProvider(target: ProviderType): { changed: boolean; authenticated: boolean } {
    const changed = provider.value !== target
    setProvider(target)
    switchProviderRoutes(target)
    // Rebuild identity from the target provider's keys. The router guard will
    // call restoreSession() again on navigation, but with no explicit provider
    // it resolves the same persisted preference — so the two stay consistent.
    const authenticated = authStore.restoreSession(target)
    return { changed, authenticated }
  }

  function enterProvider(target: ProviderType): void {
    const { authenticated } = switchToProvider(target)
    router.push(authenticated ? homeForProvider(target) : '/login')
  }

  return { switchToProvider, enterProvider, homeForProvider }
}
