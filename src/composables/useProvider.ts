import { ref, computed } from 'vue'
import type { ProviderType } from '@/types'

const STORAGE_KEY = 'batata_provider'

const provider = ref<ProviderType>((localStorage.getItem(STORAGE_KEY) as ProviderType) || 'batata')

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
    provider.value = p
    localStorage.setItem(STORAGE_KEY, p)
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
  }
}
