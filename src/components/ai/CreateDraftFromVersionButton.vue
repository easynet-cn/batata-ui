<template>
  <span class="flex items-center">
    <span v-if="divider" class="w-px h-4 bg-border mx-1.5" />
    <button
      class="btn btn-secondary btn-sm"
      :disabled="disabled || blocked"
      :title="blocked ? blockedMessage : ''"
      @click="onClick"
    >
      <Plus class="w-3.5 h-3.5" />
      {{ label }}
    </button>
  </span>
</template>

<script setup lang="ts">
import { Plus } from '@lucide/vue'

defineProps<{
  label: string
  blocked?: boolean
  blockedMessage?: string
  disabled?: boolean
  divider?: boolean
}>()

const emit = defineEmits<{ click: [] }>()
const onClick = () => emit('click')
</script>
