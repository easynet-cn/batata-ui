<template>
  <div class="space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-base font-semibold text-text-primary">{{ t('peerings') }}</h1>
        <p class="text-xs text-text-secondary mt-0.5">{{ t('peeringsDesc') }}</p>
      </div>
      <div class="flex items-center gap-2">
        <button @click="loadPeerings" class="btn btn-secondary btn-sm">
          <RefreshCw class="w-3.5 h-3.5" />
          {{ t('refresh') }}
        </button>
        <button @click="openGenerateTokenModal" class="btn btn-secondary btn-sm">
          <KeyRound class="w-3.5 h-3.5" />
          {{ t('generateToken') }}
        </button>
        <button @click="openEstablishModal" class="btn btn-primary btn-sm">
          <Plus class="w-3.5 h-3.5" />
          {{ t('establishPeering') }}
        </button>
      </div>
    </div>

    <!-- Peering List -->
    <div class="card">
      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>{{ t('peerName') }}</th>
              <th>{{ t('peerState') }}</th>
              <th>{{ t('importedServices') }}</th>
              <th>{{ t('exportedServices') }}</th>
              <th class="w-24">{{ t('actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="store.loading">
              <td colspan="5" class="text-center py-6">
                <Loader2 class="w-5 h-5 animate-spin mx-auto text-primary" />
              </td>
            </tr>
            <tr v-else-if="store.peerings.length === 0">
              <td colspan="5" class="text-center py-6 text-text-secondary">
                {{ t('noPeerings') }}
              </td>
            </tr>
            <tr v-for="peer in store.peerings" :key="peer.ID">
              <td>
                <RouterLink
                  :to="{ name: 'consul-peering-detail', params: { name: peer.Name } }"
                  class="font-medium text-primary hover:underline"
                >
                  {{ peer.Name }}
                </RouterLink>
              </td>
              <td>
                <span :class="stateClass(peer.State)">
                  {{ stateLabel(peer.State) }}
                </span>
              </td>
              <td>
                <span class="text-text-secondary">{{ peer.ImportedServices?.length || 0 }}</span>
              </td>
              <td>
                <span class="text-text-secondary">{{ peer.ExportedServices?.length || 0 }}</span>
              </td>
              <td>
                <button
                  @click="handleDelete(peer)"
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

    <!-- Generate Token Modal -->
    <FormModal
      v-model="showGenerateModal"
      :title="t('generatePeeringToken')"
      :submit-text="t('generateToken')"
      :loading="generating"
      @submit="submitGenerateToken"
    >
      <div class="space-y-3">
        <div>
          <label class="block text-xs font-medium text-text-primary mb-1">
            {{ t('peerName') }} <span class="text-danger">*</span>
          </label>
          <input v-model="generateForm.name" type="text" class="input" placeholder="my-peer" />
        </div>
        <div v-if="generatedToken">
          <label class="block text-xs font-medium text-text-primary mb-1">
            {{ t('peeringToken') }}
          </label>
          <div class="relative">
            <textarea
              :value="generatedToken"
              readonly
              class="input min-h-[100px] font-mono text-xs pr-10"
            ></textarea>
            <button
              @click="copyToClipboard(generatedToken)"
              class="absolute top-2 right-2 btn btn-ghost btn-sm"
              :title="t('copyToken')"
            >
              <Copy class="w-3.5 h-3.5" />
            </button>
          </div>
          <p class="text-xs text-text-tertiary mt-1">{{ t('peeringTokenHint') }}</p>
        </div>
      </div>
    </FormModal>

    <!-- Establish Peering Modal -->
    <FormModal
      v-model="showEstablishModal"
      :title="t('establishPeeringConnection')"
      :submit-text="t('establishPeering')"
      :loading="establishing"
      @submit="submitEstablish"
    >
      <div class="space-y-3">
        <div>
          <label class="block text-xs font-medium text-text-primary mb-1">
            {{ t('peerName') }} <span class="text-danger">*</span>
          </label>
          <input v-model="establishForm.name" type="text" class="input" placeholder="my-peer" />
        </div>
        <div>
          <label class="block text-xs font-medium text-text-primary mb-1">
            {{ t('peeringToken') }} <span class="text-danger">*</span>
          </label>
          <textarea
            v-model="establishForm.token"
            class="input min-h-[100px] font-mono text-xs"
            :placeholder="t('peeringTokenPlaceholder')"
          ></textarea>
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
        <p class="text-text-secondary">{{ t('confirmDeletePeering') }}</p>
        <p class="text-xs text-text-tertiary mt-2">
          <span class="font-medium text-text-primary">{{ peerToDelete?.Name }}</span>
          - {{ t('deletePeeringWarning') }}
        </p>
      </div>
    </ConfirmModal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { Plus, RefreshCw, Trash2, KeyRound, Copy, Loader2 } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import { useConsulStore } from '@/stores/consul'
import consulApi from '@/api/consul'
import { toast } from '@/utils/error'
import { logger } from '@/utils/logger'
import FormModal from '@/components/common/FormModal.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import type { ConsulPeering, ConsulPeeringState } from '@/types/consul'

const { t } = useI18n()
const store = useConsulStore()

// State
const showGenerateModal = ref(false)
const showEstablishModal = ref(false)
const showDeleteModal = ref(false)
const generating = ref(false)
const establishing = ref(false)
const generatedToken = ref('')
const peerToDelete = ref<ConsulPeering | null>(null)

const generateForm = reactive({ name: '' })
const establishForm = reactive({ name: '', token: '' })

// Helpers
function stateClass(state: ConsulPeeringState): string {
  switch (state) {
    case 'ACTIVE':
      return 'badge badge-success'
    case 'PENDING':
    case 'ESTABLISHING':
      return 'badge badge-warning'
    case 'FAILING':
    case 'DELETING':
      return 'badge badge-danger'
    case 'TERMINATED':
      return 'badge badge-secondary'
    default:
      return 'badge badge-secondary'
  }
}

function stateLabel(state: ConsulPeeringState): string {
  switch (state) {
    case 'PENDING':
      return t('peerStatePending')
    case 'ESTABLISHING':
      return t('peerStateEstablishing')
    case 'ACTIVE':
      return t('peerStateActive')
    case 'FAILING':
      return t('peerStateFailing')
    case 'TERMINATED':
      return t('peerStateTerminated')
    case 'DELETING':
      return t('peerStateDeleting')
    default:
      return state
  }
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(t('tokenCopied'))
  } catch {
    // Fallback
    logger.error('Failed to copy to clipboard')
  }
}

// Actions
async function loadPeerings() {
  try {
    await store.fetchPeerings()
  } catch (error) {
    logger.error('Failed to fetch peerings:', error)
    toast.error(t('operationFailed'))
  }
}

function openGenerateTokenModal() {
  generateForm.name = ''
  generatedToken.value = ''
  showGenerateModal.value = true
}

function openEstablishModal() {
  establishForm.name = ''
  establishForm.token = ''
  showEstablishModal.value = true
}

async function submitGenerateToken() {
  if (!generateForm.name) {
    toast.warning(t('requiredFieldsMissing'))
    return
  }
  generating.value = true
  try {
    const response = await consulApi.generatePeeringToken(generateForm.name)
    generatedToken.value = response.data.PeeringToken
    toast.success(t('success'))
  } catch (error) {
    logger.error('Failed to generate peering token:', error)
    toast.error(t('operationFailed'))
  } finally {
    generating.value = false
  }
}

async function submitEstablish() {
  if (!establishForm.name || !establishForm.token) {
    toast.warning(t('requiredFieldsMissing'))
    return
  }
  establishing.value = true
  try {
    await consulApi.establishPeering(establishForm.name, establishForm.token)
    showEstablishModal.value = false
    toast.success(t('success'))
    await loadPeerings()
  } catch (error) {
    logger.error('Failed to establish peering:', error)
    toast.error(t('operationFailed'))
  } finally {
    establishing.value = false
  }
}

function handleDelete(peer: ConsulPeering) {
  peerToDelete.value = peer
  showDeleteModal.value = true
}

async function confirmDelete() {
  if (!peerToDelete.value) return
  try {
    await consulApi.deletePeering(peerToDelete.value.Name)
    showDeleteModal.value = false
    toast.success(t('success'))
    await loadPeerings()
  } catch (error) {
    logger.error('Failed to delete peering:', error)
    toast.error(t('operationFailed'))
  }
}

// Lifecycle
onMounted(() => {
  loadPeerings()
})
</script>
