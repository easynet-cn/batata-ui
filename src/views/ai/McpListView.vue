<template>
  <div class="space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-base font-semibold text-text-primary">{{ t('mcpServers') }}</h1>
        <p class="text-xs text-text-secondary mt-0.5">{{ t('mcpServersDesc') }}</p>
      </div>
      <button @click="handleCreate" class="btn btn-primary btn-sm">
        <Plus class="w-3.5 h-3.5" />
        {{ t('addMcpServer') }}
      </button>
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Search, Pencil, Trash2, Loader2, Power, PowerOff } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import batataApi from '@/api/batata'
import { toast } from '@/utils/error'
import { logger } from '@/utils/logger'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
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

// Modals
const showDeleteModal = ref(false)
const serverToDelete = ref<McpServerInfo | null>(null)

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
    toast.error(t('operationFailed'))
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
    http: 'badge badge-primary',
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
    toast.error(t('operationFailed'))
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
    toast.error(t('operationFailed'))
  }
}

// Lifecycle
onMounted(() => {
  fetchMcpServers()
})
</script>
