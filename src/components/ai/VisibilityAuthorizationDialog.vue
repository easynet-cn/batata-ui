<template>
  <Teleport to="body">
    <div v-if="modelValue" class="modal-backdrop" @click="handleClose" role="presentation">
      <div class="modal" role="dialog" aria-modal="true" @click.stop @keydown.escape="handleClose">
        <div class="modal-header">
          <h3 class="text-sm font-semibold text-text-primary">可见性授权</h3>
          <button @click="handleClose" class="btn btn-ghost btn-sm" aria-label="关闭">
            <X class="w-3.5 h-3.5" />
          </button>
        </div>
        <div class="modal-body">
          <p class="text-xs text-text-secondary">
            当前后端暂未提供可见性授权 API，此功能将在后续版本中支持。
          </p>
        </div>
        <div class="modal-footer">
          <button @click="handleClose" class="btn btn-secondary">关闭</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { X } from '@lucide/vue'

defineProps<{
  modelValue: boolean
  namespaceId: string
  resourceType: string
  resourceName: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  success: []
}>()

const handleClose = () => emit('update:modelValue', false)
</script>
