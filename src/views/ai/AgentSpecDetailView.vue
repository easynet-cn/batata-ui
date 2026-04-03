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
              <div class="flex items-center gap-2 mt-1">
                <span
                  :class="detail.scope === 'public' ? 'badge badge-success' : 'badge badge-warning'"
                >
                  {{ detail.scope === 'public' ? t('skillScopePublic') : t('skillScopePrivate') }}
                </span>
                <button @click="toggleScope" class="btn btn-ghost btn-sm" :title="t('edit')">
                  <ArrowLeftRight class="w-3 h-3" />
                </button>
              </div>
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
            class="p-4 hover:bg-bg-secondary transition-colors"
            :class="{ 'bg-bg-secondary': selectedVersion === ver.version }"
          >
            <div class="flex items-center justify-between">
              <div
                class="flex items-center gap-3 cursor-pointer"
                @click="handleSelectVersion(ver.version)"
              >
                <!-- Status dot -->
                <div
                  class="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  :class="statusDotClass(ver.status)"
                />
                <span class="font-mono text-sm font-medium text-text-primary">
                  v{{ ver.version }}
                </span>
                <span :class="getStatusBadgeClass(ver.status)">
                  {{ getStatusLabel(ver.status) }}
                </span>
              </div>
              <div class="flex items-center gap-1">
                <!-- View content -->
                <button
                  @click.stop="handleViewVersionContent(ver.version)"
                  class="btn btn-ghost btn-sm"
                  :title="t('agentSpecContent')"
                >
                  <Eye class="w-3.5 h-3.5" />
                </button>
                <!-- Download -->
                <button
                  @click.stop="handleDownloadVersion(ver.version)"
                  class="btn btn-ghost btn-sm"
                  :title="t('skillDownload')"
                >
                  <Download class="w-3.5 h-3.5" />
                </button>
                <!-- Draft: Submit / Delete -->
                <template v-if="ver.status === 'draft'">
                  <button
                    @click.stop="handleSubmitVersion(ver.version)"
                    class="btn btn-ghost btn-sm text-blue-600"
                    :title="t('skillSubmitReview')"
                  >
                    <Send class="w-3.5 h-3.5" />
                  </button>
                  <button
                    @click.stop="handleDeleteDraft"
                    class="btn btn-ghost btn-sm text-danger"
                    :title="t('deleteDraft')"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </template>
                <!-- Reviewing: Publish / Force Publish -->
                <template v-if="ver.status === 'reviewing'">
                  <button
                    @click.stop="handlePublishVersion(ver.version)"
                    class="btn btn-ghost btn-sm text-emerald-600"
                    :title="t('skillPublish')"
                  >
                    <Rocket class="w-3.5 h-3.5" />
                  </button>
                  <button
                    @click.stop="handleForcePublish(ver.version)"
                    class="btn btn-ghost btn-sm text-orange-600"
                    :title="t('forcePublish')"
                  >
                    <Zap class="w-3.5 h-3.5" />
                  </button>
                </template>
                <!-- Online: Offline -->
                <button
                  v-if="ver.status === 'online'"
                  @click.stop="handleOfflineVersion(ver.version)"
                  class="btn btn-ghost btn-sm"
                  :title="t('skillOfflineAction')"
                >
                  <WifiOff class="w-3.5 h-3.5" />
                </button>
                <!-- Offline: Online -->
                <button
                  v-if="ver.status === 'offline'"
                  @click.stop="handleOnlineVersion(ver.version)"
                  class="btn btn-ghost btn-sm"
                  :title="t('skillOnlineAction')"
                >
                  <Wifi class="w-3.5 h-3.5" />
                </button>
                <!-- Create Draft From (for online/offline, when no editing version) -->
                <button
                  v-if="
                    (ver.status === 'online' || ver.status === 'offline') &&
                    !detail.editingVersion &&
                    !detail.reviewingVersion
                  "
                  @click.stop="handleCreateDraft(ver.version)"
                  class="btn btn-ghost btn-sm"
                  :title="t('createDraftFromVersion')"
                >
                  <FilePlus class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <!-- Version meta -->
            <div class="flex items-center gap-4 mt-2 text-xs text-text-tertiary ml-5">
              <span>{{ ver.author }}</span>
              <span>{{ new Date(ver.createTime).toLocaleString() }}</span>
              <span v-if="ver.description" class="truncate max-w-[200px]">{{
                ver.description
              }}</span>
            </div>
            <!-- Pipeline Status (if present) -->
            <div v-if="ver.publishPipelineInfo" class="mt-3 ml-5">
              <PipelineStatusDisplay :publish-pipeline-info="ver.publishPipelineInfo" />
            </div>
          </div>
        </div>
      </div>

      <!-- Version Content Display -->
      <div v-if="versionContent" class="card">
        <div class="p-4 border-b border-border">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-medium text-text-primary">
              {{ t('agentSpecContent') }} - v{{ selectedVersion }}
            </h3>
            <button
              @click="
                versionContent = null
                selectedVersion = null
              "
              class="btn btn-ghost btn-sm"
            >
              <X class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <div class="p-4">
          <CodeEditor
            :model-value="versionContent.content"
            language="json"
            readonly
            min-height="300px"
          />
        </div>
        <!-- Resources -->
        <div
          v-if="versionContent.resource && Object.keys(versionContent.resource).length > 0"
          class="p-4 border-t border-border"
        >
          <h4 class="text-xs font-medium text-text-secondary mb-2">{{ t('skillResources') }}</h4>
          <div class="space-y-2">
            <div
              v-for="(res, resName) in versionContent.resource"
              :key="resName"
              class="p-2 rounded-lg bg-bg-secondary"
            >
              <div class="flex items-center gap-2 text-xs">
                <FileCode class="w-3 h-3 text-text-tertiary" />
                <span class="font-mono text-text-primary">{{ resName }}</span>
                <span class="badge badge-default">{{ res.type }}</span>
              </div>
            </div>
          </div>
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

    <!-- Delete Draft Confirm Modal -->
    <ConfirmModal
      v-model="showDeleteDraftModal"
      :title="t('deleteDraft')"
      :message="t('deleteDraftConfirm')"
      :confirm-text="t('delete')"
      danger
      @confirm="confirmDeleteDraft"
    />

    <!-- Force Publish Confirm Modal -->
    <ConfirmModal
      v-model="showForcePublishModal"
      :title="t('forcePublish')"
      :message="t('forcePublishConfirm')"
      :confirm-text="t('forcePublish')"
      @confirm="confirmForcePublish"
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
  ArrowLeftRight,
  Pencil,
  Trash2,
  Loader2,
  Eye,
  Send,
  Rocket,
  FilePlus,
  Wifi,
  WifiOff,
  Download,
  Zap,
  X,
  FileCode,
} from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import batataApi from '@/api/batata'
import { toast } from '@/utils/error'
import { logger } from '@/utils/logger'
import { useBatataStore } from '@/stores/batata'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import FormModal from '@/components/common/FormModal.vue'
import CodeEditor from '@/components/common/CodeEditor.vue'
import PipelineStatusDisplay from '@/components/ai/PipelineStatusDisplay.vue'
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
const showDeleteDraftModal = ref(false)
const showForcePublishModal = ref(false)
const forcePublishVersion = ref('')
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

const handleDownloadVersion = async (version: string) => {
  try {
    const response = await batataApi.downloadAgentSpecVersion(
      namespace.value,
      agentSpecName.value,
      version,
    )
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `${agentSpecName.value}-${version}.zip`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  } catch (error) {
    logger.error('Failed to download version:', error)
    toast.apiError(error)
  }
}

const statusDotClass = (status: AgentSpecVersionStatus) => {
  const classes: Record<AgentSpecVersionStatus, string> = {
    draft: 'bg-amber-500',
    reviewing: 'bg-blue-500',
    online: 'bg-emerald-500',
    offline: 'bg-gray-400',
  }
  return classes[status] || 'bg-gray-400'
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
    toast.success(t('skillCreateDraft'))
    fetchDetail()
  } catch (error) {
    logger.error('Failed to create draft:', error)
    toast.apiError(error)
  }
}

const handleDeleteDraft = () => {
  showDeleteDraftModal.value = true
}

const confirmDeleteDraft = async () => {
  try {
    await batataApi.deleteAgentSpecDraft(namespace.value, agentSpecName.value)
    showDeleteDraftModal.value = false
    toast.success(t('deleteDraft'))
    fetchDetail()
  } catch (error) {
    logger.error('Failed to delete draft:', error)
    toast.apiError(error)
  }
}

const handleOnlineVersion = async (version: string) => {
  try {
    await batataApi.onlineAgentSpec({
      namespaceId: namespace.value,
      agentSpecName: agentSpecName.value,
      version,
    })
    toast.success(t('skillOnlineAction'))
    fetchDetail()
  } catch (error) {
    logger.error('Failed to online agent spec:', error)
    toast.apiError(error)
  }
}

const handleOfflineVersion = async (version: string) => {
  try {
    await batataApi.offlineAgentSpec({
      namespaceId: namespace.value,
      agentSpecName: agentSpecName.value,
      version,
    })
    toast.success(t('skillOfflineAction'))
    fetchDetail()
  } catch (error) {
    logger.error('Failed to offline agent spec:', error)
    toast.apiError(error)
  }
}

const handleSubmitVersion = async (version: string) => {
  try {
    await batataApi.submitAgentSpec(namespace.value, agentSpecName.value, version)
    toast.success(t('skillSubmitReview'))
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
    toast.success(t('skillPublish'))
    fetchDetail()
  } catch (error) {
    logger.error('Failed to publish agent spec:', error)
    toast.apiError(error)
  }
}

const handleForcePublish = (version: string) => {
  forcePublishVersion.value = version
  showForcePublishModal.value = true
}

const confirmForcePublish = async () => {
  try {
    await batataApi.forcePublishAgentSpec({
      namespaceId: namespace.value,
      agentSpecName: agentSpecName.value,
      version: forcePublishVersion.value,
    })
    showForcePublishModal.value = false
    toast.success(t('forcePublish'))
    fetchDetail()
  } catch (error) {
    logger.error('Failed to force publish agent spec:', error)
    toast.apiError(error)
  }
}

const toggleScope = async () => {
  if (!detail.value) return
  const newScope = detail.value.scope === 'public' ? 'private' : 'public'
  try {
    await batataApi.updateAgentSpecScope(namespace.value, agentSpecName.value, newScope)
    fetchDetail()
  } catch (error) {
    logger.error('Failed to update scope:', error)
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
