<template>
  <div class="space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-base font-semibold text-text-primary">{{ t('configEntries') }}</h1>
        <p class="text-xs text-text-secondary mt-0.5">{{ t('configEntriesDesc') }}</p>
      </div>
      <button @click="loadConfigEntries" class="btn btn-secondary btn-sm">
        <RefreshCw class="w-3.5 h-3.5" />
        {{ t('refresh') }}
      </button>
    </div>

    <!-- Kind Selector Tabs -->
    <div class="card">
      <div class="p-3">
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="k in kindOptions"
            :key="k"
            @click="selectKind(k)"
            :class="[
              'px-4 py-2 text-xs font-bold rounded-xl transition-colors',
              selectedKind === k
                ? 'bg-fuchsia-600 text-white shadow-md'
                : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary hover:text-text-primary',
            ]"
          >
            {{ k }}
          </button>
        </div>
      </div>
    </div>

    <!-- Config Entry List -->
    <div class="card">
      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>{{ t('name') }}</th>
              <th>{{ t('namespace') }}</th>
              <th>{{ t('createIndex') }}</th>
              <th>{{ t('modifyIndex') }}</th>
              <th class="w-32">{{ t('actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="store.loading">
              <td colspan="5" class="text-center py-6">
                <Loader2 class="w-5 h-5 animate-spin mx-auto text-primary" />
              </td>
            </tr>
            <tr v-else-if="store.configEntries.length === 0">
              <td colspan="5" class="text-center py-6 text-text-secondary">
                {{ t('noConfigEntries') }}
              </td>
            </tr>
            <tr v-for="entry in store.configEntries" :key="`${entry.Kind}-${entry.Name}`">
              <td>
                <span class="font-medium text-text-primary">{{ entry.Name }}</span>
              </td>
              <td>
                <span class="text-text-secondary">{{ entry.Namespace || '-' }}</span>
              </td>
              <td>
                <span class="text-text-secondary font-mono text-xs">{{ entry.CreateIndex }}</span>
              </td>
              <td>
                <span class="text-text-secondary font-mono text-xs">{{ entry.ModifyIndex }}</span>
              </td>
              <td>
                <div class="flex items-center gap-1">
                  <button
                    @click="handleViewJson(entry)"
                    class="btn btn-ghost btn-sm text-primary"
                    :title="t('viewJson')"
                  >
                    <Eye class="w-3.5 h-3.5" />
                  </button>
                  <button
                    @click="handleDelete(entry)"
                    class="btn btn-ghost btn-sm text-danger"
                    :title="t('delete')"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- View JSON Modal -->
    <ConfirmModal
      v-model="showJsonModal"
      :title="`${t('configEntryDetail')} - ${selectedEntry?.Name}`"
      :confirm-text="t('close')"
      @confirm="showJsonModal = false"
    >
      <pre
        class="bg-bg-secondary text-text-primary p-4 rounded-xl text-xs font-mono overflow-auto max-h-[60vh] border border-border"
        >{{ formattedJson }}</pre
      >
      <div class="flex justify-end mt-3">
        <button @click="copyJson" class="btn btn-secondary btn-sm">
          <Copy class="w-3.5 h-3.5" />
          {{ t('copy') }}
        </button>
      </div>
    </ConfirmModal>

    <!-- Delete Confirm Modal -->
    <ConfirmModal
      v-model="showDeleteModal"
      :title="t('confirmDelete')"
      :confirm-text="t('delete')"
      danger
      @confirm="confirmDelete"
    >
      <div>
        <p class="text-text-secondary">{{ t('confirmDeleteConfigEntry') }}</p>
        <p class="text-xs text-text-tertiary mt-2">
          <span class="font-medium text-text-primary">
            {{ entryToDelete?.Kind }}/{{ entryToDelete?.Name }}
          </span>
          - {{ t('deleteConfigEntryWarning') }}
        </p>
      </div>
    </ConfirmModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RefreshCw, Eye, Trash2, Loader2, Copy } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import { useConsulStore } from '@/stores/consul'
import consulApi from '@/api/consul'
import { toast } from '@/utils/error'
import { logger } from '@/utils/logger'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import type { ConsulConfigEntry, ConsulConfigEntryKind } from '@/types/consul'

const { t } = useI18n()
const store = useConsulStore()

// Kind options
const kindOptions: ConsulConfigEntryKind[] = [
  'service-defaults',
  'proxy-defaults',
  'service-router',
  'service-splitter',
  'service-resolver',
]

// State
const selectedKind = ref<ConsulConfigEntryKind>('service-defaults')
const showJsonModal = ref(false)
const showDeleteModal = ref(false)
const selectedEntry = ref<ConsulConfigEntry | null>(null)
const entryToDelete = ref<ConsulConfigEntry | null>(null)

// Computed
const formattedJson = computed(() => {
  if (!selectedEntry.value) return ''
  try {
    return JSON.stringify(selectedEntry.value, null, 2)
  } catch {
    return String(selectedEntry.value)
  }
})

// Actions
async function loadConfigEntries() {
  try {
    await store.fetchConfigEntries(selectedKind.value)
  } catch (error) {
    logger.error('Failed to fetch config entries:', error)
    toast.error(t('operationFailed'))
  }
}

function selectKind(kind: ConsulConfigEntryKind) {
  selectedKind.value = kind
  loadConfigEntries()
}

function handleViewJson(entry: ConsulConfigEntry) {
  selectedEntry.value = entry
  showJsonModal.value = true
}

function copyJson() {
  if (formattedJson.value) {
    navigator.clipboard
      .writeText(formattedJson.value)
      .then(() => {
        toast.success(t('success'))
      })
      .catch(() => {
        toast.error(t('operationFailed'))
      })
  }
}

function handleDelete(entry: ConsulConfigEntry) {
  entryToDelete.value = entry
  showDeleteModal.value = true
}

async function confirmDelete() {
  if (!entryToDelete.value) return
  try {
    await consulApi.deleteConfigEntry(entryToDelete.value.Kind, entryToDelete.value.Name)
    showDeleteModal.value = false
    toast.success(t('success'))
    await loadConfigEntries()
  } catch (error) {
    logger.error('Failed to delete config entry:', error)
    toast.error(t('operationFailed'))
  }
}

// Lifecycle
onMounted(() => {
  loadConfigEntries()
})
</script>
