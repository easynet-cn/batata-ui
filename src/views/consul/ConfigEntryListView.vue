<template>
  <div class="space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-base font-semibold text-text-primary">{{ t('configEntries') }}</h1>
        <p class="text-xs text-text-secondary mt-0.5">{{ t('configEntriesDesc') }}</p>
      </div>
      <div class="flex items-center gap-2">
        <button @click="loadConfigEntries" class="btn btn-secondary btn-sm">
          <RefreshCw class="w-3.5 h-3.5" />
          {{ t('refresh') }}
        </button>
        <button @click="handleCreate" class="btn btn-primary btn-sm">
          <Plus class="w-3.5 h-3.5" />
          {{ t('consulCreateConfigEntry') }}
        </button>
      </div>
    </div>

    <!-- Search & Kind Selector -->
    <div class="card">
      <div class="p-3 space-y-2">
        <div class="relative">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            v-model="searchQuery"
            type="text"
            class="input pl-10"
            :placeholder="t('searchConfigEntries')"
          />
        </div>
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
            <tr v-else-if="filteredEntries.length === 0">
              <td colspan="5" class="text-center py-6 text-text-secondary">
                {{ t('noConfigEntries') }}
              </td>
            </tr>
            <tr
              v-for="entry in filteredEntries"
              :key="`${entry.Kind}-${entry.Name}`"
              class="hover:bg-bg-secondary"
            >
              <td>
                <RouterLink
                  :to="{
                    name: 'consul-config-entry-detail',
                    params: { kind: entry.Kind, name: entry.Name },
                  }"
                  class="font-medium text-fuchsia-600 dark:text-fuchsia-400 hover:underline"
                >
                  {{ entry.Name }}
                </RouterLink>
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
                    @click="handleEdit(entry)"
                    class="btn btn-ghost btn-sm text-text-secondary"
                    :title="t('edit')"
                  >
                    <Pencil class="w-3.5 h-3.5" />
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

    <!-- Create/Edit Config Entry Modal -->
    <FormModal
      v-model="showFormModal"
      :title="isEditing ? t('consulEditConfigEntry') : t('consulCreateConfigEntry')"
      :submit-text="isEditing ? t('save') : t('create')"
      :loading="saving"
      wide
      @submit="submitForm"
    >
      <div class="space-y-3">
        <div>
          <label class="block text-xs font-medium text-text-primary mb-1">
            {{ t('kind') }} <span class="text-danger">*</span>
          </label>
          <select v-model="formData.Kind" class="input" :disabled="isEditing">
            <option v-for="k in allKindOptions" :key="k" :value="k">{{ k }}</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-text-primary mb-1">
            {{ t('name') }} <span class="text-danger">*</span>
          </label>
          <input
            v-model="formData.Name"
            type="text"
            class="input"
            :placeholder="t('name')"
            :disabled="isEditing"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-text-primary mb-1">
            {{ t('consulConfigEntryBody') }}
          </label>
          <textarea
            v-model="formData.Body"
            rows="12"
            class="input font-mono text-xs"
            placeholder="{}"
          />
        </div>
      </div>
    </FormModal>

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
import { ref, reactive, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { RefreshCw, Eye, Trash2, Loader2, Copy, Plus, Pencil, Search } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import { useConsulStore } from '@/stores/consul'
import consulApi from '@/api/consul'
import { toast } from '@/utils/error'
import { logger } from '@/utils/logger'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import FormModal from '@/components/common/FormModal.vue'
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
  'ingress-gateway',
  'terminating-gateway',
  'service-intentions',
  'mesh',
  'exported-services',
]

const allKindOptions = kindOptions

// State
const selectedKind = ref<ConsulConfigEntryKind>('service-defaults')
const showJsonModal = ref(false)
const showDeleteModal = ref(false)
const searchQuery = ref('')

const filteredEntries = computed(() => {
  if (!searchQuery.value) return store.configEntries
  const q = searchQuery.value.toLowerCase()
  return store.configEntries.filter((e) => e.Name.toLowerCase().includes(q))
})
const showFormModal = ref(false)
const isEditing = ref(false)
const saving = ref(false)
const selectedEntry = ref<ConsulConfigEntry | null>(null)
const entryToDelete = ref<ConsulConfigEntry | null>(null)

const formData = reactive({
  Kind: 'service-defaults' as ConsulConfigEntryKind,
  Name: '',
  Body: '{}',
})

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
    toast.apiError(error)
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
      .catch((err) => {
        toast.apiError(err)
      })
  }
}

function handleCreate() {
  isEditing.value = false
  formData.Kind = selectedKind.value
  formData.Name = ''
  formData.Body = '{}'
  showFormModal.value = true
}

function handleEdit(entry: ConsulConfigEntry) {
  isEditing.value = true
  formData.Kind = entry.Kind
  formData.Name = entry.Name
  try {
    formData.Body = JSON.stringify(entry, null, 2)
  } catch {
    formData.Body = String(entry)
  }
  showFormModal.value = true
}

async function submitForm() {
  if (!formData.Name) {
    toast.warning(t('requiredFieldsMissing'))
    return
  }
  saving.value = true
  try {
    let body: Record<string, unknown>
    try {
      body = JSON.parse(formData.Body)
    } catch {
      toast.warning('Invalid JSON')
      return
    }
    body.Kind = formData.Kind
    body.Name = formData.Name
    await consulApi.putConfigEntry(body as ConsulConfigEntry)
    showFormModal.value = false
    toast.success(t('success'))
    await loadConfigEntries()
  } catch (error) {
    logger.error('Failed to save config entry:', error)
    toast.apiError(error)
  } finally {
    saving.value = false
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
    toast.apiError(error)
  }
}

// Lifecycle
onMounted(() => {
  loadConfigEntries()
})
</script>
