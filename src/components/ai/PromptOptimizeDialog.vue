<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-backdrop" @click="handleClose" role="presentation">
      <div
        class="modal max-w-3xl w-full max-h-[85vh] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="prompt-optimize-title"
        @click.stop
      >
        <!-- Header -->
        <div class="modal-header">
          <h3
            id="prompt-optimize-title"
            class="text-sm font-semibold text-text-primary flex items-center gap-2"
          >
            <Sparkles class="w-4 h-4 text-primary" />
            Optimize Prompt
          </h3>
          <button @click="handleClose" class="btn btn-ghost btn-sm" aria-label="Close">
            <X class="w-3.5 h-3.5" />
          </button>
        </div>

        <!-- Body -->
        <div class="modal-body overflow-y-auto flex-1 space-y-4">
          <!-- Current Prompt Preview -->
          <div>
            <label class="block text-xs font-medium text-text-secondary mb-1">
              Current Prompt
            </label>
            <div
              class="p-3 bg-bg-secondary rounded-md text-xs font-mono whitespace-pre-wrap max-h-[150px] overflow-y-auto border border-border"
            >
              {{ promptTemplate }}
            </div>
          </div>

          <!-- Optimization Goal -->
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1">
              Optimization Goal
              <span class="text-text-tertiary font-normal">(optional)</span>
            </label>
            <textarea
              v-model="optimizationGoal"
              class="input min-h-[80px]"
              placeholder="Describe what you want to improve, e.g. 'Make the prompt more concise' or 'Add better handling for ambiguous inputs'..."
              :disabled="streaming"
            />
          </div>

          <!-- Action Button -->
          <div class="flex items-center gap-2">
            <button @click="startOptimize" class="btn btn-primary btn-sm" :disabled="streaming">
              <Loader2 v-if="streaming" class="w-3.5 h-3.5 animate-spin" />
              <Wand2 v-else class="w-3.5 h-3.5" />
              {{ streaming ? 'Optimizing...' : 'Optimize' }}
            </button>
            <button v-if="streaming" @click="cancelStream" class="btn btn-secondary btn-sm">
              <Square class="w-3.5 h-3.5" />
              Stop
            </button>
          </div>

          <!-- Error Display -->
          <div v-if="errorMessage" class="rounded-md bg-danger/10 border border-danger/20 p-3">
            <p class="text-xs text-danger">{{ errorMessage }}</p>
          </div>

          <!-- Streaming Output -->
          <div v-if="thinkingContent || contentOutput" class="space-y-3">
            <!-- Thinking Section -->
            <div v-if="thinkingContent">
              <button
                @click="showThinking = !showThinking"
                class="flex items-center gap-1 text-xs text-text-tertiary hover:text-text-secondary transition-colors"
              >
                <ChevronRight
                  class="w-3.5 h-3.5 transition-transform"
                  :class="{ 'rotate-90': showThinking }"
                />
                Thinking...
              </button>
              <div
                v-if="showThinking"
                class="mt-1 p-3 bg-bg-secondary rounded-md text-xs text-text-tertiary italic font-mono whitespace-pre-wrap max-h-[200px] overflow-y-auto"
              >
                {{ thinkingContent }}
              </div>
            </div>

            <!-- Content Section -->
            <div v-if="contentOutput">
              <label class="block text-xs font-medium text-text-secondary mb-1">
                Optimized Prompt
              </label>
              <div
                class="p-3 bg-bg-secondary rounded-md text-xs font-mono whitespace-pre-wrap max-h-[300px] overflow-y-auto border border-border"
              >
                {{ contentOutput }}
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="modal-footer">
          <button @click="handleClose" class="btn btn-secondary" :disabled="streaming">
            Cancel
          </button>
          <button
            @click="handleApply"
            class="btn btn-primary"
            :disabled="streaming || !contentOutput"
          >
            <Check class="w-3.5 h-3.5" />
            Apply
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { X, Sparkles, Wand2, Loader2, Square, Check, ChevronRight } from 'lucide-vue-next'
import { buildSSEUrl, startSSEStream } from '@/utils/sse'
import type { SSEStreamHandle } from '@/utils/sse'
import type { PromptOptimizationPayload } from '@/types/copilot'

const props = defineProps<{
  visible: boolean
  promptTemplate: string
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  applied: [optimizedPrompt: string]
}>()

// State
const optimizationGoal = ref('')
const streaming = ref(false)
const thinkingContent = ref('')
const contentOutput = ref('')
const errorMessage = ref('')
const showThinking = ref(false)
let streamHandle: SSEStreamHandle | null = null

// Watch visibility to reset state
watch(
  () => props.visible,
  (val) => {
    if (val) {
      optimizationGoal.value = ''
      thinkingContent.value = ''
      contentOutput.value = ''
      errorMessage.value = ''
      showThinking.value = false
      streaming.value = false
    }
  },
)

// Methods
const startOptimize = () => {
  streaming.value = true
  thinkingContent.value = ''
  contentOutput.value = ''
  errorMessage.value = ''
  showThinking.value = false

  const payload: PromptOptimizationPayload = {
    prompt: props.promptTemplate,
    optimizationGoal: optimizationGoal.value || undefined,
  }

  streamHandle = startSSEStream({
    url: buildSSEUrl('/v3/console/copilot/prompt/optimize'),
    payload,
    onThinking: (chunk: string) => {
      thinkingContent.value += chunk
      showThinking.value = true
    },
    onContent: (chunk: string) => {
      contentOutput.value += chunk
    },
    onError: (error: string) => {
      errorMessage.value = error
    },
    onDone: () => {
      streaming.value = false
    },
    onFinish: () => {
      streaming.value = false
      streamHandle = null
    },
  })
}

const cancelStream = () => {
  streamHandle?.abort()
  streamHandle = null
  streaming.value = false
}

const handleApply = () => {
  emit('applied', contentOutput.value)
  handleClose()
}

const handleClose = () => {
  cancelStream()
  emit('update:visible', false)
}
</script>
