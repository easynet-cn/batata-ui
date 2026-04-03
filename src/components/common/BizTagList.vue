<template>
  <div v-if="tags.length > 0" class="flex flex-wrap gap-1">
    <span
      v-for="tag in displayTags"
      :key="tag"
      class="px-1.5 py-0.5 text-[10px] rounded bg-gray-100 dark:bg-gray-800 text-text-secondary"
    >
      {{ tag }}
    </span>
    <span v-if="tags.length > maxDisplay" class="text-[10px] text-text-tertiary">
      +{{ tags.length - maxDisplay }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    /** Comma-separated tags string or string array */
    bizTags: string | string[]
    /** Max number of tags to display before showing "+N" */
    maxDisplay?: number
  }>(),
  {
    maxDisplay: 2,
  },
)

const tags = computed(() => {
  if (Array.isArray(props.bizTags)) return props.bizTags.filter(Boolean)
  if (!props.bizTags) return []
  return props.bizTags
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
})

const displayTags = computed(() => tags.value.slice(0, props.maxDisplay))
</script>
