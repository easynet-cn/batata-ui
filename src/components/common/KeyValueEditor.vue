<script setup lang="ts">
import { computed } from 'vue'
import { Plus, X } from 'lucide-vue-next'
import { useI18n } from '@/i18n'

const { t } = useI18n()

const props = withDefaults(
  defineProps<{
    modelValue: Record<string, string>
    keyPlaceholder?: string
    valuePlaceholder?: string
    readonly?: boolean
  }>(),
  {
    keyPlaceholder: 'Key',
    valuePlaceholder: 'Value',
    readonly: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, string>]
}>()

// Convert the Record to an array of entries for rendering
const entries = computed(() => {
  const obj = props.modelValue
  const keys = Object.keys(obj)
  if (keys.length === 0 && !props.readonly) {
    // Show one empty row by default in edit mode
    return [{ key: '', value: '' }]
  }
  return keys.map((key) => ({ key, value: obj[key] }))
})

function updateKey(index: number, newKey: string) {
  const current = entries.value
  const result: Record<string, string> = {}
  current.forEach((entry, i) => {
    const k = i === index ? newKey : entry.key
    if (k !== '') {
      result[k] = entry.value
    } else if (i === index) {
      // Keep empty key entry so the row persists while typing
      result[k] = entry.value
    }
  })
  emit('update:modelValue', result)
}

function updateValue(index: number, newValue: string) {
  const current = entries.value
  const result: Record<string, string> = {}
  current.forEach((entry, i) => {
    result[entry.key] = i === index ? newValue : entry.value
  })
  emit('update:modelValue', result)
}

function addRow() {
  const result: Record<string, string> = { ...props.modelValue }
  // Find a unique empty key placeholder
  let emptyKey = ''
  let counter = 0
  while (emptyKey in result) {
    counter++
    emptyKey = `key_${counter}`
  }
  result[emptyKey] = ''
  emit('update:modelValue', result)
}

function removeRow(index: number) {
  const current = entries.value
  const result: Record<string, string> = {}
  current.forEach((entry, i) => {
    if (i !== index) {
      result[entry.key] = entry.value
    }
  })
  emit('update:modelValue', result)
}
</script>

<template>
  <div class="space-y-2">
    <!-- Header row -->
    <div
      class="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400"
    >
      <div class="flex-1">{{ keyPlaceholder }}</div>
      <div class="flex-1">{{ valuePlaceholder }}</div>
      <div v-if="!readonly" class="w-9 shrink-0" />
    </div>

    <!-- Key-value rows -->
    <div v-for="(entry, index) in entries" :key="index" class="flex items-center gap-2">
      <input
        type="text"
        :value="entry.key"
        :placeholder="keyPlaceholder"
        :readonly="readonly"
        class="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
        :class="{ 'bg-gray-50 dark:bg-gray-800/50 cursor-default': readonly }"
        @input="updateKey(index, ($event.target as HTMLInputElement).value)"
      />
      <input
        type="text"
        :value="entry.value"
        :placeholder="valuePlaceholder"
        :readonly="readonly"
        class="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
        :class="{ 'bg-gray-50 dark:bg-gray-800/50 cursor-default': readonly }"
        @input="updateValue(index, ($event.target as HTMLInputElement).value)"
      />
      <button
        v-if="!readonly"
        type="button"
        :aria-label="t('removeRow')"
        class="w-9 h-9 shrink-0 inline-flex items-center justify-center rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
        @click="removeRow(index)"
      >
        <X :size="16" />
      </button>
    </div>

    <!-- Add row button -->
    <button v-if="!readonly" type="button" class="btn btn-secondary btn-sm" @click="addRow">
      <Plus :size="14" />
      {{ t('addRow') }}
    </button>
  </div>
</template>
