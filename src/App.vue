<template>
  <RouterView />
  <ToastMessage />
  <ConfirmModalHost />
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import ToastMessage from '@/components/feedback/ToastMessage.vue'
import ConfirmModalHost from '@/components/common/ConfirmModalHost.vue'
import { useTheme } from '@/composables/useTheme'

// Initialize theme on app mount (applies dark class to documentElement)
useTheme()
</script>
