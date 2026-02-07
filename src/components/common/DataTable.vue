<template>
  <div class="card">
    <div class="overflow-x-auto">
      <table class="table">
        <thead>
          <tr>
            <th v-if="selectable" class="w-8">
              <input
                type="checkbox"
                :checked="isAllSelected"
                @change="toggleSelectAll"
                class="w-3.5 h-3.5 rounded"
              />
            </th>
            <slot name="columns" />
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td :colspan="columnCount" class="text-center py-6">
              <Loader2 class="w-5 h-5 animate-spin mx-auto text-primary" />
            </td>
          </tr>
          <tr v-else-if="!data || data.length === 0">
            <td :colspan="columnCount" class="text-center py-6 text-text-secondary">
              {{ emptyText || t('noData') }}
            </td>
          </tr>
          <template v-else>
            <slot name="rows" />
          </template>
        </tbody>
      </table>
    </div>
    <slot name="footer" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Loader2 } from 'lucide-vue-next'
import { useI18n } from '@/i18n'

const { t } = useI18n()

const props = defineProps<{
  data: unknown[]
  loading?: boolean
  selectable?: boolean
  selectedIds?: string[]
  rowKey?: string
  emptyText?: string
  columnCount: number
}>()

const emit = defineEmits<{
  'update:selectedIds': [ids: string[]]
}>()

const isAllSelected = computed(() => {
  if (!props.selectable || !props.selectedIds || !props.data?.length) return false
  return props.selectedIds.length === props.data.length
})

const toggleSelectAll = () => {
  if (!props.data || !props.rowKey) return
  if (isAllSelected.value) {
    emit('update:selectedIds', [])
  } else {
    const allIds = props.data
      .map((item) => (item as Record<string, string>)[props.rowKey!])
      .filter((id): id is string => id !== undefined)
    emit('update:selectedIds', allIds)
  }
}
</script>
