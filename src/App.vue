<script setup lang="ts">
import { RouterView } from 'vue-router'
import ToastMessage from '@/components/feedback/ToastMessage.vue'
</script>

<template>
  <RouterView />
  <ToastMessage />
</template>
