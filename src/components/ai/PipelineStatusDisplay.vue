<template>
  <div v-if="pipelineData" class="space-y-3">
    <!-- Overall Status -->
    <div class="flex items-center gap-2">
      <span class="text-sm font-medium text-text-primary">{{ t('pipelineStatus') }}</span>
      <span :class="overallStatusClass">
        <component :is="overallStatusIcon" class="w-3 h-3" />
        {{ statusLabel }}
      </span>
    </div>

    <!-- Pipeline Nodes -->
    <div class="divide-y divide-border rounded-lg border border-border">
      <div v-for="node in pipelineData.pipeline" :key="node.nodeId" class="p-3">
        <div class="flex items-start gap-3">
          <!-- Pass/Fail Icon -->
          <div class="mt-0.5">
            <CheckCircle v-if="node.passed" class="w-4 h-4 text-success" />
            <XCircle v-else class="w-4 h-4 text-danger" />
          </div>

          <!-- Node Content -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-sm font-medium text-text-primary">{{ node.nodeId }}</span>
              <span :class="node.passed ? 'badge badge-success' : 'badge badge-danger'">
                {{ node.passed ? t('pipelineNodePassed') : t('pipelineNodeFailed') }}
              </span>
            </div>
            <p
              v-if="node.message"
              class="text-sm text-text-secondary whitespace-pre-wrap break-words"
            >
              {{ node.message }}
            </p>

            <!-- Checkpoints -->
            <div v-if="node.checkpoints && node.checkpoints.length > 0" class="mt-2 space-y-1">
              <p class="text-xs font-medium text-text-secondary">{{ t('pipelineCheckpoints') }}:</p>
              <div
                v-for="(cp, idx) in node.checkpoints"
                :key="idx"
                class="flex items-center gap-2 text-xs"
              >
                <CheckCircle v-if="cp.passed" class="w-3 h-3 text-success flex-shrink-0" />
                <XCircle v-else class="w-3 h-3 text-danger flex-shrink-0" />
                <span :class="cp.passed ? 'text-text-secondary' : 'text-danger'">
                  {{ cp.title }}
                </span>
              </div>
            </div>

            <div class="flex items-center gap-3 mt-1 text-xs text-text-tertiary">
              <span v-if="node.durationMs != null" class="flex items-center gap-1">
                <Clock class="w-3 h-3" />
                {{ node.durationMs }}ms
              </span>
              <span v-if="node.executedAt">
                {{ new Date(node.executedAt).toLocaleString() }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="!pipelineData.pipeline || pipelineData.pipeline.length === 0"
        class="p-3 text-center text-text-tertiary text-sm"
      >
        {{ t('noData') }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CheckCircle, XCircle, Clock, Loader2 } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import type { PublishPipelineInfo } from '@/types'

const { t } = useI18n()

const props = defineProps<{
  publishPipelineInfo: string | null
}>()

const pipelineData = computed<PublishPipelineInfo | null>(() => {
  if (!props.publishPipelineInfo) return null
  try {
    return JSON.parse(props.publishPipelineInfo)
  } catch {
    return null
  }
})

const statusLabel = computed(() => {
  if (!pipelineData.value) return ''
  const map: Record<string, string> = {
    IN_PROGRESS: t('pipelineInProgress'),
    APPROVED: t('pipelineApproved'),
    REJECTED: t('pipelineRejected'),
  }
  return map[pipelineData.value.status] || pipelineData.value.status
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
