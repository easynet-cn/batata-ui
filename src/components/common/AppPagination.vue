<template>
  <nav class="flex items-center justify-between p-3 border-t border-border" aria-label="Pagination">
    <div class="text-xs text-text-secondary">{{ t('total') }}: {{ total }} {{ t('items') }}</div>
    <div class="flex items-center gap-1.5">
      <button
        @click="emit('change', currentPage - 1)"
        :disabled="currentPage <= 1"
        class="btn btn-secondary btn-sm"
        aria-label="Previous page"
      >
        <ChevronLeft class="w-3.5 h-3.5" aria-hidden="true" />
      </button>
      <span class="text-xs text-text-primary px-2" aria-current="page">
        {{ currentPage }} / {{ totalPages }}
      </span>
      <button
        @click="emit('change', currentPage + 1)"
        :disabled="currentPage >= totalPages"
        class="btn btn-secondary btn-sm"
        aria-label="Next page"
      >
        <ChevronRight class="w-3.5 h-3.5" aria-hidden="true" />
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { useI18n } from '@/i18n'

const { t } = useI18n()

const props = defineProps<{
  currentPage: number
  pageSize: number
  total: number
}>()

const emit = defineEmits<{
  change: [page: number]
}>()

const totalPages = computed(() => Math.ceil(props.total / props.pageSize) || 1)
</script>
