<template>
  <Teleport to="body">
    <div v-if="modelValue" class="modal-backdrop" @click="handleClose">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3 class="text-sm font-semibold text-text-primary">{{ title }}</h3>
          <button @click="handleClose" class="btn btn-ghost btn-sm">
            <X class="w-3.5 h-3.5" />
          </button>
        </div>
        <div class="modal-body">
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
import { X, Loader2 } from 'lucide-vue-next'
import { useI18n } from '@/i18n'

const { t } = useI18n()

defineProps<{
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

const handleClose = () => {
  emit('update:modelValue', false)
}

const handleConfirm = () => {
  emit('confirm')
}
</script>
