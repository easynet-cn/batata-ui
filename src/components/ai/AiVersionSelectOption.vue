<template>
  <div class="flex items-center gap-1.5">
    <span class="font-mono text-xs">{{ version }}</span>
    <span v-if="latest" class="badge badge-success text-[9px] px-1 py-0">latest</span>
    <span v-if="status" :class="statusClass" class="badge text-[9px] px-1 py-0">
      {{ statusLabel }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { McpVersionStatus } from '@/types/mcp'

const props = defineProps<{
  version: string
  status?: McpVersionStatus
  latest?: boolean
  publishPipelineInfo?: string
}>()

const statusClass = computed(() => {
  switch (props.status) {
    case 'online':
      return 'badge-success'
    case 'draft':
      return 'badge-info'
    case 'reviewing':
    case 'reviewed':
      return 'badge-warning'
    case 'offline':
      return 'badge-secondary'
    default:
      return 'badge'
  }
})

const statusLabel = computed(() => {
  if (!props.status) return ''
  const map: Record<string, string> = {
    draft: '草稿',
    reviewing: '审核中',
    reviewed: '已审核',
    online: '已上线',
    offline: '已下线',
  }
  return map[props.status] || props.status
})
</script>
