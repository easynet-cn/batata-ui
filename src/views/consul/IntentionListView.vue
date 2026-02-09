<template>
  <div class="space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-base font-semibold text-text-primary">{{ t('intentions') }}</h1>
        <p class="text-xs text-text-secondary mt-0.5">{{ t('intentionsDesc') }}</p>
      </div>
      <div class="flex items-center gap-2">
        <button @click="loadIntentions" class="btn btn-secondary btn-sm">
          <RefreshCw class="w-3.5 h-3.5" />
          {{ t('refresh') }}
        </button>
        <button @click="openCreateModal" class="btn btn-primary btn-sm">
          <Plus class="w-3.5 h-3.5" />
          {{ t('createIntention') }}
        </button>
      </div>
    </div>

    <!-- Intention List -->
    <div class="card">
      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>{{ t('sourceService') }}</th>
              <th>{{ t('destinationService') }}</th>
              <th>{{ t('action') }}</th>
              <th>{{ t('precedence') }}</th>
              <th>{{ t('description') }}</th>
              <th class="w-24">{{ t('actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="store.loading">
              <td colspan="6" class="text-center py-6">
                <Loader2 class="w-5 h-5 animate-spin mx-auto text-primary" />
              </td>
            </tr>
            <tr v-else-if="store.intentions.length === 0">
              <td colspan="6" class="text-center py-6 text-text-secondary">
                {{ t('noIntentions') }}
              </td>
            </tr>
            <tr v-for="intention in store.intentions" :key="intention.ID">
              <td>
                <div class="flex items-center gap-1.5">
                  <ArrowRightFromLine class="w-3.5 h-3.5 text-text-tertiary" />
                  <span class="font-medium text-text-primary">{{ intention.SourceName }}</span>
                </div>
              </td>
              <td>
                <div class="flex items-center gap-1.5">
                  <ArrowRightToLine class="w-3.5 h-3.5 text-text-tertiary" />
                  <span class="font-medium text-text-primary">{{ intention.DestinationName }}</span>
                </div>
              </td>
              <td>
                <span
                  :class="
                    intention.Action === 'allow' ? 'badge badge-success' : 'badge badge-danger'
                  "
                >
                  {{ intention.Action === 'allow' ? t('allow') : t('deny') }}
                </span>
              </td>
              <td>
                <span class="text-text-secondary">{{ intention.Precedence }}</span>
              </td>
              <td>
                <span class="text-text-secondary">{{ intention.Description || '-' }}</span>
              </td>
              <td>
                <div class="flex items-center gap-1">
                  <button
                    @click="handleEdit(intention)"
                    class="btn btn-ghost btn-sm text-text-secondary"
                    :title="t('edit')"
                  >
                    <Pencil class="w-3.5 h-3.5" />
                  </button>
                  <button
                    @click="handleDelete(intention)"
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

    <!-- Create/Edit Intention Modal -->
    <FormModal
      v-model="showCreateModal"
      :title="isEditing ? t('editIntention') : t('createIntention')"
      :submit-text="isEditing ? t('updateIntention') : t('create')"
      :loading="saving"
      @submit="submitCreate"
    >
      <div class="space-y-3">
        <div>
          <label class="block text-xs font-medium text-text-primary mb-1">
            {{ t('sourceService') }} <span class="text-danger">*</span>
          </label>
          <input
            v-model="createForm.SourceName"
            type="text"
            class="input"
            placeholder="web"
            :disabled="isEditing"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-text-primary mb-1">
            {{ t('destinationService') }} <span class="text-danger">*</span>
          </label>
          <input
            v-model="createForm.DestinationName"
            type="text"
            class="input"
            placeholder="api"
            :disabled="isEditing"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-text-primary mb-1">
            {{ t('action') }} <span class="text-danger">*</span>
          </label>
          <select v-model="createForm.Action" class="input">
            <option value="allow">{{ t('allow') }}</option>
            <option value="deny">{{ t('deny') }}</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-text-primary mb-1">
            {{ t('description') }}
          </label>
          <input
            v-model="createForm.Description"
            type="text"
            class="input"
            :placeholder="t('descriptionPlaceholder')"
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
        <p class="text-text-secondary">{{ t('confirmDeleteIntention') }}</p>
        <p class="text-xs text-text-tertiary mt-2">
          <span class="font-medium text-text-primary">
            {{ intentionToDelete?.SourceName }}
          </span>
          &rarr;
          <span class="font-medium text-text-primary">
            {{ intentionToDelete?.DestinationName }}
          </span>
          - {{ t('deleteIntentionWarning') }}
        </p>
      </div>
    </ConfirmModal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import {
  Plus,
  RefreshCw,
  Trash2,
  Pencil,
  Loader2,
  ArrowRightFromLine,
  ArrowRightToLine,
} from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import { useConsulStore } from '@/stores/consul'
import consulApi from '@/api/consul'
import { toast } from '@/utils/error'
import { logger } from '@/utils/logger'
import FormModal from '@/components/common/FormModal.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import type { ConsulIntention } from '@/types/consul'

const { t } = useI18n()
const store = useConsulStore()

// State
const saving = ref(false)
const showCreateModal = ref(false)
const showDeleteModal = ref(false)
const isEditing = ref(false)
const editingIntention = ref<ConsulIntention | null>(null)
const intentionToDelete = ref<ConsulIntention | null>(null)

const createForm = reactive({
  SourceName: '',
  DestinationName: '',
  Action: 'allow' as 'allow' | 'deny',
  Description: '',
})

// Actions
async function loadIntentions() {
  try {
    await store.fetchIntentions()
  } catch (error) {
    logger.error('Failed to fetch intentions:', error)
    toast.error(t('operationFailed'))
  }
}

function openCreateModal() {
  isEditing.value = false
  editingIntention.value = null
  createForm.SourceName = ''
  createForm.DestinationName = ''
  createForm.Action = 'allow'
  createForm.Description = ''
  showCreateModal.value = true
}

async function handleEdit(intention: ConsulIntention) {
  isEditing.value = true
  try {
    const response = await consulApi.getIntention(intention.ID)
    const full = response.data
    editingIntention.value = full
    createForm.SourceName = full.SourceName
    createForm.DestinationName = full.DestinationName
    createForm.Action = full.Action
    createForm.Description = full.Description || ''
    showCreateModal.value = true
  } catch (error) {
    logger.error('Failed to fetch intention details:', error)
    toast.error(t('operationFailed'))
  }
}

async function submitCreate() {
  if (!createForm.SourceName || !createForm.DestinationName) {
    toast.warning(t('requiredFieldsMissing'))
    return
  }

  saving.value = true
  try {
    if (isEditing.value && editingIntention.value) {
      await consulApi.updateIntention(editingIntention.value.ID, {
        SourceName: createForm.SourceName,
        DestinationName: createForm.DestinationName,
        Action: createForm.Action,
        Description: createForm.Description || undefined,
      })
    } else {
      await consulApi.createIntention({
        SourceName: createForm.SourceName,
        DestinationName: createForm.DestinationName,
        Action: createForm.Action,
        Description: createForm.Description || undefined,
      })
    }
    showCreateModal.value = false
    toast.success(t('success'))
    await loadIntentions()
  } catch (error) {
    logger.error('Failed to save intention:', error)
    toast.error(t('operationFailed'))
  } finally {
    saving.value = false
  }
}

function handleDelete(intention: ConsulIntention) {
  intentionToDelete.value = intention
  showDeleteModal.value = true
}

async function confirmDelete() {
  if (!intentionToDelete.value) return
  try {
    await consulApi.deleteIntention(intentionToDelete.value.ID)
    showDeleteModal.value = false
    toast.success(t('success'))
    await loadIntentions()
  } catch (error) {
    logger.error('Failed to delete intention:', error)
    toast.error(t('operationFailed'))
  }
}

// Lifecycle
onMounted(() => {
  loadIntentions()
})
</script>
