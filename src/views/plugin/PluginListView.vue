<template>
  <div class="space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-base font-semibold text-text-primary">{{ t('plugins') }}</h1>
        <p class="text-xs text-text-secondary mt-0.5">{{ t('pluginsDesc') }}</p>
      </div>
      <button @click="handleRefresh" class="btn btn-secondary btn-sm">
        <RotateCcw class="w-3.5 h-3.5" :class="{ 'animate-spin': loading }" />
        {{ t('refresh') }}
      </button>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
      <div class="card p-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
            <Puzzle class="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p class="text-xs text-text-tertiary">{{ t('totalPlugins') }}</p>
            <p class="text-lg font-semibold text-text-primary">{{ plugins.length }}</p>
          </div>
        </div>
      </div>
      <div class="card p-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
            <CheckCircle class="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p class="text-xs text-text-tertiary">{{ t('enabledPlugins') }}</p>
            <p class="text-lg font-semibold text-emerald-600">{{ enabledCount }}</p>
          </div>
        </div>
      </div>
      <div class="card p-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center">
            <Circle class="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <p class="text-xs text-text-tertiary">{{ t('disabledPlugins') }}</p>
            <p class="text-lg font-semibold text-text-secondary">{{ disabledCount }}</p>
          </div>
        </div>
      </div>
      <div class="card p-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
            <AlertTriangle class="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p class="text-xs text-text-tertiary">{{ t('errorPlugins') }}</p>
            <p class="text-lg font-semibold text-amber-600">{{ errorCount }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Search Bar -->
    <div class="card">
      <div class="p-3">
        <div class="flex items-center gap-3">
          <div class="flex-1">
            <input
              v-model="searchKeyword"
              type="text"
              class="input"
              :placeholder="t('searchPlugin')"
              @keyup.enter="handleSearch"
            />
          </div>
          <select v-model="filterType" class="input w-40">
            <option value="">{{ t('allTypes') }}</option>
            <option value="config">{{ t('pluginTypeConfig') }}</option>
            <option value="auth">{{ t('pluginTypeAuth') }}</option>
            <option value="naming">{{ t('pluginTypeNaming') }}</option>
            <option value="datasource">{{ t('pluginTypeDatasource') }}</option>
            <option value="other">{{ t('pluginTypeOther') }}</option>
          </select>
          <select v-model="filterStatus" class="input w-32">
            <option value="">{{ t('allStatus') }}</option>
            <option value="enabled">{{ t('enabled') }}</option>
            <option value="disabled">{{ t('disabled') }}</option>
            <option value="error">{{ t('error') }}</option>
          </select>
          <button @click="handleSearch" class="btn btn-primary">
            <Search class="w-3.5 h-3.5" />
            {{ t('search') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Plugin List -->
    <div class="card">
      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>{{ t('pluginName') }}</th>
              <th>{{ t('pluginType') }}</th>
              <th>{{ t('version') }}</th>
              <th>{{ t('status') }}</th>
              <th>{{ t('description') }}</th>
              <th class="w-36">{{ t('actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="6" class="text-center py-6">
                <Loader2 class="w-5 h-5 animate-spin mx-auto text-primary" />
              </td>
            </tr>
            <tr v-else-if="filteredPlugins.length === 0">
              <td colspan="6" class="text-center py-6 text-text-secondary">
                {{ t('noData') }}
              </td>
            </tr>
            <tr v-for="plugin in filteredPlugins" :key="plugin.name" class="hover:bg-bg-secondary">
              <td>
                <div class="flex items-center gap-2">
                  <div
                    class="w-8 h-8 rounded-lg flex items-center justify-center"
                    :class="getPluginIconClass(plugin.type)"
                  >
                    <component :is="getPluginIcon(plugin.type)" class="w-4 h-4" />
                  </div>
                  <div>
                    <p class="font-medium text-text-primary">{{ plugin.name }}</p>
                    <p class="text-xs text-text-tertiary">{{ plugin.author || 'Nacos Team' }}</p>
                  </div>
                </div>
              </td>
              <td>
                <span class="badge" :class="getTypeClass(plugin.type)">
                  {{ getPluginTypeLabel(plugin.type) }}
                </span>
              </td>
              <td class="font-mono text-sm text-text-secondary">{{ plugin.version }}</td>
              <td>
                <span :class="getStatusClass(plugin.status)">
                  {{ t(plugin.status) }}
                </span>
              </td>
              <td class="text-text-secondary text-sm max-w-xs truncate">
                {{ plugin.description || '-' }}
              </td>
              <td>
                <div class="flex items-center gap-1">
                  <button
                    @click="viewPluginDetail(plugin)"
                    class="btn btn-ghost btn-sm"
                    :title="t('view')"
                  >
                    <Eye class="w-3.5 h-3.5" />
                  </button>
                  <button
                    v-if="plugin.status === 'disabled'"
                    @click="togglePlugin(plugin, true)"
                    class="btn btn-ghost btn-sm text-emerald-600"
                    :title="t('enable')"
                  >
                    <Power class="w-3.5 h-3.5" />
                  </button>
                  <button
                    v-else-if="plugin.status === 'enabled'"
                    @click="togglePlugin(plugin, false)"
                    class="btn btn-ghost btn-sm text-slate-500"
                    :title="t('disable')"
                  >
                    <PowerOff class="w-3.5 h-3.5" />
                  </button>
                  <button
                    v-if="plugin.configurable"
                    @click="configurePlugin(plugin)"
                    class="btn btn-ghost btn-sm"
                    :title="t('configure')"
                  >
                    <Settings class="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Plugin Detail Modal -->
    <div v-if="showDetailModal" class="modal-backdrop" @click="showDetailModal = false">
      <div class="modal max-w-2xl" @click.stop>
        <div class="modal-header">
          <h3 class="text-sm font-semibold text-text-primary">{{ t('pluginDetail') }}</h3>
          <button @click="showDetailModal = false" class="btn btn-ghost btn-sm">
            <X class="w-3.5 h-3.5" />
          </button>
        </div>
        <div class="modal-body space-y-4" v-if="selectedPlugin">
          <div class="flex items-center gap-4">
            <div
              class="w-16 h-16 rounded-xl flex items-center justify-center"
              :class="getPluginIconClass(selectedPlugin.type)"
            >
              <component :is="getPluginIcon(selectedPlugin.type)" class="w-8 h-8" />
            </div>
            <div>
              <h4 class="text-lg font-semibold text-text-primary">{{ selectedPlugin.name }}</h4>
              <p class="text-sm text-text-secondary">{{ selectedPlugin.author || 'Nacos Team' }}</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs text-text-tertiary mb-1">{{ t('version') }}</label>
              <p class="font-mono text-text-primary">{{ selectedPlugin.version }}</p>
            </div>
            <div>
              <label class="block text-xs text-text-tertiary mb-1">{{ t('pluginType') }}</label>
              <span class="badge" :class="getTypeClass(selectedPlugin.type)">
                {{ getPluginTypeLabel(selectedPlugin.type) }}
              </span>
            </div>
            <div>
              <label class="block text-xs text-text-tertiary mb-1">{{ t('status') }}</label>
              <span :class="getStatusClass(selectedPlugin.status)">
                {{ t(selectedPlugin.status) }}
              </span>
            </div>
            <div>
              <label class="block text-xs text-text-tertiary mb-1">{{ t('loadOrder') }}</label>
              <p class="text-text-primary">{{ selectedPlugin.order || 0 }}</p>
            </div>
          </div>

          <div>
            <label class="block text-xs text-text-tertiary mb-1">{{ t('description') }}</label>
            <p class="text-text-secondary">
              {{ selectedPlugin.description || t('noDescription') }}
            </p>
          </div>

          <div v-if="selectedPlugin.dependencies?.length">
            <label class="block text-xs text-text-tertiary mb-1">{{ t('dependencies') }}</label>
            <div class="flex flex-wrap gap-1">
              <span
                v-for="dep in selectedPlugin.dependencies"
                :key="dep"
                class="badge badge-secondary"
              >
                {{ dep }}
              </span>
            </div>
          </div>

          <div v-if="selectedPlugin.config">
            <label class="block text-xs text-text-tertiary mb-1">{{ t('pluginConfig') }}</label>
            <pre class="bg-bg-tertiary rounded-lg p-4 overflow-x-auto text-sm font-mono">{{
              JSON.stringify(selectedPlugin.config, null, 2)
            }}</pre>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showDetailModal = false" class="btn btn-secondary">
            {{ t('close') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Configure Plugin Modal -->
    <div v-if="showConfigModal" class="modal-backdrop" @click="showConfigModal = false">
      <div class="modal max-w-2xl" @click.stop>
        <div class="modal-header">
          <h3 class="text-sm font-semibold text-text-primary">{{ t('configurePlugin') }}</h3>
          <button @click="showConfigModal = false" class="btn btn-ghost btn-sm">
            <X class="w-3.5 h-3.5" />
          </button>
        </div>
        <div class="modal-body space-y-3" v-if="selectedPlugin">
          <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
            <Puzzle class="w-5 h-5 text-slate-500" />
            <div>
              <p class="font-medium text-text-primary">{{ selectedPlugin.name }}</p>
              <p class="text-xs text-text-tertiary">{{ selectedPlugin.version }}</p>
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-text-primary mb-1">
              {{ t('pluginConfig') }}
            </label>
            <textarea
              v-model="configJson"
              class="input font-mono text-sm min-h-[200px]"
              :placeholder="t('pluginConfigPlaceholder')"
            />
            <p class="text-xs text-text-tertiary mt-1">{{ t('pluginConfigHint') }}</p>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showConfigModal = false" class="btn btn-secondary">
            {{ t('cancel') }}
          </button>
          <button @click="savePluginConfig" class="btn btn-primary" :disabled="saving">
            <Loader2 v-if="saving" class="w-3.5 h-3.5 animate-spin" />
            {{ t('save') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  Search,
  RotateCcw,
  Loader2,
  Eye,
  Power,
  PowerOff,
  Settings,
  X,
  Puzzle,
  CheckCircle,
  Circle,
  AlertTriangle,
  Database,
  Shield,
  FileText,
  Server,
  Box,
} from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import nacosApi from '@/api/nacos'
import { toast } from '@/utils/error'
import type { PluginInfo, Namespace } from '@/types'

defineProps<{
  namespace: Namespace
}>()

const { t } = useI18n()

// State
const loading = ref(false)
const saving = ref(false)
const plugins = ref<PluginInfo[]>([])
const searchKeyword = ref('')
const filterType = ref('')
const filterStatus = ref('')

// Modals
const showDetailModal = ref(false)
const showConfigModal = ref(false)
const selectedPlugin = ref<PluginInfo | null>(null)
const configJson = ref('')

// Computed
const filteredPlugins = computed(() => {
  return plugins.value.filter((plugin) => {
    const matchesSearch =
      !searchKeyword.value ||
      plugin.name.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      plugin.description?.toLowerCase().includes(searchKeyword.value.toLowerCase())
    const matchesType = !filterType.value || plugin.type === filterType.value
    const matchesStatus = !filterStatus.value || plugin.status === filterStatus.value
    return matchesSearch && matchesType && matchesStatus
  })
})

const enabledCount = computed(() => plugins.value.filter((p) => p.status === 'enabled').length)
const disabledCount = computed(() => plugins.value.filter((p) => p.status === 'disabled').length)
const errorCount = computed(() => plugins.value.filter((p) => p.status === 'error').length)

// Methods
const fetchPlugins = async () => {
  loading.value = true
  try {
    const response = await nacosApi.getPluginList()
    plugins.value = response.data.data || []
  } catch (error) {
    console.error('Failed to fetch plugins:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  // Filtering is done in computed, just trigger reactivity
}

const handleRefresh = () => {
  fetchPlugins()
}

const viewPluginDetail = (plugin: PluginInfo) => {
  selectedPlugin.value = plugin
  showDetailModal.value = true
}

const togglePlugin = async (plugin: PluginInfo, enable: boolean) => {
  try {
    await nacosApi.updatePluginStatus(plugin.name, enable)
    plugin.status = enable ? 'enabled' : 'disabled'
    toast.success(enable ? t('pluginEnabled') : t('pluginDisabled'))
  } catch (error) {
    console.error('Failed to toggle plugin:', error)
    toast.error(t('operationFailed'))
  }
}

const configurePlugin = (plugin: PluginInfo) => {
  selectedPlugin.value = plugin
  configJson.value = plugin.config ? JSON.stringify(plugin.config, null, 2) : '{}'
  showConfigModal.value = true
}

const savePluginConfig = async () => {
  if (!selectedPlugin.value) return

  try {
    JSON.parse(configJson.value)
  } catch {
    toast.warning(t('invalidJson'))
    return
  }

  saving.value = true
  try {
    await nacosApi.updatePluginConfig(selectedPlugin.value.name, JSON.parse(configJson.value))
    selectedPlugin.value.config = JSON.parse(configJson.value)
    showConfigModal.value = false
    toast.success(t('configSaved'))
  } catch (error) {
    console.error('Failed to save plugin config:', error)
    toast.error(t('operationFailed'))
  } finally {
    saving.value = false
  }
}

const getPluginTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    config: t('pluginTypeConfig'),
    auth: t('pluginTypeAuth'),
    naming: t('pluginTypeNaming'),
    datasource: t('pluginTypeDatasource'),
    other: t('pluginTypeOther'),
  }
  return labels[type] || type
}

const getPluginIcon = (type: string) => {
  const icons: Record<string, typeof Puzzle> = {
    config: FileText,
    auth: Shield,
    naming: Server,
    datasource: Database,
    other: Box,
  }
  return icons[type] || Puzzle
}

const getPluginIconClass = (type: string) => {
  const classes: Record<string, string> = {
    config: 'bg-blue-50 text-blue-600',
    auth: 'bg-purple-50 text-purple-600',
    naming: 'bg-emerald-50 text-emerald-600',
    datasource: 'bg-amber-50 text-amber-600',
    other: 'bg-slate-50 text-slate-600',
  }
  return classes[type] || 'bg-slate-50 text-slate-600'
}

const getTypeClass = (type: string) => {
  const classes: Record<string, string> = {
    config: 'badge-info',
    auth: 'badge-purple',
    naming: 'badge-success',
    datasource: 'badge-warning',
    other: 'badge-secondary',
  }
  return classes[type] || 'badge-secondary'
}

const getStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    enabled: 'badge badge-success',
    disabled: 'badge badge-secondary',
    error: 'badge badge-danger',
  }
  return classes[status] || 'badge'
}

// Lifecycle
onMounted(() => {
  fetchPlugins()
})
</script>
