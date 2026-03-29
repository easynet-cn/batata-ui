<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-backdrop" @click="handleClose" role="presentation">
      <div
        class="modal max-w-3xl w-full max-h-[85vh] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="skill-optimize-title"
        @click.stop
      >
        <!-- Header -->
        <div class="modal-header">
          <h3
            id="skill-optimize-title"
            class="text-sm font-semibold text-text-primary flex items-center gap-2"
          >
            <Sparkles class="w-4 h-4 text-primary" />
            Optimize Skill: {{ skill?.name || '' }}
          </h3>
          <button @click="handleClose" class="btn btn-ghost btn-sm" aria-label="Close">
            <X class="w-3.5 h-3.5" />
          </button>
        </div>

        <!-- Body -->
        <div class="modal-body overflow-y-auto flex-1 space-y-4">
          <!-- Target File Selector -->
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1">Target File</label>
            <select v-model="targetFile" class="input" :disabled="streaming">
              <option value="SKILL.md">SKILL.md</option>
              <option v-for="fileName in resourceFileNames" :key="fileName" :value="fileName">
                {{ fileName }}
              </option>
            </select>
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
              placeholder="Describe what you want to improve, e.g. 'Add error handling for edge cases' or 'Make the description clearer'..."
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
                Optimized Result
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
import { ref, computed, watch } from 'vue'
import { X, Sparkles, Wand2, Loader2, Square, Check, ChevronRight } from 'lucide-vue-next'
import { buildSSEUrl, startSSEStream, parseJsonFromContent } from '@/utils/sse'
import type { SSEStreamHandle } from '@/utils/sse'
import type { SkillOptimizationPayload } from '@/types/copilot'

interface SkillProp {
  name: string
  description?: string
  skillMd?: string
  resource?: Record<string, unknown>
}

const props = defineProps<{
  visible: boolean
  skill: SkillProp | null
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  applied: [result: { targetFile: string; content: string; parsed: unknown | null }]
}>()

// State
const optimizationGoal = ref('')
const targetFile = ref('SKILL.md')
const streaming = ref(false)
const thinkingContent = ref('')
const contentOutput = ref('')
const errorMessage = ref('')
const showThinking = ref(false)
let streamHandle: SSEStreamHandle | null = null

// Computed
const resourceFileNames = computed(() => {
  if (!props.skill?.resource) return []
  return Object.keys(props.skill.resource)
})

// Watch visibility to reset state
watch(
  () => props.visible,
  (val) => {
    if (val) {
      optimizationGoal.value = ''
      targetFile.value = 'SKILL.md'
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
  if (!props.skill) return

  streaming.value = true
  thinkingContent.value = ''
  contentOutput.value = ''
  errorMessage.value = ''
  showThinking.value = false

  const payload: SkillOptimizationPayload = {
    skill: {
      name: props.skill.name,
      description: props.skill.description,
      skillMd: props.skill.skillMd,
      resource: props.skill.resource as SkillOptimizationPayload['skill']['resource'],
    },
    optimizationGoal: optimizationGoal.value || undefined,
    targetFileName: targetFile.value || undefined,
  }

  streamHandle = startSSEStream({
    url: buildSSEUrl('/v3/console/copilot/skill/optimize'),
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
  const parsed = parseJsonFromContent(contentOutput.value)
  emit('applied', {
    targetFile: targetFile.value,
    content: contentOutput.value,
    parsed,
  })
  handleClose()
}

const handleClose = () => {
  cancelStream()
  emit('update:visible', false)
}
</script>
