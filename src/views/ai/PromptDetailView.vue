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
            {{ metadata?.promptKey || t('promptDetail') }}
          </h1>
          <p class="text-xs text-text-secondary mt-0.5">
            {{ metadata?.description || t('promptDetail') }}
          </p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button @click="handleEditMetadata" class="btn btn-secondary btn-sm">
          <Pencil class="w-3.5 h-3.5" />
          {{ t('edit') }}
        </button>
        <button @click="showOptimizeDialog = true" class="btn btn-secondary btn-sm">
          <Sparkles class="w-3.5 h-3.5" />
          AI Optimize
        </button>
        <button @click="showDebugPanel = !showDebugPanel" class="btn btn-secondary btn-sm">
          <Bug class="w-3.5 h-3.5" />
          Debug
        </button>
        <button @click="handlePublishNew" class="btn btn-primary btn-sm">
          <Plus class="w-3.5 h-3.5" />
          {{ t('publishVersion') }}
        </button>
      </div>
    </div>

    <!-- Prompt Debug Panel (inline) -->
    <PromptDebugPanel
      v-if="showDebugPanel && versionDetail"
      :prompt-template="versionDetail.template"
      :variables="(versionDetail.variables || []).map((v: { name: string }) => v.name)"
    />

    <!-- Prompt Optimize Dialog -->
    <PromptOptimizeDialog
      v-model:visible="showOptimizeDialog"
      :prompt-template="versionDetail?.template || ''"
      @applied="handleOptimizeApplied"
    />

    <!-- Loading State -->
    <div v-if="loading" class="card p-8 text-center">
      <Loader2 class="w-8 h-8 animate-spin mx-auto text-primary" />
    </div>

    <template v-else-if="metadata">
      <!-- Metadata Card -->
      <div class="card">
        <div class="p-4">
          <h3 class="text-sm font-medium text-text-primary mb-3">{{ t('basicInfo') }}</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <span class="text-xs text-text-secondary">{{ t('promptKey') }}</span>
              <p class="text-sm font-medium text-text-primary">{{ metadata.promptKey }}</p>
            </div>
            <div>
              <span class="text-xs text-text-secondary">{{ t('promptLatestVersion') }}</span>
              <p class="text-sm font-medium text-text-primary">
                {{ metadata.latestVersion || '-' }}
              </p>
            </div>
            <div>
              <span class="text-xs text-text-secondary">{{ t('lastModified') }}</span>
              <p class="text-sm text-text-primary">
                {{ new Date(metadata.gmtModified).toLocaleString() }}
              </p>
            </div>
            <div class="md:col-span-2 lg:col-span-3" v-if="metadata.description">
              <span class="text-xs text-text-secondary">{{ t('description') }}</span>
              <p class="text-sm text-text-primary">{{ metadata.description }}</p>
            </div>
          </div>

          <!-- Governance info (if available) -->
          <div v-if="governance" class="mt-4 pt-3 border-t border-border">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <span class="text-xs text-text-secondary">{{ t('promptScope') }}</span>
                <div class="flex items-center gap-2 mt-1">
                  <span
                    :class="
                      governance.scope === 'public' ? 'badge badge-success' : 'badge badge-warning'
                    "
                  >
                    {{
                      governance.scope === 'public' ? t('skillScopePublic') : t('skillScopePrivate')
                    }}
                  </span>
                </div>
              </div>
              <div>
                <span class="text-xs text-text-secondary">{{ t('status') }}</span>
                <p>
                  <span :class="governance.enable ? 'badge badge-success' : 'badge badge-danger'">
                    {{ governance.enable ? t('enabled') : t('disabled') }}
                  </span>
                </p>
              </div>
              <div>
                <span class="text-xs text-text-secondary">{{ t('onlineCnt') }}</span>
                <p class="font-medium text-text-primary">{{ governance.onlineCnt }}</p>
              </div>
            </div>
          </div>

          <!-- Biz Tags -->
          <div v-if="metadata.bizTags && metadata.bizTags.length > 0" class="mt-3">
            <span class="text-xs text-text-secondary block mb-1.5">{{ t('tags') }}</span>
            <div class="flex flex-wrap gap-1">
              <span v-for="tag in metadata.bizTags" :key="tag" class="badge badge-default">
                {{ tag }}
              </span>
            </div>
          </div>

          <!-- Labels -->
          <div class="mt-3">
            <div class="flex items-center justify-between mb-1.5">
              <span class="text-xs text-text-secondary">{{ t('promptLabels') }}</span>
              <button @click="showBindLabelModal = true" class="btn btn-ghost btn-sm">
                <Tag class="w-3 h-3" />
                {{ t('bindLabel') }}
              </button>
            </div>
            <div
              v-if="metadata.labels && Object.keys(metadata.labels).length > 0"
              class="flex flex-wrap gap-1.5"
            >
              <span
                v-for="(version, label) in metadata.labels"
                :key="label"
                class="inline-flex items-center gap-1 badge badge-info"
              >
                {{ label }}: v{{ version }}
                <button @click="handleUnbindLabel(String(label))" class="hover:text-danger ml-0.5">
                  <X class="w-2.5 h-2.5" />
                </button>
              </span>
            </div>
            <p v-else class="text-xs text-text-tertiary">{{ t('noData') }}</p>
          </div>
        </div>
      </div>

      <!-- Governance Version Timeline (if governance data is available) -->
      <div v-if="governance && governance.versions && governance.versions.length > 0" class="card">
        <div class="p-4 border-b border-border">
          <h3 class="text-sm font-medium text-text-primary">{{ t('skillVersions') }}</h3>
        </div>
        <div class="divide-y divide-border">
          <div
            v-for="ver in governance.versions"
            :key="ver.version"
            class="p-4 hover:bg-bg-secondary transition-colors"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div
                  class="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  :class="promptStatusDotClass(ver.status)"
                />
                <span class="font-mono text-sm font-medium text-text-primary">
                  v{{ ver.version }}
                </span>
                <span :class="promptStatusBadgeClass(ver.status)">
                  {{ promptStatusLabel(ver.status) }}
                </span>
              </div>
              <div class="flex items-center gap-1">
                <!-- View -->
                <button
                  @click="selectVersion(ver.version)"
                  class="btn btn-ghost btn-sm"
                  :title="t('viewDetail')"
                >
                  <Eye class="w-3.5 h-3.5" />
                </button>
                <!-- Draft: Submit -->
                <button
                  v-if="ver.status === 'draft'"
                  @click="handleSubmitPrompt"
                  class="btn btn-ghost btn-sm text-blue-600"
                  :title="t('promptSubmitReview')"
                >
                  <Send class="w-3.5 h-3.5" />
                </button>
                <!-- Reviewing: Publish / Force Publish -->
                <template v-if="ver.status === 'reviewing'">
                  <button
                    @click="handlePublishPrompt(ver.version)"
                    class="btn btn-ghost btn-sm text-emerald-600"
                    :title="t('promptPublish')"
                  >
                    <Rocket class="w-3.5 h-3.5" />
                  </button>
                  <button
                    @click="handleForcePublishPrompt(ver.version)"
                    class="btn btn-ghost btn-sm text-orange-600"
                    :title="t('forcePublish')"
                  >
                    <Zap class="w-3.5 h-3.5" />
                  </button>
                </template>
                <!-- Online: Offline -->
                <button
                  v-if="ver.status === 'online'"
                  @click="handleOfflinePrompt(ver.version)"
                  class="btn btn-ghost btn-sm"
                  :title="t('promptOfflineAction')"
                >
                  <WifiOff class="w-3.5 h-3.5" />
                </button>
                <!-- Offline: Online -->
                <button
                  v-if="ver.status === 'offline'"
                  @click="handleOnlinePrompt(ver.version)"
                  class="btn btn-ghost btn-sm"
                  :title="t('promptOnlineAction')"
                >
                  <Wifi class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <!-- Version meta -->
            <div class="flex items-center gap-4 mt-2 text-xs text-text-tertiary ml-5">
              <span>{{ ver.srcUser }}</span>
              <span>{{ new Date(ver.gmtModified).toLocaleString() }}</span>
              <span v-if="ver.commitMsg" class="truncate max-w-[200px]">{{ ver.commitMsg }}</span>
            </div>
            <!-- Pipeline Status -->
            <div v-if="ver.publishPipelineInfo" class="mt-3 ml-5">
              <PipelineStatusDisplay :publish-pipeline-info="ver.publishPipelineInfo" />
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content: Version History + Template (fallback for non-governance mode) -->
      <div v-if="!governance || !governance.versions" class="grid grid-cols-1 lg:grid-cols-4 gap-3">
        <!-- Version History Sidebar -->
        <div class="lg:col-span-1">
          <div class="card">
            <div class="p-3 border-b border-border">
              <h3 class="text-sm font-medium text-text-primary">{{ t('promptVersionHistory') }}</h3>
            </div>
            <div class="divide-y divide-border max-h-[500px] overflow-y-auto">
              <div v-if="versionsLoading" class="p-4 text-center">
                <Loader2 class="w-4 h-4 animate-spin mx-auto text-primary" />
              </div>
              <div
                v-else-if="versions.length === 0"
                class="p-4 text-center text-xs text-text-tertiary"
              >
                {{ t('noData') }}
              </div>
              <button
                v-for="ver in versions"
                :key="ver.version"
                @click="selectVersion(ver.version)"
                class="w-full text-left p-3 hover:bg-bg-secondary transition-colors"
                :class="{ 'bg-bg-secondary': selectedVersion === ver.version }"
              >
                <div class="flex items-center justify-between">
                  <span class="text-xs font-medium text-text-primary">v{{ ver.version }}</span>
                  <span class="text-[10px] text-text-tertiary">
                    {{ new Date(ver.gmtModified).toLocaleDateString() }}
                  </span>
                </div>
                <p v-if="ver.commitMsg" class="text-[10px] text-text-secondary mt-0.5 truncate">
                  {{ ver.commitMsg }}
                </p>
                <p class="text-[10px] text-text-tertiary mt-0.5">{{ ver.srcUser }}</p>
              </button>
            </div>
            <AppPagination
              v-if="versionTotal > versionPageSize"
              :current-page="versionPage"
              :page-size="versionPageSize"
              :total="versionTotal"
              @change="handleVersionPageChange"
            />
          </div>
        </div>

        <!-- Template Content -->
        <div class="lg:col-span-3 space-y-3">
          <div class="card">
            <div class="p-3 border-b border-border">
              <h3 class="text-sm font-medium text-text-primary">
                {{ t('promptTemplate') }}
                <span v-if="selectedVersion" class="text-xs text-text-secondary ml-2">
                  v{{ selectedVersion }}
                </span>
              </h3>
            </div>
            <div class="p-3">
              <div v-if="detailLoading" class="text-center py-6">
                <Loader2 class="w-4 h-4 animate-spin mx-auto text-primary" />
              </div>
              <CodeEditor
                v-else
                :model-value="versionDetail?.template || ''"
                language="text"
                :readonly="true"
                min-height="250px"
              />
            </div>
          </div>

          <!-- Variables -->
          <div v-if="extractedVariables.length > 0" class="card">
            <div class="p-3 border-b border-border">
              <h3 class="text-sm font-medium text-text-primary">{{ t('promptVariables') }}</h3>
            </div>
            <div class="p-3">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div v-for="varName in extractedVariables" :key="varName">
                  <label class="block text-xs font-medium text-text-secondary mb-1">
                    {{ wrapVar(varName) }}
                  </label>
                  <input
                    v-model="variableValues[varName]"
                    type="text"
                    class="input"
                    :placeholder="varName"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Preview -->
          <div v-if="extractedVariables.length > 0" class="card">
            <div class="p-3 border-b border-border">
              <h3 class="text-sm font-medium text-text-primary">{{ t('promptPreview') }}</h3>
            </div>
            <div class="p-3">
              <pre
                class="text-sm text-text-primary whitespace-pre-wrap bg-bg-tertiary rounded-lg p-3 max-h-[300px] overflow-y-auto"
                >{{ previewText }}</pre
              >
            </div>
          </div>
        </div>
      </div>

      <!-- Template content for governance mode -->
      <template v-if="governance && governance.versions">
        <div class="card" v-if="versionDetail">
          <div class="p-3 border-b border-border">
            <h3 class="text-sm font-medium text-text-primary">
              {{ t('promptTemplate') }}
              <span class="text-xs text-text-secondary ml-2">v{{ selectedVersion }}</span>
            </h3>
          </div>
          <div class="p-3">
            <div v-if="detailLoading" class="text-center py-6">
              <Loader2 class="w-4 h-4 animate-spin mx-auto text-primary" />
            </div>
            <CodeEditor
              v-else
              :model-value="versionDetail.template"
              language="text"
              :readonly="true"
              min-height="250px"
            />
          </div>
        </div>

        <!-- Variables -->
        <div v-if="extractedVariables.length > 0" class="card">
          <div class="p-3 border-b border-border">
            <h3 class="text-sm font-medium text-text-primary">{{ t('promptVariables') }}</h3>
          </div>
          <div class="p-3">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div v-for="varName in extractedVariables" :key="varName">
                <label class="block text-xs font-medium text-text-secondary mb-1">
                  {{ wrapVar(varName) }}
                </label>
                <input
                  v-model="variableValues[varName]"
                  type="text"
                  class="input"
                  :placeholder="varName"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Preview -->
        <div v-if="extractedVariables.length > 0" class="card">
          <div class="p-3 border-b border-border">
            <h3 class="text-sm font-medium text-text-primary">{{ t('promptPreview') }}</h3>
          </div>
          <div class="p-3">
            <pre
              class="text-sm text-text-primary whitespace-pre-wrap bg-bg-tertiary rounded-lg p-3 max-h-[300px] overflow-y-auto"
              >{{ previewText }}</pre
            >
          </div>
        </div>
      </template>
    </template>

    <!-- Edit Metadata Modal -->
    <FormModal
      v-model="showEditMetadataModal"
      :title="t('edit')"
      :submit-text="t('save')"
      :loading="savingMetadata"
      @submit="saveMetadata"
    >
      <div class="space-y-3">
        <div>
          <label class="block text-xs font-medium text-text-secondary mb-1">
            {{ t('description') }}
          </label>
          <textarea
            v-model="editForm.description"
            class="input min-h-[80px]"
            :placeholder="t('descriptionPlaceholder')"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-text-secondary mb-1">
            {{ t('tags') }}
          </label>
          <input
            v-model="editForm.bizTags"
            type="text"
            class="input"
            placeholder="tag1, tag2, tag3"
          />
          <p class="text-[10px] text-text-tertiary mt-1">{{ t('tagsHint') }}</p>
        </div>
      </div>
    </FormModal>

    <!-- Bind Label Modal -->
    <FormModal
      v-model="showBindLabelModal"
      :title="t('bindLabel')"
      :submit-text="t('confirm')"
      :loading="bindingLabel"
      @submit="handleBindLabel"
    >
      <div class="space-y-3">
        <div>
          <label class="block text-xs font-medium text-text-secondary mb-1">
            {{ t('labelName') }}
          </label>
          <input
            v-model="labelForm.label"
            type="text"
            class="input"
            :placeholder="t('labelNamePlaceholder')"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-text-secondary mb-1">
            {{ t('promptVersion') }}
          </label>
          <select v-model="labelForm.version" class="input">
            <option value="" disabled>{{ t('promptVersionPlaceholder') }}</option>
            <option v-for="ver in versions" :key="ver.version" :value="ver.version">
              v{{ ver.version }}
            </option>
          </select>
        </div>
      </div>
    </FormModal>

    <!-- Force Publish Confirm -->
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
import { ref, computed, reactive, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  ArrowLeft,
  Plus,
  Pencil,
  Loader2,
  Sparkles,
  Bug,
  Tag,
  X,
  Eye,
  Send,
  Rocket,
  Zap,
  Wifi,
  WifiOff,
} from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import batataApi from '@/api/batata'
import { toast } from '@/utils/error'
import { logger } from '@/utils/logger'
import { useBatataStore } from '@/stores/batata'
import AppPagination from '@/components/common/AppPagination.vue'
import FormModal from '@/components/common/FormModal.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import CodeEditor from '@/components/common/CodeEditor.vue'
import PromptDebugPanel from '@/components/ai/PromptDebugPanel.vue'
import PromptOptimizeDialog from '@/components/ai/PromptOptimizeDialog.vue'
import PipelineStatusDisplay from '@/components/ai/PipelineStatusDisplay.vue'
import type {
  PromptMetaInfo,
  PromptGovernanceDetail,
  PromptVersionInfo,
  PromptVersionSummary,
  PromptVersionStatus,
} from '@/types'

const showOptimizeDialog = ref(false)
const showDebugPanel = ref(false)

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const store = useBatataStore()
const namespace = computed(() => store.currentNamespace)

// State
const loading = ref(false)
const metadata = ref<PromptMetaInfo | null>(null)
const governance = ref<PromptGovernanceDetail | null>(null)
const selectedVersion = ref<string>('')

// Version history
const versionsLoading = ref(false)
const versions = ref<PromptVersionSummary[]>([])
const versionPage = ref(1)
const versionPageSize = ref(10)
const versionTotal = ref(0)

// Version detail
const detailLoading = ref(false)
const versionDetail = ref<PromptVersionInfo | null>(null)

// Variable preview
const variableValues = reactive<Record<string, string>>({})

// Edit metadata modal
const showEditMetadataModal = ref(false)
const savingMetadata = ref(false)
const editForm = reactive({
  description: '',
  bizTags: '',
})

// Bind label modal
const showBindLabelModal = ref(false)
const bindingLabel = ref(false)
const labelForm = reactive({
  label: '',
  version: '',
})

// Force publish
const showForcePublishModal = ref(false)
const forcePublishVersion = ref('')

// Computed
const promptKey = computed(() => String(route.query.promptKey || ''))

const wrapVar = (name: string) => `\u007B\u007B${name}\u007D\u007D`

const extractVariables = (template: string): string[] => {
  const matches = template.match(/\{\{(\w+)\}\}/g)
  if (!matches) return []
  return [...new Set(matches.map((m) => m.replace(/\{\{|\}\}/g, '')))]
}

const extractedVariables = computed(() => {
  if (!versionDetail.value?.template) return []
  return extractVariables(versionDetail.value.template)
})

const previewText = computed(() => {
  if (!versionDetail.value?.template) return ''
  let text = versionDetail.value.template
  for (const varName of extractedVariables.value) {
    const value = variableValues[varName] || `{{${varName}}}`
    text = text.replace(new RegExp(`\\{\\{${varName}\\}\\}`, 'g'), value)
  }
  return text
})

// Status helpers for governance versions
const promptStatusDotClass = (status: PromptVersionStatus) => {
  const map: Record<PromptVersionStatus, string> = {
    draft: 'bg-amber-500',
    reviewing: 'bg-blue-500',
    online: 'bg-emerald-500',
    offline: 'bg-gray-400',
  }
  return map[status] || 'bg-gray-400'
}

const promptStatusBadgeClass = (status: PromptVersionStatus) => {
  const map: Record<PromptVersionStatus, string> = {
    draft: 'badge badge-warning',
    reviewing: 'badge badge-info',
    online: 'badge badge-success',
    offline: 'badge badge-secondary',
  }
  return map[status] || 'badge'
}

const promptStatusLabel = (status: PromptVersionStatus) => {
  const map: Record<PromptVersionStatus, string> = {
    draft: t('promptDraft'),
    reviewing: t('promptReviewing'),
    online: t('promptOnline'),
    offline: t('promptOffline'),
  }
  return map[status] || status
}

// Methods
const goBack = () => {
  router.push('/prompts')
}

const fetchMetadata = async () => {
  if (!promptKey.value) return
  loading.value = true
  try {
    const response = await batataApi.getPromptMetadata(promptKey.value, namespace.value)
    metadata.value = response.data.data
  } catch (error) {
    logger.error('Failed to fetch prompt metadata:', error)
    toast.apiError(error)
  } finally {
    loading.value = false
  }
}

const fetchGovernance = async () => {
  if (!promptKey.value) return
  try {
    const response = await batataApi.getPromptGovernance(promptKey.value, namespace.value)
    governance.value = response.data.data
  } catch {
    // Governance endpoint may not exist - fall back to versions-only mode
    governance.value = null
  }
}

const fetchVersions = async () => {
  if (!promptKey.value) return
  versionsLoading.value = true
  try {
    const response = await batataApi.getPromptVersions({
      promptKey: promptKey.value,
      namespaceId: namespace.value,
      pageNo: versionPage.value,
      pageSize: versionPageSize.value,
    })
    versions.value = response.data.data.pageItems || []
    versionTotal.value = response.data.data.totalCount || 0
  } catch (error) {
    logger.error('Failed to fetch prompt versions:', error)
    toast.apiError(error)
  } finally {
    versionsLoading.value = false
  }
}

const fetchVersionDetail = async (version?: string) => {
  if (!promptKey.value) return
  detailLoading.value = true
  try {
    const response = await batataApi.getPromptDetail({
      promptKey: promptKey.value,
      version: version || undefined,
      namespaceId: namespace.value,
    })
    versionDetail.value = response.data.data
    selectedVersion.value = response.data.data.version
  } catch (error) {
    logger.error('Failed to fetch prompt detail:', error)
    toast.apiError(error)
  } finally {
    detailLoading.value = false
  }
}

const selectVersion = (version: string) => {
  selectedVersion.value = version
  fetchVersionDetail(version)
}

const handleVersionPageChange = (page: number) => {
  versionPage.value = page
  fetchVersions()
}

const handleOptimizeApplied = (optimizedPrompt: string) => {
  showOptimizeDialog.value = false
  router.push(
    `/prompt/editor?promptKey=${encodeURIComponent(promptKey.value)}&template=${encodeURIComponent(optimizedPrompt)}`,
  )
}

const handlePublishNew = () => {
  router.push(`/prompt/editor?promptKey=${encodeURIComponent(promptKey.value)}`)
}

const handleEditMetadata = () => {
  if (metadata.value) {
    editForm.description = metadata.value.description || ''
    editForm.bizTags = metadata.value.bizTags?.join(', ') || ''
  }
  showEditMetadataModal.value = true
}

const saveMetadata = async () => {
  savingMetadata.value = true
  try {
    await batataApi.updatePromptMetadata({
      promptKey: promptKey.value,
      description: editForm.description || undefined,
      bizTags: editForm.bizTags || undefined,
      namespaceId: namespace.value,
    })
    toast.success(t('save'))
    showEditMetadataModal.value = false
    fetchMetadata()
    fetchGovernance()
  } catch (error) {
    logger.error('Failed to update prompt metadata:', error)
    toast.apiError(error)
  } finally {
    savingMetadata.value = false
  }
}

const handleBindLabel = async () => {
  if (!labelForm.label || !labelForm.version) return
  bindingLabel.value = true
  try {
    await batataApi.bindPromptLabel({
      promptKey: promptKey.value,
      label: labelForm.label,
      version: labelForm.version,
      namespaceId: namespace.value,
    })
    toast.success(t('bindLabel'))
    showBindLabelModal.value = false
    labelForm.label = ''
    labelForm.version = ''
    fetchMetadata()
  } catch (error) {
    logger.error('Failed to bind label:', error)
    toast.apiError(error)
  } finally {
    bindingLabel.value = false
  }
}

const handleUnbindLabel = async (label: string) => {
  try {
    await batataApi.unbindPromptLabel(promptKey.value, label, namespace.value)
    toast.success(t('unbindLabel'))
    fetchMetadata()
  } catch (error) {
    logger.error('Failed to unbind label:', error)
    toast.apiError(error)
  }
}

// Governance lifecycle actions
const handleSubmitPrompt = async () => {
  try {
    await batataApi.submitPrompt(promptKey.value, namespace.value)
    toast.success(t('promptSubmitReview'))
    fetchGovernance()
  } catch (error) {
    logger.error('Failed to submit prompt:', error)
    toast.apiError(error)
  }
}

const handlePublishPrompt = async (version: string) => {
  try {
    await batataApi.publishPrompt({
      promptKey: promptKey.value,
      version,
      template: versionDetail.value?.template || '',
      namespaceId: namespace.value,
    })
    toast.success(t('promptPublish'))
    fetchGovernance()
    fetchMetadata()
  } catch (error) {
    logger.error('Failed to publish prompt:', error)
    toast.apiError(error)
  }
}

const handleForcePublishPrompt = (version: string) => {
  forcePublishVersion.value = version
  showForcePublishModal.value = true
}

const confirmForcePublish = async () => {
  try {
    await batataApi.forcePublishPrompt({
      promptKey: promptKey.value,
      version: forcePublishVersion.value,
      namespaceId: namespace.value,
    })
    showForcePublishModal.value = false
    toast.success(t('forcePublish'))
    fetchGovernance()
    fetchMetadata()
  } catch (error) {
    logger.error('Failed to force publish prompt:', error)
    toast.apiError(error)
  }
}

const handleOnlinePrompt = async (version: string) => {
  try {
    await batataApi.onlinePrompt({
      promptKey: promptKey.value,
      version,
      namespaceId: namespace.value,
    })
    toast.success(t('promptOnlineAction'))
    fetchGovernance()
  } catch (error) {
    logger.error('Failed to online prompt:', error)
    toast.apiError(error)
  }
}

const handleOfflinePrompt = async (version: string) => {
  try {
    await batataApi.offlinePrompt({
      promptKey: promptKey.value,
      version,
      namespaceId: namespace.value,
    })
    toast.success(t('promptOfflineAction'))
    fetchGovernance()
  } catch (error) {
    logger.error('Failed to offline prompt:', error)
    toast.apiError(error)
  }
}

// Watch for route query changes
watch(
  () => route.query.promptKey,
  () => {
    if (promptKey.value) {
      fetchMetadata()
      fetchGovernance()
      fetchVersions()
      const queryVersion = String(route.query.version || '')
      fetchVersionDetail(queryVersion || undefined)
    }
  },
)

onMounted(() => {
  if (promptKey.value) {
    fetchMetadata()
    fetchGovernance()
    fetchVersions()
    const queryVersion = String(route.query.version || '')
    fetchVersionDetail(queryVersion || undefined)
  }
})
</script>
