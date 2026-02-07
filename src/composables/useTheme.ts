import { ref, computed, watchEffect } from 'vue'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'batata_theme'

const theme = ref<Theme>((localStorage.getItem(STORAGE_KEY) as Theme) || 'light')

function applyTheme(t: Theme) {
  if (t === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

// Apply on init
applyTheme(theme.value)

watchEffect(() => {
  applyTheme(theme.value)
  localStorage.setItem(STORAGE_KEY, theme.value)
})

export function useTheme() {
  const isDark = computed(() => theme.value === 'dark')

  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }

  function setTheme(t: Theme) {
    theme.value = t
  }

  return {
    theme,
    isDark,
    toggleTheme,
    setTheme,
  }
}
