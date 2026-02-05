<template>
  <div class="space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-base font-semibold text-text-primary">{{ t('agents') }}</h1>
        <p class="text-xs text-text-secondary mt-0.5">{{ t('agentsDesc') }}</p>
      </div>
      <button @click="handleCreate" class="btn btn-primary btn-sm">
        <Plus class="w-3.5 h-3.5" />
        {{ t('createAgent') }}
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
              :placeholder="t('searchAgent')"
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

    <!-- Agent List -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      <template v-if="loading">
        <div class="card p-8 text-center col-span-full">
          <Loader2 class="w-5 h-5 animate-spin mx-auto text-primary" />
        </div>
      </template>
      <template v-else-if="agents.length === 0">
        <div class="card p-8 text-center col-span-full text-text-secondary">
          {{ t('noData') }}
        </div>
      </template>
      <template v-else>
        <div v-for="agent in agents" :key="agent.id" class="card hover:shadow-md transition-shadow">
          <div class="p-3">
            <div class="flex items-start justify-between mb-3">
              <div class="flex items-center gap-2">
                <div class="w-10 h-10 rounded-lg bg-primary-light flex items-center justify-center">
                  <Bot class="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 class="font-medium text-text-primary">{{ agent.name }}</h3>
                  <p class="text-xs text-text-tertiary">{{ agent.model || 'default' }}</p>
                </div>
              </div>
              <span :class="agent.enabled ? 'badge badge-success' : 'badge badge-danger'">
                {{ agent.enabled ? t('enabled') : t('disabled') }}
              </span>
            </div>

            <p class="text-sm text-text-secondary mb-4 line-clamp-2">
              {{ agent.description || t('noDescription') }}
            </p>

            <div class="flex items-center gap-2 text-xs text-text-tertiary mb-4">
              <span class="flex items-center gap-1">
                <Server class="w-3 h-3" />
                {{ agent.mcpServers?.length || 0 }} {{ t('mcpServers') }}
              </span>
              <span class="flex items-center gap-1">
                <Wrench class="w-3 h-3" />
                {{ agent.tools?.length || 0 }} {{ t('tools') }}
              </span>
            </div>

            <div class="flex items-center justify-end gap-1 pt-3 border-t border-border">
              <button @click="handleEdit(agent)" class="btn btn-ghost btn-sm" :title="t('edit')">
                <Pencil class="w-3.5 h-3.5" />
              </button>
              <button
                @click="handleToggleStatus(agent)"
                class="btn btn-ghost btn-sm"
                :title="agent.enabled ? t('disable') : t('enable')"
              >
                <component :is="agent.enabled ? PowerOff : Power" class="w-3.5 h-3.5" />
              </button>
              <button
                @click="handleDelete(agent)"
                class="btn btn-ghost btn-sm text-danger"
                :title="t('delete')"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Pagination -->
    <div v-if="!loading && agents.length > 0" class="card">
      <div class="flex items-center justify-between p-4">
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
            {{ t('confirmDeleteAgent') }}
            <span class="font-medium text-text-primary">{{ agentToDelete?.name }}</span
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
  Bot,
  Server,
  Wrench,
} from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import batataApi from '@/api/batata'
import type { AgentInfo, Namespace } from '@/types'

defineProps<{
  namespace: Namespace
}>()

const router = useRouter()
const { t } = useI18n()

// State
const loading = ref(false)
const agents = ref<AgentInfo[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(12)
const searchKeyword = ref('')

// Modals
const showDeleteModal = ref(false)
const agentToDelete = ref<AgentInfo | null>(null)

// Computed
const totalPages = computed(() => Math.ceil(total.value / pageSize.value) || 1)

// Methods
const fetchAgents = async () => {
  loading.value = true
  try {
    const response = await batataApi.getAgentList({
      pageNo: currentPage.value,
      pageSize: pageSize.value,
      name: searchKeyword.value || undefined,
    })
    agents.value = response.data.data.pageItems || []
    total.value = response.data.data.totalCount || 0
  } catch (error) {
    console.error('Failed to fetch agents:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  fetchAgents()
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchAgents()
}

const handleCreate = () => {
  router.push('/agent/new')
}

const handleEdit = (agent: AgentInfo) => {
  router.push(
    `/agent/edit?namespace=${encodeURIComponent(agent.namespace || 'default')}&name=${encodeURIComponent(agent.name)}`,
  )
}

const handleToggleStatus = async (agent: AgentInfo) => {
  try {
    const namespace = agent.namespace || 'default'
    await batataApi.updateAgent(namespace, agent.name, {
      ...agent,
      enabled: !agent.enabled,
    })
    fetchAgents()
  } catch (error) {
    console.error('Failed to toggle agent status:', error)
  }
}

const handleDelete = (agent: AgentInfo) => {
  agentToDelete.value = agent
  showDeleteModal.value = true
}

const confirmDelete = async () => {
  if (!agentToDelete.value) return
  try {
    const namespace = agentToDelete.value.namespace || 'default'
    await batataApi.deleteAgent(namespace, agentToDelete.value.name)
    showDeleteModal.value = false
    fetchAgents()
  } catch (error) {
    console.error('Failed to delete agent:', error)
  }
}

// Lifecycle
onMounted(() => {
  fetchAgents()
})
</script>
