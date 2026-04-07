<script setup lang="ts">
import { type Component } from 'vue'
import { Inbox } from 'lucide-vue-next'
import { useI18n } from '@/i18n'

const { t } = useI18n()

withDefaults(
  defineProps<{
    icon?: Component
    title?: string
    description?: string
    actionLabel?: string
  }>(),
  {
    icon: undefined,
    title: undefined,
    description: undefined,
    actionLabel: undefined,
  },
)

const emit = defineEmits<{
  action: []
}>()
</script>

<template>
  <div class="empty-state">
    <component :is="icon ?? Inbox" :size="48" class="mb-4 text-gray-300 dark:text-gray-600" />
    <h3 class="text-base font-extrabold text-gray-900 dark:text-gray-100 mb-1">
      {{ title ?? t('noDataTitle') }}
    </h3>
    <p class="text-sm text-gray-500 dark:text-gray-400 mb-5">
      {{ description ?? t('noDataDescription') }}
    </p>
    <button v-if="actionLabel" class="btn btn-primary btn-sm" @click="emit('action')">
      {{ actionLabel }}
    </button>
  </div>
</template>
