<template>
  <div class="card">
    <div class="p-3">
      <div class="grid grid-cols-1 gap-2" :class="gridClass">
        <slot />
        <div class="flex items-end gap-1.5">
          <button @click="emit('search')" class="btn btn-primary flex-1">
            <Search class="w-3.5 h-3.5" />
            {{ t('search') }}
          </button>
          <button @click="emit('reset')" class="btn btn-secondary">
            <RotateCcw class="w-3.5 h-3.5" />
          </button>
          <slot name="extra-actions" />
        </div>
      </div>
      <slot name="advanced" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Search, RotateCcw } from 'lucide-vue-next'
import { useI18n } from '@/i18n'

const { t } = useI18n()

const props = withDefaults(
  defineProps<{
    columns?: number
  }>(),
  {
    columns: 4,
  },
)

const emit = defineEmits<{
  search: []
  reset: []
}>()

const gridClass = computed(() => `md:grid-cols-${props.columns}`)
</script>
