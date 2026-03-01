import { ref, computed } from 'vue'
import type { ProviderType } from '@/types'
import { storage } from './useStorage'

const STORAGE_KEY = 'batata_provider'

const provider = ref<ProviderType>((storage.get(STORAGE_KEY) as ProviderType) || 'batata')
const consulEnabled = ref(false)

// Provider change callbacks
const onChangeCallbacks: Array<(p: ProviderType) => void> = []

export function useProvider() {
  const isBatata = computed(() => provider.value === 'batata')
  const isConsul = computed(() => provider.value === 'consul')

  // Tailwind class helpers for provider-aware styling
  const providerColor = computed(() => {
    switch (provider.value) {
      case 'consul':
        return 'fuchsia'
      default:
        return 'blue'
    }
  })

  const providerBgClass = computed(() => {
    switch (provider.value) {
      case 'consul':
        return 'bg-fuchsia-600'
      default:
        return 'bg-blue-600'
    }
  })

  const providerHoverBgClass = computed(() => {
    switch (provider.value) {
      case 'consul':
        return 'hover:bg-fuchsia-700'
      default:
        return 'hover:bg-blue-700'
    }
  })

  const providerTextClass = computed(() => {
    switch (provider.value) {
      case 'consul':
        return 'text-fuchsia-600'
      default:
        return 'text-blue-600'
    }
  })

  const providerShadowClass = computed(() => {
    switch (provider.value) {
      case 'consul':
        return 'shadow-fuchsia-600/30'
      default:
        return 'shadow-blue-600/30'
    }
  })

  const providerLetter = computed(() => {
    switch (provider.value) {
      case 'consul':
        return 'C'
      default:
        return 'B'
    }
  })

  function setProvider(p: ProviderType) {
    const previous = provider.value
    provider.value = p
    storage.set(STORAGE_KEY, p)

    // Notify listeners on change
    if (previous !== p) {
      onChangeCallbacks.forEach((cb) => cb(p))
    }
  }

  function setConsulEnabled(enabled: boolean) {
    consulEnabled.value = enabled
  }

  function onProviderChange(callback: (p: ProviderType) => void) {
    onChangeCallbacks.push(callback)
  }

  return {
    provider,
    isBatata,
    isConsul,
    consulEnabled,
    providerColor,
    providerBgClass,
    providerHoverBgClass,
    providerTextClass,
    providerShadowClass,
    providerLetter,
    setProvider,
    setConsulEnabled,
    onProviderChange,
  }
}
