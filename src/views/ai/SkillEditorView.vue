<template>
  <div class="space-y-3">
    <!-- Page Header -->
    <div class="flex items-center gap-3">
      <button @click="goBack" class="btn btn-ghost btn-sm">
        <ArrowLeft class="w-3.5 h-3.5" />
      </button>
      <div>
        <h1 class="text-base font-semibold text-text-primary">{{ t('createSkill') }}</h1>
        <p class="text-xs text-text-secondary mt-0.5">{{ t('skillsDesc') }}</p>
      </div>
    </div>

    <!-- Tab Switcher -->
    <div class="card">
      <div class="flex border-b border-border">
        <button
          @click="activeTab = 'manual'"
          class="flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors"
          :class="
            activeTab === 'manual'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          "
        >
          <FileText class="w-4 h-4" />
          Manual Create
        </button>
        <button
          @click="activeTab = 'ai'"
          class="flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors"
          :class="
            activeTab === 'ai'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          "
        >
          <Sparkles class="w-4 h-4" />
          AI Generate
        </button>
      </div>

      <!-- Manual Create Tab -->
      <div v-if="activeTab === 'manual'" class="p-6 space-y-3">
        <div>
          <label class="block text-xs font-medium text-text-primary mb-1">
            {{ t('skillName') }} <span class="text-danger">*</span>
          </label>
          <input
            v-model="form.skillName"
            type="text"
            class="input"
            :placeholder="t('skillNamePlaceholder')"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-text-primary mb-1">
            {{ t('description') }}
          </label>
          <textarea
            v-model="form.description"
            class="input min-h-[80px]"
            :placeholder="t('description')"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-text-primary mb-1"> SKILL.md </label>
          <textarea
            v-model="form.skillMd"
            class="input font-mono text-sm min-h-[200px]"
            placeholder="# My Skill&#10;&#10;Instructions for the skill..."
          />
        </div>

        <div class="flex items-center justify-end gap-3 pt-3 border-t border-border">
          <button @click="goBack" class="btn btn-secondary">{{ t('cancel') }}</button>
          <button @click="handleManualCreate" class="btn btn-primary" :disabled="saving">
            <Loader2 v-if="saving" class="w-3.5 h-3.5 animate-spin" />
            {{ t('create') }}
          </button>
        </div>
      </div>

      <!-- AI Generate Tab -->
      <div v-if="activeTab === 'ai'" class="p-6 space-y-4">
        <div>
          <label class="block text-xs font-medium text-text-primary mb-1">
            Background Information <span class="text-danger">*</span>
          </label>
          <textarea
            v-model="aiForm.backgroundInfo"
            class="input min-h-[120px]"
            placeholder="Describe the skill you want to create. Include what it should do, when it should be used, and any specific requirements..."
          />
        </div>

        <!-- MCP Tool Selector -->
        <McpToolSelector v-model="aiForm.selectedMcpTools" />

        <!-- Generate Button -->
        <div class="flex items-center gap-3">
          <button
            @click="handleGenerate"
            class="btn btn-primary"
            :disabled="generating || !aiForm.backgroundInfo.trim()"
          >
            <Loader2 v-if="generating" class="w-3.5 h-3.5 animate-spin" />
            <Sparkles v-else class="w-3.5 h-3.5" />
            {{ generating ? 'Generating...' : 'Generate Skill' }}
          </button>
          <button v-if="generating" @click="stopGeneration" class="btn btn-ghost btn-sm">
            <Square class="w-3.5 h-3.5" />
            Stop
          </button>
        </div>

        <!-- Streaming Output -->
        <div v-if="thinkingContent || streamContent || generationError" class="space-y-3">
          <!-- Thinking (collapsible) -->
          <div v-if="thinkingContent" class="border border-border rounded-lg">
            <button
              @click="showThinking = !showThinking"
              class="w-full flex items-center gap-2 p-2 text-xs text-text-secondary"
            >
              <ChevronDown
                class="w-3 h-3 transition-transform"
                :class="{ 'rotate-180': !showThinking }"
              />
              Thinking...
            </button>
            <div v-if="showThinking" class="px-3 pb-3">
              <pre class="text-xs text-text-secondary italic whitespace-pre-wrap">{{
                thinkingContent
              }}</pre>
            </div>
          </div>

          <!-- Generated Content -->
          <div v-if="streamContent" class="border border-border rounded-lg p-3">
            <pre
              class="text-sm text-text-primary whitespace-pre-wrap font-mono max-h-[400px] overflow-auto"
              >{{ streamContent }}</pre
            >
          </div>

          <!-- Error -->
          <div v-if="generationError" class="text-sm text-danger bg-danger/5 rounded-lg p-3">
            {{ generationError }}
          </div>
        </div>

        <!-- Generated Skill Preview & Apply -->
        <div
          v-if="generatedSkill"
          class="border border-success/30 bg-success/5 rounded-lg p-4 space-y-3"
        >
          <div class="flex items-center gap-2 text-sm font-medium text-success">
            <CheckCircle class="w-4 h-4" />
            Skill Generated Successfully
          </div>
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span class="text-text-secondary">Name:</span>
              <span class="ml-2 font-medium">{{ generatedSkill.name }}</span>
            </div>
            <div>
              <span class="text-text-secondary">Resources:</span>
              <span class="ml-2"
                >{{ Object.keys(generatedSkill.resource || {}).length }} files</span
              >
            </div>
          </div>
          <p v-if="generatedSkill.description" class="text-xs text-text-secondary">
            {{ generatedSkill.description }}
          </p>
          <div class="flex items-center gap-3 pt-2 border-t border-border">
            <button @click="handleApplyGenerated" class="btn btn-primary btn-sm" :disabled="saving">
              <Loader2 v-if="saving" class="w-3.5 h-3.5 animate-spin" />
              <Rocket v-else class="w-3.5 h-3.5" />
              Create as Draft
            </button>
            <button @click="handleGenerate" class="btn btn-secondary btn-sm" :disabled="generating">
              <RefreshCw class="w-3.5 h-3.5" />
              Regenerate
            </button>
            <button @click="goBack" class="btn btn-ghost btn-sm">{{ t('cancel') }}</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowLeft,
  FileText,
  Sparkles,
  Loader2,
  Square,
  ChevronDown,
  CheckCircle,
  Rocket,
  RefreshCw,
} from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import batataApi from '@/api/batata'
import { toast } from '@/utils/error'
import { logger } from '@/utils/logger'
import { useBatataStore } from '@/stores/batata'
import { buildSSEUrl, startSSEStream, parseJsonFromContent } from '@/utils/sse'
import type { SSEStreamHandle } from '@/utils/sse'
import type { SelectedMcpTool } from '@/types/copilot'
import McpToolSelector from '@/components/ai/McpToolSelector.vue'

const router = useRouter()
const { t } = useI18n()
const store = useBatataStore()
const namespace = computed(() => store.currentNamespace)

// Tab state
const activeTab = ref<'manual' | 'ai'>('manual')

// Manual create form
const saving = ref(false)
const form = reactive({
  skillName: '',
  description: '',
  skillMd: '',
})

// AI generation form
const aiForm = reactive({
  backgroundInfo: '',
  selectedMcpTools: [] as SelectedMcpTool[],
})

// AI generation state
const generating = ref(false)
const thinkingContent = ref('')
const streamContent = ref('')
const generationError = ref('')
const showThinking = ref(false)
const generatedSkill = ref<{
  name: string
  description: string
  skillMd: string
  resource: Record<string, unknown>
} | null>(null)
let streamHandle: SSEStreamHandle | null = null

// Navigation
const goBack = () => router.push('/skills')

// Manual create
const handleManualCreate = async () => {
  if (!form.skillName.trim()) {
    toast.warning(t('requiredFieldsMissing'))
    return
  }

  saving.value = true
  try {
    const skillCard: Record<string, unknown> = {
      name: form.skillName.trim(),
      description: form.description.trim(),
      skillMd: form.skillMd.trim(),
      resource: {},
    }

    await batataApi.createSkillDraft({
      namespaceId: namespace.value,
      skillName: form.skillName.trim(),
      skillCard: JSON.stringify(skillCard),
    })
    router.push(`/skills/detail?skillName=${encodeURIComponent(form.skillName.trim())}`)
  } catch (error) {
    logger.error('Failed to create skill:', error)
    toast.apiError(error)
  } finally {
    saving.value = false
  }
}

// AI Generate
const handleGenerate = () => {
  if (!aiForm.backgroundInfo.trim()) {
    toast.warning('Please provide background information')
    return
  }

  // Reset state
  generating.value = true
  thinkingContent.value = ''
  streamContent.value = ''
  generationError.value = ''
  generatedSkill.value = null

  const url = buildSSEUrl('/v3/console/copilot/skill/generate')

  streamHandle = startSSEStream({
    url,
    payload: {
      backgroundInfo: aiForm.backgroundInfo,
      selectedMcpTools: aiForm.selectedMcpTools,
    },
    onThinking: (chunk) => {
      thinkingContent.value += chunk
    },
    onContent: (chunk) => {
      streamContent.value += chunk
    },
    onDone: (data) => {
      generating.value = false
      if (data.explanation) {
        generationError.value = data.explanation
      }
      // Try to parse generated skill from accumulated content
      if (streamContent.value) {
        const parsed = parseJsonFromContent<{
          name: string
          description: string
          skillMd: string
          resource: Record<string, unknown>
        }>(streamContent.value)
        if (parsed) {
          generatedSkill.value = parsed
        }
      }
    },
    onError: (error) => {
      generating.value = false
      generationError.value = error
    },
    onFinish: () => {
      generating.value = false
      streamHandle = null
    },
  })
}

const stopGeneration = () => {
  streamHandle?.abort()
  generating.value = false
}

// Apply generated skill as draft
const handleApplyGenerated = async () => {
  if (!generatedSkill.value) return

  saving.value = true
  try {
    await batataApi.createSkillDraft({
      namespaceId: namespace.value,
      skillName: generatedSkill.value.name,
      skillCard: JSON.stringify(generatedSkill.value),
    })
    router.push(`/skills/detail?skillName=${encodeURIComponent(generatedSkill.value.name)}`)
  } catch (error) {
    logger.error('Failed to create skill from generated:', error)
    toast.apiError(error)
  } finally {
    saving.value = false
  }
}
</script>
