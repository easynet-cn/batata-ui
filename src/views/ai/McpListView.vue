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
      <div class="flex items-center justify-between p-4 border-t border-border">
        <div class="text-sm text-text-secondary">
          {{ t('total') }}: {{ total }} {{ t('items') }}
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="handlePageChange(currentPage - 1)"
            :disabled="currentPage <= 1"
            class="btn btn-secondary btn-sm"
          >
            <ChevronLeft class="w-3.5 h-3.5" />
          </button>
          <span class="text-sm text-text-primary px-3"> {{ currentPage }} / {{ totalPages }} </span>
          <button
            @click="handlePageChange(currentPage + 1)"
            :disabled="currentPage >= totalPages"
            class="btn btn-secondary btn-sm"
          >
            <ChevronRight class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirm Modal -->
    <div v-if="showDeleteModal" class="modal-backdrop" @click="showDeleteModal = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3 class="text-sm font-semibold text-text-primary">{{ t('confirmDelete') }}</h3>
          <button @click="showDeleteModal = false" class="btn btn-ghost btn-sm">
            <X class="w-3.5 h-3.5" />
          </button>
        </div>
        <div class="modal-body">
          <p class="text-text-secondary">
            {{ t('confirmDeleteMcpServer') }}
            <span class="font-medium text-text-primary">{{ serverToDelete?.name }}</span
            >?
          </p>
        </div>
        <div class="modal-footer">
          <button @click="showDeleteModal = false" class="btn btn-secondary">
            {{ t('cancel') }}
          </button>
          <button @click="confirmDelete" class="btn btn-danger">
            {{ t('delete') }}
          </button>
        </div>
      </div>
    </div>
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
  X,
  ChevronLeft,
  ChevronRight,
  Power,
  PowerOff,
} from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import batataApi from '@/api/batata'
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

// Computed
const totalPages = computed(() => Math.ceil(total.value / pageSize.value) || 1)

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
    console.error('Failed to fetch MCP servers:', error)
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
    console.error('Failed to toggle MCP server status:', error)
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
    console.error('Failed to delete MCP server:', error)
  }
}

// Lifecycle
onMounted(() => {
  fetchMcpServers()
})
</script>
