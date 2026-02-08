import { ref, computed } from 'vue'
import type { ProviderType } from '@/types'
import { storage } from './useStorage'

const STORAGE_KEY = 'batata_provider'

const provider = ref<ProviderType>((storage.get(STORAGE_KEY) as ProviderType) || 'batata')

// Provider change callbacks
const onChangeCallbacks: Array<(p: ProviderType) => void> = []

export function useProvider() {
  const isBatata = computed(() => provider.value === 'batata')
  const isConsul = computed(() => provider.value === 'consul')

  // Tailwind class helpers for provider-aware styling
  const providerColor = computed(() => (provider.value === 'batata' ? 'blue' : 'fuchsia'))

  const providerBgClass = computed(() =>
    provider.value === 'batata' ? 'bg-blue-600' : 'bg-fuchsia-600',
  )

  const providerHoverBgClass = computed(() =>
    provider.value === 'batata' ? 'hover:bg-blue-700' : 'hover:bg-fuchsia-700',
  )

  const providerTextClass = computed(() =>
    provider.value === 'batata' ? 'text-blue-600' : 'text-fuchsia-600',
  )

  const providerShadowClass = computed(() =>
    provider.value === 'batata' ? 'shadow-blue-600/30' : 'shadow-fuchsia-600/30',
  )

  const providerLetter = computed(() => (provider.value === 'batata' ? 'B' : 'C'))

  function setProvider(p: ProviderType) {
    const previous = provider.value
    provider.value = p
    storage.set(STORAGE_KEY, p)

    // Notify listeners on change
    if (previous !== p) {
      onChangeCallbacks.forEach((cb) => cb(p))
    }
  }

  function onProviderChange(callback: (p: ProviderType) => void) {
    onChangeCallbacks.push(callback)
  }

  return {
    provider,
    isBatata,
    isConsul,
    providerColor,
    providerBgClass,
    providerHoverBgClass,
    providerTextClass,
    providerShadowClass,
    providerLetter,
    setProvider,
    onProviderChange,
  }
}
