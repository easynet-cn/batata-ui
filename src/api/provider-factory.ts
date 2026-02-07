import type { ProviderType } from '@/types'
import type { ProviderCapabilities } from './types'
import { batataCapabilities, consulCapabilities } from './types'

export function getProviderCapabilities(provider: ProviderType): ProviderCapabilities {
  return provider === 'consul' ? consulCapabilities : batataCapabilities
}
