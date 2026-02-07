<template>
  <Teleport to="body">
    <div v-if="modelValue" class="modal-backdrop" @click="handleClose">
      <div class="modal" :class="widthClass" @click.stop>
        <div class="modal-header">
          <h3 class="text-sm font-semibold text-text-primary">{{ title }}</h3>
          <button @click="handleClose" class="btn btn-ghost btn-sm">
            <X class="w-3.5 h-3.5" />
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
import { computed } from 'vue'
import { X, Loader2 } from 'lucide-vue-next'
import { useI18n } from '@/i18n'

const { t } = useI18n()

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

const handleClose = () => {
  emit('update:modelValue', false)
}

const handleSubmit = () => {
  emit('submit')
}
</script>
