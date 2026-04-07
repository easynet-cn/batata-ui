<script setup lang="ts">
import { ref, watch } from 'vue'
import { Search, X } from 'lucide-vue-next'
import { useDebounceFn } from '@vueuse/core'
import { useI18n } from '@/i18n'

const { t } = useI18n()

const props = withDefaults(
  defineProps<{
    modelValue: string
    placeholder?: string
    debounce?: number
  }>(),
  {
    placeholder: undefined,
    debounce: 300,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  search: [value: string]
}>()

const localValue = ref(props.modelValue)

// Sync external changes to local value
watch(
  () => props.modelValue,
  (val) => {
    localValue.value = val
  },
)

const debouncedEmit = useDebounceFn((value: string) => {
  emit('update:modelValue', value)
  emit('search', value)
}, props.debounce)

function onInput(event: Event) {
  const value = (event.target as HTMLInputElement).value
  localValue.value = value
  debouncedEmit(value)
}

function clear() {
  localValue.value = ''
  emit('update:modelValue', '')
  emit('search', '')
}
</script>

<template>
  <div class="relative">
    <Search
      :size="16"
      class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none"
    />
    <input
      type="text"
      :value="localValue"
      :placeholder="placeholder ?? t('searchPlaceholder')"
      class="w-full pl-9 pr-9 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
      @input="onInput"
    />
    <button
      v-if="localValue"
      type="button"
      :aria-label="t('clearSearch')"
      class="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-700 transition-colors"
      @click="clear"
    >
      <X :size="14" />
    </button>
  </div>
</template>
