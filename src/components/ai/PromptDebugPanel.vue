<template>
  <div class="card">
    <div class="p-4 border-b border-border">
      <h3 class="text-sm font-medium text-text-primary flex items-center gap-2">
        <Bug class="w-5 h-5 text-primary" />
        Prompt Debug
      </h3>
    </div>
    <div class="p-4 space-y-4">
      <!-- Variables Info -->
      <div v-if="variables && variables.length > 0">
        <label class="block text-xs font-medium text-text-secondary mb-1">
          Template Variables
        </label>
        <div class="flex flex-wrap gap-1">
          <span v-for="variable in variables" :key="variable" class="badge badge-info text-xs">
            {{ variable }}
          </span>
        </div>
      </div>

      <!-- User Input -->
      <div>
        <label class="block text-sm font-medium text-text-primary mb-1">User Input</label>
        <textarea
          v-model="userInput"
          class="input min-h-[80px]"
          placeholder="Enter a test user message to debug this prompt..."
          :disabled="streaming"
        />
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center gap-2">
        <button
          @click="startDebug"
          class="btn btn-primary btn-sm"
          :disabled="streaming || !userInput.trim()"
        >
          <Loader2 v-if="streaming" class="w-3.5 h-3.5 animate-spin" />
          <Play v-else class="w-3.5 h-3.5" />
          {{ streaming ? 'Running...' : 'Run Debug' }}
        </button>
        <button v-if="streaming" @click="cancelStream" class="btn btn-secondary btn-sm">
          <Square class="w-3.5 h-3.5" />
          Stop
        </button>
        <button
          v-if="contentOutput && !streaming"
          @click="clearOutput"
          class="btn btn-ghost btn-sm"
        >
          <Eraser class="w-3.5 h-3.5" />
          Clear
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

        <!-- Response Content -->
        <div v-if="contentOutput">
          <label class="block text-xs font-medium text-text-secondary mb-1">Response</label>
          <div
            class="p-3 bg-bg-secondary rounded-md text-xs font-mono whitespace-pre-wrap max-h-[400px] overflow-y-auto border border-border"
          >
            {{ contentOutput }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Bug, Play, Loader2, Square, Eraser, ChevronRight } from 'lucide-vue-next'
import { buildSSEUrl, startSSEStream } from '@/utils/sse'
import type { SSEStreamHandle } from '@/utils/sse'
import type { PromptDebugPayload } from '@/types/copilot'

const props = defineProps<{
  promptTemplate: string
  variables?: string[]
}>()

// State
const userInput = ref('')
const streaming = ref(false)
const thinkingContent = ref('')
const contentOutput = ref('')
const errorMessage = ref('')
const showThinking = ref(false)
let streamHandle: SSEStreamHandle | null = null

// Methods
const startDebug = () => {
  if (!userInput.value.trim()) return

  streaming.value = true
  thinkingContent.value = ''
  contentOutput.value = ''
  errorMessage.value = ''
  showThinking.value = false

  const payload: PromptDebugPayload = {
    prompt: props.promptTemplate,
    userInput: userInput.value,
  }

  streamHandle = startSSEStream({
    url: buildSSEUrl('/v3/console/copilot/prompt/debug'),
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

const clearOutput = () => {
  thinkingContent.value = ''
  contentOutput.value = ''
  errorMessage.value = ''
  showThinking.value = false
}
</script>
