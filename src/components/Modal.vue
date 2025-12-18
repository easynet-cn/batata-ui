<script setup lang="ts">
import { X } from 'lucide-vue-next'

defineProps<{
  visible: boolean
  title: string
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'close'): void
}>()

const handleClose = () => {
  emit('update:visible', false)
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
          @click="handleClose"
        />

        <!-- Content -->
        <div
          class="bg-white rounded-2xl shadow-2xl w-full max-w-lg z-10 overflow-hidden transform transition-all"
        >
          <div
            class="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50"
          >
            <h3 class="text-lg font-bold text-slate-800">{{ title }}</h3>
            <button
              @click="handleClose"
              class="p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
            >
              <X :size="20" />
            </button>
          </div>

          <div class="p-6">
            <slot />
          </div>

          <div
            v-if="$slots.footer"
            class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-3"
          >
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from > div:last-child,
.modal-leave-to > div:last-child {
  transform: scale(0.95);
}
</style>
