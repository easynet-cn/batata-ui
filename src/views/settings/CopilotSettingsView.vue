<template>
  <div class="space-y-3">
    <!-- Page Header -->
    <div>
      <h1 class="text-base font-semibold text-text-primary">Copilot Settings</h1>
      <p class="text-xs text-text-secondary mt-0.5">
        Configure the AI Copilot model, API key, and endpoint for skill/prompt optimization.
      </p>
    </div>

    <!-- Settings Sections -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left Column - Config Form -->
      <div class="lg:col-span-2 space-y-3">
        <!-- LLM Configuration -->
        <div class="card">
          <div class="p-4 border-b border-border">
            <h3 class="text-sm font-medium text-text-primary flex items-center gap-2">
              <Bot class="w-5 h-5 text-primary" />
              LLM Configuration
            </h3>
          </div>
          <div class="p-4 space-y-4">
            <!-- API Key -->
            <div>
              <label class="block text-sm font-medium text-text-primary mb-1">API Key</label>
              <p class="text-xs text-text-secondary mb-2">
                The API key for your LLM provider (e.g. DashScope, OpenAI).
              </p>
              <div class="relative">
                <Key class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                <input
                  v-model="config.apiKey"
                  :type="showApiKey ? 'text' : 'password'"
                  class="input pl-9 pr-10"
                  placeholder="sk-..."
                  autocomplete="off"
                />
                <button
                  type="button"
                  class="absolute right-2 top-1/2 -translate-y-1/2 btn btn-ghost btn-sm p-1"
                  @click="showApiKey = !showApiKey"
                >
                  <EyeOff v-if="showApiKey" class="w-4 h-4" />
                  <Eye v-else class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- Model -->
            <div>
              <label class="block text-sm font-medium text-text-primary mb-1">Model</label>
              <p class="text-xs text-text-secondary mb-2">
                Select the LLM model to use for Copilot features.
              </p>
              <select v-model="config.model" class="input">
                <option v-for="model in AVAILABLE_MODELS" :key="model" :value="model">
                  {{ model }}
                </option>
              </select>
            </div>

            <!-- Base URL -->
            <div>
              <label class="block text-sm font-medium text-text-primary mb-1">
                Base URL
                <span class="text-text-tertiary font-normal">(optional)</span>
              </label>
              <p class="text-xs text-text-secondary mb-2">
                Custom LLM endpoint URL. Leave empty to use the provider's default.
              </p>
              <div class="relative">
                <Globe
                  class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary"
                />
                <input
                  v-model="config.baseUrl"
                  type="text"
                  class="input pl-9"
                  placeholder="https://dashscope.aliyuncs.com/compatible-mode/v1"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Studio Configuration -->
        <div class="card">
          <div class="p-4 border-b border-border">
            <h3 class="text-sm font-medium text-text-primary flex items-center gap-2">
              <Settings class="w-5 h-5 text-primary" />
              Studio Configuration
            </h3>
          </div>
          <div class="p-4 space-y-4">
            <!-- Studio URL -->
            <div>
              <label class="block text-sm font-medium text-text-primary mb-1">
                Studio URL
                <span class="text-text-tertiary font-normal">(optional)</span>
              </label>
              <p class="text-xs text-text-secondary mb-2">URL for the AI Studio integration.</p>
              <input
                v-model="config.studioUrl"
                type="text"
                class="input"
                placeholder="https://studio.example.com"
              />
            </div>

            <!-- Studio Project -->
            <div>
              <label class="block text-sm font-medium text-text-primary mb-1">Studio Project</label>
              <p class="text-xs text-text-secondary mb-2">The project identifier in AI Studio.</p>
              <input
                v-model="config.studioProject"
                type="text"
                class="input"
                placeholder="my-project"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column - Actions & Info -->
      <div class="space-y-3">
        <!-- Actions -->
        <div class="card">
          <div class="p-4 space-y-3">
            <button @click="handleSave" class="btn btn-primary w-full" :disabled="saving">
              <Loader2 v-if="saving" class="w-3.5 h-3.5 animate-spin" />
              <Save v-else class="w-3.5 h-3.5" />
              Save Configuration
            </button>
            <button @click="handleReset" class="btn btn-secondary w-full">
              <RotateCcw class="w-3.5 h-3.5" />
              Reset to Default
            </button>
          </div>
        </div>

        <!-- Status -->
        <div class="card">
          <div class="p-4 border-b border-border">
            <h3 class="text-sm font-medium text-text-primary flex items-center gap-2">
              <Info class="w-5 h-5 text-primary" />
              Status
            </h3>
          </div>
          <div class="p-4 space-y-3">
            <div v-if="loadingConfig" class="text-center py-4">
              <Loader2 class="w-5 h-5 animate-spin mx-auto text-primary" />
            </div>
            <template v-else>
              <div class="flex justify-between">
                <span class="text-text-secondary">API Key</span>
                <span :class="config.apiKey ? 'badge badge-success' : 'badge badge-warning'">
                  {{ config.apiKey ? t('configured') : t('notSet') }}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-text-secondary">Model</span>
                <span class="font-mono text-text-primary text-xs">{{ config.model || '-' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-text-secondary">Base URL</span>
                <span class="font-mono text-text-primary text-xs truncate max-w-[160px]">
                  {{ config.baseUrl || 'Default' }}
                </span>
              </div>
            </template>
          </div>
        </div>

        <!-- Help -->
        <div class="card">
          <div class="p-4 border-b border-border">
            <h3 class="text-sm font-medium text-text-primary flex items-center gap-2">
              <HelpCircle class="w-5 h-5 text-primary" />
              Help
            </h3>
          </div>
          <div class="p-4 text-xs text-text-secondary space-y-2">
            <p>
              The Copilot uses a large language model to provide AI-powered features such as skill
              optimization and prompt debugging.
            </p>
            <p>
              You need a valid API key from your chosen provider. Supported providers include
              DashScope (Qwen models), OpenAI, and DeepSeek.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import {
  Bot,
  Key,
  Eye,
  EyeOff,
  Globe,
  Settings,
  Save,
  RotateCcw,
  Info,
  HelpCircle,
  Loader2,
} from 'lucide-vue-next'
import batataApi from '@/api/batata'
import { toast } from '@/utils/error'
import { logger } from '@/utils/logger'
import { AVAILABLE_MODELS } from '@/types/copilot'
import type { CopilotConfigUpdate } from '@/types/copilot'
import { useI18n } from '@/i18n'

const { t } = useI18n()

// State
const saving = ref(false)
const loadingConfig = ref(false)
const showApiKey = ref(false)

const config = reactive<CopilotConfigUpdate>({
  apiKey: '',
  model: 'qwen-plus',
  baseUrl: '',
  studioUrl: '',
  studioProject: '',
})

// Methods
const fetchConfig = async () => {
  loadingConfig.value = true
  try {
    const response = await batataApi.getCopilotConfig()
    const data = response.data.data
    if (data) {
      config.apiKey = data.apiKey || ''
      config.model = data.model || 'qwen-plus'
      config.baseUrl = data.baseUrl || ''
      config.studioUrl = data.studioUrl || ''
      config.studioProject = data.studioProject || ''
    }
  } catch (error) {
    logger.error('Failed to load copilot config:', error)
    toast.apiError(error)
  } finally {
    loadingConfig.value = false
  }
}

const handleSave = async () => {
  saving.value = true
  try {
    const payload: CopilotConfigUpdate = {
      model: config.model,
    }
    if (config.apiKey) payload.apiKey = config.apiKey
    if (config.baseUrl) payload.baseUrl = config.baseUrl
    if (config.studioUrl) payload.studioUrl = config.studioUrl
    if (config.studioProject) payload.studioProject = config.studioProject

    await batataApi.saveCopilotConfig(payload)
    toast.success('Copilot configuration saved successfully')
  } catch (error) {
    logger.error('Failed to save copilot config:', error)
    toast.apiError(error)
  } finally {
    saving.value = false
  }
}

const handleReset = () => {
  config.apiKey = ''
  config.model = 'qwen-plus'
  config.baseUrl = ''
  config.studioUrl = ''
  config.studioProject = ''
}

// Lifecycle
onMounted(() => {
  fetchConfig()
})
</script>
