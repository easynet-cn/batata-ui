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
            {{ itemName || t('skillDetail') }}
          </h1>
          <p class="text-xs text-text-secondary mt-0.5">{{ t('skillDetail') }}</p>
        </div>
      </div>
      <div v-if="detail" class="flex items-center gap-2">
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
        <button @click="showOptimizeDialog = true" class="btn btn-secondary btn-sm">
          <Sparkles class="w-3.5 h-3.5" />
          AI Optimize
        </button>
        <button @click="showDeleteModal = true" class="btn btn-ghost btn-sm text-danger">
          <Trash2 class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>

    <!-- Skill AI Optimize Dialog -->
    <SkillOptimizeDialog
      v-model:visible="showOptimizeDialog"
      :skill="currentSkillForOptimize"
      @applied="handleOptimizeApplied"
    />

    <!-- Loading State -->
    <div v-if="loading" class="card p-8 text-center">
      <Loader2 class="w-8 h-8 animate-spin mx-auto text-primary" />
    </div>

    <template v-else-if="detail">
      <!-- Info Section -->
      <div class="card">
        <div class="p-4">
          <h3 class="text-sm font-medium text-text-primary mb-4">{{ t('basicInfo') }}</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <span class="text-xs text-text-secondary">{{ t('skillScope') }}</span>
              <div class="flex items-center gap-2 mt-1">
                <span
                  :class="detail.scope === 'public' ? 'badge badge-success' : 'badge badge-info'"
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
              <span class="text-xs text-text-secondary">{{ t('skillOnline') }}</span>
              <p class="font-medium text-text-primary">{{ detail.onlineCnt }}</p>
            </div>
            <div>
              <span class="text-xs text-text-secondary">{{ t('skillDownload') }}</span>
              <p class="font-medium text-text-primary">{{ detail.downloadCount }}</p>
            </div>
            <div>
              <span class="text-xs text-text-secondary">{{ t('modifyTime') }}</span>
              <p class="font-medium text-text-primary">
                {{ new Date(detail.updateTime).toLocaleString() }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Labels -->
      <div class="card">
        <div class="p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-medium text-text-primary">{{ t('skillLabels') }}</h3>
            <button
              v-if="!editingLabels"
              @click="startEditLabels(detail.labels)"
              class="btn btn-ghost btn-sm"
            >
              <Pencil class="w-3.5 h-3.5" />
              {{ t('edit') }}
            </button>
            <div v-else class="flex items-center gap-1">
              <button @click="saveLabels" class="btn btn-primary btn-sm">
                {{ t('save') }}
              </button>
              <button @click="editingLabels = false" class="btn btn-secondary btn-sm">
                {{ t('cancel') }}
              </button>
            </div>
          </div>
          <div v-if="!editingLabels" class="flex flex-wrap gap-1">
            <span v-for="(value, key) in detail.labels" :key="key" class="badge badge-info">
              {{ key }}={{ value }}
            </span>
            <span
              v-if="!detail.labels || Object.keys(detail.labels).length === 0"
              class="text-xs text-text-tertiary"
            >
              {{ t('noData') }}
            </span>
          </div>
          <textarea
            v-else
            v-model="labelsText"
            class="input min-h-[80px] font-mono"
            placeholder="key1=value1&#10;key2=value2"
          />
        </div>
      </div>

      <!-- Biz Tags -->
      <div class="card">
        <div class="p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-medium text-text-primary">{{ t('skillBizTags') }}</h3>
            <button
              v-if="!editingBizTags"
              @click="startEditBizTags(detail.bizTags)"
              class="btn btn-ghost btn-sm"
            >
              <Pencil class="w-3.5 h-3.5" />
              {{ t('edit') }}
            </button>
            <div v-else class="flex items-center gap-1">
              <button @click="saveBizTags" class="btn btn-primary btn-sm">
                {{ t('save') }}
              </button>
              <button @click="editingBizTags = false" class="btn btn-secondary btn-sm">
                {{ t('cancel') }}
              </button>
            </div>
          </div>
          <div v-if="!editingBizTags" class="flex flex-wrap gap-1">
            <span v-for="tag in bizTagsList" :key="tag" class="badge">
              {{ tag }}
            </span>
            <span v-if="bizTagsList.length === 0" class="text-xs text-text-tertiary">
              {{ t('noData') }}
            </span>
          </div>
          <input
            v-else
            v-model="bizTagsText"
            type="text"
            class="input"
            placeholder="tag1,tag2,tag3"
          />
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
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <!-- Status dot -->
                <div
                  class="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  :class="statusDotClass(ver.status)"
                />
                <span class="text-sm font-semibold text-text-primary">{{ ver.version }}</span>
                <span :class="getStatusClass(ver.status)">
                  {{ getStatusLabel(ver.status) }}
                </span>
              </div>
              <div class="flex items-center gap-1">
                <button
                  @click="handleViewVersion(ver.version)"
                  class="btn btn-ghost btn-sm"
                  :title="t('details')"
                >
                  <Eye class="w-3.5 h-3.5" />
                </button>
                <button
                  @click="handleDownloadVersion(ver.version)"
                  class="btn btn-ghost btn-sm"
                  :title="t('skillDownload')"
                >
                  <Download class="w-3.5 h-3.5" />
                </button>
                <!-- Draft actions -->
                <template v-if="ver.status === 'draft'">
                  <button
                    @click="handleSubmitVersion(ver.version)"
                    class="btn btn-ghost btn-sm text-blue-600"
                    :title="t('skillSubmitReview')"
                  >
                    <Send class="w-3.5 h-3.5" />
                  </button>
                  <button
                    @click="handleDeleteDraft"
                    class="btn btn-ghost btn-sm text-danger"
                    :title="t('deleteDraft')"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </template>
                <!-- Reviewing actions -->
                <template v-if="ver.status === 'reviewing'">
                  <button
                    @click="handlePublishVersion(ver.version)"
                    class="btn btn-ghost btn-sm text-emerald-600"
                    :title="t('skillPublish')"
                  >
                    <Rocket class="w-3.5 h-3.5" />
                  </button>
                  <button
                    @click="handleForcePublish(ver.version)"
                    class="btn btn-ghost btn-sm text-orange-600"
                    :title="t('forcePublish')"
                  >
                    <Zap class="w-3.5 h-3.5" />
                  </button>
                </template>
                <!-- Online: Offline -->
                <button
                  v-if="ver.status === 'online'"
                  @click="handleOfflineVersion(ver.version)"
                  class="btn btn-ghost btn-sm"
                  :title="t('skillOfflineAction')"
                >
                  <WifiOff class="w-3.5 h-3.5" />
                </button>
                <!-- Offline: Online -->
                <button
                  v-if="ver.status === 'offline'"
                  @click="handleOnlineVersion(ver.version)"
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
                  @click="handleCreateDraft(ver.version)"
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
            <!-- Pipeline Status -->
            <div v-if="ver.publishPipelineInfo" class="mt-3 ml-5">
              <PipelineStatusDisplay :publish-pipeline-info="ver.publishPipelineInfo" />
            </div>
          </div>
        </div>
      </div>

      <!-- Version Content Display -->
      <div v-if="selectedVersion" class="card">
        <div class="p-4 border-b border-border">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-medium text-text-primary">
              {{ t('skillMarkdown') }} - {{ selectedVersion.name }} ({{ selectedVersionId }})
            </h3>
            <button @click="selectedVersion = null" class="btn btn-ghost btn-sm">
              <X class="w-3.5 h-3.5" />
              {{ t('close') }}
            </button>
          </div>
        </div>
        <div class="p-4">
          <CodeEditor :model-value="selectedVersion.skillMd" language="text" :readonly="true" />
        </div>
        <!-- Resources -->
        <div
          v-if="selectedVersion.resource && Object.keys(selectedVersion.resource).length > 0"
          class="p-4 border-t border-border"
        >
          <h4 class="text-xs font-medium text-text-secondary mb-2">{{ t('skillResources') }}</h4>
          <div class="space-y-2">
            <div
              v-for="(res, resName) in selectedVersion.resource"
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
      :title="t('deleteSkill')"
      :message="`${t('deleteSkillConfirm')} ${itemName}?`"
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowLeft,
  ArrowLeftRight,
  Pencil,
  FilePlus,
  Trash2,
  Loader2,
  Eye,
  Download,
  Send,
  Rocket,
  Sparkles,
  X,
  Wifi,
  WifiOff,
  Zap,
  FileCode,
} from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import batataApi from '@/api/batata'
import { toast } from '@/utils/error'
import SkillOptimizeDialog from '@/components/ai/SkillOptimizeDialog.vue'
import PipelineStatusDisplay from '@/components/ai/PipelineStatusDisplay.vue'
import { logger } from '@/utils/logger'
import { useDetailView } from '@/composables/useDetailView'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import CodeEditor from '@/components/common/CodeEditor.vue'
import type { SkillAdminDetail, SkillDocument, SkillVersionStatus } from '@/types'

const router = useRouter()
const { t } = useI18n()
const showOptimizeDialog = ref(false)

// Use detail view composable
const {
  namespace,
  itemName,
  loading,
  detail,
  showDeleteModal,
  editingLabels,
  labelsText,
  startEditLabels,
  saveLabels,
  editingBizTags,
  bizTagsText,
  startEditBizTags,
  saveBizTags,
  fetchDetail,
  goBack,
  confirmDelete,
} = useDetailView<SkillAdminDetail>({
  fetchFn: (ns, name) => batataApi.getSkillDetail(ns, name),
  deleteFn: (ns, name) => batataApi.deleteSkill(ns, name),
  queryKey: 'skillName',
  listRoute: '/skills',
  updateLabelsFn: (ns, name, labels) => batataApi.updateSkillLabels(ns, name, labels),
  updateBizTagsFn: (ns, name, tags) => batataApi.updateSkillBizTags(ns, name, tags),
})

// Biz tags list
const bizTagsList = computed(() => {
  if (!detail.value?.bizTags) return []
  return detail.value.bizTags
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
})

// Version viewing
const selectedVersion = ref<SkillDocument | null>(null)
const selectedVersionId = ref('')

// Additional modals
const showDeleteDraftModal = ref(false)
const showForcePublishModal = ref(false)
const forcePublishVersion = ref('')

// Status helpers
const statusDotClass = (status: SkillVersionStatus) => {
  const map: Record<SkillVersionStatus, string> = {
    draft: 'bg-amber-500',
    reviewing: 'bg-blue-500',
    online: 'bg-emerald-500',
    offline: 'bg-gray-400',
  }
  return map[status] || 'bg-gray-400'
}

const getStatusClass = (status: SkillVersionStatus) => {
  const map: Record<SkillVersionStatus, string> = {
    draft: 'badge badge-warning',
    reviewing: 'badge badge-info',
    online: 'badge badge-success',
    offline: 'badge badge-secondary',
  }
  return map[status] || 'badge'
}

const getStatusLabel = (status: SkillVersionStatus) => {
  const map: Record<SkillVersionStatus, string> = {
    draft: t('skillDraft'),
    reviewing: t('skillReviewing'),
    online: t('skillOnline'),
    offline: t('skillOffline'),
  }
  return map[status] || status
}

// AI Optimize
const currentSkillForOptimize = computed(() => {
  const d = detail.value as unknown as { name?: string; description?: string } | null
  return {
    name: d?.name || '',
    description: d?.description || '',
    skillMd: '',
    resource: {},
  }
})

const handleOptimizeApplied = () => {
  showOptimizeDialog.value = false
  fetchDetail()
  toast.success('Optimization applied')
}

// Draft management
const handleEditDraft = () => {
  router.push(`/skills/draft?skillName=${encodeURIComponent(itemName.value)}`)
}

const handleCreateDraft = async (basedOnVersion?: string) => {
  try {
    await batataApi.createSkillDraft({
      namespaceId: namespace.value,
      skillName: itemName.value,
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
    await batataApi.deleteSkillDraft(namespace.value, itemName.value)
    showDeleteDraftModal.value = false
    toast.success(t('deleteDraft'))
    fetchDetail()
  } catch (error) {
    logger.error('Failed to delete draft:', error)
    toast.apiError(error)
  }
}

// Scope toggle
const toggleScope = async () => {
  if (!detail.value) return
  const newScope = detail.value.scope === 'public' ? 'private' : 'public'
  try {
    await batataApi.updateSkillScope(namespace.value, itemName.value, newScope)
    fetchDetail()
  } catch (error) {
    logger.error('Failed to update scope:', error)
    toast.apiError(error)
  }
}

// Online/offline per version
const handleOnlineVersion = async (version: string) => {
  try {
    await batataApi.onlineSkill({
      namespaceId: namespace.value,
      skillName: itemName.value,
      version,
    })
    toast.success(t('skillOnlineAction'))
    fetchDetail()
  } catch (error) {
    logger.error('Failed to online skill:', error)
    toast.apiError(error)
  }
}

const handleOfflineVersion = async (version: string) => {
  try {
    await batataApi.offlineSkill({
      namespaceId: namespace.value,
      skillName: itemName.value,
      version,
    })
    toast.success(t('skillOfflineAction'))
    fetchDetail()
  } catch (error) {
    logger.error('Failed to offline skill:', error)
    toast.apiError(error)
  }
}

// Version management
const handleViewVersion = async (version: string) => {
  try {
    const response = await batataApi.getSkillVersion(namespace.value, itemName.value, version)
    selectedVersion.value = response.data.data
    selectedVersionId.value = version
  } catch (error) {
    logger.error('Failed to fetch version:', error)
    toast.apiError(error)
  }
}

const handleDownloadVersion = async (version: string) => {
  try {
    const response = await batataApi.downloadSkillVersion(namespace.value, itemName.value, version)
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `${itemName.value}-${version}.zip`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  } catch (error) {
    logger.error('Failed to download version:', error)
    toast.apiError(error)
  }
}

const handleSubmitVersion = async (version: string) => {
  try {
    await batataApi.submitSkill(namespace.value, itemName.value, version)
    toast.success(t('skillSubmitReview'))
    fetchDetail()
  } catch (error) {
    logger.error('Failed to submit skill:', error)
    toast.apiError(error)
  }
}

const handlePublishVersion = async (version: string) => {
  try {
    await batataApi.publishSkill({
      namespaceId: namespace.value,
      skillName: itemName.value,
      version,
    })
    toast.success(t('skillPublish'))
    fetchDetail()
  } catch (error) {
    logger.error('Failed to publish skill:', error)
    toast.apiError(error)
  }
}

const handleForcePublish = (version: string) => {
  forcePublishVersion.value = version
  showForcePublishModal.value = true
}

const confirmForcePublish = async () => {
  try {
    await batataApi.forcePublishSkill({
      namespaceId: namespace.value,
      skillName: itemName.value,
      version: forcePublishVersion.value,
    })
    showForcePublishModal.value = false
    toast.success(t('forcePublish'))
    fetchDetail()
  } catch (error) {
    logger.error('Failed to force publish skill:', error)
    toast.apiError(error)
  }
}
</script>
