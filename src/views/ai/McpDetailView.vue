<template>
  <div class="space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <button @click="goBack" class="btn btn-ghost btn-sm">
          <ArrowLeft class="w-3.5 h-3.5" />
        </button>
        <div>
          <h1 class="text-base font-semibold text-text-primary">
            {{ server?.name || t('mcpServerDetail') }}
          </h1>
          <p class="text-xs text-text-secondary mt-0.5">{{ t('mcpServerDetailDesc') }}</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button @click="refreshTools" class="btn btn-secondary btn-sm" :disabled="refreshing">
          <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': refreshing }" />
          {{ t('refreshTools') }}
        </button>
        <button @click="handleEdit" class="btn btn-primary btn-sm">
          <Pencil class="w-3.5 h-3.5" />
          {{ t('edit') }}
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="card p-8 text-center">
      <Loader2 class="w-8 h-8 animate-spin mx-auto text-primary" />
    </div>

    <template v-else-if="server">
      <!-- Server Info -->
      <div class="card">
        <div class="p-4">
          <h3 class="text-sm font-medium text-text-primary mb-4">{{ t('serverInfo') }}</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <span class="text-sm text-text-secondary">{{ t('serverName') }}</span>
              <p class="font-medium text-text-primary">{{ server.name }}</p>
            </div>
            <div>
              <span class="text-sm text-text-secondary">{{ t('serverType') }}</span>
              <p>
                <span :class="getTypeClass(server.type)">{{ server.type }}</span>
              </p>
            </div>
            <div>
              <span class="text-sm text-text-secondary">{{ t('status') }}</span>
              <p>
                <span :class="server.enabled ? 'badge badge-success' : 'badge badge-danger'">
                  {{ server.enabled ? t('enabled') : t('disabled') }}
                </span>
              </p>
            </div>
            <div v-if="server.type === 'stdio'">
              <span class="text-sm text-text-secondary">{{ t('command') }}</span>
              <p class="font-mono text-sm text-text-primary">{{ server.command }}</p>
            </div>
            <div v-else>
              <span class="text-sm text-text-secondary">{{ t('serverUrl') }}</span>
              <p class="font-mono text-sm text-text-primary">{{ server.url }}</p>
            </div>
            <div>
              <span class="text-sm text-text-secondary">{{ t('toolCount') }}</span>
              <p class="font-medium text-text-primary">{{ tools.length }}</p>
            </div>
            <div class="md:col-span-2 lg:col-span-3" v-if="server.description">
              <span class="text-sm text-text-secondary">{{ t('description') }}</span>
              <p class="text-text-primary">{{ server.description }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Tools List -->
      <div class="card">
        <div class="p-4 border-b border-border">
          <h3 class="text-sm font-medium text-text-primary">{{ t('availableTools') }}</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>{{ t('toolName') }}</th>
                <th>{{ t('description') }}</th>
                <th>{{ t('parameters') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="tools.length === 0">
                <td colspan="3" class="text-center py-6 text-text-secondary">
                  {{ t('noToolsFound') }}
                </td>
              </tr>
              <tr v-for="tool in tools" :key="tool.name" class="hover:bg-bg-secondary">
                <td class="font-mono font-medium">{{ tool.name }}</td>
                <td class="text-text-secondary max-w-md">{{ tool.description || '-' }}</td>
                <td>
                  <button
                    v-if="tool.inputSchema"
                    @click="showParameters(tool)"
                    class="btn btn-ghost btn-sm"
                  >
                    <Code class="w-3.5 h-3.5" />
                    {{ t('viewSchema') }}
                  </button>
                  <span v-else class="text-text-tertiary">-</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- Parameters Modal -->
    <ConfirmModal
      v-model="showSchemaModal"
      :title="`${selectedTool?.name} - ${t('inputSchema')}`"
      :confirm-text="t('close')"
      @confirm="showSchemaModal = false"
    >
      <pre class="bg-bg-tertiary rounded-lg p-4 overflow-x-auto text-sm font-mono">{{
        JSON.stringify(selectedTool?.inputSchema, null, 2)
      }}</pre>
    </ConfirmModal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeft, RefreshCw, Pencil, Loader2, Code } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import batataApi from '@/api/batata'
import { toast } from '@/utils/error'
import { logger } from '@/utils/logger'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import type { McpServerInfo, McpToolInfo, Namespace } from '@/types'

defineProps<{
  namespace: Namespace
}>()

const router = useRouter()
const route = useRoute()
const { t } = useI18n()

// State
const loading = ref(false)
const refreshing = ref(false)
const server = ref<McpServerInfo | null>(null)
const tools = ref<McpToolInfo[]>([])

// Modal
const showSchemaModal = ref(false)
const selectedTool = ref<McpToolInfo | null>(null)

// Methods
const fetchMcpServer = async () => {
  const namespace = route.query.namespace as string
  const name = route.query.name as string
  if (!namespace || !name) return

  loading.value = true
  try {
    const serverRes = await batataApi.getMcpServerDetail(namespace, name)
    server.value = serverRes.data.data
    // Tools are included in the server detail response
    tools.value = serverRes.data.data?.tools || []
  } catch (error) {
    logger.error('Failed to fetch MCP server:', error)
    toast.error(t('operationFailed'))
  } finally {
    loading.value = false
  }
}

const refreshTools = async () => {
  const namespace = route.query.namespace as string
  const name = route.query.name as string
  if (!namespace || !name) return

  refreshing.value = true
  try {
    const response = await batataApi.getMcpServerDetail(namespace, name)
    tools.value = response.data.data?.tools || []
  } catch (error) {
    logger.error('Failed to refresh tools:', error)
    toast.error(t('operationFailed'))
  } finally {
    refreshing.value = false
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
  router.push('/mcp')
}

const handleEdit = () => {
  router.push(
    `/mcp/edit?namespace=${encodeURIComponent(route.query.namespace as string)}&name=${encodeURIComponent(route.query.name as string)}`,
  )
}

const showParameters = (tool: McpToolInfo) => {
  selectedTool.value = tool
  showSchemaModal.value = true
}

// Lifecycle
onMounted(() => {
  fetchMcpServer()
})
</script>
