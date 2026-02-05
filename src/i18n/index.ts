import { ref, computed } from 'vue'
import { translations, type Language, type TranslationKeys } from './translations'

const STORAGE_KEY = 'batata_lang'

const currentLanguage = ref<Language>((localStorage.getItem(STORAGE_KEY) as Language) || 'zh')

export function useI18n() {
  const language = computed(() => currentLanguage.value)

  const setLanguage = (lang: Language) => {
    currentLanguage.value = lang
    localStorage.setItem(STORAGE_KEY, lang)
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
