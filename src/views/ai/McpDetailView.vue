<template>
  <div class="mcp-detail space-y-3">
    <!-- Header -->
    <div class="flex items-center gap-3">
      <button @click="goBack" class="btn btn-ghost btn-sm">
        <ArrowLeft class="w-3.5 h-3.5" />
      </button>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <h1 class="text-base font-semibold text-text-primary truncate">
            {{ detail?.name || mcpName }}
          </h1>
          <span :class="statusBadgeClass" class="badge text-[9px]">{{ statusLabel }}</span>
        </div>
        <p v-if="detail?.description" class="text-xs text-text-secondary mt-0.5 truncate">
          {{ detail.description }}
        </p>
      </div>
      <button class="btn btn-secondary btn-sm" @click="goEdit">
        <Pencil class="w-3.5 h-3.5" /> 编辑
      </button>
    </div>

    <div v-if="error" class="p-3 rounded border border-danger/30 bg-danger/5 text-xs text-danger">
      {{ error }}
      <button class="ml-2 underline" @click="reload">重试</button>
    </div>

    <div v-if="loading" class="card p-8 text-center text-sm text-text-tertiary">加载中...</div>

    <template v-else-if="detail">
      <!-- Version selector + lifecycle actions -->
      <div class="card">
        <div class="p-4 space-y-3">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <div class="flex items-center gap-2">
              <label class="text-xs text-text-secondary">版本:</label>
              <select
                v-if="versions.length > 0"
                v-model="selectedVersion"
                class="input text-xs w-auto"
                @change="onVersionChange"
              >
                <option v-for="v in versions" :key="v.version" :value="v.version">
                  v{{ v.version }} ({{ versionStatusLabel(v.status) }}){{ v.latest ? ' ★' : '' }}
                </option>
              </select>
              <span v-else class="text-xs text-text-tertiary">无版本记录</span>
            </div>

            <VersionLifecycleActionBar>
              <button
                v-for="action in availableActions"
                :key="action.key"
                class="btn btn-secondary btn-sm"
                :class="actionBtnClass(action)"
                :disabled="actionLoading"
                @click="handleLifecycleAction(action.key)"
              >
                <Loader2 v-if="actionLoading" class="w-3.5 h-3.5 animate-spin" />
                {{ action.label }}
              </button>
              <CreateDraftFromVersionButton
                label="从当前版本创建草稿"
                :divider="availableActions.length > 0"
                @click="handleCreateDraft"
              />
            </VersionLifecycleActionBar>
          </div>
        </div>
      </div>

      <!-- Status controls -->
      <div class="card">
        <div class="p-4">
          <AiResourceStatusControls
            :enabled="detail.enabled !== false"
            :scope="scope"
            enabled-label="已启用"
            disabled-label="已禁用"
            public-label="公开"
            private-label="私有"
            visibility-label="可见性授权"
            visibility-tooltip="配置可见性授权"
            @update:enabled="handleToggleEnabled"
            @update:scope="handleScopeChange"
            @visibility-click="visibilityDialogOpen = true"
          />
        </div>
      </div>

      <!-- Basic info -->
      <div class="card">
        <div class="p-4">
          <h3 class="text-sm font-medium text-text-primary border-b border-border pb-2 mb-3">
            基本信息
          </h3>
          <dl class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-xs">
            <div>
              <dt class="text-text-tertiary">命名空间</dt>
              <dd class="text-text-primary">{{ detail.namespaceId || '—' }}</dd>
            </div>
            <div>
              <dt class="text-text-tertiary">协议</dt>
              <dd class="text-text-primary uppercase">
                {{ detail.frontProtocol || detail.protocol || '—' }}
              </dd>
            </div>
            <div>
              <dt class="text-text-tertiary">版本</dt>
              <dd class="text-text-primary">{{ detail.version || '—' }}</dd>
            </div>
            <div>
              <dt class="text-text-tertiary">工具数</dt>
              <dd class="text-text-primary">{{ detail.toolSpec?.tools?.length || 0 }}</dd>
            </div>
          </dl>
        </div>
      </div>

      <!-- Tools -->
      <div class="card">
        <div class="p-4">
          <h3 class="text-sm font-medium text-text-primary border-b border-border pb-2 mb-3">
            工具
          </h3>
          <McpToolList :tools="detail.toolSpec?.tools" :tools-meta="detail.toolSpec?.toolsMeta" />
        </div>
      </div>

      <!-- Endpoints -->
      <div v-if="hasEndpoints" class="card">
        <div class="p-4">
          <h3 class="text-sm font-medium text-text-primary border-b border-border pb-2 mb-3">
            端点
          </h3>
          <div class="space-y-2">
            <div
              v-for="(ep, i) in endpointList"
              :key="i"
              class="flex items-center gap-2 text-xs font-mono p-2 rounded bg-bg-tertiary"
            >
              <span class="badge text-[9px]">{{ ep.protocol }}</span>
              <span class="text-text-primary">{{ ep.url }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <VisibilityAuthorizationDialog
      v-model="visibilityDialogOpen"
      :namespace-id="namespaceId"
      resource-type="mcp"
      :resource-name="mcpName"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeft, Pencil, Loader2 } from '@lucide/vue'
import { useMcpStore } from '@/stores/mcp'
import { useNamespaceStore } from '@/stores/namespace'
import { mcpApi } from '@/api/mcp'
import { logger } from '@/utils/logger'
import McpToolList from '@/components/ai/mcp/McpToolList.vue'
import AiResourceStatusControls from '@/components/ai/AiResourceStatusControls.vue'
import VersionLifecycleActionBar from '@/components/ai/VersionLifecycleActionBar.vue'
import CreateDraftFromVersionButton from '@/components/ai/CreateDraftFromVersionButton.vue'
import VisibilityAuthorizationDialog from '@/components/ai/VisibilityAuthorizationDialog.vue'
import {
  getMcpVersionActions,
  getMcpStatusBadgeClass,
  getMcpVersionStatusLabel,
} from '@/components/ai/mcp/mcp-lifecycle'
import { extractEndpoints } from '@/components/ai/mcp/endpoint-utils'
import { parsePipelineInfo } from '@/components/ai/version-lifecycle'
import type { McpServerVersionSummary, McpVersionStatus, McpVersionIdentity } from '@/types/mcp'
import type { Namespace } from '@/types'

const props = defineProps<{
  namespace?: Namespace
}>()

const router = useRouter()
const route = useRoute()
const store = useMcpStore()
const namespaceStore = useNamespaceStore()

const namespaceId = computed(
  () =>
    (route.query.namespaceId as string) ||
    props.namespace?.namespace ||
    namespaceStore.currentNamespace,
)
const mcpName = computed(() => (route.query.mcpName as string) || '')

const loading = computed(() => store.detailLoading)
const error = computed(() => store.error)
const detail = computed(() => store.currentMcp)
const selectedVersion = computed(() => store.selectedVersion)

const currentVersionStatus = computed(() => {
  // Version lifecycle status only comes from the versions list API.
  return versions.value.find((v) => v.version === selectedVersion.value)?.status || ''
})

const versions = ref<McpServerVersionSummary[]>([])
const actionLoading = ref(false)
const visibilityDialogOpen = ref(false)
const scope = ref<'PUBLIC' | 'PRIVATE'>('PRIVATE')

const hasEndpoints = computed(() => endpointList.value.length > 0)
const endpointList = computed(() =>
  extractEndpoints(detail.value).map((e) => ({ protocol: e.protocol, url: e.url })),
)

const statusBadgeClass = computed(() => getMcpStatusBadgeClass(currentVersionStatus.value))

const statusLabel = computed(() => getMcpVersionStatusLabel(currentVersionStatus.value) || '—')

interface LifecycleActionDef {
  key: string
  label: string
  danger?: boolean
}

const availableActions = computed<LifecycleActionDef[]>(() => {
  const status = currentVersionStatus.value as McpVersionStatus
  const matchedVersion = versions.value.find((v) => v.version === selectedVersion.value)
  const pipeline = parsePipelineInfo(matchedVersion?.publishPipelineInfo)
  // globalAdmin assumed false for now; could be wired from auth store
  const actions = getMcpVersionActions(status, pipeline, false)
  const labelMap: Record<string, string> = {
    editDraft: '编辑草稿',
    submit: '提交审核',
    publish: '发布',
    forcePublish: '强制发布',
    redraft: '退回草稿',
    online: '上线',
    offline: '下线',
    deleteDraft: '删除草稿',
  }
  const dangerSet = new Set(['deleteDraft'])
  return actions.map((a) => ({
    key: a,
    label: labelMap[a] || a,
    danger: dangerSet.has(a),
  }))
})

function versionStatusLabel(s?: string): string {
  return getMcpVersionStatusLabel(s)
}

function actionBtnClass(action: LifecycleActionDef) {
  return action.danger ? 'btn-danger' : ''
}

async function reload() {
  if (!mcpName.value) return
  store.clearError()
  await store.fetchMcpDetail(namespaceId.value, mcpName.value, selectedVersion.value || undefined)
  await loadVersions()
  await loadVersionDetail()
}

async function loadVersions() {
  if (!mcpName.value) return
  try {
    const response = await mcpApi.listVersions({
      namespaceId: namespaceId.value,
      mcpName: mcpName.value,
      pageNo: 1,
      pageSize: 50,
    })
    versions.value = response.data.data?.pageItems || []
  } catch {
    versions.value = []
  }
}

// `getMcpServer` does not return scope; fetch it from the version detail.
async function loadVersionDetail() {
  const version = selectedVersion.value
  if (!mcpName.value || !version) return
  try {
    const response = await mcpApi.getVersion({
      namespaceId: namespaceId.value,
      mcpName: mcpName.value,
      version,
    })
    const s = response.data.data?.scope
    if (s === 'PUBLIC' || s === 'PRIVATE') scope.value = s
  } catch {
    // keep current scope on failure
  }
}

async function onVersionChange() {
  const v = selectedVersion.value
  if (v) {
    await store.fetchMcpDetail(namespaceId.value, mcpName.value, v)
    await loadVersionDetail()
  }
}

// Maps a lifecycle action key to the mcpApi method that performs it.
// `editDraft` is handled separately (navigation, not an API call).
const LIFECYCLE_API_METHODS: Record<string, keyof typeof mcpApi> = {
  submit: 'submit',
  publish: 'publish',
  forcePublish: 'forcePublish',
  redraft: 'redraft',
  online: 'online',
  offline: 'offline',
  deleteDraft: 'deleteDraft',
}

async function handleLifecycleAction(action: string) {
  if (!mcpName.value || !selectedVersion.value) return
  if (action === 'editDraft') {
    router.push({
      name: 'mcp-edit',
      query: { mcpName: mcpName.value, namespaceId: namespaceId.value },
    })
    return
  }
  const method = LIFECYCLE_API_METHODS[action]
  if (!method) return
  actionLoading.value = true
  try {
    const identity: McpVersionIdentity = {
      namespaceId: namespaceId.value,
      mcpName: mcpName.value,
      version: selectedVersion.value,
    }
    await (mcpApi[method] as (identity: McpVersionIdentity) => Promise<unknown>)(identity)
    await reload()
  } catch (err) {
    store.error = err instanceof Error ? err.message : '操作失败'
    logger.error('Lifecycle action failed:', err)
  } finally {
    actionLoading.value = false
  }
}

async function handleCreateDraft() {
  // Navigate to editor pre-filled with the current version's data, bumping the version number.
  router.push({
    name: 'mcp-new',
    query: {
      mcpName: mcpName.value,
      namespaceId: namespaceId.value,
      fromVersion: selectedVersion.value || detail.value?.versionDetail?.version || '',
    },
  })
}

async function handleToggleEnabled(enabled: boolean) {
  if (!mcpName.value) return
  try {
    await mcpApi.updateStatus({
      namespaceId: namespaceId.value,
      mcpName: mcpName.value,
      enabled,
    })
    await reload()
  } catch (err) {
    store.error = err instanceof Error ? err.message : '切换启用状态失败'
    logger.error('Toggle enabled failed:', err)
  }
}

async function handleScopeChange(newScope: string) {
  if (!mcpName.value) return
  scope.value = newScope as 'PUBLIC' | 'PRIVATE'
  try {
    await mcpApi.updateScope({
      namespaceId: namespaceId.value,
      mcpName: mcpName.value,
      scope: scope.value,
    })
  } catch (err) {
    store.error = err instanceof Error ? err.message : '修改可见性失败'
    logger.error('Scope change failed:', err)
  }
}

function goBack() {
  router.push({ name: 'mcp' })
}

function goEdit() {
  router.push({
    name: 'mcp-edit',
    query: { mcpName: mcpName.value, namespaceId: namespaceId.value },
  })
}

onMounted(() => {
  reload()
})

watch(mcpName, () => {
  reload()
})
</script>
