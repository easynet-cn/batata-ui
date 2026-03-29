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
            {{ agentSpecName || t('agentSpecDetail') }}
          </h1>
          <p class="text-xs text-text-secondary mt-0.5">{{ t('agentSpecsDesc') }}</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <template v-if="detail">
          <button
            v-if="detail.editingVersion"
            @click="handleEditDraft"
            class="btn btn-secondary btn-sm"
          >
            <Pencil class="w-3.5 h-3.5" />
            {{ t('skillEditDraft') }}
          </button>
          <button v-else @click="handleCreateDraft()" class="btn btn-secondary btn-sm">
            <FilePlus class="w-3.5 h-3.5" />
            {{ t('skillCreateDraft') }}
          </button>
          <button
            v-if="detail.onlineCnt > 0"
            @click="handleOffline"
            class="btn btn-secondary btn-sm"
          >
            <WifiOff class="w-3.5 h-3.5" />
            {{ t('skillOfflineAction') }}
          </button>
          <button v-else @click="handleOnline" class="btn btn-primary btn-sm">
            <Wifi class="w-3.5 h-3.5" />
            {{ t('skillOnlineAction') }}
          </button>
          <button @click="handleDelete" class="btn btn-ghost btn-sm text-danger">
            <Trash2 class="w-3.5 h-3.5" />
          </button>
        </template>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="card p-8 text-center">
      <Loader2 class="w-8 h-8 animate-spin mx-auto text-primary" />
    </div>

    <template v-else-if="detail">
      <!-- Info Section -->
      <div class="card">
        <div class="p-4">
          <h3 class="text-sm font-medium text-text-primary mb-4">{{ t('basicInfo') }}</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <span class="text-xs text-text-secondary">{{ t('skillScope') }}</span>
              <p>
                <span
                  :class="detail.scope === 'public' ? 'badge badge-success' : 'badge badge-warning'"
                >
                  {{ detail.scope === 'public' ? t('skillScopePublic') : t('skillScopePrivate') }}
                </span>
              </p>
            </div>
            <div>
              <span class="text-xs text-text-secondary">{{ t('status') }}</span>
              <p>
                <span :class="detail.enable ? 'badge badge-success' : 'badge badge-danger'">
                  {{ detail.enable ? t('enabled') : t('disabled') }}
                </span>
              </p>
            </div>
            <div>
              <span class="text-xs text-text-secondary">{{ t('onlineCnt') }}</span>
              <p class="font-medium text-text-primary">{{ detail.onlineCnt }}</p>
            </div>
            <div>
              <span class="text-xs text-text-secondary">{{ t('downloadCount') }}</span>
              <p class="font-medium text-text-primary">{{ detail.downloadCount }}</p>
            </div>
            <div>
              <span class="text-xs text-text-secondary">{{ t('modifyTime') }}</span>
              <p class="text-sm text-text-primary">
                {{ new Date(detail.updateTime).toLocaleString() }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Labels Section -->
      <div class="card">
        <div class="p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-medium text-text-primary">{{ t('skillLabels') }}</h3>
            <button @click="showLabelsModal = true" class="btn btn-ghost btn-sm">
              <Pencil class="w-3.5 h-3.5" />
            </button>
          </div>
          <div
            v-if="detail.labels && Object.keys(detail.labels).length > 0"
            class="flex flex-wrap gap-1"
          >
            <span v-for="(value, key) in detail.labels" :key="key" class="badge badge-info">
              {{ key }}={{ value }}
            </span>
          </div>
          <p v-else class="text-xs text-text-tertiary">{{ t('noData') }}</p>
        </div>
      </div>

      <!-- Biz Tags Section -->
      <div class="card">
        <div class="p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-medium text-text-primary">{{ t('skillBizTags') }}</h3>
            <button @click="showBizTagsModal = true" class="btn btn-ghost btn-sm">
              <Pencil class="w-3.5 h-3.5" />
            </button>
          </div>
          <div v-if="detail.bizTags" class="flex flex-wrap gap-1">
            <span v-for="tag in detail.bizTags.split(',')" :key="tag" class="badge">
              {{ tag.trim() }}
            </span>
          </div>
          <p v-else class="text-xs text-text-tertiary">{{ t('noData') }}</p>
        </div>
      </div>

      <!-- Version Timeline -->
      <div class="card">
        <div class="p-4 border-b border-border">
          <h3 class="text-sm font-medium text-text-primary">{{ t('skillVersions') }}</h3>
        </div>
        <div v-if="detail.versions.length === 0" class="p-6 text-center text-text-secondary">
          {{ t('noVersions') }}
        </div>
        <div v-else class="divide-y divide-border">
          <div
            v-for="ver in detail.versions"
            :key="ver.version"
            class="p-4 hover:bg-bg-secondary transition-colors cursor-pointer"
            :class="{ 'bg-bg-secondary': selectedVersion === ver.version }"
            @click="handleSelectVersion(ver.version)"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <span class="font-mono text-sm font-medium text-text-primary">
                  v{{ ver.version }}
                </span>
                <span :class="getStatusBadgeClass(ver.status)">
                  {{ getStatusLabel(ver.status) }}
                </span>
              </div>
              <div class="flex items-center gap-2">
                <!-- Version Actions -->
                <button
                  @click.stop="handleViewVersionContent(ver.version)"
                  class="btn btn-ghost btn-sm"
                  :title="t('agentSpecContent')"
                >
                  <Eye class="w-3.5 h-3.5" />
                </button>
                <button
                  v-if="ver.status === 'draft'"
                  @click.stop="handleSubmitVersion(ver.version)"
                  class="btn btn-ghost btn-sm"
                  :title="t('skillSubmitReview')"
                >
                  <Send class="w-3.5 h-3.5" />
                </button>
                <button
                  v-if="ver.status === 'reviewing'"
                  @click.stop="handlePublishVersion(ver.version)"
                  class="btn btn-ghost btn-sm"
                  :title="t('skillPublish')"
                >
                  <Rocket class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div class="flex items-center gap-4 mt-2 text-xs text-text-tertiary">
              <span>{{ ver.author }}</span>
              <span>{{ new Date(ver.createTime).toLocaleString() }}</span>
              <span>{{ t('downloadCount') }}: {{ ver.downloadCount }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Version Content Display -->
      <div v-if="versionContent" class="card">
        <div class="p-4 border-b border-border">
          <h3 class="text-sm font-medium text-text-primary">
            {{ t('agentSpecContent') }} - v{{ selectedVersion }}
          </h3>
        </div>
        <div class="p-4">
          <CodeEditor
            :model-value="versionContent.content"
            language="json"
            readonly
            min-height="300px"
          />
        </div>
      </div>
    </template>

    <!-- Delete Confirm Modal -->
    <ConfirmModal
      v-model="showDeleteModal"
      :title="t('deleteAgentSpec')"
      :message="`${t('deleteAgentSpecConfirm')} ${agentSpecName}?`"
      :confirm-text="t('delete')"
      danger
      @confirm="confirmDelete"
    />

    <!-- Labels Edit Modal -->
    <FormModal
      v-model="showLabelsModal"
      :title="t('skillLabels')"
      :loading="savingLabels"
      @submit="handleSaveLabels"
    >
      <div class="space-y-3">
        <div>
          <label class="block text-xs font-medium text-text-secondary mb-1">
            {{ t('skillLabels') }}
          </label>
          <textarea
            v-model="labelsText"
            class="input min-h-[100px] font-mono"
            placeholder="key1=value1&#10;key2=value2"
          />
          <p class="text-xs text-text-tertiary mt-1">{{ t('envVarsHint') }}</p>
        </div>
      </div>
    </FormModal>

    <!-- Biz Tags Edit Modal -->
    <FormModal
      v-model="showBizTagsModal"
      :title="t('skillBizTags')"
      :loading="savingBizTags"
      @submit="handleSaveBizTags"
    >
      <div class="space-y-3">
        <div>
          <label class="block text-xs font-medium text-text-secondary mb-1">
            {{ t('skillBizTags') }}
          </label>
          <input v-model="bizTagsText" type="text" class="input" placeholder="tag1,tag2,tag3" />
        </div>
      </div>
    </FormModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Loader2,
  Eye,
  Send,
  Rocket,
  FilePlus,
  Wifi,
  WifiOff,
} from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import batataApi from '@/api/batata'
import { toast } from '@/utils/error'
import { logger } from '@/utils/logger'
import { useBatataStore } from '@/stores/batata'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import FormModal from '@/components/common/FormModal.vue'
import CodeEditor from '@/components/common/CodeEditor.vue'
import type { AgentSpecDetail, AgentSpecDocument, AgentSpecVersionStatus } from '@/types'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const store = useBatataStore()
const namespace = computed(() => store.currentNamespace)

const agentSpecName = computed(() => route.query.agentSpecName as string)

// State
const loading = ref(false)
const detail = ref<AgentSpecDetail | null>(null)
const selectedVersion = ref<string | null>(null)
const versionContent = ref<AgentSpecDocument | null>(null)

// Modals
const showDeleteModal = ref(false)
const showLabelsModal = ref(false)
const showBizTagsModal = ref(false)
const savingLabels = ref(false)
const savingBizTags = ref(false)
const labelsText = ref('')
const bizTagsText = ref('')

// Methods
const fetchDetail = async () => {
  if (!agentSpecName.value) return
  loading.value = true
  try {
    const response = await batataApi.getAgentSpecDetail(namespace.value, agentSpecName.value)
    detail.value = response.data.data
  } catch (error) {
    logger.error('Failed to fetch agent spec detail:', error)
    toast.apiError(error)
  } finally {
    loading.value = false
  }
}

const handleSelectVersion = (version: string) => {
  if (selectedVersion.value === version) {
    selectedVersion.value = null
    versionContent.value = null
  } else {
    handleViewVersionContent(version)
  }
}

const handleViewVersionContent = async (version: string) => {
  selectedVersion.value = version
  try {
    const response = await batataApi.getAgentSpecVersion(
      namespace.value,
      agentSpecName.value,
      version,
    )
    versionContent.value = response.data.data
  } catch (error) {
    logger.error('Failed to fetch version content:', error)
    toast.apiError(error)
  }
}

const getStatusBadgeClass = (status: AgentSpecVersionStatus) => {
  const classes: Record<AgentSpecVersionStatus, string> = {
    draft: 'badge badge-warning',
    reviewing: 'badge badge-info',
    online: 'badge badge-success',
    offline: 'badge badge-secondary',
  }
  return classes[status] || 'badge'
}

const getStatusLabel = (status: AgentSpecVersionStatus) => {
  const labels: Record<AgentSpecVersionStatus, string> = {
    draft: t('skillDraft'),
    reviewing: t('skillReviewing'),
    online: t('skillOnline'),
    offline: t('skillOffline'),
  }
  return labels[status] || status
}

const goBack = () => {
  router.push('/ai/agent-specs')
}

const handleEditDraft = () => {
  router.push(`/ai/agent-specs/draft?agentSpecName=${encodeURIComponent(agentSpecName.value)}`)
}

const handleCreateDraft = async (basedOnVersion?: string) => {
  try {
    await batataApi.createAgentSpecDraft({
      namespaceId: namespace.value,
      agentSpecName: agentSpecName.value,
      basedOnVersion,
    })
    fetchDetail()
  } catch (error) {
    logger.error('Failed to create draft:', error)
    toast.apiError(error)
  }
}

const handleOnline = async () => {
  try {
    await batataApi.onlineAgentSpec({
      namespaceId: namespace.value,
      agentSpecName: agentSpecName.value,
    })
    fetchDetail()
  } catch (error) {
    logger.error('Failed to online agent spec:', error)
    toast.apiError(error)
  }
}

const handleOffline = async () => {
  try {
    await batataApi.offlineAgentSpec({
      namespaceId: namespace.value,
      agentSpecName: agentSpecName.value,
    })
    fetchDetail()
  } catch (error) {
    logger.error('Failed to offline agent spec:', error)
    toast.apiError(error)
  }
}

const handleSubmitVersion = async (version: string) => {
  try {
    await batataApi.submitAgentSpec(namespace.value, agentSpecName.value, version)
    fetchDetail()
  } catch (error) {
    logger.error('Failed to submit agent spec:', error)
    toast.apiError(error)
  }
}

const handlePublishVersion = async (version: string) => {
  try {
    await batataApi.publishAgentSpec({
      namespaceId: namespace.value,
      agentSpecName: agentSpecName.value,
      version,
    })
    fetchDetail()
  } catch (error) {
    logger.error('Failed to publish agent spec:', error)
    toast.apiError(error)
  }
}

const handleDelete = () => {
  showDeleteModal.value = true
}

const confirmDelete = async () => {
  try {
    await batataApi.deleteAgentSpec(namespace.value, agentSpecName.value)
    showDeleteModal.value = false
    router.push('/ai/agent-specs')
  } catch (error) {
    logger.error('Failed to delete agent spec:', error)
    toast.apiError(error)
  }
}

const handleSaveLabels = async () => {
  savingLabels.value = true
  try {
    const labels: Record<string, string> = {}
    labelsText.value
      .split('\n')
      .filter(Boolean)
      .forEach((line) => {
        const [key, ...rest] = line.split('=')
        if (key?.trim()) {
          labels[key.trim()] = rest.join('=').trim()
        }
      })
    await batataApi.updateAgentSpecLabels(namespace.value, agentSpecName.value, labels)
    showLabelsModal.value = false
    fetchDetail()
  } catch (error) {
    logger.error('Failed to update labels:', error)
    toast.apiError(error)
  } finally {
    savingLabels.value = false
  }
}

const handleSaveBizTags = async () => {
  savingBizTags.value = true
  try {
    await batataApi.updateAgentSpecBizTags(namespace.value, agentSpecName.value, bizTagsText.value)
    showBizTagsModal.value = false
    fetchDetail()
  } catch (error) {
    logger.error('Failed to update biz tags:', error)
    toast.apiError(error)
  } finally {
    savingBizTags.value = false
  }
}

// Lifecycle
onMounted(() => {
  fetchDetail()
})
</script>
