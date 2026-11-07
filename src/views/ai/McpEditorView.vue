<template>
  <div class="mcp-editor space-y-3">
    <!-- Header -->
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

    <div v-if="error" class="p-3 rounded border border-danger/30 bg-danger/5 text-xs text-danger">
      {{ error }}
    </div>

    <div v-if="loading" class="card p-8 text-center text-sm text-text-tertiary">
      {{ t('loading') }}
    </div>

    <template v-else>
      <!-- Basic Info -->
      <div class="card">
        <div class="p-4 space-y-3">
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
                :disabled="isEdit"
                :placeholder="t('serverNamePlaceholder')"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-text-primary mb-1">
                {{ t('mcpProtocolType') }}
              </label>
              <select v-model="form.frontProtocol" class="input">
                <option value="mcp-sse">MCP SSE</option>
                <option value="mcp-streamable">MCP Streamable HTTP</option>
                <option value="stdio">STDIO</option>
                <option value="http">HTTP</option>
                <option value="dubbo">Dubbo</option>
              </select>
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-text-primary mb-1">
              {{ t('description') }}
            </label>
            <textarea
              v-model="form.description"
              rows="2"
              class="input"
              :placeholder="t('mcpDescriptionPlaceholder')"
            />
          </div>
        </div>
      </div>

      <!-- Endpoint -->
      <div class="card">
        <div class="p-4 space-y-3">
          <h3 class="text-sm font-medium text-text-primary border-b border-border pb-2">
            {{ t('mcpEndpointConfig') }}
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-text-primary mb-1">Base URL</label>
              <input
                v-model="form.baseUrl"
                type="text"
                class="input"
                :placeholder="t('mcpBaseUrlPlaceholder')"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-text-primary mb-1">Path</label>
              <input v-model="form.path" type="text" class="input" placeholder="/mcp" />
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-text-primary mb-1">
              {{ t('mcpAuthTokenOptional') }}
            </label>
            <input
              v-model="form.authToken"
              type="text"
              class="input"
              :placeholder="t('mcpAuthTokenPlaceholder')"
            />
          </div>
        </div>
      </div>

      <!-- Tools -->
      <div class="card">
        <div class="p-4">
          <ToolManager v-model:tools="form.tools" />
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-end gap-2">
        <button class="btn btn-secondary" @click="goBack">{{ t('cancel') }}</button>
        <button class="btn btn-primary" :disabled="saving || !form.name" @click="handleSave">
          <Loader2 v-if="saving" class="w-3.5 h-3.5 animate-spin" />
          {{ isEdit ? t('save') : t('create') }}
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeft, Loader2 } from '@lucide/vue'
import { useI18n } from '@/i18n'
import { mcpApi } from '@/api/mcp'
import ToolManager from '@/components/ai/mcp/ToolManager.vue'
import { extractEndpoints } from '@/components/ai/mcp/endpoint-utils'
import { nextMcpVersion } from '@/components/ai/mcp/version-utils'
import type { McpTool, McpServerDetailInfo, McpDraftData } from '@/types/mcp'
import type { Namespace } from '@/types'

const props = defineProps<{
  namespace?: Namespace
}>()

const router = useRouter()
const route = useRoute()
const { t } = useI18n()

const isEdit = computed(() => !!route.query.mcpName)
const namespaceId = computed(
  () => (route.query.namespaceId as string) || props.namespace?.namespace || 'public',
)

const loading = ref(false)
const saving = ref(false)
const error = ref('')
const currentVersion = ref<string>('1.0.0')

interface EditorForm {
  name: string
  description: string
  frontProtocol: string
  baseUrl: string
  path: string
  authToken: string
  tools: McpTool[]
}

const form = ref<EditorForm>({
  name: '',
  description: '',
  frontProtocol: 'mcp-sse',
  baseUrl: '',
  path: '',
  authToken: '',
  tools: [],
})

async function loadDetail() {
  const name = route.query.mcpName as string
  if (!name) return
  loading.value = true
  error.value = ''
  try {
    const response = await mcpApi.getMcpServer({
      mcpName: name,
      namespaceId: namespaceId.value,
    })
    const detail: McpServerDetailInfo = response.data.data
    form.value.name = detail.name || name
    form.value.description = detail.description || ''
    form.value.frontProtocol = detail.frontProtocol || 'mcp-sse'
    form.value.tools = detail.toolSpec?.tools ? [...detail.toolSpec.tools] : []
    const sourceVersion = detail.versionDetail?.version || detail.version || '1.0.0'
    // If creating a draft from an existing version, bump the patch number.
    currentVersion.value = route.query.fromVersion ? nextMcpVersion(sourceVersion) : sourceVersion

    // Extract baseUrl/path from the first available endpoint
    const first = extractEndpoints(detail)[0]
    if (first) {
      form.value.baseUrl = `${first.protocol}://${first.address}:${first.port}`
      form.value.path = first.path || ''
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('loadFailed')
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.push({ name: 'mcp' })
}

async function handleSave() {
  saving.value = true
  error.value = ''
  try {
    // Build server specification
    const serverSpec = {
      name: form.value.name,
      namespaceId: namespaceId.value,
      frontProtocol: form.value.frontProtocol,
      description: form.value.description,
      remoteServerConfig: {
        frontEndpointConfigList: [
          {
            type: form.value.frontProtocol,
            protocol: form.value.frontProtocol,
            endpointType: 'DIRECT' as const,
            endpointData: form.value.baseUrl,
            path: form.value.path,
            headers: form.value.authToken
              ? [{ name: 'Authorization', value: form.value.authToken, isSecret: true }]
              : [],
          },
        ],
      },
    }

    const toolSpec = {
      specificationType: 'mcp',
      tools: form.value.tools,
    }

    const payload: McpDraftData = {
      mcpName: form.value.name,
      namespaceId: namespaceId.value,
      version: currentVersion.value,
      serverSpecification: JSON.stringify(serverSpec),
      toolSpecification: JSON.stringify(toolSpec),
    }

    if (isEdit.value) {
      await mcpApi.updateDraft(payload)
    } else {
      await mcpApi.createDraft(payload)
    }

    router.push({
      name: 'mcp-detail',
      query: { mcpName: form.value.name, namespaceId: namespaceId.value },
    })
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('saveFailed')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  if (isEdit.value) {
    loadDetail()
  }
})
</script>
