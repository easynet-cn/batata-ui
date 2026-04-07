<template>
  <div class="space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-base font-semibold text-text-primary">{{ t('consulPartitions') }}</h1>
        <p class="text-xs text-text-secondary mt-0.5">{{ t('consulPartitionsDesc') }}</p>
      </div>
      <div class="flex items-center gap-2">
        <button @click="loadPartitions" class="btn btn-secondary btn-sm" :disabled="loading">
          <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': loading }" />
          {{ t('refresh') }}
        </button>
        <button @click="openCreateModal" class="btn btn-primary btn-sm">
          <Plus class="w-3.5 h-3.5" />
          {{ t('createPartition') }}
        </button>
      </div>
    </div>

    <!-- Partition List -->
    <div class="card">
      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>{{ t('name') }}</th>
              <th>{{ t('description') }}</th>
              <th>{{ t('createIndex') }}</th>
              <th class="w-24">{{ t('actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="4" class="text-center py-6">
                <Loader2 class="w-5 h-5 animate-spin mx-auto text-fuchsia-600" />
              </td>
            </tr>
            <tr v-else-if="partitions.length === 0">
              <td colspan="4" class="text-center py-6 text-text-secondary">
                {{ t('noData') }}
              </td>
            </tr>
            <tr v-for="partition in partitions" :key="partition.Name" class="hover:bg-bg-secondary">
              <td>
                <span class="font-medium text-text-primary">{{ partition.Name }}</span>
              </td>
              <td class="text-text-secondary">{{ partition.Description || '-' }}</td>
              <td class="text-text-secondary text-xs">{{ partition.CreateIndex }}</td>
              <td>
                <button
                  @click="handleDelete(partition)"
                  class="btn btn-ghost btn-sm text-danger"
                  :title="t('delete')"
                  :disabled="partition.Name === 'default'"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create Partition Modal -->
    <FormModal
      v-model="showCreateModal"
      :title="t('createPartition')"
      :submit-text="t('create')"
      :loading="creating"
      @submit="submitCreate"
    >
      <div class="space-y-3">
        <div>
          <label class="block text-xs font-medium text-text-primary mb-1">
            {{ t('partitionName') }}
            <span class="text-red-500">*</span>
          </label>
          <input v-model="createForm.Name" type="text" class="input" placeholder="my-partition" />
        </div>
        <div>
          <label class="block text-xs font-medium text-text-primary mb-1">
            {{ t('description') }}
          </label>
          <input
            v-model="createForm.Description"
            type="text"
            class="input"
            :placeholder="t('description')"
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
        <p class="text-text-secondary">{{ t('confirmDeletePartition') }}</p>
        <p class="text-xs text-text-tertiary mt-2">
          <span class="font-mono text-text-primary">{{ partitionToDelete?.Name }}</span>
        </p>
      </div>
    </ConfirmModal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { RefreshCw, Trash2, Loader2, Plus } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import consulApi from '@/api/consul'
import { toast } from '@/utils/error'
import { logger } from '@/utils/logger'
import FormModal from '@/components/common/FormModal.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import type { ConsulPartition } from '@/types/consul'

const { t } = useI18n()

// State
const loading = ref(false)
const partitions = ref<ConsulPartition[]>([])
const showCreateModal = ref(false)
const creating = ref(false)
const showDeleteModal = ref(false)
const partitionToDelete = ref<ConsulPartition | null>(null)

const createForm = reactive({
  Name: '',
  Description: '',
})

// Actions
async function loadPartitions() {
  loading.value = true
  try {
    const response = await consulApi.listPartitions()
    partitions.value = response.data || []
  } catch (error) {
    logger.error('Failed to fetch partitions:', error)
    toast.apiError(error)
  } finally {
    loading.value = false
  }
}

function openCreateModal() {
  Object.assign(createForm, { Name: '', Description: '' })
  showCreateModal.value = true
}

async function submitCreate() {
  if (!createForm.Name.trim()) {
    toast.warning(t('requiredFieldsMissing'))
    return
  }
  creating.value = true
  try {
    await consulApi.createPartition({
      Name: createForm.Name.trim(),
      Description: createForm.Description.trim() || undefined,
    })
    showCreateModal.value = false
    toast.success(t('success'))
    await loadPartitions()
  } catch (error) {
    logger.error('Failed to create partition:', error)
    toast.apiError(error)
  } finally {
    creating.value = false
  }
}

function handleDelete(partition: ConsulPartition) {
  partitionToDelete.value = partition
  showDeleteModal.value = true
}

async function confirmDelete() {
  if (!partitionToDelete.value) return
  try {
    await consulApi.deletePartition(partitionToDelete.value.Name)
    showDeleteModal.value = false
    toast.success(t('success'))
    await loadPartitions()
  } catch (error) {
    logger.error('Failed to delete partition:', error)
    toast.apiError(error)
  }
}

// Lifecycle
onMounted(() => {
  loadPartitions()
})
</script>
