import { ref, computed } from 'vue'
import { translations, type Language, type TranslationKeys } from './translations'
import { storage } from '@/composables/useStorage'

const STORAGE_KEY = 'batata_lang'

const currentLanguage = ref<Language>((storage.get(STORAGE_KEY) as Language) || 'zh')

export function useI18n() {
  const language = computed(() => currentLanguage.value)

  const setLanguage = (lang: Language) => {
    currentLanguage.value = lang
    storage.set(STORAGE_KEY, lang)
  }

  const t = (key: TranslationKeys): string => {
    return translations[currentLanguage.value][key] || key
  }

  return {
    language,
    setLanguage,
    t,
  }
}

export type { Language, TranslationKeys }
