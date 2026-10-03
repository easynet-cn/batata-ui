<template>
  <ConfirmModal
    :model-value="confirmState.open"
    :title="confirmState.title"
    :message="confirmState.message || undefined"
    :confirm-text="confirmState.confirmText || undefined"
    :cancel-text="confirmState.cancelText || undefined"
    :danger="confirmState.danger"
    :confirm-disabled="confirmState.confirmDisabled"
    @update:model-value="onUpdate"
    @confirm="onConfirm"
  />
</template>

<script setup lang="ts">
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import { useConfirm } from '@/composables/useConfirm'

const { confirmState, resolveConfirm } = useConfirm()

// ConfirmModal closes via cancel / escape / backdrop click -> treat as "No".
const onUpdate = (visible: boolean) => {
  if (!visible) resolveConfirm(false)
}

const onConfirm = () => resolveConfirm(true)
</script>
