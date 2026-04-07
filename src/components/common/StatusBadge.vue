<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '@/i18n'

const { t } = useI18n()

type Status = 'healthy' | 'warning' | 'critical' | 'unknown' | 'passing' | 'failing'

const props = withDefaults(
  defineProps<{
    status: Status
    label?: string
    size?: 'sm' | 'md'
  }>(),
  {
    label: undefined,
    size: 'md',
  },
)

// Map status to color classes
const statusColors = computed(() => {
  const map: Record<Status, { dot: string; bg: string; text: string }> = {
    healthy: {
      dot: 'bg-green-500',
      bg: 'bg-green-50 dark:bg-green-950/30',
      text: 'text-green-700 dark:text-green-400',
    },
    passing: {
      dot: 'bg-green-500',
      bg: 'bg-green-50 dark:bg-green-950/30',
      text: 'text-green-700 dark:text-green-400',
    },
    warning: {
      dot: 'bg-amber-500',
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      text: 'text-amber-700 dark:text-amber-400',
    },
    critical: {
      dot: 'bg-red-500',
      bg: 'bg-red-50 dark:bg-red-950/30',
      text: 'text-red-700 dark:text-red-400',
    },
    failing: {
      dot: 'bg-red-500',
      bg: 'bg-red-50 dark:bg-red-950/30',
      text: 'text-red-700 dark:text-red-400',
    },
    unknown: {
      dot: 'bg-gray-400',
      bg: 'bg-gray-50 dark:bg-gray-800',
      text: 'text-gray-600 dark:text-gray-400',
    },
  }
  return map[props.status]
})

// Default label from i18n if not provided
const displayLabel = computed(() => {
  if (props.label) return props.label
  const labelMap: Record<Status, () => string> = {
    healthy: () => t('healthy'),
    warning: () => t('warning'),
    critical: () => t('critical'),
    unknown: () => t('unknown'),
    passing: () => t('passing'),
    failing: () => t('failing'),
  }
  return labelMap[props.status]()
})

const sizeClasses = computed(() =>
  props.size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
)

const dotSize = computed(() => (props.size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2'))
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 font-bold rounded-lg"
    :class="[statusColors.bg, statusColors.text, sizeClasses]"
  >
    <span class="rounded-full shrink-0" :class="[statusColors.dot, dotSize]" />
    {{ displayLabel }}
  </span>
</template>
