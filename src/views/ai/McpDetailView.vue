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
                :class="action.danger ? 'btn-danger' : ''"
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
import McpToolList from '@/components/ai/mcp/McpToolList.vue'
import AiResourceStatusControls from '@/components/ai/AiResourceStatusControls.vue'
import VersionLifecycleActionBar from '@/components/ai/VersionLifecycleActionBar.vue'
import CreateDraftFromVersionButton from '@/components/ai/CreateDraftFromVersionButton.vue'
import VisibilityAuthorizationDialog from '@/components/ai/VisibilityAuthorizationDialog.vue'
import { getMcpVersionActions } from '@/components/ai/mcp/mcp-lifecycle'
import { parsePipelineInfo } from '@/components/ai/version-lifecycle'
import type { McpServerVersionSummary, McpVersionStatus } from '@/types/mcp'
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
  const matched = versions.value.find((v) => v.version === selectedVersion.value)
  return matched?.status || ''
})

const versions = ref<McpServerVersionSummary[]>([])
const actionLoading = ref(false)
const visibilityDialogOpen = ref(false)
const scope = ref<'PUBLIC' | 'PRIVATE'>('PRIVATE')

const hasEndpoints = computed(() => endpointList.value.length > 0)
const endpointList = computed(() => {
  const list: { protocol: string; url: string }[] = []
  const fe = detail.value?.frontendEndpoints
  if (fe) {
    for (const ep of fe) {
      list.push({
        protocol: ep.protocol,
        url: `${ep.protocol}://${ep.address}:${ep.port}${ep.path || ''}`,
      })
    }
  }
  const remote = detail.value?.remoteServerConfig?.frontEndpointConfigList
  if (remote) {
    for (const ep of remote) {
      if (typeof ep.endpointData === 'string') {
        list.push({
          protocol: ep.protocol || ep.type || 'http',
          url: ep.endpointData + (ep.path || ''),
        })
      }
    }
  }
  return list
})

const statusBadgeClass = computed(() => {
  const s = currentVersionStatus.value
  switch (s) {
    case 'online':
      return 'badge-success'
    case 'draft':
      return 'badge-info'
    case 'reviewing':
    case 'reviewed':
      return 'badge-warning'
    case 'offline':
      return 'badge-secondary'
    default:
      return 'badge'
  }
})

const statusLabel = computed(() => {
  const s = currentVersionStatus.value
  const map: Record<string, string> = {
    online: '已上线',
    offline: '已下线',
    draft: '草稿',
    reviewing: '审核中',
    reviewed: '已审核',
  }
  return map[s as string] || s || '—'
})

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
  const map: Record<string, string> = {
    draft: '草稿',
    reviewing: '审核中',
    reviewed: '已审核',
    online: '已上线',
    offline: '已下线',
  }
  return map[s as string] || s || ''
}

async function reload() {
  if (!mcpName.value) return
  store.clearError()
  await store.fetchMcpDetail(namespaceId.value, mcpName.value, selectedVersion.value || undefined)
  await loadVersions()
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

function onVersionChange() {
  const v = selectedVersion.value
  if (v) {
    store.fetchMcpDetail(namespaceId.value, mcpName.value, v)
  }
}

async function handleLifecycleAction(action: string) {
  if (!mcpName.value || !selectedVersion.value) return
  actionLoading.value = true
  try {
    const identity = {
      namespaceId: namespaceId.value,
      mcpName: mcpName.value,
      version: selectedVersion.value,
    }
    switch (action) {
      case 'editDraft':
        router.push({
          name: 'mcp-edit',
          query: { mcpName: mcpName.value, namespaceId: namespaceId.value },
        })
        break
      case 'submit':
        await mcpApi.submit(identity)
        break
      case 'publish':
        await mcpApi.publish(identity)
        break
      case 'forcePublish':
        await mcpApi.forcePublish(identity)
        break
      case 'redraft':
        await mcpApi.redraft(identity)
        break
      case 'online':
        await mcpApi.online(identity)
        break
      case 'offline':
        await mcpApi.offline(identity)
        break
      case 'deleteDraft':
        await mcpApi.deleteDraft(identity)
        break
    }
    await reload()
  } catch (err) {
    console.error('Lifecycle action failed:', err)
  } finally {
    actionLoading.value = false
  }
}

async function handleCreateDraft() {
  // For simplicity, navigate to editor to create a new draft
  router.push({ name: 'mcp-new' })
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
    console.error('Toggle enabled failed:', err)
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
    console.error('Scope change failed:', err)
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
