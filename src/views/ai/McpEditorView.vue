<template>
  <div class="space-y-3">
    <!-- Page Header -->
    <div class="flex items-center gap-3">
      <button @click="goBack" class="btn btn-ghost btn-sm">
        <ArrowLeft class="w-3.5 h-3.5" />
      </button>
      <div>
        <h1 class="text-base font-semibold text-text-primary">
          {{ isEdit ? t('editMcpServer') : t('createMcpServer') }}
        </h1>
        <p class="text-xs text-text-secondary mt-0.5">
          {{ isEdit ? t('editMcpServerDesc') : t('createMcpServerDesc') }}
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
                {{ t('serverName') }} <span class="text-danger">*</span>
              </label>
              <input
                v-model="form.name"
                type="text"
                class="input"
                :placeholder="t('serverNamePlaceholder')"
              />
            </div>

            <div>
              <label class="block text-xs font-medium text-text-primary mb-1">
                {{ t('serverType') }} <span class="text-danger">*</span>
              </label>
              <select v-model="form.type" class="input">
                <option value="stdio">stdio</option>
                <option value="sse">sse</option>
                <option value="http">http</option>
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
              :placeholder="t('descriptionPlaceholder')"
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
              {{ t('enableServer') }}
            </label>
          </div>
        </div>

        <!-- Connection Config -->
        <div class="space-y-3">
          <h3 class="text-sm font-medium text-text-primary border-b border-border pb-2">
            {{ t('connectionConfig') }}
          </h3>

          <!-- STDIO Config -->
          <template v-if="form.type === 'stdio'">
            <div>
              <label class="block text-xs font-medium text-text-primary mb-1">
                {{ t('command') }} <span class="text-danger">*</span>
              </label>
              <input
                v-model="form.command"
                type="text"
                class="input font-mono"
                placeholder="npx -y @modelcontextprotocol/server-xxx"
              />
            </div>

            <div>
              <label class="block text-xs font-medium text-text-primary mb-1">
                {{ t('args') }}
              </label>
              <input
                v-model="form.args"
                type="text"
                class="input font-mono"
                :placeholder="t('argsPlaceholder')"
              />
              <p class="text-xs text-text-tertiary mt-1">{{ t('argsHint') }}</p>
            </div>

            <div>
              <label class="block text-xs font-medium text-text-primary mb-1">
                {{ t('envVars') }}
              </label>
              <textarea
                v-model="form.env"
                class="input min-h-[100px] font-mono"
                :placeholder="t('envVarsPlaceholder')"
              />
              <p class="text-xs text-text-tertiary mt-1">{{ t('envVarsHint') }}</p>
            </div>
          </template>

          <!-- SSE/HTTP Config -->
          <template v-else>
            <div>
              <label class="block text-xs font-medium text-text-primary mb-1">
                {{ t('serverUrl') }} <span class="text-danger">*</span>
              </label>
              <input
                v-model="form.url"
                type="text"
                class="input font-mono"
                :placeholder="
                  form.type === 'sse' ? 'http://localhost:3000/sse' : 'http://localhost:3000'
                "
              />
            </div>

            <div>
              <label class="block text-xs font-medium text-text-primary mb-1">
                {{ t('headers') }}
              </label>
              <textarea
                v-model="form.headers"
                class="input min-h-[100px] font-mono"
                :placeholder="t('headersPlaceholder')"
              />
              <p class="text-xs text-text-tertiary mt-1">{{ t('headersHint') }}</p>
            </div>
          </template>
        </div>

        <!-- Tools Config -->
        <div class="space-y-3">
          <h3 class="text-sm font-medium text-text-primary border-b border-border pb-2">
            {{ t('toolsConfig') }}
          </h3>

          <div class="flex items-center gap-2">
            <input
              id="autoDiscoverTools"
              v-model="form.autoDiscoverTools"
              type="checkbox"
              class="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary"
            />
            <label for="autoDiscoverTools" class="text-sm text-text-primary">
              {{ t('autoDiscoverTools') }}
            </label>
          </div>

          <div v-if="!form.autoDiscoverTools">
            <label class="block text-xs font-medium text-text-primary mb-1">
              {{ t('allowedTools') }}
            </label>
            <textarea
              v-model="form.allowedTools"
              class="input min-h-[80px] font-mono"
              :placeholder="t('allowedToolsPlaceholder')"
            />
            <p class="text-xs text-text-tertiary mt-1">{{ t('allowedToolsHint') }}</p>
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
import { logger } from '@/utils/logger'
import type { Namespace, McpServerPayload } from '@/types'

defineProps<{
  namespace: Namespace
}>()

const router = useRouter()
const route = useRoute()
const { t } = useI18n()

// State
const loading = ref(false)
const saving = ref(false)

const form = reactive({
  id: '',
  name: '',
  type: 'stdio',
  description: '',
  enabled: true,
  command: '',
  args: '',
  env: '',
  url: '',
  headers: '',
  autoDiscoverTools: true,
  allowedTools: '',
})

// Computed
const isEdit = computed(() => !!route.query.name)

// Methods
const fetchMcpServer = async () => {
  const namespace = route.query.namespace as string
  const name = route.query.name as string
  if (!namespace || !name) return

  loading.value = true
  try {
    const response = await batataApi.getMcpServerDetail(namespace, name)
    const server = response.data.data
    Object.assign(form, {
      id: server.id,
      name: server.name,
      type: server.type,
      description: server.description || '',
      enabled: server.enabled,
      command: server.command || '',
      args: server.args?.join(' ') || '',
      env: server.env
        ? Object.entries(server.env)
            .map(([k, v]) => `${k}=${v}`)
            .join('\n')
        : '',
      url: server.url || '',
      headers: server.headers ? JSON.stringify(server.headers, null, 2) : '',
      autoDiscoverTools: server.autoDiscoverTools !== false,
      allowedTools: server.allowedTools?.join('\n') || '',
    })
  } catch (error) {
    logger.error('Failed to fetch MCP server:', error)
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.push('/mcp')
}

const handleSubmit = async () => {
  if (!form.name || !form.type) {
    toast.warning(t('requiredFieldsMissing'))
    return
  }

  if (form.type === 'stdio' && !form.command) {
    toast.warning(t('commandRequired'))
    return
  }

  if ((form.type === 'sse' || form.type === 'http') && !form.url) {
    toast.warning(t('urlRequired'))
    return
  }

  saving.value = true
  try {
    const payload: McpServerPayload = {
      name: form.name,
      type: form.type as McpServerPayload['type'],
      description: form.description,
      enabled: form.enabled,
      autoDiscoverTools: form.autoDiscoverTools,
    }

    if (form.type === 'stdio') {
      payload.command = form.command
      payload.args = form.args ? form.args.split(/\s+/).filter(Boolean) : []
      payload.env = form.env
        ? Object.fromEntries(
            form.env
              .split('\n')
              .filter(Boolean)
              .map((line) => {
                const [key, ...rest] = line.split('=')
                return [key?.trim() ?? '', rest.join('=').trim()]
              })
              .filter(([k]) => k),
          )
        : {}
    } else {
      payload.url = form.url
      payload.headers = form.headers ? JSON.parse(form.headers) : {}
    }

    if (!form.autoDiscoverTools && form.allowedTools) {
      payload.allowedTools = form.allowedTools.split('\n').filter(Boolean)
    }

    if (isEdit.value) {
      const namespace = (route.query.namespace as string) || 'default'
      const name = route.query.name as string
      await batataApi.updateMcpServer(namespace, name, payload)
    } else {
      await batataApi.createMcpServer(payload)
    }

    router.push('/mcp')
  } catch (error) {
    logger.error('Failed to save MCP server:', error)
  } finally {
    saving.value = false
  }
}

// Lifecycle
onMounted(() => {
  fetchMcpServer()
})
</script>
