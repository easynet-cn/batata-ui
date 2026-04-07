<template>
  <Teleport to="body">
    <div v-if="modelValue" class="modal-backdrop" @click="handleClose" role="presentation">
      <div
        ref="modalRef"
        class="modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        @click.stop
        @keydown.escape="handleClose"
      >
        <div class="modal-header">
          <h3 id="confirm-title" class="text-sm font-semibold text-text-primary">{{ title }}</h3>
          <button @click="handleClose" class="btn btn-ghost btn-sm" :aria-label="t('close')">
            <X class="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
        <div id="confirm-message" class="modal-body">
          <slot>
            <p class="text-xs text-text-secondary">{{ message }}</p>
          </slot>
        </div>
        <div class="modal-footer">
          <button @click="handleClose" class="btn btn-secondary" :disabled="loading">
            {{ cancelText || t('cancel') }}
          </button>
          <button
            @click="handleConfirm"
            :class="danger ? 'btn btn-danger' : 'btn btn-primary'"
            :disabled="loading || confirmDisabled"
          >
            <Loader2 v-if="loading" class="w-3.5 h-3.5 animate-spin" />
            {{ confirmText || t('confirm') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { X, Loader2 } from 'lucide-vue-next'
import { useI18n } from '@/i18n'

const { t } = useI18n()

const modalRef = ref<HTMLElement>()

const props = defineProps<{
  modelValue: boolean
  title: string
  message?: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
  loading?: boolean
  confirmDisabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: []
}>()

// Auto-focus cancel button when modal opens
watch(
  () => props.modelValue,
  async (isOpen) => {
    if (isOpen) {
      await nextTick()
      const cancelBtn = modalRef.value?.querySelector<HTMLButtonElement>(
        '.modal-footer .btn-secondary',
      )
      cancelBtn?.focus()
    }
  },
)

const handleClose = () => {
  emit('update:modelValue', false)
}

const handleConfirm = () => {
  emit('confirm')
}
</script>
