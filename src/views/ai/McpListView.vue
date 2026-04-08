<template>
  <div class="space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-base font-semibold text-text-primary">{{ t('mcpServers') }}</h1>
        <p class="text-xs text-text-secondary mt-0.5">{{ t('mcpServersDesc') }}</p>
      </div>
      <div class="flex items-center gap-2">
        <button @click="showOpenApiModal = true" class="btn btn-secondary btn-sm">
          <FileCode class="w-3.5 h-3.5" />
          {{ t('importFromOpenAPI') }}
        </button>
        <button @click="showImportRegistryModal = true" class="btn btn-secondary btn-sm">
          <Download class="w-3.5 h-3.5" />
          {{ t('importFromRegistry') }}
        </button>
        <button @click="handleCreate" class="btn btn-primary btn-sm">
          <Plus class="w-3.5 h-3.5" />
          {{ t('addMcpServer') }}
        </button>
      </div>
    </div>

    <!-- Statistics Cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div class="card p-3">
        <div class="flex items-center gap-2">
          <div
            class="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center"
          >
            <ServerIcon class="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p class="text-lg font-bold text-text-primary">{{ total }}</p>
            <p class="text-[10px] text-text-tertiary">{{ t('totalMcpServers') }}</p>
          </div>
        </div>
      </div>
      <div class="card p-3">
        <div class="flex items-center gap-2">
          <div
            class="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center"
          >
            <Power class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p class="text-lg font-bold text-text-primary">{{ enabledCount }}</p>
            <p class="text-[10px] text-text-tertiary">{{ t('enabled') }}</p>
          </div>
        </div>
      </div>
      <div class="card p-3">
        <div class="flex items-center gap-2">
          <div
            class="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center"
          >
            <Wrench class="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p class="text-lg font-bold text-text-primary">{{ totalToolCount }}</p>
            <p class="text-[10px] text-text-tertiary">{{ t('toolCount') }}</p>
          </div>
        </div>
      </div>
      <div class="card p-3">
        <div class="flex items-center gap-2">
          <div
            class="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center"
          >
            <Layers class="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p class="text-lg font-bold text-text-primary">{{ typeCount }}</p>
            <p class="text-[10px] text-text-tertiary">{{ t('serverTypes') }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Search Bar -->
    <div class="card">
      <div class="p-3">
        <div class="flex items-center gap-3">
          <div class="flex-1">
            <input
              v-model="searchKeyword"
              type="text"
              class="input"
              :placeholder="t('searchMcpServer')"
              @keyup.enter="handleSearch"
            />
          </div>
          <button @click="handleSearch" class="btn btn-primary">
            <Search class="w-3.5 h-3.5" />
            {{ t('search') }}
          </button>
        </div>
      </div>
    </div>

    <!-- MCP Server List -->
    <div class="card">
      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>{{ t('serverName') }}</th>
              <th>{{ t('serverType') }}</th>
              <th>{{ t('status') }}</th>
              <th>{{ t('toolCount') }}</th>
              <th>{{ t('description') }}</th>
              <th class="w-48">{{ t('actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="6" class="text-center py-6">
                <Loader2 class="w-5 h-5 animate-spin mx-auto text-primary" />
              </td>
            </tr>
            <tr v-else-if="mcpServers.length === 0">
              <td colspan="6" class="text-center py-6 text-text-secondary">
                {{ t('noData') }}
              </td>
            </tr>
            <tr v-for="server in mcpServers" :key="server.id" class="hover:bg-bg-secondary">
              <td class="font-medium">
                <router-link
                  :to="`/mcp/detail?namespace=${encodeURIComponent(server.namespace || 'default')}&name=${encodeURIComponent(server.name)}`"
                  class="text-primary hover:underline"
                >
                  {{ server.name }}
                </router-link>
              </td>
              <td>
                <span :class="getTypeClass(server.type)">
                  {{ server.type }}
                </span>
              </td>
              <td>
                <span :class="server.enabled ? 'badge badge-success' : 'badge badge-danger'">
                  {{ server.enabled ? t('enabled') : t('disabled') }}
                </span>
              </td>
              <td>{{ server.toolCount || 0 }}</td>
              <td class="text-text-secondary max-w-xs truncate">
                {{ server.description || '-' }}
              </td>
              <td>
                <div class="flex items-center gap-1">
                  <button
                    @click="handleEdit(server)"
                    class="btn btn-ghost btn-sm"
                    :title="t('edit')"
                  >
                    <Pencil class="w-3.5 h-3.5" />
                  </button>
                  <button
                    @click="handleToggleStatus(server)"
                    class="btn btn-ghost btn-sm"
                    :title="server.enabled ? t('disable') : t('enable')"
                  >
                    <component :is="server.enabled ? PowerOff : Power" class="w-3.5 h-3.5" />
                  </button>
                  <button
                    @click="handleDelete(server)"
                    class="btn btn-ghost btn-sm text-danger"
                    :title="t('delete')"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <AppPagination
        :current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        @change="handlePageChange"
      />
    </div>

    <!-- Delete Confirm Modal -->
    <ConfirmModal
      v-model="showDeleteModal"
      :title="t('confirmDelete')"
      :message="`${t('confirmDeleteMcpServer')} ${serverToDelete?.name}?`"
      :confirm-text="t('delete')"
      danger
      @confirm="confirmDelete"
    />

    <!-- Import from Registry Modal -->
    <FormModal
      v-model="showImportRegistryModal"
      :title="t('importFromRegistry')"
      :submit-text="t('import')"
      :submit-disabled="!registrySearchKeyword"
      :loading="importingFromRegistry"
      @submit="handleImportFromRegistry"
    >
      <div class="space-y-3">
        <div>
          <label class="block text-xs font-medium text-text-secondary mb-1">{{
            t('registryUrl')
          }}</label>
          <input
            v-model="registryUrl"
            type="text"
            class="input font-mono text-xs"
            placeholder="https://registry.modelcontextprotocol.io/v0/servers"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-text-secondary mb-1">{{
            t('searchMcpServer')
          }}</label>
          <input
            v-model="registrySearchKeyword"
            type="text"
            class="input"
            :placeholder="t('registrySearchPlaceholder')"
          />
        </div>
        <div
          v-if="registryResults.length > 0"
          class="max-h-60 overflow-y-auto border border-border rounded-lg divide-y divide-border"
        >
          <label
            v-for="item in registryResults"
            :key="item.name"
            class="flex items-center gap-2 p-2 hover:bg-bg-secondary cursor-pointer"
          >
            <input
              type="checkbox"
              :checked="selectedRegistryItems.has(item.name)"
              @change="toggleRegistryItem(item.name)"
              class="w-3.5 h-3.5 rounded"
            />
            <div class="flex-1 min-w-0">
              <p class="text-xs font-medium text-text-primary truncate">{{ item.name }}</p>
              <p class="text-[10px] text-text-tertiary truncate">{{ item.description }}</p>
            </div>
          </label>
        </div>
        <div
          v-if="registrySearched && registryResults.length === 0"
          class="text-center py-4 text-text-tertiary text-xs"
        >
          {{ t('noData') }}
        </div>
      </div>
    </FormModal>

    <!-- Import from OpenAPI Modal -->
    <FormModal
      v-model="showOpenApiModal"
      :title="t('importFromOpenAPI')"
      :submit-text="t('importSelected')"
      :submit-disabled="openApiSelectedTools.size === 0"
      :loading="importingOpenApi"
      wide
      @submit="handleImportOpenApi"
    >
      <div class="space-y-3">
        <div>
          <label class="block text-xs font-medium text-text-secondary mb-1">
            {{ t('specFormat') }}
          </label>
          <select v-model="openApiFormat" class="input">
            <option value="json">JSON</option>
            <option value="yaml">YAML</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-text-secondary mb-1">
            {{ t('openApiSpec') }}
          </label>
          <textarea
            v-model="openApiContent"
            class="input min-h-[160px] font-mono text-xs"
            :placeholder="t('pasteOpenApiSpec')"
          />
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="handleValidateOpenApi"
            class="btn btn-secondary btn-sm"
            :disabled="!openApiContent || validatingOpenApi"
          >
            <Loader2 v-if="validatingOpenApi" class="w-3.5 h-3.5 animate-spin" />
            <CheckCircle v-else class="w-3.5 h-3.5" />
            {{ validatingOpenApi ? t('validating') : t('validateSpec') }}
          </button>
          <span v-if="openApiParsedTools.length > 0" class="text-xs text-text-secondary">
            {{ t('toolsFound').replace('{count}', String(openApiParsedTools.length)) }}
          </span>
        </div>
        <div v-if="openApiParsedTools.length > 0" class="space-y-2">
          <div class="flex items-center justify-between">
            <h4 class="text-xs font-medium text-text-primary">{{ t('previewTools') }}</h4>
            <button
              @click="toggleSelectAllOpenApiTools"
              class="text-xs text-primary hover:underline"
            >
              {{
                openApiSelectedTools.size === openApiParsedTools.length
                  ? t('deselectAll')
                  : t('selectAll')
              }}
            </button>
          </div>
          <div
            class="max-h-48 overflow-y-auto border border-border rounded-lg divide-y divide-border"
          >
            <label
              v-for="tool in openApiParsedTools"
              :key="tool.name"
              class="flex items-center gap-2 p-2 hover:bg-bg-secondary cursor-pointer"
            >
              <input
                type="checkbox"
                :checked="openApiSelectedTools.has(tool.name)"
                @change="toggleOpenApiTool(tool.name)"
                class="w-3.5 h-3.5 rounded"
              />
              <div class="flex-1 min-w-0">
                <p class="text-xs font-medium text-text-primary font-mono truncate">
                  {{ tool.name }}
                </p>
                <p class="text-[10px] text-text-tertiary truncate">
                  {{ tool.description || '-' }}
                </p>
              </div>
            </label>
          </div>
        </div>
      </div>
    </FormModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  Power,
  PowerOff,
  Download,
  Server as ServerIcon,
  Wrench,
  Layers,
  FileCode,
  CheckCircle,
} from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import batataApi from '@/api/batata'
import { toast } from '@/utils/error'
import { logger } from '@/utils/logger'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import FormModal from '@/components/common/FormModal.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import type { McpServerInfo, Namespace } from '@/types'

defineProps<{
  namespace: Namespace
}>()

const router = useRouter()
const { t } = useI18n()

// State
const loading = ref(false)
const mcpServers = ref<McpServerInfo[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const searchKeyword = ref('')

// Statistics
const enabledCount = computed(() => mcpServers.value.filter((s) => s.enabled).length)
const totalToolCount = computed(() =>
  mcpServers.value.reduce((sum, s) => sum + (s.toolCount || 0), 0),
)
const typeCount = computed(() => new Set(mcpServers.value.map((s) => s.type)).size)

// Modals
const showDeleteModal = ref(false)
const serverToDelete = ref<McpServerInfo | null>(null)

// Import from registry
const showImportRegistryModal = ref(false)
const registryUrl = ref('https://registry.modelcontextprotocol.io/v0/servers')
const registrySearchKeyword = ref('')
const registryResults = ref<Array<{ name: string; description: string }>>([])
const selectedRegistryItems = ref<Set<string>>(new Set())
const importingFromRegistry = ref(false)
const registrySearched = ref(false)

// Import from OpenAPI
const showOpenApiModal = ref(false)
const openApiContent = ref('')
const openApiFormat = ref('json')
const openApiParsedTools = ref<
  Array<{ name: string; description: string; inputSchema?: Record<string, unknown> }>
>([])
const openApiSelectedTools = ref<Set<string>>(new Set())
const validatingOpenApi = ref(false)
const importingOpenApi = ref(false)

const parseOpenApiLocally = (
  content: string,
): Array<{ name: string; description: string; inputSchema?: Record<string, unknown> }> => {
  const tools: Array<{ name: string; description: string; inputSchema?: Record<string, unknown> }> =
    []
  try {
    const spec = JSON.parse(content)
    const paths = spec.paths || {}
    for (const [path, methods] of Object.entries(paths)) {
      for (const [method, operation] of Object.entries(
        methods as Record<string, Record<string, unknown>>,
      )) {
        if (!['get', 'post', 'put', 'delete', 'patch'].includes(method)) continue
        const op = operation as Record<string, unknown>
        const toolName =
          (op.operationId as string) || `${method}_${path.replace(/[^a-zA-Z0-9]/g, '_')}`
        const description = (op.summary as string) || (op.description as string) || ''

        // Build input schema from parameters and request body
        const properties: Record<string, unknown> = {}
        const required: string[] = []
        const params = op.parameters as Array<Record<string, unknown>> | undefined
        if (params) {
          for (const param of params) {
            properties[param.name as string] = param.schema || { type: 'string' }
            if (param.required) required.push(param.name as string)
          }
        }
        const requestBody = op.requestBody as Record<string, unknown> | undefined
        if (requestBody) {
          const bodyContent = requestBody.content as
            | Record<string, Record<string, unknown>>
            | undefined
          if (bodyContent) {
            const jsonBody = bodyContent['application/json']
            if (jsonBody?.schema) {
              properties['body'] = jsonBody.schema
            }
          }
        }

        const inputSchema: Record<string, unknown> = {
          type: 'object',
          properties,
        }
        if (required.length > 0) inputSchema.required = required

        tools.push({ name: toolName, description, inputSchema })
      }
    }
  } catch {
    // Parsing failed, return empty
  }
  return tools
}

const handleValidateOpenApi = async () => {
  if (!openApiContent.value) return
  validatingOpenApi.value = true
  openApiParsedTools.value = []
  openApiSelectedTools.value = new Set()

  try {
    // Try server-side validation first
    const response = await batataApi.validateOpenApiSpec({
      content: openApiContent.value,
      format: openApiFormat.value,
    })
    const tools = response.data.data?.tools || []
    openApiParsedTools.value = tools
    // Select all tools by default
    openApiSelectedTools.value = new Set(tools.map((t: { name: string }) => t.name))
    if (tools.length === 0) {
      toast.warning(t('noToolsParsed'))
    }
  } catch {
    // Fallback to client-side parsing for JSON specs
    const tools = parseOpenApiLocally(openApiContent.value)
    if (tools.length > 0) {
      openApiParsedTools.value = tools
      openApiSelectedTools.value = new Set(tools.map((t) => t.name))
    } else {
      toast.error(t('openApiParseError'))
    }
  } finally {
    validatingOpenApi.value = false
  }
}

const toggleOpenApiTool = (name: string) => {
  if (openApiSelectedTools.value.has(name)) {
    openApiSelectedTools.value.delete(name)
  } else {
    openApiSelectedTools.value.add(name)
  }
}

const toggleSelectAllOpenApiTools = () => {
  if (openApiSelectedTools.value.size === openApiParsedTools.value.length) {
    openApiSelectedTools.value = new Set()
  } else {
    openApiSelectedTools.value = new Set(openApiParsedTools.value.map((t) => t.name))
  }
}

const handleImportOpenApi = async () => {
  if (openApiSelectedTools.value.size === 0) return
  importingOpenApi.value = true
  try {
    await batataApi.importOpenApiTools({
      content: openApiContent.value,
      format: openApiFormat.value,
      selectedTools: Array.from(openApiSelectedTools.value),
    })
    showOpenApiModal.value = false
    openApiContent.value = ''
    openApiParsedTools.value = []
    openApiSelectedTools.value = new Set()
    fetchMcpServers()
  } catch (error) {
    logger.error('Failed to import from OpenAPI:', error)
    toast.apiError(error)
  } finally {
    importingOpenApi.value = false
  }
}

const toggleRegistryItem = (name: string) => {
  if (selectedRegistryItems.value.has(name)) {
    selectedRegistryItems.value.delete(name)
  } else {
    selectedRegistryItems.value.add(name)
  }
}

const handleImportFromRegistry = async () => {
  if (!registrySearchKeyword.value) return
  importingFromRegistry.value = true
  try {
    await batataApi.executeMcpImport({
      content: JSON.stringify({
        registryUrl: registryUrl.value,
        search: registrySearchKeyword.value,
        selected: Array.from(selectedRegistryItems.value),
      }),
    })
    showImportRegistryModal.value = false
    fetchMcpServers()
  } catch (error) {
    logger.error('Failed to import from registry:', error)
    toast.apiError(error)
  } finally {
    importingFromRegistry.value = false
  }
}

// Methods
const fetchMcpServers = async () => {
  loading.value = true
  try {
    const response = await batataApi.getMcpServerList({
      pageNo: currentPage.value,
      pageSize: pageSize.value,
      search: searchKeyword.value || undefined,
    })
    mcpServers.value = response.data.data.pageItems || []
    total.value = response.data.data.totalCount || 0
  } catch (error) {
    logger.error('Failed to fetch MCP servers:', error)
    toast.apiError(error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  fetchMcpServers()
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchMcpServers()
}

const getTypeClass = (type: string) => {
  const classes: Record<string, string> = {
    stdio: 'badge badge-info',
    sse: 'badge badge-success',
    'mcp-sse': 'badge badge-success',
    'mcp-streamable': 'badge badge-primary',
    http: 'badge badge-primary',
    dubbo: 'badge badge-warning',
    off: 'badge badge-secondary',
  }
  return classes[type] || 'badge'
}

const handleCreate = () => {
  router.push('/mcp/new')
}

const handleEdit = (server: McpServerInfo) => {
  router.push(
    `/mcp/edit?namespace=${encodeURIComponent(server.namespace || 'default')}&name=${encodeURIComponent(server.name)}`,
  )
}

const handleToggleStatus = async (server: McpServerInfo) => {
  try {
    const namespace = server.namespace || 'default'
    await batataApi.updateMcpServer(namespace, server.name, {
      ...server,
      enabled: !server.enabled,
    })
    fetchMcpServers()
  } catch (error) {
    logger.error('Failed to toggle MCP server status:', error)
    toast.apiError(error)
  }
}

const handleDelete = (server: McpServerInfo) => {
  serverToDelete.value = server
  showDeleteModal.value = true
}

const confirmDelete = async () => {
  if (!serverToDelete.value) return
  try {
    const namespace = serverToDelete.value.namespace || 'default'
    await batataApi.deleteMcpServer(namespace, serverToDelete.value.name)
    showDeleteModal.value = false
    fetchMcpServers()
  } catch (error) {
    logger.error('Failed to delete MCP server:', error)
    toast.apiError(error)
  }
}

// Lifecycle
onMounted(() => {
  fetchMcpServers()
})
</script>
