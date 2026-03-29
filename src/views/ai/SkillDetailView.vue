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
        <button v-else @click="handleCreateDraft" class="btn btn-secondary btn-sm">
          <FilePlus class="w-3.5 h-3.5" />
          {{ t('skillCreateDraft') }}
        </button>
        <button v-if="detail.onlineCnt > 0" @click="handleOffline" class="btn btn-secondary btn-sm">
          <PowerOff class="w-3.5 h-3.5" />
          {{ t('skillOfflineAction') }}
        </button>
        <button v-else @click="handleOnline" class="btn btn-primary btn-sm">
          <Power class="w-3.5 h-3.5" />
          {{ t('skillOnlineAction') }}
        </button>
        <button @click="showOptimizeDialog = true" class="btn btn-secondary btn-sm">
          <Sparkles class="w-3.5 h-3.5" />
          AI Optimize
        </button>
        <button @click="showDeleteModal = true" class="btn btn-ghost btn-sm text-danger">
          <Trash2 class="w-3.5 h-3.5" />
          {{ t('delete') }}
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
              <span class="text-sm text-text-secondary">{{ t('skillScope') }}</span>
              <p>
                <span
                  :class="detail.scope === 'public' ? 'badge badge-success' : 'badge badge-info'"
                >
                  {{ detail.scope === 'public' ? t('skillScopePublic') : t('skillScopePrivate') }}
                </span>
              </p>
            </div>
            <div>
              <span class="text-sm text-text-secondary">{{ t('status') }}</span>
              <p>
                <span :class="detail.enable ? 'badge badge-success' : 'badge badge-danger'">
                  {{ detail.enable ? t('enabled') : t('disabled') }}
                </span>
              </p>
            </div>
            <div>
              <span class="text-sm text-text-secondary">{{ t('skillOnline') }}</span>
              <p class="font-medium text-text-primary">{{ detail.onlineCnt }}</p>
            </div>
            <div>
              <span class="text-sm text-text-secondary">{{ t('skillDownload') }}</span>
              <p class="font-medium text-text-primary">{{ detail.downloadCount }}</p>
            </div>
            <div>
              <span class="text-sm text-text-secondary">{{ t('modifyTime') }}</span>
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
        <div class="divide-y divide-border">
          <div
            v-for="ver in detail.versions"
            :key="ver.version"
            class="p-4 flex items-center justify-between hover:bg-bg-secondary"
          >
            <div class="flex items-center gap-3">
              <div class="flex flex-col items-center">
                <span class="text-sm font-semibold text-text-primary">{{ ver.version }}</span>
                <span :class="getStatusClass(ver.status)">
                  {{ getStatusLabel(ver.status) }}
                </span>
              </div>
              <div class="text-xs text-text-tertiary">
                <p>{{ ver.author }}</p>
                <p>{{ new Date(ver.createTime).toLocaleString() }}</p>
              </div>
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
              <button
                v-if="ver.status === 'draft'"
                @click="handleSubmitVersion(ver.version)"
                class="btn btn-ghost btn-sm"
                :title="t('skillSubmitReview')"
              >
                <Send class="w-3.5 h-3.5" />
              </button>
              <button
                v-if="ver.status === 'reviewing'"
                @click="handlePublishVersion(ver.version)"
                class="btn btn-ghost btn-sm"
                :title="t('skillPublish')"
              >
                <Rocket class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div
            v-if="detail.versions.length === 0"
            class="p-4 text-center text-text-secondary text-sm"
          >
            {{ t('noData') }}
          </div>
        </div>
      </div>

      <!-- Draft Content Display -->
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowLeft,
  Pencil,
  FilePlus,
  Trash2,
  Loader2,
  Power,
  PowerOff,
  Eye,
  Download,
  Send,
  Rocket,
  Sparkles,
  X,
} from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import batataApi from '@/api/batata'
import { toast } from '@/utils/error'
import SkillOptimizeDialog from '@/components/ai/SkillOptimizeDialog.vue'

const showOptimizeDialog = ref(false)
import { logger } from '@/utils/logger'
import { useDetailView } from '@/composables/useDetailView'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import CodeEditor from '@/components/common/CodeEditor.vue'
import type { SkillAdminDetail, SkillDocument, SkillVersionStatus } from '@/types'

const router = useRouter()
const { t } = useI18n()

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

// Local computed: biz tags list
const bizTagsList = computed(() => {
  if (!detail.value?.bizTags) return []
  return detail.value.bizTags
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
})

// Local state: version viewing
const selectedVersion = ref<SkillDocument | null>(null)
const selectedVersionId = ref('')

// Local methods: version status helpers
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

// Local methods: draft management
const handleEditDraft = () => {
  router.push(`/skills/draft?skillName=${encodeURIComponent(itemName.value)}`)
}

const handleCreateDraft = async () => {
  try {
    await batataApi.createSkillDraft({
      namespaceId: namespace.value,
      skillName: itemName.value,
    })
    fetchDetail()
  } catch (error) {
    logger.error('Failed to create draft:', error)
    toast.apiError(error)
  }
}

// Local methods: online/offline
const handleOnline = async () => {
  try {
    await batataApi.onlineSkill({
      namespaceId: namespace.value,
      skillName: itemName.value,
    })
    fetchDetail()
  } catch (error) {
    logger.error('Failed to online skill:', error)
    toast.apiError(error)
  }
}

const handleOffline = async () => {
  try {
    await batataApi.offlineSkill({
      namespaceId: namespace.value,
      skillName: itemName.value,
    })
    fetchDetail()
  } catch (error) {
    logger.error('Failed to offline skill:', error)
    toast.apiError(error)
  }
}

// Local methods: version management
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
    fetchDetail()
  } catch (error) {
    logger.error('Failed to publish skill:', error)
    toast.apiError(error)
  }
}
</script>
