<template>
  <Teleport to="body">
    <TransitionGroup name="toast" tag="div" class="fixed top-4 right-4 z-[200] flex flex-col gap-2">
      <div
        v-for="item in toasts"
        :key="item.id"
        :class="toastClass(item.type)"
        class="flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg min-w-[200px] max-w-[400px]"
      >
        <component :is="getIcon(item.type)" class="w-4 h-4 shrink-0" />
        <span class="text-xs flex-1">{{ item.message }}</span>
        <button @click="toast.remove(item.id)" class="p-0.5 hover:bg-black/10 rounded">
          <X class="w-3 h-3" />
        </button>
      </div>
    </TransitionGroup>
  </Teleport>
</template>

<script setup lang="ts">
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-vue-next'
import { toast } from '@/utils/error'

type ToastType = 'success' | 'error' | 'warning' | 'info'

const toasts = toast.getToasts()

const toastClass = (type: ToastType) => {
  switch (type) {
    case 'success':
      return 'bg-success text-white'
    case 'error':
      return 'bg-danger text-white'
    case 'warning':
      return 'bg-warning text-white'
    default:
      return 'bg-info text-white'
  }
}

const getIcon = (type: ToastType) => {
  switch (type) {
    case 'success':
      return CheckCircle
    case 'error':
      return AlertCircle
    case 'warning':
      return AlertTriangle
    default:
      return Info
  }
}
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.toast-move {
  transition: transform 0.3s ease;
}
</style>
