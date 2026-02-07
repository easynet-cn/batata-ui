<script setup lang="ts">
import { RouterView } from 'vue-router'
import ToastMessage from '@/components/feedback/ToastMessage.vue'
import { useTheme } from '@/composables/useTheme'

// Initialize theme on app mount (applies dark class to documentElement)
useTheme()
</script>

<template>
  <RouterView />
  <ToastMessage />
</template>
