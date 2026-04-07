<template>
  <Teleport to="body">
    <div v-if="modelValue" class="modal-backdrop" @click="handleClose">
      <div
        ref="modalRef"
        class="modal"
        :class="widthClass"
        role="dialog"
        aria-modal="true"
        aria-labelledby="form-modal-title"
        @click.stop
        @keydown.escape="handleClose"
      >
        <div class="modal-header">
          <h3 id="form-modal-title" class="text-sm font-semibold text-text-primary">{{ title }}</h3>
          <button @click="handleClose" class="btn btn-ghost btn-sm" :aria-label="t('close')">
            <X class="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
        <div class="modal-body">
          <slot />
        </div>
        <div class="modal-footer">
          <button @click="handleClose" class="btn btn-secondary" :disabled="loading">
            {{ cancelText || t('cancel') }}
          </button>
          <button
            @click="handleSubmit"
            class="btn btn-primary"
            :disabled="loading || submitDisabled"
          >
            <Loader2 v-if="loading" class="w-3.5 h-3.5 animate-spin" />
            {{ submitText || t('save') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import { X, Loader2 } from 'lucide-vue-next'
import { useI18n } from '@/i18n'

const { t } = useI18n()

const modalRef = ref<HTMLElement>()

const props = defineProps<{
  modelValue: boolean
  title: string
  submitText?: string
  cancelText?: string
  loading?: boolean
  submitDisabled?: boolean
  wide?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: []
}>()

const widthClass = computed(() => (props.wide ? 'max-w-lg' : ''))

// Focus first input when modal opens
watch(
  () => props.modelValue,
  async (isOpen) => {
    if (isOpen) {
      await nextTick()
      const firstInput = modalRef.value?.querySelector<HTMLElement>(
        'input, textarea, select, [contenteditable]',
      )
      firstInput?.focus()
    }
  },
)

const handleClose = () => {
  emit('update:modelValue', false)
}

const handleSubmit = () => {
  emit('submit')
}
</script>
