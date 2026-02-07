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
                <button
                  @click="handleDelete(intention)"
                  class="btn btn-ghost btn-sm text-danger"
                  :title="t('delete')"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create Intention Modal -->
    <div v-if="showCreateModal" class="modal-backdrop" @click="showCreateModal = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3 class="text-sm font-semibold text-text-primary">{{ t('createIntention') }}</h3>
          <button @click="showCreateModal = false" class="btn btn-ghost btn-sm">
            <X class="w-3.5 h-3.5" />
          </button>
        </div>
        <div class="modal-body space-y-3">
          <div>
            <label class="block text-xs font-medium text-text-primary mb-1">
              {{ t('sourceService') }} <span class="text-danger">*</span>
            </label>
            <input v-model="createForm.SourceName" type="text" class="input" placeholder="web" />
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
        <div class="modal-footer">
          <button @click="showCreateModal = false" class="btn btn-secondary">
            {{ t('cancel') }}
          </button>
          <button @click="submitCreate" class="btn btn-primary" :disabled="saving">
            <Loader2 v-if="saving" class="w-3.5 h-3.5 animate-spin" />
            {{ t('create') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirm Modal -->
    <div v-if="showDeleteModal" class="modal-backdrop" @click="showDeleteModal = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3 class="text-sm font-semibold text-text-primary">{{ t('confirmDelete') }}</h3>
          <button @click="showDeleteModal = false" class="btn btn-ghost btn-sm">
            <X class="w-3.5 h-3.5" />
          </button>
        </div>
        <div class="modal-body">
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
        <div class="modal-footer">
          <button @click="showDeleteModal = false" class="btn btn-secondary">
            {{ t('cancel') }}
          </button>
          <button @click="confirmDelete" class="btn btn-danger">
            {{ t('delete') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import {
  Plus,
  RefreshCw,
  Trash2,
  Loader2,
  X,
  ArrowRightFromLine,
  ArrowRightToLine,
} from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import { useConsulStore } from '@/stores/consul'
import consulApi from '@/api/consul'
import { toast } from '@/utils/error'
import type { ConsulIntention } from '@/types/consul'

const { t } = useI18n()
const store = useConsulStore()

// State
const saving = ref(false)
const showCreateModal = ref(false)
const showDeleteModal = ref(false)
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
    console.error('Failed to fetch intentions:', error)
  }
}

function openCreateModal() {
  createForm.SourceName = ''
  createForm.DestinationName = ''
  createForm.Action = 'allow'
  createForm.Description = ''
  showCreateModal.value = true
}

async function submitCreate() {
  if (!createForm.SourceName || !createForm.DestinationName) {
    toast.warning(t('requiredFieldsMissing'))
    return
  }

  saving.value = true
  try {
    await consulApi.createIntention({
      SourceName: createForm.SourceName,
      DestinationName: createForm.DestinationName,
      Action: createForm.Action,
      Description: createForm.Description || undefined,
    })
    showCreateModal.value = false
    toast.success(t('success'))
    await loadIntentions()
  } catch (error) {
    console.error('Failed to create intention:', error)
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
    console.error('Failed to delete intention:', error)
    toast.error(t('operationFailed'))
  }
}

// Lifecycle
onMounted(() => {
  loadIntentions()
})
</script>
