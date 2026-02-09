<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold text-gray-900 dark:text-gray-100">
          {{ t('apolloServerConfig') }}
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {{ t('apolloServerConfigDesc') }}
        </p>
      </div>
      <div class="flex items-center gap-2">
        <button
          @click="refreshData"
          :disabled="loading"
          class="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw :size="14" :class="{ 'animate-spin': loading }" />
          {{ t('refresh') }}
        </button>
        <button
          @click="showAddModal = true"
          class="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-orange-600 rounded-xl hover:bg-orange-700 transition-colors"
        >
          <Plus :size="14" />
          {{ t('apolloAddConfig') }}
        </button>
      </div>
    </div>

    <!-- Tab Switcher -->
    <div
      class="p-1 bg-white rounded-2xl shadow-sm border border-gray-200 dark:bg-gray-900 dark:border-gray-800 inline-flex"
    >
      <button
        @click="activeTab = 'portal'"
        :class="[
          'px-4 py-2 text-sm font-bold rounded-xl transition-all',
          activeTab === 'portal'
            ? 'bg-orange-600 text-white shadow-md'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
        ]"
      >
        {{ t('apolloPortalDBConfig') }}
      </button>
      <button
        @click="activeTab = 'env'"
        :class="[
          'px-4 py-2 text-sm font-bold rounded-xl transition-all',
          activeTab === 'env'
            ? 'bg-orange-600 text-white shadow-md'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
        ]"
      >
        {{ t('apolloConfigDBConfig') }}
      </button>
    </div>

    <!-- Environment Selector (for env tab) -->
    <div v-if="activeTab === 'env'" class="flex items-center gap-3">
      <label class="text-sm font-bold text-gray-700 dark:text-gray-300"
        >{{ t('apolloEnvironment') }}:</label
      >
      <select
        v-model="selectedEnv"
        @change="refreshData"
        class="px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
      >
        <option v-for="env in environments" :key="env" :value="env">{{ env }}</option>
      </select>
    </div>

    <!-- Config Table -->
    <div
      class="bg-white rounded-2xl shadow-sm border border-gray-200 dark:bg-gray-900 dark:border-gray-800 overflow-hidden"
    >
      <div
        v-if="currentConfigs.length === 0 && !loading"
        class="text-center py-12 text-gray-400 dark:text-gray-500"
      >
        <Database :size="40" class="mx-auto mb-3 opacity-50" />
        <p class="text-sm">{{ t('apolloNoServerConfigs') }}</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr>
              <th
                class="px-6 py-4 font-bold text-xs uppercase tracking-wider text-gray-500 bg-gray-50 dark:bg-gray-800 dark:text-gray-400 text-left"
              >
                {{ t('apolloKey') }}
              </th>
              <th
                class="px-6 py-4 font-bold text-xs uppercase tracking-wider text-gray-500 bg-gray-50 dark:bg-gray-800 dark:text-gray-400 text-left"
              >
                {{ t('apolloValue') }}
              </th>
              <th
                class="px-6 py-4 font-bold text-xs uppercase tracking-wider text-gray-500 bg-gray-50 dark:bg-gray-800 dark:text-gray-400 text-left"
              >
                {{ t('apolloComment') }}
              </th>
              <th
                class="px-6 py-4 font-bold text-xs uppercase tracking-wider text-gray-500 bg-gray-50 dark:bg-gray-800 dark:text-gray-400 text-left"
              >
                {{ t('actions') }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="cfg in currentConfigs" :key="cfg.key">
              <td
                class="px-6 py-5 border-b border-gray-100 dark:border-gray-800 text-sm font-medium text-gray-900 dark:text-gray-100"
              >
                {{ cfg.key }}
              </td>
              <td
                class="px-6 py-5 border-b border-gray-100 dark:border-gray-800 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate"
              >
                {{ cfg.value }}
              </td>
              <td
                class="px-6 py-5 border-b border-gray-100 dark:border-gray-800 text-sm text-gray-500 dark:text-gray-500"
              >
                {{ cfg.comment || '-' }}
              </td>
              <td class="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
                <button
                  @click="editConfig(cfg)"
                  class="p-1.5 text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  :title="t('edit')"
                >
                  <Pencil :size="14" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        v-if="currentConfigs.length > 0"
        class="px-6 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400"
      >
        {{ t('total') }} {{ currentConfigs.length }} {{ t('items') }}
      </div>
    </div>

    <!-- Add/Edit Config Modal -->
    <template v-if="showAddModal || showEditModal">
      <div class="fixed inset-0 bg-black/50 z-40" @click="closeModal" />
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="closeModal">
        <div
          class="bg-white rounded-3xl shadow-2xl dark:bg-gray-900 dark:border dark:border-gray-800 w-full max-w-md"
        >
          <div class="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
            <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100">
              {{ showEditModal ? t('apolloEditConfig') : t('apolloAddConfig') }}
            </h3>
          </div>
          <div class="p-6 space-y-4">
            <div>
              <label
                class="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5"
              >
                {{ t('apolloKey') }}
              </label>
              <input
                v-model="configForm.key"
                :disabled="showEditModal"
                class="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 disabled:opacity-50"
              />
            </div>
            <div>
              <label
                class="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5"
              >
                {{ t('apolloValue') }}
              </label>
              <textarea
                v-model="configForm.value"
                rows="3"
                class="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 resize-none"
              />
            </div>
            <div>
              <label
                class="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5"
              >
                {{ t('apolloComment') }}
              </label>
              <input
                v-model="configForm.comment"
                class="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              />
            </div>
          </div>
          <div class="px-6 py-4 bg-gray-50 dark:bg-gray-800 rounded-b-3xl flex justify-end gap-3">
            <button
              @click="closeModal"
              class="px-5 py-2 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              {{ t('cancel') }}
            </button>
            <button
              @click="saveConfig"
              class="px-5 py-2 text-sm font-bold text-white bg-orange-600 rounded-xl hover:bg-orange-700 transition-colors"
            >
              {{ t('save') }}
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { RefreshCw, Plus, Database, Pencil } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import { useApolloPortalStore } from '@/stores/apollo-portal'
import { useApolloStore } from '@/stores/apollo'
import type { ApolloServerConfig, ApolloServerConfigPayload } from '@/types/apollo'
import { logger } from '@/utils/logger'

const { t } = useI18n()
const portalStore = useApolloPortalStore()
const apolloStore = useApolloStore()

const loading = ref(false)
const activeTab = ref<'portal' | 'env'>('portal')
const selectedEnv = ref('')
const showAddModal = ref(false)
const showEditModal = ref(false)

const environments = computed(() =>
  apolloStore.environments.filter((e) => e.active).map((e) => e.env),
)

const configForm = ref<ApolloServerConfigPayload>({ key: '', value: '', comment: '' })

const currentConfigs = computed(() =>
  activeTab.value === 'portal' ? portalStore.portalConfigs : portalStore.envConfigs,
)

watch(activeTab, () => {
  refreshData()
})

function editConfig(cfg: ApolloServerConfig) {
  configForm.value = { key: cfg.key, value: cfg.value, comment: cfg.comment || '' }
  showEditModal.value = true
}

async function saveConfig() {
  try {
    if (activeTab.value === 'portal') {
      await portalStore.savePortalConfig(configForm.value)
    } else if (selectedEnv.value) {
      await portalStore.saveEnvConfig(selectedEnv.value, configForm.value)
    }
    closeModal()
    await refreshData()
  } catch (err) {
    logger.error('Failed to save config:', err)
  }
}

function closeModal() {
  showAddModal.value = false
  showEditModal.value = false
  configForm.value = { key: '', value: '', comment: '' }
}

async function refreshData() {
  loading.value = true
  try {
    if (activeTab.value === 'portal') {
      await portalStore.fetchPortalConfigs()
    } else if (selectedEnv.value) {
      await portalStore.fetchEnvConfigs(selectedEnv.value)
    }
  } catch (err) {
    logger.error('Failed to fetch configs:', err)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  try {
    await apolloStore.fetchEnvironments()
    const firstEnv = environments.value[0]
    if (firstEnv) {
      selectedEnv.value = firstEnv
    }
  } catch {
    // Ignore
  }
  refreshData()
})
</script>
