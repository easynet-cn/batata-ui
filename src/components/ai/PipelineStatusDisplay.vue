<template>
  <div v-if="pipelineData" class="space-y-3">
    <!-- Overall Status -->
    <div class="flex items-center gap-2">
      <span class="text-sm font-medium text-text-primary">Pipeline Status</span>
      <span :class="overallStatusClass">
        <component :is="overallStatusIcon" class="w-3 h-3" />
        {{ pipelineData.status }}
      </span>
    </div>

    <!-- Pipeline Nodes -->
    <div class="divide-y divide-border rounded-lg border border-border">
      <div v-for="node in pipelineData.nodes" :key="node.id" class="p-3 flex items-start gap-3">
        <!-- Pass/Fail Icon -->
        <div class="mt-0.5">
          <CheckCircle v-if="node.passed" class="w-4 h-4 text-success" />
          <XCircle v-else class="w-4 h-4 text-danger" />
        </div>

        <!-- Node Content -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-sm font-medium text-text-primary">{{ node.id }}</span>
          </div>
          <p
            v-if="node.message"
            class="text-sm text-text-secondary whitespace-pre-wrap break-words"
          >
            {{ node.message }}
          </p>
          <div class="flex items-center gap-3 mt-1 text-xs text-text-tertiary">
            <span v-if="node.duration != null" class="flex items-center gap-1">
              <Clock class="w-3 h-3" />
              {{ node.duration }}ms
            </span>
            <span v-if="node.executedAt">
              {{ new Date(node.executedAt).toLocaleString() }}
            </span>
          </div>
        </div>
      </div>

      <div
        v-if="pipelineData.nodes && pipelineData.nodes.length === 0"
        class="p-3 text-center text-text-tertiary text-sm"
      >
        No pipeline nodes
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CheckCircle, XCircle, Clock, Loader2 } from 'lucide-vue-next'

interface PipelineNode {
  id: string
  passed: boolean
  message?: string
  duration?: number
  executedAt?: string | number
}

interface PipelineInfo {
  status: string
  nodes: PipelineNode[]
}

const props = defineProps<{
  publishPipelineInfo: string | null
}>()

const pipelineData = computed<PipelineInfo | null>(() => {
  if (!props.publishPipelineInfo) return null
  try {
    return JSON.parse(props.publishPipelineInfo)
  } catch {
    return null
  }
})

const overallStatusClass = computed(() => {
  if (!pipelineData.value) return 'badge'
  const status = pipelineData.value.status
  if (status === 'APPROVED') return 'badge badge-success'
  if (status === 'REJECTED') return 'badge badge-danger'
  if (status === 'IN_PROGRESS') return 'badge badge-warning'
  return 'badge'
})

const overallStatusIcon = computed(() => {
  if (!pipelineData.value) return CheckCircle
  const status = pipelineData.value.status
  if (status === 'APPROVED') return CheckCircle
  if (status === 'REJECTED') return XCircle
  if (status === 'IN_PROGRESS') return Loader2
  return CheckCircle
})
</script>
