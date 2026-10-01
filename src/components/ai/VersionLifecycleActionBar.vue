<template>
  <div class="mt-2">
    <div v-if="warning" class="mb-1">{{ warning }}</div>
    <div class="flex items-center gap-1.5 flex-wrap">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  warning?: string
}>()
</script>
