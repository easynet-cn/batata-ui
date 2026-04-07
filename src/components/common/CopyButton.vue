<script setup lang="ts">
import { ref } from 'vue'
import { Copy, Check } from 'lucide-vue-next'
import { useI18n } from '@/i18n'

const { t } = useI18n()

const props = withDefaults(
  defineProps<{
    text: string
    label?: string
    size?: 'sm' | 'md'
  }>(),
  {
    label: undefined,
    size: 'md',
  },
)

const copied = ref(false)
let timer: ReturnType<typeof setTimeout> | null = null

async function copyToClipboard() {
  try {
    await navigator.clipboard.writeText(props.text)
    copied.value = true
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
    // Fallback: silent fail
  }
}
</script>

<template>
  <button
    type="button"
    class="btn btn-secondary inline-flex items-center gap-1.5 transition-colors"
    :class="size === 'sm' ? 'btn-sm' : ''"
    :title="copied ? t('copied') : t('copy')"
    @click="copyToClipboard"
  >
    <Check v-if="copied" :size="size === 'sm' ? 13 : 16" class="text-green-500" />
    <Copy v-else :size="size === 'sm' ? 13 : 16" />
    <span v-if="label || copied">{{ copied ? t('copied') : label }}</span>
  </button>
</template>
