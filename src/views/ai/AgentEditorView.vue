<template>
  <div class="space-y-3">
    <!-- Page Header -->
    <div class="flex items-center gap-3">
      <button @click="goBack" class="btn btn-ghost btn-sm">
        <ArrowLeft class="w-3.5 h-3.5" />
      </button>
      <div>
        <h1 class="text-base font-semibold text-text-primary">
          {{ isEdit ? t('editAgent') : t('createAgent') }}
        </h1>
        <p class="text-xs text-text-secondary mt-0.5">
          {{ isEdit ? t('editAgentDesc') : t('createAgentDesc') }}
        </p>
      </div>
    </div>

    <!-- Form -->
    <div class="card">
      <div class="p-6 space-y-3">
        <!-- Basic Info -->
        <div class="space-y-3">
          <h3 class="text-sm font-medium text-text-primary border-b border-border pb-2">
            {{ t('basicInfo') }}
          </h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-text-primary mb-1">
                {{ t('agentName') }} <span class="text-danger">*</span>
              </label>
              <input
                v-model="form.name"
                type="text"
                class="input"
                :placeholder="t('agentNamePlaceholder')"
              />
            </div>

            <div>
              <label class="block text-xs font-medium text-text-primary mb-1">
                {{ t('model') }}
              </label>
              <select v-model="form.model" class="input">
                <option value="">{{ t('defaultModel') }}</option>
                <option value="gpt-3">GPT-4</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                <option value="claude-3-opus">Claude 3 Opus</option>
                <option value="claude-3-sonnet">Claude 3 Sonnet</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-text-primary mb-1">
              {{ t('description') }}
            </label>
            <textarea
              v-model="form.description"
              class="input min-h-[80px]"
              :placeholder="t('agentDescriptionPlaceholder')"
            />
          </div>

          <div class="flex items-center gap-2">
            <input
              id="enabled"
              v-model="form.enabled"
              type="checkbox"
              class="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary"
            />
            <label for="enabled" class="text-sm text-text-primary">
              {{ t('enableAgent') }}
            </label>
          </div>
        </div>

        <!-- System Prompt -->
        <div class="space-y-3">
          <h3 class="text-sm font-medium text-text-primary border-b border-border pb-2">
            {{ t('systemPrompt') }}
          </h3>

          <div>
            <textarea
              v-model="form.systemPrompt"
              class="input min-h-[150px] font-mono text-sm"
              :placeholder="t('systemPromptPlaceholder')"
            />
            <p class="text-xs text-text-tertiary mt-1">{{ t('systemPromptHint') }}</p>
          </div>
        </div>

        <!-- MCP Servers -->
        <div class="space-y-3">
          <h3 class="text-sm font-medium text-text-primary border-b border-border pb-2">
            {{ t('mcpServersConfig') }}
          </h3>

          <div>
            <label class="block text-xs font-medium text-text-primary mb-1">
              {{ t('selectMcpServers') }}
            </label>
            <div class="space-y-2 max-h-48 overflow-y-auto border border-border rounded-lg p-3">
              <div v-if="loadingMcp" class="text-center py-4">
                <Loader2 class="w-5 h-5 animate-spin mx-auto text-primary" />
              </div>
              <template v-else-if="availableMcpServers.length === 0">
                <p class="text-text-tertiary text-sm text-center py-4">
                  {{ t('noMcpServersAvailable') }}
                </p>
              </template>
              <template v-else>
                <label
                  v-for="server in availableMcpServers"
                  :key="server.id"
                  class="flex items-center gap-2 p-2 rounded-lg hover:bg-bg-secondary cursor-pointer"
                >
                  <input
                    v-model="form.mcpServers"
                    :value="server.id"
                    type="checkbox"
                    class="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary"
                  />
                  <div class="flex-1">
                    <span class="font-medium text-text-primary">{{ server.name }}</span>
                    <span :class="['ml-2', getTypeClass(server.type)]">{{ server.type }}</span>
                  </div>
                  <span :class="server.enabled ? 'badge badge-success' : 'badge badge-danger'">
                    {{ server.enabled ? t('enabled') : t('disabled') }}
                  </span>
                </label>
              </template>
            </div>
          </div>
        </div>

        <!-- Tools Config -->
        <div class="space-y-3">
          <h3 class="text-sm font-medium text-text-primary border-b border-border pb-2">
            {{ t('toolsConfig') }}
          </h3>

          <div class="flex items-center gap-2">
            <input
              id="useAllTools"
              v-model="form.useAllTools"
              type="checkbox"
              class="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary"
            />
            <label for="useAllTools" class="text-sm text-text-primary">
              {{ t('useAllAvailableTools') }}
            </label>
          </div>

          <div v-if="!form.useAllTools">
            <label class="block text-xs font-medium text-text-primary mb-1">
              {{ t('allowedTools') }}
            </label>
            <textarea
              v-model="form.allowedTools"
              class="input min-h-[80px] font-mono"
              :placeholder="t('allowedToolsPlaceholder')"
            />
            <p class="text-xs text-text-tertiary mt-1">{{ t('oneToolPerLine') }}</p>
          </div>
        </div>

        <!-- Advanced Settings -->
        <div class="space-y-3">
          <h3 class="text-sm font-medium text-text-primary border-b border-border pb-2">
            {{ t('advancedSettings') }}
          </h3>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label class="block text-xs font-medium text-text-primary mb-1">
                {{ t('temperature') }}
              </label>
              <input
                v-model.number="form.temperature"
                type="number"
                min="0"
                max="2"
                step="0.1"
                class="input"
              />
              <p class="text-xs text-text-tertiary mt-1">0-2, {{ t('defaultValue') }}: 0.7</p>
            </div>

            <div>
              <label class="block text-xs font-medium text-text-primary mb-1">
                {{ t('maxTokens') }}
              </label>
              <input v-model.number="form.maxTokens" type="number" min="1" class="input" />
            </div>

            <div>
              <label class="block text-xs font-medium text-text-primary mb-1">
                {{ t('maxIterations') }}
              </label>
              <input
                v-model.number="form.maxIterations"
                type="number"
                min="1"
                max="100"
                class="input"
              />
              <p class="text-xs text-text-tertiary mt-1">{{ t('defaultValue') }}: 10</p>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-end gap-3 pt-3 border-t border-border">
          <button @click="goBack" class="btn btn-secondary">
            {{ t('cancel') }}
          </button>
          <button @click="handleSubmit" class="btn btn-primary" :disabled="saving">
            <Loader2 v-if="saving" class="w-3.5 h-3.5 animate-spin" />
            {{ isEdit ? t('save') : t('create') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeft, Loader2 } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import batataApi from '@/api/batata'
import { toast } from '@/utils/error'
import type { McpServerInfo, Namespace } from '@/types'

defineProps<{
  namespace: Namespace
}>()

const router = useRouter()
const route = useRoute()
const { t } = useI18n()

// State
const loading = ref(false)
const saving = ref(false)
const loadingMcp = ref(false)
const availableMcpServers = ref<McpServerInfo[]>([])

const form = reactive({
  id: '',
  name: '',
  model: '',
  description: '',
  enabled: true,
  systemPrompt: '',
  mcpServers: [] as string[],
  useAllTools: true,
  allowedTools: '',
  temperature: 0.7,
  maxTokens: 4096,
  maxIterations: 10,
})

// Computed
const isEdit = computed(() => !!route.query.name)

// Methods
const fetchMcpServers = async () => {
  loadingMcp.value = true
  try {
    const response = await batataApi.getMcpServerList({
      pageNo: 1,
      pageSize: 100,
    })
    availableMcpServers.value = response.data.data.pageItems || []
  } catch (error) {
    console.error('Failed to fetch MCP servers:', error)
  } finally {
    loadingMcp.value = false
  }
}

const fetchAgent = async () => {
  const namespace = route.query.namespace as string
  const name = route.query.name as string
  if (!namespace || !name) return

  loading.value = true
  try {
    const response = await batataApi.getAgentDetail(namespace, name)
    const agent = response.data.data
    Object.assign(form, {
      id: agent.id,
      name: agent.name,
      model: agent.model || '',
      description: agent.description || '',
      enabled: agent.enabled,
      systemPrompt: agent.systemPrompt || '',
      mcpServers: agent.mcpServers || [],
      useAllTools: !agent.tools || agent.tools.length === 0,
      allowedTools: agent.tools?.join('\n') || '',
      temperature: agent.temperature ?? 0.7,
      maxTokens: agent.maxTokens ?? 4096,
      maxIterations: agent.maxIterations ?? 10,
    })
  } catch (error) {
    console.error('Failed to fetch agent:', error)
  } finally {
    loading.value = false
  }
}

const getTypeClass = (type: string) => {
  const classes: Record<string, string> = {
    stdio: 'badge badge-info',
    sse: 'badge badge-success',
    http: 'badge badge-primary',
  }
  return classes[type] || 'badge'
}

const goBack = () => {
  router.push('/agents')
}

const handleSubmit = async () => {
  if (!form.name) {
    toast.warning(t('requiredFieldsMissing'))
    return
  }

  saving.value = true
  try {
    const payload: Record<string, unknown> = {
      name: form.name,
      model: form.model || undefined,
      description: form.description,
      enabled: form.enabled,
      systemPrompt: form.systemPrompt,
      mcpServers: form.mcpServers,
      temperature: form.temperature,
      maxTokens: form.maxTokens,
      maxIterations: form.maxIterations,
    }

    if (!form.useAllTools && form.allowedTools) {
      payload.tools = form.allowedTools.split('\n').filter(Boolean)
    }

    if (isEdit.value) {
      const namespace = (route.query.namespace as string) || 'default'
      const name = route.query.name as string
      await batataApi.updateAgent(namespace, name, payload)
    } else {
      await batataApi.createAgent(payload)
    }

    router.push('/agents')
  } catch (error) {
    console.error('Failed to save agent:', error)
  } finally {
    saving.value = false
  }
}

// Lifecycle
onMounted(() => {
  fetchMcpServers()
  fetchAgent()
})
</script>
