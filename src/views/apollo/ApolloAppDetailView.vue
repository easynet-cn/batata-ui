<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
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
  ShieldCheck,
  UserCog,
  Shuffle,
  Copy,
  Eye,
  GitCompare,
  GitCommit,
  Lock,
  Unlock,
  Link2,
  Download,
} from '@lucide/vue'
import apolloApi from '@/api/apollo'
import { useConfirm } from '@/composables/useConfirm'
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
  ApolloCommitDTO,
} from '@/types/apollo'
import CodeEditor from '@/components/common/CodeEditor.vue'
import ApolloRoleAssign from '@/views/apollo/ApolloRoleAssign.vue'
import FormModal from '@/components/common/FormModal.vue'

const { t } = useI18n()
const { confirm } = useConfirm()
const route = useRoute()
const router = useRouter()

type Tab = 'overview' | 'items' | 'history' | 'gray' | 'instances' | 'commits' | 'compare'

const appId = ref<string>(String(route.query.appId || ''))
const env = ref<string>(String(route.query.env || 'DEV'))
const cluster = ref<string>(String(route.query.cluster || 'default'))
const namespace = ref<string>(String(route.query.namespace || 'application'))

const routeTab = (route.meta.tab as Tab) || (route.query.tab as Tab) || 'overview'
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
interface GrayRuleRow {
  clientAppId: string
  ipText: string
  forceReleased: boolean
}
const grayItems = ref<ApolloItemDTO[]>([])
const grayRulesText = ref('')
const grayRuleRows = ref<GrayRuleRow[]>([])
const loadingGray = ref(false)

const instances = ref<ApolloInstanceDTO[]>([])
const loadingInstances = ref(false)
const showOnlyGrayInstances = ref(false)
const grayMatchedInstances = computed(() => {
  const rules = grayRuleRows.value
  if (rules.length === 0) return []
  return instances.value.filter((inst) => {
    const ip = inst.ip || ''
    return rules.some((r) => {
      const ips = (r.ipText || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      return (r.clientAppId && r.clientAppId === inst.appId) || (ip && ips.includes(ip))
    })
  })
})
const shownInstances = computed(() =>
  showOnlyGrayInstances.value ? grayMatchedInstances.value : instances.value,
)

const commits = ref<ApolloCommitDTO[]>([])
const loadingCommits = ref(false)

const keyHistory = ref<ApolloCommitDTO[]>([])
const loadingKeyHistory = ref(false)
const showKeyHistory = ref(false)
const keyHistoryKey = ref('')

const compareBase = ref<number | null>(null)
const compareTarget = ref<number | null>(null)
const compareResult = ref<ApolloCompareResultDTO | null>(null)
const loadingCompare = ref(false)

const operator = 'admin'

// ---------------- Permission modals ----------------
const showAppRole = ref(false)
const showNsRole = ref(false)

// ---------------- Config sync ----------------
const showSync = ref(false)
const savingSync = ref(false)
const syncTarget = ref<{ env: string; cluster: string; namespace: string }>({
  env: '',
  cluster: '',
  namespace: '',
})
const syncSelected = ref<string[]>([])

function openSync() {
  syncTarget.value = { env: env.value, cluster: cluster.value, namespace: namespace.value }
  syncSelected.value = items.value.map((i) => i.key)
  showSync.value = true
}

async function runSync() {
  if (!syncTarget.value.env || !syncTarget.value.cluster || !syncTarget.value.namespace) return
  savingSync.value = true
  try {
    const syncItems = items.value
      .filter((i) => syncSelected.value.includes(i.key))
      .map((i) => ({ key: i.key, value: i.value, comment: i.comment, type: i.type }))
    await apolloApi.syncNamespace(env.value, appId.value, cluster.value, namespace.value, {
      syncToNamespaces: [
        {
          appId: appId.value,
          env: syncTarget.value.env,
          clusterName: syncTarget.value.cluster,
          namespaceName: syncTarget.value.namespace,
        },
      ],
      syncItems,
    })
    showSync.value = false
  } finally {
    savingSync.value = false
  }
}

// ---------------- Cross-namespace diff ----------------
const diffTarget = ref<{ appId: string; env: string; cluster: string; namespace: string }>({
  appId: '',
  env: '',
  cluster: '',
  namespace: '',
})
const diffResult = ref<{
  onlySource: { key: string; value: string }[]
  onlyTarget: { key: string; value: string }[]
  changed: { key: string; source: string; target: string }[]
} | null>(null)
const loadingDiffNs = ref(false)
const diffError = ref('')

async function runNsDiff() {
  if (!diffTarget.value.env || !diffTarget.value.namespace) return
  loadingDiffNs.value = true
  diffError.value = ''
  try {
    const src = await apolloApi.getLatestRelease(
      env.value,
      appId.value,
      cluster.value,
      namespace.value,
    )
    const dst = await apolloApi.getLatestRelease(
      diffTarget.value.env,
      diffTarget.value.appId || appId.value,
      diffTarget.value.cluster || cluster.value,
      diffTarget.value.namespace,
    )
    const s = (src?.configurations as Record<string, string>) || {}
    const d = (dst?.configurations as Record<string, string>) || {}
    const onlySource: { key: string; value: string }[] = []
    const onlyTarget: { key: string; value: string }[] = []
    const changed: { key: string; source: string; target: string }[] = []
    for (const k of Object.keys(s)) {
      if (!(k in d)) onlySource.push({ key: k, value: s[k] })
      else if (s[k] !== d[k]) changed.push({ key: k, source: s[k], target: d[k] })
    }
    for (const k of Object.keys(d)) {
      if (!(k in s)) onlyTarget.push({ key: k, value: d[k] })
    }
    diffResult.value = { onlySource, onlyTarget, changed }
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } }; message?: string }
    diffError.value = err?.response?.data?.message || err?.message || t('apolloCompareFailed')
  } finally {
    loadingDiffNs.value = false
  }
}

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

const currentNamespace = computed(() =>
  namespaces.value.find((n) => n.namespaceName === namespace.value),
)

async function lockNamespace() {
  if (!currentNamespace.value) return
  const comment = prompt(t('apolloLockComment')) || ''
  await apolloApi.lockNamespace(
    env.value,
    appId.value,
    cluster.value,
    namespace.value,
    comment,
    operator,
  )
  await loadNamespaces()
}

async function unlockNamespace() {
  if (!currentNamespace.value) return
  await apolloApi.unlockNamespace(env.value, appId.value, cluster.value, namespace.value, operator)
  await loadNamespaces()
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
      grayRuleRows.value = parseGrayRules(grayRulesText.value)
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
    const map: Record<string, ReleaseDiffRow[]> = {}
    for (let i = 0; i < res.content.length; i++) {
      const prev = res.content[i + 1]
      map[String(res.content[i].releaseId)] = computeReleaseDiff(
        res.content[i].configurations,
        prev?.configurations,
      )
    }
    releaseDiffMap.value = map
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

async function loadCommits() {
  if (!appId.value || !env.value || !cluster.value || !namespace.value) return
  loadingCommits.value = true
  try {
    const res = await apolloApi.listCommits(
      env.value,
      appId.value,
      cluster.value,
      namespace.value,
      0,
      50,
    )
    commits.value = res.content
  } finally {
    loadingCommits.value = false
  }
}

function changeOpLabel(op?: number): string {
  if (op === 0) return t('apolloChangeAdded')
  if (op === 1) return t('apolloChangeModified')
  if (op === 2) return t('apolloChangeDeleted')
  return String(op ?? '?')
}

async function openKeyHistory(key: string, branchName?: string) {
  keyHistoryKey.value = key
  showKeyHistory.value = true
  loadingKeyHistory.value = true
  try {
    keyHistory.value = await apolloApi.getItemHistory(
      env.value,
      appId.value,
      cluster.value,
      namespace.value,
      key,
      branchName,
    )
  } finally {
    loadingKeyHistory.value = false
  }
}

function onTabChange(tab: Tab) {
  activeTab.value = tab
  if (tab === 'overview' || tab === 'history' || tab === 'compare') loadReleases()
  if (tab === 'history') loadHistory()
  if (tab === 'instances') loadInstances()
  if (tab === 'commits') loadCommits()
}

async function initialTabLoad() {
  if (
    activeTab.value === 'overview' ||
    activeTab.value === 'history' ||
    activeTab.value === 'compare'
  ) {
    await loadReleases()
  }
  if (activeTab.value === 'history') {
    await loadHistory()
  } else if (activeTab.value === 'instances') {
    await loadInstances()
  } else if (activeTab.value === 'commits') {
    await loadCommits()
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
  if (
    !(await confirm({
      title: t('confirmDelete'),
      message: `Delete item ${item.key}?`,
      danger: true,
    }))
  )
    return
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
  if (
    !(await confirm({
      title: t('confirm'),
      message: `Rollback to release ${release.releaseId}?`,
      danger: true,
    }))
  )
    return
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

async function exportCurrentConfig() {
  const text = await apolloApi.exportConfigs(appId.value, cluster.value, namespace.value)
  const blob = new Blob([text], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${appId.value}-${cluster.value}-${namespace.value}.properties`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ---------------- Gray ----------------
const showCreateNs = ref(false)
const showAssociateNs = ref(false)
const associateForm = ref({ publicAppId: '', publicNamespace: '' })
const nsForm = ref({ name: '', format: 'properties', isPublic: false, comment: '' })
const showAppNs = ref(false)
const appNsForm = ref({ name: '', format: 'properties', isPublic: false, comment: '' })

function closeAppNsModal() {
  showAppNs.value = false
  appNsForm.value = { name: '', format: 'properties', isPublic: false, comment: '' }
}

function openAppNs() {
  showAppNs.value = true
}

function openAppRole() {
  showAppRole.value = true
}

function openNsRole() {
  showNsRole.value = true
}

function openAssociateNs() {
  showAssociateNs.value = true
}

function openCreateNs() {
  showCreateNs.value = true
}

function openReleaseModal() {
  showReleaseModal.value = true
}

function closeTextMode() {
  textMode.value = false
}

function namespaceNameClass(ns: ApolloOpenNamespace): string {
  return ns.namespaceName === namespace.value ? 'text-white' : 'text-danger'
}

const namespaceLockClass = computed(() =>
  currentNamespace.value?.isLocked ? 'text-warning' : 'text-text-secondary',
)

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
  if (
    !(await confirm({
      title: t('confirmDelete'),
      message: `Delete app namespace ${ns.name}?`,
      danger: true,
    }))
  )
    return
  await apolloApi.deleteAppNamespace(appId.value, ns.name, operator)
  appNamespaces.value = await apolloApi.listAppNamespaces(appId.value)
}

async function associatePublicNamespace() {
  if (!associateForm.value.publicAppId || !associateForm.value.publicNamespace) return
  await apolloApi.associateNamespace(
    env.value,
    appId.value,
    cluster.value,
    associateForm.value.publicNamespace,
    associateForm.value.publicAppId,
    associateForm.value.publicNamespace,
    operator,
  )
  showAssociateNs.value = false
  associateForm.value = { publicAppId: '', publicNamespace: '' }
  await loadNamespaces()
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
function parseGrayRules(text: string): GrayRuleRow[] {
  if (!text || !text.trim()) return []
  try {
    const arr = JSON.parse(text)
    if (Array.isArray(arr)) {
      return (
        arr as Array<{ clientAppId?: string; clientIpList?: string[]; forceReleased?: boolean }>
      ).map((r) => ({
        clientAppId: r.clientAppId || '',
        ipText: Array.isArray(r.clientIpList) ? r.clientIpList.join(', ') : '',
        forceReleased: !!r.forceReleased,
      }))
    }
  } catch {
    // keep empty when malformed
  }
  return []
}

function addGrayRuleRow() {
  grayRuleRows.value.push({ clientAppId: '', ipText: '', forceReleased: false })
}

async function saveGrayRules() {
  if (!branch.value) return
  const rules = grayRuleRows.value.map((r) => ({
    clientAppId: r.clientAppId,
    clientIpList: r.ipText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    forceReleased: r.forceReleased,
  }))
  grayRulesText.value = JSON.stringify(rules)
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
  if (!(await confirm({ title: t('confirm'), message: 'Discard gray release?', danger: true })))
    return
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

// Stage a gray release (only affects instances matching the gray rules) — distinct
// from a full merge/release which pushes the branch to the main namespace.
async function publishGray() {
  if (!branch.value) return
  await apolloApi.createGrayRelease(
    env.value,
    appId.value,
    cluster.value,
    namespace.value,
    branch.value.branchName,
    { releaseTitle: `Gray ${namespace.value}`, releasedBy: operator },
  )
  await loadBranch()
}

// Add a brand-new key into the gray branch.
const showGrayItemModal = ref(false)
const grayItemForm = ref({ key: '', value: '', comment: '' })
function openCreateGrayItem() {
  grayItemForm.value = { key: '', value: '', comment: '' }
  showGrayItemModal.value = true
}
async function saveGrayItemNew() {
  if (!branch.value || !grayItemForm.value.key) return
  await apolloApi.createItem(
    env.value,
    appId.value,
    cluster.value,
    namespace.value,
    {
      key: grayItemForm.value.key,
      value: grayItemForm.value.value,
      comment: grayItemForm.value.comment,
    },
    branch.value.branchName,
  )
  showGrayItemModal.value = false
  await loadBranch()
}
async function deleteGrayItem(gi: ApolloItemDTO) {
  if (!branch.value) return
  if (
    !(await confirm({
      title: t('confirmDelete'),
      message: `Delete gray item ${gi.key}?`,
      danger: true,
    }))
  )
    return
  await apolloApi.deleteItem(
    env.value,
    appId.value,
    cluster.value,
    namespace.value,
    gi.key,
    operator,
    branch.value.branchName,
  )
  await loadBranch()
}

// ---------------- Release diff (vs previous) ----------------
interface ReleaseDiffRow {
  type: 'added' | 'modified' | 'deleted'
  key: string
  oldValue?: string
  newValue?: string
}
const expandedRelease = ref<string | number | null>(null)
function toggleRelease(id: number | string) {
  expandedRelease.value = expandedRelease.value === id ? null : id
}
function computeReleaseDiff(
  cur: Record<string, string> | undefined,
  prev: Record<string, string> | undefined,
): ReleaseDiffRow[] {
  const c = cur || {}
  const p = prev || {}
  const rows: ReleaseDiffRow[] = []
  for (const k of Object.keys(c)) {
    if (!(k in p)) rows.push({ type: 'added', key: k, newValue: c[k] })
    else if (p[k] !== c[k]) rows.push({ type: 'modified', key: k, oldValue: p[k], newValue: c[k] })
  }
  for (const k of Object.keys(p)) {
    if (!(k in c)) rows.push({ type: 'deleted', key: k, oldValue: p[k] })
  }
  return rows
}
const releaseDiffMap = ref<Record<string, ReleaseDiffRow[]>>({})
function opLabel(op: number | undefined): string {
  const map: Record<number, string> = {
    0: t('apolloOp0'),
    1: t('apolloOp1'),
    2: t('apolloOp2'),
    3: t('apolloOp3'),
    4: t('apolloOp4'),
  }
  if (op === undefined || !(op in map)) return String(op ?? '?')
  return map[op]
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

// ---------------- Instance actual configs ----------------
const showInstanceModal = ref(false)
const instanceConfigs = ref<Record<string, string> | null>(null)
const instanceIp = ref('')
const loadingInstanceCfg = ref(false)
async function openInstance(inst: ApolloInstanceDTO) {
  loadingInstanceCfg.value = true
  instanceIp.value = inst.ip || ''
  showInstanceModal.value = true
  try {
    instanceConfigs.value = await apolloApi.getInstanceConfigs(env.value, inst.id!)
  } finally {
    loadingInstanceCfg.value = false
  }
}

// ---------------- Edit app info ----------------
const showAppEdit = ref(false)
const appEditForm = ref({ name: '', ownerName: '', ownerEmail: '', orgId: '', orgName: '' })
function openEditApp() {
  if (!app.value) return
  appEditForm.value = {
    name: app.value.name,
    ownerName: app.value.ownerName,
    ownerEmail: app.value.ownerEmail,
    orgId: app.value.orgId,
    orgName: app.value.orgName,
  }
  showAppEdit.value = true
}
async function saveApp() {
  await apolloApi.updateApp(appId.value, {
    appId: appId.value,
    name: appEditForm.value.name,
    ownerName: appEditForm.value.ownerName,
    ownerEmail: appEditForm.value.ownerEmail,
    orgId: appEditForm.value.orgId,
    orgName: appEditForm.value.orgName,
  })
  app.value = await apolloApi.getApp(appId.value)
  showAppEdit.value = false
}

// ---------------- Items enhancements ----------------
const itemSearch = ref('')
const itemSelected = ref<string[]>([])
const filteredItems = computed(() => {
  const q = itemSearch.value.trim().toLowerCase()
  if (!q) return items.value
  return items.value.filter(
    (i) => i.key.toLowerCase().includes(q) || (i.value || '').toLowerCase().includes(q),
  )
})
async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    /* clipboard not available */
  }
}
async function batchDeleteItems() {
  if (itemSelected.value.length === 0) return
  if (
    !(await confirm({
      title: t('confirmDelete'),
      message: `Delete ${itemSelected.value.length} item(s)?`,
      danger: true,
    }))
  )
    return
  for (const k of itemSelected.value) {
    await apolloApi.deleteItem(env.value, appId.value, cluster.value, namespace.value, k, operator)
  }
  itemSelected.value = []
  await loadItemsAndBranch()
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
async function deleteNamespace(ns: ApolloOpenNamespace) {
  if (
    !(await confirm({
      title: t('confirmDelete'),
      message: `Delete namespace ${ns.namespaceName}?`,
      danger: true,
    }))
  )
    return
  await apolloApi.deleteNamespace(env.value, appId.value, cluster.value, ns.namespaceName, operator)
  if (namespace.value === ns.namespaceName) namespace.value = 'application'
  await loadNamespaces()
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
      <button class="btn btn-ghost btn-xs" :title="t('apolloEditApp')" @click="openEditApp">
        <Pencil class="w-3.5 h-3.5" />
      </button>
      <div class="ml-auto flex gap-2">
        <button class="btn btn-ghost btn-sm" @click="openAppNs()">
          <Layers class="w-4 h-4" />{{ t('apolloAppNamespaces') }}
        </button>
        <button class="btn btn-ghost btn-sm" @click="goClusters">
          <Network class="w-4 h-4" />{{ t('apolloClusters') }}
        </button>
        <button class="btn btn-ghost btn-sm" @click="goAccessKeys">
          <KeyRound class="w-4 h-4" />{{ t('apolloAccessKeys') }}
        </button>
        <button class="btn btn-ghost btn-sm" @click="openAppRole()">
          <ShieldCheck class="w-4 h-4" />{{ t('apolloAppPermission') }}
        </button>
        <button class="btn btn-ghost btn-sm" @click="openNsRole()">
          <UserCog class="w-4 h-4" />{{ t('apolloNamespacePermission') }}
        </button>
        <button class="btn btn-ghost btn-sm" @click="openSync">
          <Shuffle class="w-4 h-4" />{{ t('apolloSync') }}
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
              <div class="flex items-center gap-1">
                <button
                  class="btn btn-ghost btn-xs"
                  :title="t('apolloAssociateNs')"
                  @click="openAssociateNs()"
                >
                  <Link2 class="w-3 h-3" />
                </button>
                <button class="btn btn-ghost btn-xs" @click="openCreateNs()">
                  <Plus class="w-3 h-3" />
                </button>
              </div>
            </div>
            <div class="space-y-1 max-h-80 overflow-auto">
              <div
                v-for="ns in namespaces"
                :key="ns.namespaceName"
                class="group flex items-center gap-1 rounded"
                :class="
                  ns.namespaceName === namespace
                    ? 'bg-emerald-600 text-white'
                    : 'hover:bg-bg-secondary text-text-primary'
                "
              >
                <button
                  class="flex-1 text-left px-2 py-1 text-sm truncate"
                  @click="openNamespace(ns)"
                >
                  <FileCode class="w-3 h-3 inline mr-1" />{{ ns.namespaceName }}
                </button>
                <button
                  v-if="ns.namespaceName !== 'application'"
                  class="btn btn-ghost btn-xs px-1"
                  :class="namespaceNameClass(ns)"
                  :title="t('delete')"
                  @click.stop="deleteNamespace(ns)"
                >
                  <Trash2 class="w-3 h-3" />
                </button>
              </div>
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
            :class="{ 'tab-active': activeTab === 'overview' }"
            @click="onTabChange('overview')"
          >
            <Layers class="w-3.5 h-3.5" />{{ t('apolloOverview') }}
          </button>
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
            :class="{ 'tab-active': activeTab === 'commits' }"
            @click="onTabChange('commits')"
          >
            <GitCommit class="w-3.5 h-3.5" />{{ t('apolloCommitHistory') }}
          </button>
          <button
            class="tab"
            :class="{ 'tab-active': activeTab === 'compare' }"
            @click="onTabChange('compare')"
          >
            <Code2 class="w-3.5 h-3.5" />{{ t('apolloCompare') }}
          </button>
        </div>

        <!-- Overview tab -->
        <div v-if="activeTab === 'overview'">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            <div v-for="ns in namespaces" :key="ns.namespaceName" class="card p-4">
              <div class="flex items-center justify-between mb-2">
                <span class="font-semibold text-text-primary truncate">{{ ns.namespaceName }}</span>
                <span
                  v-if="ns.isLocked"
                  class="badge badge-warning shrink-0 ml-2"
                  :title="ns.lockedBy ? ns.lockedBy + ' · ' + (ns.lockedComment || '') : ''"
                  >{{ t('apolloLocked') }}</span
                >
              </div>
              <div class="text-xs text-text-secondary space-y-1">
                <div>{{ t('apolloFormat') }}: {{ ns.format || 'properties' }}</div>
                <div>{{ t('apolloItemCount') }}: {{ ns.items?.length || 0 }}</div>
                <div v-if="ns.isPublic" class="text-info">{{ t('apolloIsPublic') }}</div>
              </div>
              <button class="btn btn-ghost btn-xs mt-2" @click="openNamespace(ns)">
                {{ t('apolloOpen') }}
              </button>
            </div>
            <div v-if="namespaces.length === 0" class="card p-4 text-text-tertiary text-sm">
              {{ t('noData') }}
            </div>
          </div>
          <div class="card p-4">
            <h3 class="text-sm font-semibold mb-2 text-text-primary">
              {{ t('apolloLatestRelease') }}
            </h3>
            <div v-if="releases.length">
              <div class="flex items-center justify-between">
                <span class="text-text-primary"
                  >{{ releases[0].name }}
                  <span class="text-text-tertiary font-mono text-xs"
                    >#{{ releases[0].releaseId }}</span
                  ></span
                >
              </div>
              <p v-if="releases[0].comment" class="text-xs text-text-secondary mt-1">
                {{ releases[0].comment }}
              </p>
            </div>
            <div v-else class="text-xs text-text-tertiary">{{ t('noData') }}</div>
          </div>
        </div>

        <!-- Items tab -->
        <div v-if="activeTab === 'items'">
          <div class="flex items-center justify-between gap-2 mb-3">
            <div class="flex items-center gap-2">
              <div class="relative">
                <Search
                  class="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-tertiary"
                />
                <input
                  v-model="itemSearch"
                  class="input input-sm pl-7 w-56"
                  :placeholder="t('apolloItemSearch')"
                />
              </div>
              <button
                v-if="itemSelected.length"
                class="btn btn-ghost btn-sm text-danger"
                @click="batchDeleteItems"
              >
                <Trash2 class="w-4 h-4" />{{ t('apolloBatchDelete') }} ({{ itemSelected.length }})
              </button>
            </div>
            <div class="flex items-center gap-2">
              <button
                v-if="currentNamespace"
                class="btn btn-ghost btn-sm"
                :class="namespaceLockClass"
                :title="currentNamespace?.isLocked ? t('apolloUnlock') : t('apolloLock')"
                @click="currentNamespace?.isLocked ? unlockNamespace() : lockNamespace()"
              >
                <Lock v-if="!currentNamespace?.isLocked" class="w-4 h-4" />
                <Unlock v-else class="w-4 h-4" />
                {{ currentNamespace?.isLocked ? t('apolloUnlock') : t('apolloLock') }}
              </button>
              <button v-if="!textMode" class="btn btn-ghost btn-sm" @click="openTextMode">
                <Code2 class="w-4 h-4" />{{ t('apolloTextMode') }}
              </button>
              <button class="btn btn-ghost btn-sm" @click="exportCurrentConfig">
                <Download class="w-4 h-4" />{{ t('apolloExport') }}
              </button>
              <button class="btn btn-primary btn-sm" @click="openReleaseModal()">
                <Upload class="w-4 h-4" />{{ t('apolloPublish') }}
              </button>
              <button class="btn btn-primary btn-sm" @click="openCreateItem">
                <Plus class="w-4 h-4" />{{ t('apolloAddItem') }}
              </button>
            </div>
          </div>

          <div v-if="textMode" class="space-y-2">
            <CodeEditor v-model="textContent" language="properties" :min-height="'400px'" />
            <div class="flex justify-end gap-2">
              <button class="btn btn-ghost btn-sm" @click="closeTextMode()">
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
                  <th class="w-8 px-2 py-2">
                    <input
                      type="checkbox"
                      :checked="
                        itemSelected.length === filteredItems.length && filteredItems.length > 0
                      "
                      @change="
                        itemSelected =
                          itemSelected.length === filteredItems.length
                            ? []
                            : filteredItems.map((i) => i.key)
                      "
                    />
                  </th>
                  <th class="text-left px-4 py-2">{{ t('apolloItemKey') }}</th>
                  <th class="text-left px-4 py-2">{{ t('apolloItemValue') }}</th>
                  <th class="text-left px-4 py-2">{{ t('apolloComment') }}</th>
                  <th class="text-right px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="loadingItems">
                  <td colspan="5" class="text-center py-8 text-text-secondary">
                    {{ t('loading') }}
                  </td>
                </tr>
                <tr v-else-if="filteredItems.length === 0">
                  <td colspan="5" class="text-center py-8 text-text-secondary">
                    {{ t('noData') }}
                  </td>
                </tr>
                <tr
                  v-for="item in filteredItems"
                  :key="item.key"
                  class="border-t border-border hover:bg-bg-secondary"
                >
                  <td class="px-2 py-2 w-8">
                    <input type="checkbox" :value="item.key" v-model="itemSelected" />
                  </td>
                  <td class="px-4 py-2 font-mono text-text-primary">
                    {{ item.key }}
                    <button
                      class="btn btn-ghost btn-xs"
                      :title="t('apolloCopy')"
                      @click="copyText(item.key)"
                    >
                      <Copy class="w-3 h-3" />
                    </button>
                  </td>
                  <td class="px-4 py-2 text-text-primary max-w-md truncate">
                    {{ item.value }}
                    <button
                      class="btn btn-ghost btn-xs"
                      :title="t('apolloCopy')"
                      @click="copyText(item.value)"
                    >
                      <Copy class="w-3 h-3" />
                    </button>
                  </td>
                  <td class="px-4 py-2 text-text-secondary">{{ item.comment }}</td>
                  <td class="px-4 py-2 text-right whitespace-nowrap">
                    <button
                      class="btn btn-ghost btn-sm"
                      :title="t('apolloItemHistory')"
                      @click="openKeyHistory(item.key)"
                    >
                      <History class="w-4 h-4" />
                    </button>
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

        <!-- Key history modal -->
        <FormModal
          v-model="showKeyHistory"
          :title="`${t('apolloItemHistory')} · ${keyHistoryKey}`"
          size="lg"
          hide-footer
        >
          <div v-if="loadingKeyHistory" class="text-center text-text-secondary py-6">
            {{ t('loading') }}
          </div>
          <div v-else class="space-y-3 max-h-96 overflow-auto">
            <div v-for="c in keyHistory" :key="c.id" class="card p-3">
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs text-text-tertiary">{{ c.dataChangeCreatedTime }}</span>
                <span class="text-xs text-text-secondary">{{ c.dataChangeCreatedBy }}</span>
              </div>
              <div v-if="c.changeSets && c.changeSets.length" class="space-y-1">
                <div
                  v-for="ch in c.changeSets"
                  :key="ch.key"
                  class="text-sm flex items-center gap-2"
                >
                  <span class="font-mono text-text-primary">{{ ch.key }}</span>
                  <span
                    class="text-xs font-medium"
                    :class="
                      ch.op === 2 ? 'text-danger' : ch.op === 0 ? 'text-success' : 'text-warning'
                    "
                    >{{ changeOpLabel(ch.op) }}</span
                  >
                  <span v-if="ch.op !== 2" class="text-xs text-text-secondary">
                    <span v-if="ch.op === 1" class="text-danger line-through mr-1">{{
                      ch.oldValue
                    }}</span
                    >→ {{ ch.newValue }}</span
                  >
                </div>
              </div>
              <div v-else class="text-xs text-text-tertiary">{{ t('apolloNoChanges') }}</div>
            </div>
            <div v-if="keyHistory.length === 0" class="text-center text-text-secondary py-6">
              {{ t('noData') }}
            </div>
          </div>
        </FormModal>

        <!-- History tab -->
        <div v-if="activeTab === 'history'">
          <div v-if="loadingReleases" class="card p-8 text-center text-text-secondary">
            {{ t('loading') }}
          </div>
          <div v-else class="space-y-3">
            <div v-for="(rel, idx) in releases" :key="rel.releaseId" class="card p-4">
              <div class="flex items-center justify-between mb-2">
                <span class="font-medium text-text-primary">
                  {{ rel.name }}
                  <span class="text-text-tertiary font-mono text-xs">#{{ rel.releaseId }}</span>
                </span>
                <div class="flex gap-2">
                  <button class="btn btn-ghost btn-sm" @click="toggleRelease(rel.releaseId)">
                    <GitCompare class="w-4 h-4" />{{
                      expandedRelease === rel.releaseId ? t('apolloHideDiff') : t('apolloViewDiff')
                    }}
                  </button>
                  <button class="btn btn-ghost btn-sm text-warning" @click="rollback(rel)">
                    <X class="w-4 h-4" />{{ t('apolloRollback') }}
                  </button>
                </div>
              </div>
              <p v-if="rel.comment" class="text-xs text-text-secondary mb-2">{{ rel.comment }}</p>
              <pre
                class="text-xs bg-bg-secondary rounded p-3 overflow-auto max-h-48 text-text-primary"
                >{{ JSON.stringify(rel.configurations, null, 2) }}</pre>
              <div
                v-if="expandedRelease === rel.releaseId && idx < releases.length - 1"
                class="mt-3 border-t border-border pt-3"
              >
                <div class="text-xs font-semibold mb-2 text-text-primary">
                  {{ t('apolloDiffVsPrevious') }}
                </div>
                <div class="card overflow-hidden">
                  <table class="w-full text-sm">
                    <thead class="bg-bg-secondary text-text-secondary">
                      <tr>
                        <th class="text-left px-2 py-1">{{ t('apolloItemKey') }}</th>
                        <th class="text-left px-2 py-1">{{ t('apolloItemValue') }}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="d in releaseDiffMap[String(rel.releaseId)] || []"
                        :key="d.key"
                        class="border-t border-border"
                      >
                        <td class="px-2 py-1 font-mono text-text-primary">{{ d.key }}</td>
                        <td class="px-2 py-1">
                          <span v-if="d.type === 'added'" class="text-success"
                            >+ {{ d.newValue }}</span
                          >
                          <span v-else-if="d.type === 'modified'" class="text-warning">
                            <span class="text-danger line-through">{{ d.oldValue }}</span>
                            → {{ d.newValue }}
                          </span>
                          <span v-else class="text-danger">- {{ d.oldValue }}</span>
                        </td>
                      </tr>
                      <tr v-if="(releaseDiffMap[String(rel.releaseId)] || []).length === 0">
                        <td colspan="2" class="text-center py-4 text-text-tertiary">
                          {{ t('noData') }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div
                v-else-if="expandedRelease === rel.releaseId && idx === releases.length - 1"
                class="mt-3 text-xs text-text-tertiary"
              >
                {{ t('apolloBaseRelease') }}
              </div>
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
                    <th class="text-left px-4 py-2 max-w-xs">{{ t('apolloOpContext') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="h in history" :key="h.id" class="border-t border-border">
                    <td class="px-4 py-2 text-text-primary">{{ opLabel(h.operation) }}</td>
                    <td class="px-4 py-2 text-text-secondary">{{ h.dataChangeCreatedBy }}</td>
                    <td class="px-4 py-2 text-text-tertiary">{{ h.dataChangeCreatedTime }}</td>
                    <td
                      class="px-4 py-2 text-text-secondary max-w-xs truncate"
                      :title="h.operationContext"
                    >
                      {{ h.operationContext }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Gray tab -->
        <div v-if="activeTab === 'gray'">
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
                <button class="btn btn-primary btn-sm" @click="publishGray">
                  <GitBranch class="w-4 h-4" />{{ t('apolloGrayRelease') }}
                </button>
                <button class="btn btn-primary btn-sm" @click="mergeGray">
                  <Merge class="w-4 h-4" />{{ t('apolloMergeAndPublish') }}
                </button>
                <button class="btn btn-ghost btn-sm" @click="openCreateGrayItem">
                  <Plus class="w-4 h-4" />{{ t('apolloAddItem') }}
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
                    <th class="text-right px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="gi in grayItems" :key="gi.key" class="border-t border-border">
                    <td class="px-4 py-2 font-mono text-text-primary">{{ gi.key }}</td>
                    <td class="px-4 py-2">
                      <input v-model="gi.value" class="input" @change="saveGrayItem(gi)" />
                    </td>
                    <td class="px-4 py-2 text-right">
                      <button
                        class="btn btn-ghost btn-sm"
                        :title="t('apolloItemHistory')"
                        @click="openKeyHistory(gi.key, branch?.branchName)"
                      >
                        <History class="w-4 h-4" />
                      </button>
                      <button class="btn btn-ghost btn-sm text-danger" @click="deleteGrayItem(gi)">
                        <Trash2 class="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                  <tr v-if="grayItems.length === 0">
                    <td colspan="3" class="text-center py-6 text-text-secondary">
                      {{ t('noData') }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div>
              <label class="block text-xs mb-1">{{ t('apolloGrayRules') }}</label>
              <div class="space-y-2">
                <div v-for="(row, i) in grayRuleRows" :key="i" class="card p-3 space-y-2">
                  <div class="flex items-center gap-2">
                    <input
                      v-model="row.clientAppId"
                      class="input input-sm flex-1"
                      :placeholder="t('apolloClientAppId')"
                    />
                    <button
                      class="btn btn-ghost btn-xs text-danger"
                      @click="grayRuleRows.splice(i, 1)"
                    >
                      <Trash2 class="w-3 h-3" />
                    </button>
                  </div>
                  <input
                    v-model="row.ipText"
                    class="input input-sm w-full font-mono"
                    :placeholder="t('apolloClientIpList')"
                  />
                  <label class="flex items-center gap-2 text-xs text-text-secondary">
                    <input type="checkbox" v-model="row.forceReleased" />
                    {{ t('apolloForceReleased') }}
                  </label>
                </div>
                <button class="btn btn-ghost btn-sm" @click="addGrayRuleRow">
                  <Plus class="w-4 h-4" />{{ t('apolloAddGrayRule') }}
                </button>
              </div>
              <button
                class="btn btn-primary btn-sm mt-2"
                :disabled="!branch"
                @click="saveGrayRules"
              >
                {{ t('save') }}
              </button>
            </div>
          </div>
        </div>

        <!-- Instances tab -->
        <div v-if="activeTab === 'instances'">
          <div v-if="loadingInstances" class="card p-8 text-center text-text-secondary">
            {{ t('loading') }}
          </div>
          <div v-else>
            <label class="flex items-center gap-2 text-xs text-text-secondary mb-2">
              <input type="checkbox" v-model="showOnlyGrayInstances" />
              {{ t('apolloOnlyGray') }}
              <span class="badge badge-info">{{ grayMatchedInstances.length }}</span>
            </label>
            <div class="card overflow-hidden">
              <table class="w-full text-sm">
                <thead class="bg-bg-secondary text-text-secondary">
                  <tr>
                    <th class="text-left px-4 py-2">{{ t('apolloIp') }}</th>
                    <th class="text-left px-4 py-2">{{ t('apolloDataCenter') }}</th>
                    <th class="text-left px-4 py-2">AppId</th>
                    <th class="text-left px-4 py-2">Cluster</th>
                    <th class="text-left px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="shownInstances.length === 0">
                    <td colspan="5" class="text-center py-8 text-text-secondary">
                      {{ t('noData') }}
                    </td>
                  </tr>
                  <tr v-for="inst in shownInstances" :key="inst.id" class="border-t border-border">
                    <td class="px-4 py-2 font-mono text-text-primary">
                      <button class="btn btn-ghost btn-xs" @click="openInstance(inst)">
                        <Eye class="w-3.5 h-3.5" />{{ inst.ip }}
                      </button>
                    </td>
                    <td class="px-4 py-2 text-text-secondary">{{ inst.dataCenter }}</td>
                    <td class="px-4 py-2 text-text-secondary">{{ inst.appId }}</td>
                    <td class="px-4 py-2 text-text-secondary">{{ inst.clusterName }}</td>
                    <td class="px-4 py-2">
                      <span
                        v-if="grayMatchedInstances.includes(inst)"
                        class="badge badge-warning"
                        >{{ t('apolloGrayInstance') }}</span
                      >
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Commit history tab -->
        <div v-if="activeTab === 'commits'">
          <div v-if="loadingCommits" class="card p-8 text-center text-text-secondary">
            {{ t('loading') }}
          </div>
          <div v-else class="space-y-3">
            <div v-for="c in commits" :key="c.id" class="card p-4">
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs text-text-tertiary">{{ c.dataChangeCreatedTime }}</span>
                <span class="text-xs text-text-secondary">{{ c.dataChangeCreatedBy }}</span>
              </div>
              <div v-if="c.changeSets && c.changeSets.length" class="space-y-1">
                <div
                  v-for="ch in c.changeSets"
                  :key="ch.key"
                  class="text-sm flex items-center gap-2"
                >
                  <span class="font-mono text-text-primary">{{ ch.key }}</span>
                  <span
                    class="text-xs font-medium"
                    :class="
                      ch.op === 2 ? 'text-danger' : ch.op === 0 ? 'text-success' : 'text-warning'
                    "
                    >{{ changeOpLabel(ch.op) }}</span
                  >
                  <span v-if="ch.op !== 2" class="text-xs text-text-secondary">
                    <span v-if="ch.op === 1" class="text-danger line-through mr-1">{{
                      ch.oldValue
                    }}</span
                    >→ {{ ch.newValue }}</span
                  >
                </div>
              </div>
              <div v-else class="text-xs text-text-tertiary">{{ t('apolloNoChanges') }}</div>
            </div>
            <div v-if="commits.length === 0" class="card p-8 text-center text-text-secondary">
              {{ t('noData') }}
            </div>
          </div>
        </div>

        <!-- Compare tab -->
        <div v-if="activeTab === 'compare'">
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

          <!-- Cross-namespace / env / cluster diff -->
          <div class="border-t border-border pt-4 mt-4">
            <h3 class="text-sm font-semibold mb-2 text-text-primary">
              {{ t('apolloCrossNsDiff') }}
            </h3>
            <div class="flex flex-wrap items-end gap-3 mb-3">
              <div>
                <label class="block text-xs mb-1">{{ t('apolloSyncTargetEnv') }}</label>
                <select v-model="diffTarget.env" class="input w-auto">
                  <option v-for="ec in envClusters" :key="ec.env" :value="ec.env">
                    {{ ec.env }}
                  </option>
                </select>
              </div>
              <div>
                <label class="block text-xs mb-1">{{ t('apolloSyncTargetCluster') }}</label>
                <select v-model="diffTarget.cluster" class="input w-auto">
                  <option
                    v-for="c in envClusters.find((e) => e.env === diffTarget.env)?.clusters || []"
                    :key="c"
                    :value="c"
                  >
                    {{ c }}
                  </option>
                </select>
              </div>
              <div>
                <label class="block text-xs mb-1">{{ t('apolloSyncTargetNamespace') }}</label>
                <input v-model="diffTarget.namespace" class="input w-auto" />
              </div>
              <button class="btn btn-primary btn-sm" :disabled="loadingDiffNs" @click="runNsDiff">
                <Search class="w-4 h-4" />{{ t('apolloCompare') }}
              </button>
            </div>
            <div v-if="diffError" class="text-danger text-sm mb-2">{{ diffError }}</div>
            <div v-if="loadingDiffNs" class="card p-8 text-center text-text-secondary">
              {{ t('loading') }}
            </div>
            <div v-else-if="diffResult" class="card overflow-hidden">
              <table class="w-full text-sm">
                <thead class="bg-bg-secondary text-text-secondary">
                  <tr>
                    <th class="text-left px-2 py-1">{{ t('apolloItemKey') }}</th>
                    <th class="text-left px-2 py-1">{{ t('apolloItemValue') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="x in diffResult.onlySource"
                    :key="'s' + x.key"
                    class="border-t border-border"
                  >
                    <td class="px-2 py-1 font-mono text-text-primary">{{ x.key }}</td>
                    <td class="px-2 py-1 text-text-secondary">{{ x.value }}</td>
                  </tr>
                  <tr
                    v-for="x in diffResult.onlyTarget"
                    :key="'t' + x.key"
                    class="border-t border-border"
                  >
                    <td class="px-2 py-1 font-mono text-text-primary">{{ x.key }}</td>
                    <td class="px-2 py-1 text-text-secondary">{{ x.value }}</td>
                  </tr>
                  <tr
                    v-for="x in diffResult.changed"
                    :key="'c' + x.key"
                    class="border-t border-border"
                  >
                    <td class="px-2 py-1 font-mono text-text-primary">{{ x.key }}</td>
                    <td class="px-2 py-1 text-warning">{{ x.source }} → {{ x.target }}</td>
                  </tr>
                  <tr
                    v-if="
                      diffResult.onlySource.length === 0 &&
                      diffResult.onlyTarget.length === 0 &&
                      diffResult.changed.length === 0
                    "
                  >
                    <td colspan="2" class="text-center py-6 text-text-tertiary">
                      {{ t('noData') }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Namespace modal -->
    <FormModal
      v-model="showCreateNs"
      :title="t('apolloCreateNamespace')"
      :submit-text="t('create')"
      @submit="createNamespace"
    >
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
    </FormModal>

    <!-- Associate public namespace modal -->
    <FormModal
      v-model="showAssociateNs"
      :title="t('apolloAssociateNs')"
      :submit-text="t('apolloAssociate')"
      @submit="associatePublicNamespace"
    >
      <div class="space-y-3">
        <div>
          <label class="block text-xs mb-1">{{ t('apolloSourceApp') }}</label>
          <input v-model="associateForm.publicAppId" class="input w-full" placeholder="apollo" />
        </div>
        <div>
          <label class="block text-xs mb-1">{{ t('apolloSourceNamespace') }}</label>
          <input
            v-model="associateForm.publicNamespace"
            class="input w-full"
            placeholder="application"
          />
        </div>
      </div>
    </FormModal>

    <!-- App Namespaces modal -->
    <FormModal v-model="showAppNs" :title="t('apolloAppNamespaces')" hide-footer>
      <div class="space-y-4">
        <div class="flex justify-end">
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
    </FormModal>

    <!-- Item modal -->
    <FormModal
      v-model="showItemModal"
      :title="editingKey ? t('edit') : t('apolloAddItem')"
      :submit-text="t('save')"
      :loading="savingItem"
      @submit="saveItem"
    >
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
    </FormModal>

    <!-- Release modal -->
    <FormModal
      v-model="showReleaseModal"
      :title="t('apolloPublish')"
      :submit-text="t('apolloPublish')"
      @submit="publish"
    >
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
    </FormModal>

    <!-- App permission (Master) modal -->
    <FormModal v-model="showAppRole" :title="t('apolloAppPermission')" hide-footer>
      <ApolloRoleAssign
        :app-id="appId"
        :roles="[{ roleType: 'Master', label: t('apolloAppAdmin') }]"
      />
    </FormModal>

    <!-- Namespace permission modal -->
    <FormModal
      v-model="showNsRole"
      :title="`${t('apolloNamespacePermission')} · ${namespace}`"
      size="2xl"
      hide-footer
    >
      <ApolloRoleAssign
        :app-id="appId"
        :env="env"
        :namespace="namespace"
        :roles="[
          { roleType: 'ModifyNamespace', label: t('apolloModifyPermission') },
          { roleType: 'ReleaseNamespace', label: t('apolloReleasePermission') },
        ]"
      />
    </FormModal>

    <!-- Config sync modal -->
    <FormModal
      v-model="showSync"
      :title="t('apolloSync')"
      :submit-text="t('apolloSync')"
      :loading="savingSync"
      size="2xl"
      @submit="runSync"
    >
      <div class="space-y-3">
        <div class="flex gap-3">
          <div class="flex-1">
            <label class="block text-xs mb-1">{{ t('apolloSyncTargetEnv') }}</label>
            <select v-model="syncTarget.env" class="input">
              <option v-for="ec in envClusters" :key="ec.env" :value="ec.env">
                {{ ec.env }}
              </option>
            </select>
          </div>
          <div class="flex-1">
            <label class="block text-xs mb-1">{{ t('apolloSyncTargetCluster') }}</label>
            <select v-model="syncTarget.cluster" class="input">
              <option
                v-for="c in envClusters.find((e) => e.env === syncTarget.env)?.clusters || []"
                :key="c"
                :value="c"
              >
                {{ c }}
              </option>
            </select>
          </div>
          <div class="flex-1">
            <label class="block text-xs mb-1">{{ t('apolloSyncTargetNamespace') }}</label>
            <input v-model="syncTarget.namespace" class="input" />
          </div>
        </div>
        <div>
          <label class="block text-xs mb-1">{{ t('apolloSyncSelectItems') }}</label>
          <div class="card overflow-hidden max-h-64 overflow-auto">
            <table class="w-full text-sm">
              <tbody>
                <tr v-for="i in items" :key="i.key" class="border-t border-border">
                  <td class="px-2 py-1 w-8">
                    <input type="checkbox" :value="i.key" v-model="syncSelected" />
                  </td>
                  <td class="px-2 py-1 font-mono text-text-primary">{{ i.key }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </FormModal>

    <!-- Gray item modal -->
    <FormModal
      v-model="showGrayItemModal"
      :title="t('apolloAddItem')"
      :submit-text="t('save')"
      :submit-disabled="!grayItemForm.key"
      @submit="saveGrayItemNew"
    >
      <div class="space-y-3">
        <div>
          <label class="block text-xs mb-1">{{ t('apolloItemKey') }} *</label
          ><input v-model="grayItemForm.key" class="input" :placeholder="'key.name'" />
        </div>
        <div>
          <label class="block text-xs mb-1">{{ t('apolloItemValue') }}</label
          ><textarea
            v-model="grayItemForm.value"
            rows="4"
            class="input font-mono"
            :placeholder="'value'"
          ></textarea>
        </div>
        <div>
          <label class="block text-xs mb-1">{{ t('apolloComment') }}</label
          ><input v-model="grayItemForm.comment" class="input" :placeholder="'comment'" />
        </div>
      </div>
    </FormModal>

    <!-- Instance config modal -->
    <FormModal
      v-model="showInstanceModal"
      :title="`${t('apolloInstanceConfigs')} · ${instanceIp}`"
      size="2xl"
      hide-footer
    >
      <div v-if="loadingInstanceCfg" class="card p-8 text-center text-text-secondary">
        {{ t('loading') }}
      </div>
      <div
        v-else-if="!instanceConfigs || Object.keys(instanceConfigs).length === 0"
        class="card p-8 text-center text-text-secondary"
      >
        {{ t('noData') }}
      </div>
      <div v-else class="card overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-bg-secondary text-text-secondary">
            <tr>
              <th class="text-left px-3 py-2">{{ t('apolloItemKey') }}</th>
              <th class="text-left px-3 py-2">{{ t('apolloItemValue') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(v, k) in instanceConfigs" :key="k" class="border-t border-border">
              <td class="px-3 py-2 font-mono text-text-primary">{{ k }}</td>
              <td class="px-3 py-2 text-text-primary max-w-md truncate">{{ v }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </FormModal>

    <!-- App edit modal -->
    <FormModal
      v-model="showAppEdit"
      :title="t('apolloEditApp')"
      :submit-text="t('save')"
      @submit="saveApp"
    >
      <div class="space-y-3">
        <div>
          <label class="block text-xs mb-1">{{ t('apolloAppName') }}</label
          ><input v-model="appEditForm.name" class="input" />
        </div>
        <div>
          <label class="block text-xs mb-1">{{ t('apolloOwnerName') }}</label
          ><input v-model="appEditForm.ownerName" class="input" />
        </div>
        <div>
          <label class="block text-xs mb-1">{{ t('apolloOwnerEmail') }}</label
          ><input v-model="appEditForm.ownerEmail" class="input" />
        </div>
        <div>
          <label class="block text-xs mb-1">{{ t('apolloOrgId') }}</label
          ><input v-model="appEditForm.orgId" class="input" />
        </div>
        <div>
          <label class="block text-xs mb-1">{{ t('apolloOrgName') }}</label
          ><input v-model="appEditForm.orgName" class="input" />
        </div>
      </div>
    </FormModal>
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
