<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from '@/i18n'
import {
  Boxes,
  Plus,
  Trash2,
  Pencil,
  Upload,
  ArrowLeft,
  Network,
  KeyRound,
  Server,
  GitBranch,
  FileCode,
  Table2,
  Code2,
  History,
  Layers,
  Search,
  Merge,
  X,
} from '@lucide/vue'
import apolloApi from '@/api/apollo'
import type {
  ApolloAppDTO,
  ApolloItemDTO,
  ApolloOpenNamespace,
  ApolloOpenRelease,
  ApolloReleaseHistoryDTO,
  ApolloGrayReleaseRuleDTO,
  ApolloInstanceDTO,
  ApolloAppNamespaceDTO,
  ApolloCompareResultDTO,
} from '@/types/apollo'
import CodeEditor from '@/components/common/CodeEditor.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

type Tab = 'items' | 'history' | 'gray' | 'instances' | 'compare'

const appId = ref<string>(String(route.query.appId || ''))
const env = ref<string>(String(route.query.env || 'DEV'))
const cluster = ref<string>(String(route.query.cluster || 'default'))
const namespace = ref<string>(String(route.query.namespace || 'application'))

const routeTab = (route.meta.tab as Tab) || (route.query.tab as Tab) || 'items'
const activeTab = ref<Tab>(routeTab)

const app = ref<ApolloAppDTO | null>(null)
const envClusters = ref<{ env: string; clusters: string[] }[]>([])
const namespaces = ref<ApolloOpenNamespace[]>([])
const appNamespaces = ref<ApolloAppNamespaceDTO[]>([])

const items = ref<ApolloItemDTO[]>([])
const loadingItems = ref(false)
const releases = ref<ApolloOpenRelease[]>([])
const releaseTotal = ref(0)
const loadingReleases = ref(false)
const history = ref<ApolloReleaseHistoryDTO[]>([])
const loadingHistory = ref(false)

const branch = ref<ApolloGrayReleaseRuleDTO | null>(null)
const grayItems = ref<ApolloItemDTO[]>([])
const grayRulesText = ref('')
const loadingGray = ref(false)

const instances = ref<ApolloInstanceDTO[]>([])
const loadingInstances = ref(false)

const compareBase = ref<number | null>(null)
const compareTarget = ref<number | null>(null)
const compareResult = ref<ApolloCompareResultDTO | null>(null)
const loadingCompare = ref(false)

const operator = 'admin'

// ---------------- Loaders ----------------
async function loadApp() {
  if (!appId.value) return
  app.value = await apolloApi.getApp(appId.value)
  envClusters.value = await apolloApi.getEnvClusters(appId.value)
  if (envClusters.value.length > 0) {
    if (!envClusters.value.find((e) => e.env === env.value)) env.value = envClusters.value[0].env
    const cl = envClusters.value.find((e) => e.env === env.value)?.clusters || []
    if (!cl.includes(cluster.value)) cluster.value = cl[0] || 'default'
  }
  appNamespaces.value = await apolloApi.listAppNamespaces(appId.value)
  await loadNamespaces()
  await initialTabLoad()
}

async function loadNamespaces() {
  if (!appId.value || !env.value || !cluster.value) return
  namespaces.value = await apolloApi.listNamespaces(env.value, appId.value, cluster.value)
  const exists = namespaces.value.find((n) => n.namespaceName === namespace.value)
  if (!exists && namespaces.value.length > 0) namespace.value = namespaces.value[0].namespaceName
  await loadItemsAndBranch()
}

async function loadItemsAndBranch() {
  if (!appId.value || !env.value || !cluster.value || !namespace.value) return
  loadingItems.value = true
  try {
    const page = await apolloApi.listItems(
      env.value,
      appId.value,
      cluster.value,
      namespace.value,
      0,
      500,
    )
    items.value = page.content
  } finally {
    loadingItems.value = false
  }
  await loadBranch()
}

async function loadBranch() {
  if (!appId.value || !env.value || !cluster.value || !namespace.value) return
  loadingGray.value = true
  try {
    const branches = await apolloApi.listBranches(
      env.value,
      appId.value,
      cluster.value,
      namespace.value,
    )
    branch.value = branches.length > 0 ? branches[0] : null
    if (branch.value) {
      const bpage = await apolloApi.listItems(
        env.value,
        appId.value,
        cluster.value,
        namespace.value,
        0,
        500,
        branch.value.branchName,
      )
      grayItems.value = bpage.content
      const rule = await apolloApi.getBranchRule(
        env.value,
        appId.value,
        cluster.value,
        namespace.value,
        branch.value.branchName,
      )
      grayRulesText.value = rule.rules || ''
    }
  } finally {
    loadingGray.value = false
  }
}

async function loadReleases() {
  if (!appId.value || !env.value || !cluster.value || !namespace.value) return
  loadingReleases.value = true
  try {
    const res = await apolloApi.listReleases(
      env.value,
      appId.value,
      cluster.value,
      namespace.value,
      0,
      20,
    )
    releases.value = res.content
    releaseTotal.value = res.total
  } finally {
    loadingReleases.value = false
  }
}

async function loadHistory() {
  if (!appId.value || !env.value || !cluster.value || !namespace.value) return
  loadingHistory.value = true
  try {
    const res = await apolloApi.releaseHistory(
      env.value,
      appId.value,
      cluster.value,
      namespace.value,
      0,
      50,
    )
    history.value = res.content
  } finally {
    loadingHistory.value = false
  }
}

async function loadInstances() {
  if (!appId.value || !env.value || !cluster.value) return
  loadingInstances.value = true
  try {
    instances.value = await apolloApi.listInstances(env.value, appId.value, cluster.value)
  } finally {
    loadingInstances.value = false
  }
}

function onTabChange(tab: Tab) {
  activeTab.value = tab
  if (tab === 'history') {
    loadReleases()
    loadHistory()
  }
  if (tab === 'instances') loadInstances()
  if (tab === 'compare') loadReleases()
}

async function initialTabLoad() {
  if (activeTab.value === 'history') {
    await loadReleases()
    await loadHistory()
  } else if (activeTab.value === 'instances') {
    await loadInstances()
  } else if (activeTab.value === 'compare') {
    await loadReleases()
  }
}

watch([env, cluster], async () => {
  namespace.value = 'application'
  await loadNamespaces()
})
watch(namespace, () => {
  loadItemsAndBranch()
})

// ---------------- Items (table) ----------------
const showItemModal = ref(false)
const itemForm = ref({ key: '', value: '', comment: '', type: 0 })
const editingKey = ref<string | null>(null)
const savingItem = ref(false)

function openCreateItem() {
  editingKey.value = null
  itemForm.value = { key: '', value: '', comment: '', type: 0 }
  showItemModal.value = true
}
function openEditItem(item: ApolloItemDTO) {
  editingKey.value = item.key
  itemForm.value = {
    key: item.key,
    value: item.value,
    comment: item.comment || '',
    type: item.type || 0,
  }
  showItemModal.value = true
}
async function saveItem() {
  if (!itemForm.value.key) return
  savingItem.value = true
  try {
    if (editingKey.value) {
      await apolloApi.updateItem(
        env.value,
        appId.value,
        cluster.value,
        namespace.value,
        editingKey.value,
        {
          key: itemForm.value.key,
          value: itemForm.value.value,
          comment: itemForm.value.comment,
          type: itemForm.value.type,
        },
      )
    } else {
      await apolloApi.createItem(env.value, appId.value, cluster.value, namespace.value, {
        key: itemForm.value.key,
        value: itemForm.value.value,
        comment: itemForm.value.comment,
        type: itemForm.value.type,
      })
    }
    showItemModal.value = false
    await loadItemsAndBranch()
  } finally {
    savingItem.value = false
  }
}
async function deleteItem(item: ApolloItemDTO) {
  if (!confirm(`Delete item ${item.key}?`)) return
  await apolloApi.deleteItem(
    env.value,
    appId.value,
    cluster.value,
    namespace.value,
    item.key,
    operator,
  )
  await loadItemsAndBranch()
}

// ---------------- Text mode ----------------
const textMode = ref(false)
const textContent = ref('')
const savingText = ref(false)
function itemsToText(list: ApolloItemDTO[]): string {
  return list.map((i) => `${i.key}=${i.value}`).join('\n')
}
function openTextMode() {
  textContent.value = itemsToText(items.value)
  textMode.value = true
}
function parseText(text: string): ApolloItemDTO[] {
  const out: ApolloItemDTO[] = []
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx < 0) continue
    out.push({ key: trimmed.slice(0, idx).trim(), value: trimmed.slice(idx + 1).trim() })
  }
  return out
}
async function saveText() {
  savingText.value = true
  try {
    const next = parseText(textContent.value)
    const oldMap = new Map(items.value.map((i) => [i.key, i]))
    const newMap = new Map(next.map((i) => [i.key, i]))
    for (const n of next) {
      const old = oldMap.get(n.key)
      if (!old)
        await apolloApi.createItem(env.value, appId.value, cluster.value, namespace.value, n)
      else if (old.value !== n.value)
        await apolloApi.updateItem(env.value, appId.value, cluster.value, namespace.value, n.key, n)
    }
    for (const o of items.value) {
      if (!newMap.has(o.key))
        await apolloApi.deleteItem(
          env.value,
          appId.value,
          cluster.value,
          namespace.value,
          o.key,
          operator,
        )
    }
    textMode.value = false
    await loadItemsAndBranch()
  } finally {
    savingText.value = false
  }
}

// ---------------- Publish / Rollback ----------------
const showReleaseModal = ref(false)
const releaseForm = ref({ releaseTitle: '', releaseComment: '' })
async function publish() {
  if (!releaseForm.value.releaseTitle) return
  await apolloApi.publishRelease(env.value, appId.value, cluster.value, namespace.value, {
    releaseTitle: releaseForm.value.releaseTitle,
    releaseComment: releaseForm.value.releaseComment,
    releasedBy: operator,
  })
  showReleaseModal.value = false
  releaseForm.value = { releaseTitle: '', releaseComment: '' }
  await loadReleases()
}
async function rollback(release: ApolloOpenRelease) {
  if (!confirm(`Rollback to release ${release.releaseId}?`)) return
  await apolloApi.rollbackRelease(
    env.value,
    appId.value,
    cluster.value,
    namespace.value,
    release.releaseId,
    operator,
  )
  await loadReleases()
}

// ---------------- Gray ----------------
const showCreateNs = ref(false)
const nsForm = ref({ name: '', format: 'properties', isPublic: false, comment: '' })
const showAppNs = ref(false)
const appNsForm = ref({ name: '', format: 'properties', isPublic: false, comment: '' })

function closeAppNsModal() {
  showAppNs.value = false
  appNsForm.value = { name: '', format: 'properties', isPublic: false, comment: '' }
}

async function createNamespace() {
  if (!nsForm.value.name) return
  await apolloApi.createNamespace(env.value, appId.value, cluster.value, {
    name: nsForm.value.name,
    format: nsForm.value.format,
    isPublic: nsForm.value.isPublic,
    comment: nsForm.value.comment,
  })
  showCreateNs.value = false
  nsForm.value = { name: '', format: 'properties', isPublic: false, comment: '' }
  await loadNamespaces()
}
async function createAppNamespace() {
  if (!appNsForm.value.name) return
  await apolloApi.createAppNamespace(appId.value, {
    name: appNsForm.value.name,
    format: appNsForm.value.format,
    isPublic: appNsForm.value.isPublic,
    comment: appNsForm.value.comment,
  })
  showAppNs.value = false
  appNsForm.value = { name: '', format: 'properties', isPublic: false, comment: '' }
  appNamespaces.value = await apolloApi.listAppNamespaces(appId.value)
}
async function deleteAppNamespace(ns: ApolloAppNamespaceDTO) {
  if (!confirm(`Delete app namespace ${ns.name}?`)) return
  await apolloApi.deleteAppNamespace(appId.value, ns.name, operator)
  appNamespaces.value = await apolloApi.listAppNamespaces(appId.value)
}

async function createBranch() {
  await apolloApi.createBranch(
    env.value,
    appId.value,
    cluster.value,
    namespace.value,
    'gray',
    operator,
  )
  await loadBranch()
}
async function saveGrayItem(item: ApolloItemDTO) {
  if (!branch.value) return
  await apolloApi.updateItem(
    env.value,
    appId.value,
    cluster.value,
    namespace.value,
    item.key,
    { key: item.key, value: item.value, comment: item.comment },
    branch.value.branchName,
  )
}
async function saveGrayRules() {
  if (!branch.value) return
  await apolloApi.updateBranchRule(
    env.value,
    appId.value,
    cluster.value,
    namespace.value,
    branch.value.branchName,
    {
      rules: grayRulesText.value,
    },
  )
}
async function mergeGray() {
  if (!branch.value) return
  await apolloApi.mergeBranch(
    env.value,
    appId.value,
    cluster.value,
    namespace.value,
    branch.value.branchName,
    {
      releaseTitle: `Merge ${namespace.value}`,
      releasedBy: operator,
    },
  )
  await loadBranch()
  await loadItemsAndBranch()
}
async function discardGray() {
  if (!branch.value) return
  if (!confirm('Discard gray release?')) return
  await apolloApi.deleteBranch(
    env.value,
    appId.value,
    cluster.value,
    namespace.value,
    branch.value.branchName,
    operator,
  )
  await loadBranch()
}

// ---------------- Compare ----------------
async function runCompare() {
  if (compareBase.value == null) return
  loadingCompare.value = true
  try {
    compareResult.value = await apolloApi.compareReleases(
      env.value,
      compareBase.value,
      compareTarget.value ?? undefined,
    )
  } finally {
    loadingCompare.value = false
  }
}

// ---------------- Misc actions ----------------
function goApps() {
  router.push('/apollo/apps')
}
function goClusters() {
  router.push({ path: '/apollo/clusters', query: { appId: appId.value } })
}
function goAccessKeys() {
  router.push({ path: '/apollo/access-keys', query: { appId: appId.value } })
}
function openNamespace(ns: ApolloOpenNamespace) {
  namespace.value = ns.namespaceName
  loadItemsAndBranch()
}

const formatOptions = ['properties', 'xml', 'json', 'yml', 'yaml', 'txt']

onMounted(loadApp)
</script>

<template>
  <div class="p-4">
    <!-- Header -->
    <div class="flex items-center gap-2 mb-3">
      <button class="btn btn-ghost btn-sm" @click="goApps"><ArrowLeft class="w-4 h-4" /></button>
      <Boxes class="w-5 h-5 text-emerald-600" />
      <h1 class="text-lg font-semibold text-text-primary">{{ app?.name || appId }}</h1>
      <span class="text-xs text-text-secondary font-mono">{{ appId }}</span>
      <div class="ml-auto flex gap-2">
        <button class="btn btn-ghost btn-sm" @click="showAppNs = true">
          <Layers class="w-4 h-4" />{{ t('apolloAppNamespaces') }}
        </button>
        <button class="btn btn-ghost btn-sm" @click="goClusters">
          <Network class="w-4 h-4" />{{ t('apolloClusters') }}
        </button>
        <button class="btn btn-ghost btn-sm" @click="goAccessKeys">
          <KeyRound class="w-4 h-4" />{{ t('apolloAccessKeys') }}
        </button>
      </div>
    </div>

    <div class="flex gap-4">
      <!-- Left: env / cluster / namespace tree -->
      <div class="w-64 shrink-0">
        <div class="card p-3 space-y-3">
          <div>
            <label class="block text-xs mb-1">{{ t('apolloEnvs') }}</label>
            <select v-model="env" class="input w-full">
              <option v-for="ec in envClusters" :key="ec.env" :value="ec.env">{{ ec.env }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs mb-1">{{ t('apolloClusterName') }}</label>
            <select v-model="cluster" class="input w-full">
              <option
                v-for="c in envClusters.find((e) => e.env === env)?.clusters || []"
                :key="c"
                :value="c"
              >
                {{ c }}
              </option>
            </select>
          </div>
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="text-xs">{{ t('apolloNamespaces') }}</label>
              <button class="btn btn-ghost btn-xs" @click="showCreateNs = true">
                <Plus class="w-3 h-3" />
              </button>
            </div>
            <div class="space-y-1 max-h-80 overflow-auto">
              <button
                v-for="ns in namespaces"
                :key="ns.namespaceName"
                class="w-full text-left px-2 py-1 rounded text-sm truncate"
                :class="
                  ns.namespaceName === namespace
                    ? 'bg-emerald-600 text-white'
                    : 'hover:bg-bg-secondary text-text-primary'
                "
                @click="openNamespace(ns)"
              >
                <FileCode class="w-3 h-3 inline mr-1" />{{ ns.namespaceName }}
              </button>
              <div v-if="namespaces.length === 0" class="text-xs text-text-tertiary px-2">
                {{ t('noData') }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: tabs -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-1 border-b border-border mb-3">
          <button
            class="tab"
            :class="{ 'tab-active': activeTab === 'items' }"
            @click="onTabChange('items')"
          >
            <Table2 class="w-3.5 h-3.5" />{{ t('apolloItems') }}
          </button>
          <button
            class="tab"
            :class="{ 'tab-active': activeTab === 'history' }"
            @click="onTabChange('history')"
          >
            <History class="w-3.5 h-3.5" />{{ t('apolloHistory') }}
          </button>
          <button
            class="tab"
            :class="{ 'tab-active': activeTab === 'gray' }"
            @click="onTabChange('gray')"
          >
            <GitBranch class="w-3.5 h-3.5" />{{ t('apolloGrayRelease') }}
          </button>
          <button
            class="tab"
            :class="{ 'tab-active': activeTab === 'instances' }"
            @click="onTabChange('instances')"
          >
            <Server class="w-3.5 h-3.5" />{{ t('apolloInstances') }}
          </button>
          <button
            class="tab"
            :class="{ 'tab-active': activeTab === 'compare' }"
            @click="onTabChange('compare')"
          >
            <Code2 class="w-3.5 h-3.5" />{{ t('apolloCompare') }}
          </button>
        </div>

        <!-- Items tab -->
        <div v-if="activeTab === 'items'">
          <div class="flex items-center justify-end gap-2 mb-3">
            <button v-if="!textMode" class="btn btn-ghost btn-sm" @click="openTextMode">
              <Code2 class="w-4 h-4" />{{ t('apolloTextMode') }}
            </button>
            <button class="btn btn-primary btn-sm" @click="showReleaseModal = true">
              <Upload class="w-4 h-4" />{{ t('apolloPublish') }}
            </button>
            <button class="btn btn-primary btn-sm" @click="openCreateItem">
              <Plus class="w-4 h-4" />{{ t('apolloAddItem') }}
            </button>
          </div>

          <div v-if="textMode" class="space-y-2">
            <CodeEditor v-model="textContent" language="properties" :min-height="'400px'" />
            <div class="flex justify-end gap-2">
              <button class="btn btn-ghost btn-sm" @click="textMode = false">
                {{ t('cancel') }}
              </button>
              <button class="btn btn-primary btn-sm" :disabled="savingText" @click="saveText">
                {{ t('save') }}
              </button>
            </div>
          </div>

          <div v-else class="card overflow-hidden">
            <table class="w-full text-sm">
              <thead class="bg-bg-secondary text-text-secondary">
                <tr>
                  <th class="text-left px-4 py-2">{{ t('apolloItemKey') }}</th>
                  <th class="text-left px-4 py-2">{{ t('apolloItemValue') }}</th>
                  <th class="text-left px-4 py-2">{{ t('apolloComment') }}</th>
                  <th class="text-right px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="loadingItems">
                  <td colspan="4" class="text-center py-8 text-text-secondary">
                    {{ t('loading') }}
                  </td>
                </tr>
                <tr v-else-if="items.length === 0">
                  <td colspan="4" class="text-center py-8 text-text-secondary">
                    {{ t('noData') }}
                  </td>
                </tr>
                <tr
                  v-for="item in items"
                  :key="item.key"
                  class="border-t border-border hover:bg-bg-secondary"
                >
                  <td class="px-4 py-2 font-mono text-text-primary">{{ item.key }}</td>
                  <td class="px-4 py-2 text-text-primary max-w-md truncate">{{ item.value }}</td>
                  <td class="px-4 py-2 text-text-secondary">{{ item.comment }}</td>
                  <td class="px-4 py-2 text-right whitespace-nowrap">
                    <button class="btn btn-ghost btn-sm" title="Edit" @click="openEditItem(item)">
                      <Pencil class="w-4 h-4" />
                    </button>
                    <button
                      class="btn btn-ghost btn-sm text-danger"
                      title="Delete"
                      @click="deleteItem(item)"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- History tab -->
        <div v-else-if="activeTab === 'history'">
          <div v-if="loadingReleases" class="card p-8 text-center text-text-secondary">
            {{ t('loading') }}
          </div>
          <div v-else class="space-y-3">
            <div v-for="rel in releases" :key="rel.releaseId" class="card p-4">
              <div class="flex items-center justify-between mb-2">
                <span class="font-medium text-text-primary">{{ rel.name }}</span>
                <button class="btn btn-ghost btn-sm text-warning" @click="rollback(rel)">
                  <X class="w-4 h-4" />{{ t('apolloRollback') }}
                </button>
              </div>
              <p v-if="rel.comment" class="text-xs text-text-secondary mb-2">{{ rel.comment }}</p>
              <pre
                class="text-xs bg-bg-secondary rounded p-3 overflow-auto max-h-48 text-text-primary"
                >{{ JSON.stringify(rel.configurations, null, 2) }}</pre>
            </div>
            <div v-if="releases.length === 0" class="card p-8 text-center text-text-secondary">
              {{ t('noData') }}
            </div>
          </div>
          <div v-if="loadingHistory" class="sr-only">{{ t('loading') }}</div>
          <div v-if="history.length" class="mt-4">
            <h3 class="text-sm font-semibold mb-2 text-text-primary">{{ t('apolloCommits') }}</h3>
            <div class="card overflow-hidden">
              <table class="w-full text-sm">
                <thead class="bg-bg-secondary text-text-secondary">
                  <tr>
                    <th class="text-left px-4 py-2">{{ t('apolloOpName') }}</th>
                    <th class="text-left px-4 py-2">{{ t('apolloOpBy') }}</th>
                    <th class="text-left px-4 py-2">{{ t('apolloOpTime') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="h in history" :key="h.id" class="border-t border-border">
                    <td class="px-4 py-2 text-text-primary">{{ h.operation }}</td>
                    <td class="px-4 py-2 text-text-secondary">{{ h.dataChangeCreatedBy }}</td>
                    <td class="px-4 py-2 text-text-tertiary">{{ h.dataChangeCreatedTime }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Gray tab -->
        <div v-else-if="activeTab === 'gray'">
          <div v-if="!branch" class="card p-8 text-center">
            <p class="text-text-secondary mb-4">{{ t('apolloGrayRelease') }}</p>
            <button class="btn btn-primary btn-sm" :disabled="loadingGray" @click="createBranch">
              <GitBranch class="w-4 h-4" />{{ t('apolloCreateBranch') }}
            </button>
          </div>
          <div v-else class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="badge badge-info">{{ branch.branchName }}</span>
              <div class="flex gap-2">
                <button class="btn btn-primary btn-sm" @click="mergeGray">
                  <Merge class="w-4 h-4" />{{ t('apolloMergeAndPublish') }}
                </button>
                <button class="btn btn-ghost btn-sm text-danger" @click="discardGray">
                  <X class="w-4 h-4" />{{ t('apolloDiscardGray') }}
                </button>
              </div>
            </div>
            <div class="card overflow-hidden">
              <table class="w-full text-sm">
                <thead class="bg-bg-secondary text-text-secondary">
                  <tr>
                    <th class="text-left px-4 py-2">{{ t('apolloItemKey') }}</th>
                    <th class="text-left px-4 py-2">{{ t('apolloItemValue') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="gi in grayItems" :key="gi.key" class="border-t border-border">
                    <td class="px-4 py-2 font-mono text-text-primary">{{ gi.key }}</td>
                    <td class="px-4 py-2">
                      <input v-model="gi.value" class="input" @change="saveGrayItem(gi)" />
                    </td>
                  </tr>
                  <tr v-if="grayItems.length === 0">
                    <td colspan="2" class="text-center py-6 text-text-secondary">
                      {{ t('noData') }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div>
              <label class="block text-xs mb-1">{{ t('apolloGrayRules') }}</label>
              <textarea
                v-model="grayRulesText"
                rows="4"
                class="input font-mono"
                @change="saveGrayRules"
              ></textarea>
            </div>
          </div>
        </div>

        <!-- Instances tab -->
        <div v-else-if="activeTab === 'instances'">
          <div v-if="loadingInstances" class="card p-8 text-center text-text-secondary">
            {{ t('loading') }}
          </div>
          <div v-else class="card overflow-hidden">
            <table class="w-full text-sm">
              <thead class="bg-bg-secondary text-text-secondary">
                <tr>
                  <th class="text-left px-4 py-2">{{ t('apolloIp') }}</th>
                  <th class="text-left px-4 py-2">{{ t('apolloDataCenter') }}</th>
                  <th class="text-left px-4 py-2">AppId</th>
                  <th class="text-left px-4 py-2">Cluster</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="instances.length === 0">
                  <td colspan="4" class="text-center py-8 text-text-secondary">
                    {{ t('noData') }}
                  </td>
                </tr>
                <tr v-for="inst in instances" :key="inst.id" class="border-t border-border">
                  <td class="px-4 py-2 font-mono text-text-primary">{{ inst.ip }}</td>
                  <td class="px-4 py-2 text-text-secondary">{{ inst.dataCenter }}</td>
                  <td class="px-4 py-2 text-text-secondary">{{ inst.appId }}</td>
                  <td class="px-4 py-2 text-text-secondary">{{ inst.clusterName }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Compare tab -->
        <div v-else-if="activeTab === 'compare'">
          <div class="flex flex-wrap items-end gap-3 mb-3">
            <div>
              <label class="block text-xs mb-1">{{ t('apolloCompareBase') }}</label>
              <select v-model="compareBase" class="input w-auto">
                <option :value="null">--</option>
                <option v-for="r in releases" :key="r.releaseId" :value="r.releaseId">
                  #{{ r.releaseId }} {{ r.name }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-xs mb-1">{{ t('apolloCompareTarget') }}</label>
              <select v-model="compareTarget" class="input w-auto">
                <option :value="null">{{ t('apolloLatest') }}</option>
                <option v-for="r in releases" :key="r.releaseId" :value="r.releaseId">
                  #{{ r.releaseId }} {{ r.name }}
                </option>
              </select>
            </div>
            <button class="btn btn-primary btn-sm" :disabled="loadingCompare" @click="runCompare">
              <Search class="w-4 h-4" />{{ t('apolloCompare') }}
            </button>
          </div>
          <div v-if="loadingCompare" class="card p-8 text-center text-text-secondary">
            {{ t('loading') }}
          </div>
          <div v-else-if="compareResult" class="card p-4">
            <pre
              class="text-xs bg-bg-secondary rounded p-3 overflow-auto max-h-96 text-text-primary"
              >{{ JSON.stringify(compareResult.differentConfigs || compareResult, null, 2) }}</pre>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Namespace modal -->
    <div
      v-if="showCreateNs"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="showCreateNs = false"
    >
      <div class="bg-bg rounded-xl shadow-lg w-full max-w-md p-6">
        <h3 class="text-base font-semibold mb-4">{{ t('apolloCreateNamespace') }}</h3>
        <div class="space-y-3">
          <div>
            <label class="block text-xs mb-1">{{ t('apolloNamespaceName') }} *</label
            ><input v-model="nsForm.name" class="input" />
          </div>
          <div>
            <label class="block text-xs mb-1">{{ t('apolloFormat') }}</label
            ><select v-model="nsForm.format" class="input">
              <option v-for="f in formatOptions" :key="f" :value="f">{{ f }}</option>
            </select>
          </div>
          <div class="flex items-center gap-2">
            <input type="checkbox" v-model="nsForm.isPublic" :id="`pub-${appId}`" /><label
              :for="`pub-${appId}`"
              class="text-xs"
              >{{ t('apolloIsPublic') }}</label
            >
          </div>
          <div>
            <label class="block text-xs mb-1">{{ t('apolloComment') }}</label
            ><input v-model="nsForm.comment" class="input" />
          </div>
        </div>
        <div class="flex justify-end gap-2 mt-6">
          <button class="btn btn-ghost btn-sm" @click="showCreateNs = false">
            {{ t('cancel') }}
          </button>
          <button class="btn btn-primary btn-sm" @click="createNamespace">{{ t('create') }}</button>
        </div>
      </div>
    </div>

    <!-- App Namespaces modal -->
    <div
      v-if="showAppNs"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="showAppNs = false"
    >
      <div class="bg-bg rounded-xl shadow-lg w-full max-w-lg p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-base font-semibold">{{ t('apolloAppNamespaces') }}</h3>
          <button class="btn btn-primary btn-sm" @click="closeAppNsModal">
            {{ t('apolloCreateAppNamespace') }}
          </button>
        </div>
        <div class="card overflow-hidden mb-4">
          <table class="w-full text-sm">
            <thead class="bg-bg-secondary text-text-secondary">
              <tr>
                <th class="text-left px-4 py-2">{{ t('apolloNamespaceName') }}</th>
                <th class="text-left px-4 py-2">{{ t('apolloFormat') }}</th>
                <th class="text-left px-4 py-2">{{ t('apolloIsPublic') }}</th>
                <th class="text-right px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="ns in appNamespaces" :key="ns.name" class="border-t border-border">
                <td class="px-4 py-2 text-text-primary">{{ ns.name }}</td>
                <td class="px-4 py-2 text-text-secondary">{{ ns.format }}</td>
                <td class="px-4 py-2 text-text-secondary">
                  {{ ns.isPublic ? t('apolloIsPublic') : t('apolloPrivate') }}
                </td>
                <td class="px-4 py-2 text-right">
                  <button
                    class="btn btn-ghost btn-sm text-danger"
                    title="Delete"
                    @click="deleteAppNamespace(ns)"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </td>
              </tr>
              <tr v-if="appNamespaces.length === 0">
                <td colspan="4" class="text-center py-6 text-text-secondary">{{ t('noData') }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="space-y-3 border-t border-border pt-4" v-if="appNsForm.name || true">
          <div class="font-medium text-sm">{{ t('apolloCreateAppNamespace') }}</div>
          <div>
            <label class="block text-xs mb-1">{{ t('apolloNamespaceName') }} *</label
            ><input v-model="appNsForm.name" class="input" />
          </div>
          <div class="flex gap-3">
            <div class="flex-1">
              <label class="block text-xs mb-1">{{ t('apolloFormat') }}</label
              ><select v-model="appNsForm.format" class="input">
                <option v-for="f in formatOptions" :key="f" :value="f">{{ f }}</option>
              </select>
            </div>
            <div class="flex items-center gap-2 pt-5">
              <input type="checkbox" v-model="appNsForm.isPublic" :id="`apub-${appId}`" /><label
                :for="`apub-${appId}`"
                class="text-xs"
                >{{ t('apolloIsPublic') }}</label
              >
            </div>
          </div>
          <div class="flex justify-end">
            <button class="btn btn-primary btn-sm" @click="createAppNamespace">
              {{ t('create') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Item modal -->
    <div
      v-if="showItemModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="showItemModal = false"
    >
      <div class="bg-bg rounded-xl shadow-lg w-full max-w-lg p-6">
        <h3 class="text-base font-semibold mb-4">
          {{ editingKey ? t('edit') : t('apolloAddItem') }}
        </h3>
        <div class="space-y-3">
          <div>
            <label class="block text-xs mb-1">{{ t('apolloItemKey') }} *</label
            ><input
              v-model="itemForm.key"
              class="input"
              :disabled="!!editingKey"
              :placeholder="'key.name'"
            />
          </div>
          <div>
            <label class="block text-xs mb-1">{{ t('apolloItemValue') }}</label
            ><textarea
              v-model="itemForm.value"
              rows="4"
              class="input font-mono"
              :placeholder="'value'"
            ></textarea>
          </div>
          <div>
            <label class="block text-xs mb-1">{{ t('apolloComment') }}</label
            ><input v-model="itemForm.comment" class="input" :placeholder="'comment'" />
          </div>
        </div>
        <div class="flex justify-end gap-2 mt-6">
          <button class="btn btn-ghost btn-sm" @click="showItemModal = false">
            {{ t('cancel') }}
          </button>
          <button class="btn btn-primary btn-sm" :disabled="savingItem" @click="saveItem">
            {{ t('save') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Release modal -->
    <div
      v-if="showReleaseModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="showReleaseModal = false"
    >
      <div class="bg-bg rounded-xl shadow-lg w-full max-w-md p-6">
        <h3 class="text-base font-semibold mb-4">{{ t('apolloPublish') }}</h3>
        <div class="space-y-3">
          <div>
            <label class="block text-xs mb-1">{{ t('apolloReleaseTitle') }} *</label
            ><input v-model="releaseForm.releaseTitle" class="input" />
          </div>
          <div>
            <label class="block text-xs mb-1">{{ t('apolloReleaseComment') }}</label
            ><input v-model="releaseForm.releaseComment" class="input" />
          </div>
        </div>
        <div class="flex justify-end gap-2 mt-6">
          <button class="btn btn-ghost btn-sm" @click="showReleaseModal = false">
            {{ t('cancel') }}
          </button>
          <button class="btn btn-primary btn-sm" @click="publish">{{ t('apolloPublish') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tab {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  border-bottom: 2px solid transparent;
  color: rgb(var(--text-secondary));
}
.tab:hover {
  color: rgb(var(--text-primary));
}
.tab-active {
  border-bottom-color: #10b981;
  color: #10b981;
}
</style>
