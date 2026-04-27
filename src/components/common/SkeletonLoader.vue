<template>
  <!-- Text skeleton -->
  <div v-if="type === 'text'" class="space-y-3">
    <div
      v-for="(width, i) in lineWidths"
      :key="i"
      class="h-4 rounded-lg animate-pulse bg-gray-200 dark:bg-gray-700"
      :class="width"
    />
  </div>

  <!-- Card skeleton -->
  <div
    v-else-if="type === 'card'"
    class="p-6 bg-white rounded-2xl shadow-sm border border-gray-200 dark:bg-gray-900 dark:border-gray-800"
  >
    <div class="space-y-4 animate-pulse">
      <!-- Card header -->
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700" />
        <div class="flex-1 space-y-2">
          <div class="h-4 w-1/3 rounded-lg bg-gray-200 dark:bg-gray-700" />
          <div class="h-3 w-1/2 rounded-lg bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
      <!-- Card body lines -->
      <div class="space-y-2">
        <div class="h-3 w-full rounded-lg bg-gray-200 dark:bg-gray-700" />
        <div class="h-3 w-5/6 rounded-lg bg-gray-200 dark:bg-gray-700" />
        <div class="h-3 w-4/6 rounded-lg bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>
  </div>

  <!-- Table skeleton -->
  <div
    v-else-if="type === 'table'"
    class="bg-white rounded-2xl shadow-sm border border-gray-200 dark:bg-gray-900 dark:border-gray-800 overflow-hidden"
  >
    <!-- Table header -->
    <div
      class="flex gap-4 px-6 py-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
    >
      <div class="h-3 w-1/4 rounded-lg animate-pulse bg-gray-200 dark:bg-gray-600" />
      <div class="h-3 w-1/4 rounded-lg animate-pulse bg-gray-200 dark:bg-gray-600" />
      <div class="h-3 w-1/4 rounded-lg animate-pulse bg-gray-200 dark:bg-gray-600" />
      <div class="h-3 w-1/4 rounded-lg animate-pulse bg-gray-200 dark:bg-gray-600" />
    </div>
    <!-- Table rows -->
    <div
      v-for="i in rows"
      :key="i"
      class="flex gap-4 px-6 py-5 border-b border-gray-100 dark:border-gray-800"
    >
      <div class="h-3 w-1/4 rounded-lg animate-pulse bg-gray-200 dark:bg-gray-700" />
      <div class="h-3 w-1/4 rounded-lg animate-pulse bg-gray-200 dark:bg-gray-700" />
      <div class="h-3 w-1/4 rounded-lg animate-pulse bg-gray-200 dark:bg-gray-700" />
      <div class="h-3 w-1/4 rounded-lg animate-pulse bg-gray-200 dark:bg-gray-700" />
    </div>
  </div>

  <!-- Avatar skeleton -->
  <div v-else-if="type === 'avatar'" class="flex items-center gap-3 animate-pulse">
    <div class="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
    <div class="space-y-2">
      <div class="h-4 w-24 rounded-lg bg-gray-200 dark:bg-gray-700" />
      <div class="h-3 w-32 rounded-lg bg-gray-200 dark:bg-gray-700" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    type?: 'text' | 'card' | 'table' | 'avatar'
    lines?: number
    rows?: number
  }>(),
  {
    type: 'text',
    lines: 3,
    rows: 5,
  },
)

// Generate random widths for text lines to look more natural
const lineWidths = computed(() => {
  const widths = ['w-full', 'w-5/6', 'w-4/6', 'w-3/4', 'w-2/3']
  return Array.from({ length: props.lines }, (_, i) =>
    i === props.lines - 1 ? widths[Math.floor(Math.random() * (widths.length - 1)) + 1] : 'w-full',
  )
})
</script>
