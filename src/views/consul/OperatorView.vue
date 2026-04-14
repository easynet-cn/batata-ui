<template>
  <div class="space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-base font-semibold text-text-primary">{{ t('consulOperator') }}</h1>
        <p class="text-xs text-text-secondary mt-0.5">{{ t('consulOperatorDesc') }}</p>
      </div>
      <div class="flex items-center gap-2">
        <button
          @click="handleReloadAgent"
          class="btn btn-secondary btn-sm"
          :disabled="reloading"
          :title="t('consulReloadAgentDesc')"
        >
          <RotateCcw class="w-3.5 h-3.5" :class="{ 'animate-spin': reloading }" />
          {{ t('consulReloadAgent') }}
        </button>
        <button @click="loadData" class="btn btn-secondary btn-sm" :disabled="loading">
          <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': loading }" />
          {{ t('refresh') }}
        </button>
      </div>
    </div>

    <!-- Raft Configuration -->
    <div class="card">
      <div class="px-6 py-4 border-b border-border">
        <h3 class="text-sm font-semibold text-text-primary">
          {{ t('consulRaftConfiguration') }}
        </h3>
      </div>
      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>{{ t('node') }}</th>
              <th>ID</th>
              <th>{{ t('address') }}</th>
              <th>{{ t('consulRaftLeader') }}</th>
              <th>{{ t('consulRaftVoter') }}</th>
              <th>{{ t('protocol') }}</th>
              <th>{{ t('lastIndex') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading && !raftConfig">
              <td colspan="7" class="text-center py-6">
                <Loader2 class="w-5 h-5 animate-spin mx-auto text-primary" />
              </td>
            </tr>
            <tr v-else-if="!raftConfig?.Servers?.length">
              <td colspan="7" class="text-center py-6 text-text-secondary">
                <Wrench class="w-6 h-6 mx-auto mb-2 opacity-50" />
                <p>{{ t('noData') }}</p>
              </td>
            </tr>
            <tr
              v-for="server in raftConfig?.Servers || []"
              :key="server.ID"
              class="hover:bg-bg-secondary"
            >
              <td class="font-medium text-text-primary">{{ server.Node }}</td>
              <td class="text-text-secondary font-mono text-xs">
                {{ server.ID.substring(0, 8) }}...
              </td>
              <td class="text-text-secondary font-mono text-xs">{{ server.Address }}</td>
              <td>
                <span
                  v-if="server.Leader"
                  class="badge bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                >
                  {{ t('consulRaftLeader') }}
                </span>
                <span v-else class="text-xs text-text-tertiary">-</span>
              </td>
              <td>
                <span
                  v-if="server.Voter"
                  class="badge bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
                >
                  {{ t('consulRaftVoter') }}
                </span>
                <span v-else class="text-xs text-text-tertiary">-</span>
              </td>
              <td class="text-text-secondary text-xs">{{ server.ProtocolVersion }}</td>
              <td class="text-text-secondary font-mono text-xs">{{ server.LastIndex }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Cluster Usage -->
    <div class="card">
      <div class="px-6 py-4 border-b border-border">
        <h3 class="text-sm font-semibold text-text-primary">{{ t('consulClusterUsage') }}</h3>
      </div>
      <div class="p-6">
        <div
          v-if="!operatorUsage?.Usage || Object.keys(operatorUsage.Usage).length === 0"
          class="text-center py-6 text-text-tertiary"
        >
          <Wrench class="w-6 h-6 mx-auto mb-2 opacity-50" />
          <p class="text-xs">{{ t('noData') }}</p>
        </div>
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="(usage, dc) in operatorUsage.Usage"
            :key="dc"
            class="p-4 rounded-xl border border-border"
          >
            <h4 class="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3">
              {{ dc }}
            </h4>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <p class="text-xs text-text-tertiary">{{ t('nodes') }}</p>
                <p class="text-lg font-extrabold text-text-primary">{{ usage.Nodes }}</p>
              </div>
              <div>
                <p class="text-xs text-text-tertiary">{{ t('services') }}</p>
                <p class="text-lg font-extrabold text-text-primary">{{ usage.Services }}</p>
              </div>
              <div>
                <p class="text-xs text-text-tertiary">{{ t('instances') }}</p>
                <p class="text-lg font-extrabold text-text-primary">
                  {{ usage.ServiceInstances }}
                </p>
              </div>
              <div>
                <p class="text-xs text-text-tertiary">Connect</p>
                <p class="text-lg font-extrabold text-text-primary">
                  {{ usage.ConnectServiceInstances }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Autopilot Health -->
    <div class="card">
      <div class="px-6 py-4 border-b border-border flex items-center justify-between">
        <h3 class="text-sm font-semibold text-text-primary">{{ t('consulAutopilot') }}</h3>
        <span
          v-if="autopilotHealth"
          :class="autopilotHealth.Healthy ? 'badge badge-success' : 'badge badge-danger'"
        >
          {{ autopilotHealth.Healthy ? t('consulAutopilotHealthy') : t('consulCritical') }}
        </span>
      </div>
      <div v-if="autopilotHealth" class="p-6">
        <div class="mb-4 text-xs text-text-secondary">
          {{ t('consulAutopilotDesc') }}
          <span class="ml-2 font-medium text-text-primary">
            Failure Tolerance: {{ autopilotHealth.FailureTolerance }}
          </span>
        </div>
        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>{{ t('node') }}</th>
                <th>{{ t('address') }}</th>
                <th>Version</th>
                <th>{{ t('consulAutopilotHealthy') }}</th>
                <th>{{ t('consulRaftLeader') }}</th>
                <th>{{ t('consulRaftVoter') }}</th>
                <th>Stable Since</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="server in autopilotHealth.Servers || []"
                :key="server.ID"
                class="hover:bg-bg-secondary"
              >
                <td class="font-medium text-text-primary">{{ server.Name }}</td>
                <td class="font-mono text-xs text-text-secondary">{{ server.Address }}</td>
                <td class="text-text-secondary text-xs">{{ server.Version }}</td>
                <td>
                  <span :class="server.Healthy ? 'badge badge-success' : 'badge badge-danger'">
                    {{ server.Healthy ? t('yes') : t('no') }}
                  </span>
                </td>
                <td>
                  <span
                    v-if="server.Leader"
                    class="badge bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                  >
                    {{ t('consulRaftLeader') }}
                  </span>
                  <span v-else class="text-xs text-text-tertiary">-</span>
                </td>
                <td>
                  <span
                    v-if="server.Voter"
                    class="badge bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
                  >
                    {{ t('consulRaftVoter') }}
                  </span>
                  <span v-else class="text-xs text-text-tertiary">-</span>
                </td>
                <td class="text-text-secondary text-xs">
                  {{ server.StableSince ? new Date(server.StableSince).toLocaleString() : '-' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div v-else class="p-6 text-center text-text-tertiary text-xs">
        {{ t('noData') }}
      </div>
    </div>

    <!-- Leadership Transfer -->
    <div class="card">
      <div class="px-6 py-4 border-b border-border">
        <h3 class="text-sm font-semibold text-text-primary">{{ t('consulTransferLeader') }}</h3>
      </div>
      <div class="p-6">
        <p class="text-xs text-text-secondary mb-3">{{ t('consulTransferLeaderDesc') }}</p>
        <div class="flex items-center gap-3">
          <select v-model="transferTargetId" class="input w-64 text-xs">
            <option value="">{{ t('consulTransferTarget') }}</option>
            <option v-for="server in nonLeaderServers" :key="server.ID" :value="server.ID">
              {{ server.Node }} ({{ server.Address }})
            </option>
          </select>
          <button
            @click="handleTransferLeader"
            class="btn btn-primary btn-sm"
            :disabled="transferring"
          >
            {{ t('consulTransferLeader') }}
          </button>
        </div>
      </div>
    </div>

    <!-- LAN Cluster Members -->
    <div class="card">
      <div class="px-6 py-4 border-b border-border flex items-center justify-between">
        <h3 class="text-sm font-semibold text-text-primary">{{ t('consulLanMembers') }}</h3>
        <span class="text-xs text-text-tertiary">{{ lanMembers.length }} {{ t('nodes') }}</span>
      </div>
      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>{{ t('name') }}</th>
              <th>{{ t('address') }}</th>
              <th>{{ t('state') }}</th>
              <th>{{ t('consulSerfTags') }}</th>
              <th class="text-right">{{ t('actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!lanMembers.length && !loading">
              <td colspan="5" class="text-center py-6 text-text-tertiary text-xs">
                {{ t('noData') }}
              </td>
            </tr>
            <tr v-for="m in lanMembers" :key="m.Name" class="hover:bg-bg-secondary">
              <td class="font-medium text-text-primary">{{ m.Name }}</td>
              <td class="font-mono text-xs text-text-secondary">{{ m.Addr }}:{{ m.Port }}</td>
              <td>
                <span :class="memberStatusClass(m.Status)">
                  {{ memberStatusLabel(m.Status) }}
                </span>
              </td>
              <td>
                <span
                  v-if="m.Tags?.role"
                  class="badge bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 mr-1"
                >
                  {{ m.Tags.role }}
                </span>
                <span v-if="m.Tags?.dc" class="text-xs text-text-tertiary">dc={{ m.Tags.dc }}</span>
              </td>
              <td class="text-right">
                <button
                  v-if="m.Status === 3 || m.Status === 4"
                  class="btn btn-ghost btn-sm text-red-600 hover:text-red-700"
                  @click="openForceLeave(m.Name)"
                  :title="t('consulForceLeaveDesc')"
                >
                  <LogOut class="w-3.5 h-3.5" />
                  {{ t('consulForceLeave') }}
                </button>
                <span v-else class="text-xs text-text-tertiary">-</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- WAN Federation -->
    <div class="card">
      <div class="px-6 py-4 border-b border-border flex items-center justify-between">
        <h3 class="text-sm font-semibold text-text-primary">{{ t('consulWanFederation') }}</h3>
        <span class="text-xs text-text-tertiary"
          >{{ datacenters.length }} {{ t('consulDatacenters') }}</span
        >
      </div>
      <div class="p-6 space-y-4">
        <div v-if="datacenters.length > 0">
          <div class="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
            {{ t('consulKnownDatacenters') }}
          </div>
          <div class="flex flex-wrap gap-1.5">
            <span v-for="dc in datacenters" :key="dc" class="badge badge-info">{{ dc }}</span>
          </div>
        </div>
        <div>
          <div class="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
            {{ t('consulWanMembers') }}
          </div>
          <div v-if="!wanMembers.length" class="text-xs text-text-tertiary py-3 text-center">
            {{ t('consulWanMembersEmpty') }}
          </div>
          <div v-else class="overflow-x-auto">
            <table class="table">
              <thead>
                <tr>
                  <th>{{ t('name') }}</th>
                  <th>{{ t('address') }}</th>
                  <th>{{ t('consulDatacenter') }}</th>
                  <th>{{ t('state') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="m in wanMembers" :key="m.Name" class="hover:bg-bg-secondary">
                  <td class="font-medium text-text-primary">{{ m.Name }}</td>
                  <td class="font-mono text-xs text-text-secondary">{{ m.Addr }}:{{ m.Port }}</td>
                  <td>
                    <span class="badge badge-info">{{ m.Tags?.dc || '-' }}</span>
                  </td>
                  <td>
                    <span :class="memberStatusClass(m.Status)">
                      {{ memberStatusLabel(m.Status) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Force Leave Confirmation -->
    <div
      v-if="forceLeaveNode"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      @click.self="forceLeaveNode = null"
    >
      <div
        class="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md mx-4 border dark:border-gray-800"
      >
        <div class="p-6 border-b border-border">
          <h3 class="text-base font-semibold text-text-primary">{{ t('consulForceLeave') }}</h3>
        </div>
        <div class="p-6">
          <p class="text-sm text-text-primary mb-2">{{ t('consulForceLeaveConfirm') }}</p>
          <p class="font-mono text-xs text-text-secondary">{{ forceLeaveNode }}</p>
          <p class="mt-2 text-xs text-amber-600">{{ t('consulForceLeaveWarning') }}</p>
        </div>
        <div class="p-4 bg-bg-secondary rounded-b-3xl flex justify-end gap-2">
          <button class="btn btn-secondary btn-sm" @click="forceLeaveNode = null">
            {{ t('cancel') }}
          </button>
          <button
            class="btn btn-primary btn-sm"
            :disabled="forceLeaving"
            @click="confirmForceLeave"
          >
            <Loader2 v-if="forceLeaving" class="w-3.5 h-3.5 animate-spin" />
            {{ t('confirm') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Snapshot Actions -->
    <div class="card">
      <div class="px-6 py-4 border-b border-border">
        <h3 class="text-sm font-semibold text-text-primary">{{ t('consulDownloadSnapshot') }}</h3>
      </div>
      <div class="p-6">
        <button
          @click="handleDownloadSnapshot"
          class="btn btn-primary btn-sm"
          :disabled="downloading"
        >
          <Download class="w-3.5 h-3.5" />
          {{ t('consulDownloadSnapshot') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RefreshCw, RotateCcw, Wrench, Loader2, Download, LogOut } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import consulApi from '@/api/consul'
import { toast } from '@/utils/error'
import { logger } from '@/utils/logger'
import type {
  ConsulRaftConfiguration,
  ConsulOperatorUsage,
  ConsulAgentMember,
} from '@/types/consul'

const { t } = useI18n()

// State
const loading = ref(false)
const downloading = ref(false)
const transferring = ref(false)
const reloading = ref(false)
const forceLeaving = ref(false)
const forceLeaveNode = ref<string | null>(null)
const transferTargetId = ref('')
const raftConfig = ref<ConsulRaftConfiguration | null>(null)
const operatorUsage = ref<ConsulOperatorUsage | null>(null)
const lanMembers = ref<ConsulAgentMember[]>([])
const wanMembers = ref<ConsulAgentMember[]>([])
const datacenters = ref<string[]>([])
const autopilotHealth = ref<{
  Healthy: boolean
  FailureTolerance: number
  Servers: Array<{
    ID: string
    Name: string
    Address: string
    SerfStatus: string
    Version: string
    Leader: boolean
    Voter: boolean
    LastContact: string
    LastTerm: number
    LastIndex: number
    Healthy: boolean
    StableSince: string
  }>
} | null>(null)

// Computed
const nonLeaderServers = computed(() => {
  if (!raftConfig.value?.Servers) return []
  return raftConfig.value.Servers.filter((s) => !s.Leader)
})

// Actions
async function loadData() {
  loading.value = true
  try {
    const [raftRes, usageRes, autopilotRes, lanRes, wanRes, dcRes] = await Promise.allSettled([
      consulApi.getRaftConfiguration(),
      consulApi.getOperatorUsage(),
      consulApi.getAutopilotHealth(),
      consulApi.getAgentMembers(false),
      consulApi.getAgentMembers(true),
      consulApi.getDatacenters(),
    ])
    if (raftRes.status === 'fulfilled') {
      raftConfig.value = raftRes.value.data
    }
    if (usageRes.status === 'fulfilled') {
      operatorUsage.value = usageRes.value.data
    }
    if (autopilotRes.status === 'fulfilled') {
      autopilotHealth.value = autopilotRes.value.data
    }
    if (lanRes.status === 'fulfilled') {
      lanMembers.value = lanRes.value.data || []
    }
    if (wanRes.status === 'fulfilled') {
      wanMembers.value = wanRes.value.data || []
    }
    if (dcRes.status === 'fulfilled') {
      datacenters.value = dcRes.value.data || []
    }
  } catch (error) {
    logger.error('Failed to fetch operator data:', error)
    toast.apiError(error)
  } finally {
    loading.value = false
  }
}

function memberStatusLabel(status: number): string {
  switch (status) {
    case 1:
      return 'alive'
    case 2:
      return 'leaving'
    case 3:
      return 'left'
    case 4:
      return 'failed'
    default:
      return 'unknown'
  }
}

function memberStatusClass(status: number): string {
  switch (status) {
    case 1:
      return 'badge badge-success'
    case 2:
      return 'badge badge-warning'
    case 3:
      return 'badge'
    case 4:
      return 'badge badge-danger'
    default:
      return 'badge'
  }
}

function openForceLeave(name: string) {
  forceLeaveNode.value = name
}

async function confirmForceLeave() {
  if (!forceLeaveNode.value) return
  forceLeaving.value = true
  try {
    await consulApi.forceLeaveNode(forceLeaveNode.value)
    toast.success(t('success'))
    forceLeaveNode.value = null
    await loadData()
  } catch (error) {
    logger.error('Failed to force-leave node:', error)
    toast.apiError(error)
  } finally {
    forceLeaving.value = false
  }
}

async function handleReloadAgent() {
  reloading.value = true
  try {
    await consulApi.reloadAgent()
    toast.success(t('consulReloadAgentSuccess'))
  } catch (error) {
    logger.error('Failed to reload agent:', error)
    toast.apiError(error)
  } finally {
    reloading.value = false
  }
}

async function handleTransferLeader() {
  transferring.value = true
  try {
    await consulApi.transferLeader(transferTargetId.value || undefined)
    toast.success(t('success'))
    transferTargetId.value = ''
    await loadData()
  } catch (error) {
    logger.error('Failed to transfer leader:', error)
    toast.apiError(error)
  } finally {
    transferring.value = false
  }
}

async function handleDownloadSnapshot() {
  downloading.value = true
  try {
    const response = await consulApi.downloadSnapshot()
    const blob = new Blob([response.data], { type: 'application/octet-stream' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `consul-snapshot-${Date.now()}.snap`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    toast.success(t('success'))
  } catch (error) {
    logger.error('Failed to download snapshot:', error)
    toast.apiError(error)
  } finally {
    downloading.value = false
  }
}

// Lifecycle
onMounted(() => {
  loadData()
})
</script>
