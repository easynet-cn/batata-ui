<template>
  <div class="space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-base font-semibold text-text-primary">{{ t('namespaces') }}</h1>
        <p class="text-xs text-text-secondary mt-0.5">{{ t('namespacesDesc') }}</p>
      </div>
      <button @click="showCreateModal = true" class="btn btn-primary btn-sm">
        <Plus class="w-3.5 h-3.5" />
        {{ t('createNamespace') }}
      </button>
    </div>

    <!-- Namespace List -->
    <div class="card">
      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>{{ t('namespaceName') }}</th>
              <th>{{ t('namespaceId') }}</th>
              <th>{{ t('configCount') }}</th>
              <th>{{ t('type') }}</th>
              <th class="w-32">{{ t('actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="5" class="text-center py-6">
                <Loader2 class="w-5 h-5 animate-spin mx-auto text-primary" />
              </td>
            </tr>
            <tr v-else-if="namespaces.length === 0">
              <td colspan="5" class="text-center py-6 text-text-secondary">
                {{ t('noData') }}
              </td>
            </tr>
            <tr v-for="ns in namespaces" :key="ns.namespace" class="hover:bg-bg-secondary">
              <td class="font-medium">{{ ns.namespaceShowName }}</td>
              <td class="font-mono text-sm text-text-secondary">{{ ns.namespace || 'public' }}</td>
              <td>{{ ns.configCount }}</td>
              <td>
                <span :class="getTypeClass(ns.type)">
                  {{ getTypeName(ns.type) }}
                </span>
              </td>
              <td>
                <div class="flex items-center gap-1">
                  <button
                    v-if="ns.type !== 0"
                    @click="handleEdit(ns)"
                    class="btn btn-ghost btn-sm"
                    :title="t('edit')"
                  >
                    <Pencil class="w-3.5 h-3.5" />
                  </button>
                  <button
                    v-if="ns.type !== 0"
                    @click="handleDelete(ns)"
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

    <!-- Create/Edit Modal -->
    <FormModal
      v-model="showFormModal"
      :title="showEditModal ? t('editNamespace') : t('createNamespace')"
      :submit-text="showEditModal ? t('save') : t('create')"
      :loading="saving"
      @submit="handleSubmit"
    >
      <div class="space-y-3">
        <div v-if="!showEditModal">
          <label class="block text-xs font-medium text-text-primary mb-1">
            {{ t('namespaceId') }}
          </label>
          <input
            v-model="form.namespaceId"
            type="text"
            class="input"
            :placeholder="t('namespaceIdPlaceholder')"
          />
          <p class="text-xs text-text-tertiary mt-1">{{ t('namespaceIdHint') }}</p>
        </div>
        <div>
          <label class="block text-xs font-medium text-text-primary mb-1">
            {{ t('namespaceName') }} <span class="text-danger">*</span>
          </label>
          <input
            v-model="form.namespaceName"
            type="text"
            class="input"
            :placeholder="t('namespaceName')"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-text-primary mb-1">
            {{ t('namespaceDesc') }}
          </label>
          <textarea
            v-model="form.namespaceDesc"
            class="input min-h-[80px]"
            :placeholder="t('namespaceDesc')"
          />
        </div>
      </div>
    </FormModal>

    <!-- Delete Confirm Modal -->
    <ConfirmModal
      v-model="showDeleteModal"
      :title="t('confirmDelete')"
      :message="`${t('confirmDeleteNamespace')} ${nsToDelete?.namespaceShowName}?`"
      :confirm-text="t('delete')"
      danger
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import batataApi from '@/api/batata'
import { toast } from '@/utils/error'
import { logger } from '@/utils/logger'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import FormModal from '@/components/common/FormModal.vue'
import type { Namespace } from '@/types'

defineProps<{
  namespace: Namespace
}>()

const { t } = useI18n()

// State
const loading = ref(false)
const saving = ref(false)
const namespaces = ref<Namespace[]>([])

// Modals
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showFormModal = ref(false)
const showDeleteModal = ref(false)
const nsToDelete = ref<Namespace | null>(null)

const form = reactive({
  namespaceId: '',
  namespaceName: '',
  namespaceDesc: '',
})

// Methods
const fetchNamespaces = async () => {
  loading.value = true
  try {
    const response = await batataApi.getNamespaceList()
    namespaces.value = response.data.data || []
  } catch (error) {
    logger.error('Failed to fetch namespaces:', error)
    toast.error(t('operationFailed'))
  } finally {
    loading.value = false
  }
}

const getTypeClass = (type: number) => {
  const classes: Record<number, string> = {
    0: 'badge badge-info',
    1: 'badge badge-success',
    2: 'badge badge-primary',
  }
  return classes[type] || 'badge'
}

const getTypeName = (type: number) => {
  const names: Record<number, string> = {
    0: t('global'),
    1: t('default'),
    2: t('custom'),
  }
  return names[type] || t('custom')
}

const handleEdit = (ns: Namespace) => {
  Object.assign(form, {
    namespaceId: ns.namespace,
    namespaceName: ns.namespaceShowName,
    namespaceDesc: ns.namespaceDesc || '',
  })
  showEditModal.value = true
  showFormModal.value = true
}

const closeModal = () => {
  showCreateModal.value = false
  showEditModal.value = false
  showFormModal.value = false
  Object.assign(form, {
    namespaceId: '',
    namespaceName: '',
    namespaceDesc: '',
  })
}

const handleSubmit = async () => {
  if (!form.namespaceName) {
    toast.warning(t('requiredFieldsMissing'))
    return
  }

  saving.value = true
  try {
    if (showEditModal.value) {
      await batataApi.updateNamespace({
        namespaceId: form.namespaceId,
        namespaceName: form.namespaceName,
        namespaceDesc: form.namespaceDesc,
      })
    } else {
      await batataApi.createNamespace({
        namespaceId: form.namespaceId || undefined,
        namespaceName: form.namespaceName,
        namespaceDesc: form.namespaceDesc,
      })
    }
    closeModal()
    fetchNamespaces()
  } catch (error) {
    logger.error('Failed to save namespace:', error)
    toast.error(t('operationFailed'))
  } finally {
    saving.value = false
  }
}

const handleDelete = (ns: Namespace) => {
  nsToDelete.value = ns
  showDeleteModal.value = true
}

const confirmDelete = async () => {
  if (!nsToDelete.value) return
  try {
    await batataApi.deleteNamespace(nsToDelete.value.namespace)
    showDeleteModal.value = false
    fetchNamespaces()
  } catch (error) {
    logger.error('Failed to delete namespace:', error)
    toast.error(t('operationFailed'))
  }
}

// Watch for create modal open
import { watch } from 'vue'
watch(showCreateModal, (val) => {
  if (val) {
    showEditModal.value = false
    showFormModal.value = true
  }
})

// Lifecycle
onMounted(() => {
  fetchNamespaces()
})
</script>
