<template>
  <div class="space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-base font-semibold text-text-primary">{{ t('services') }}</h1>
        <p class="text-xs text-text-secondary mt-0.5">{{ t('servicesDesc') }}</p>
      </div>
      <button @click="showCreateModal = true" class="btn btn-primary btn-sm">
        <Plus class="w-3.5 h-3.5" />
        {{ t('createService') }}
      </button>
    </div>

    <!-- Search Bar -->
    <div class="card">
      <div class="p-3">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label class="block text-xs font-medium text-text-secondary mb-1">{{
              t('serviceName')
            }}</label>
            <input
              v-model="searchParams.serviceName"
              type="text"
              class="input"
              :placeholder="t('serviceName')"
              @keyup.enter="handleSearch"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-text-secondary mb-1">{{
              t('groupName')
            }}</label>
            <input
              v-model="searchParams.groupName"
              type="text"
              class="input"
              :placeholder="t('groupName')"
              @keyup.enter="handleSearch"
            />
          </div>
          <div class="flex items-center pt-6">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                v-model="searchParams.hasIpCount"
                class="w-3.5 h-3.5 rounded text-primary"
              />
              <span class="text-sm text-text-primary">{{ t('hideEmptyService') }}</span>
            </label>
          </div>
          <div class="flex items-end gap-2">
            <button @click="handleSearch" class="btn btn-primary flex-1">
              <Search class="w-3.5 h-3.5" />
              {{ t('search') }}
            </button>
            <button @click="handleReset" class="btn btn-secondary">
              <RotateCcw class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Service List -->
    <div class="card">
      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>{{ t('serviceName') }}</th>
              <th>{{ t('groupName') }}</th>
              <th>{{ t('clusterCount') }}</th>
              <th>{{ t('instanceCount') }}</th>
              <th>{{ t('healthyInstanceCount') }}</th>
              <th>{{ t('protectThreshold') }}</th>
              <th class="w-48">{{ t('actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="7" class="text-center py-6">
                <Loader2 class="w-5 h-5 animate-spin mx-auto text-primary" />
              </td>
            </tr>
            <tr v-else-if="services.length === 0">
              <td colspan="7" class="text-center py-6 text-text-secondary">
                {{ t('noData') }}
              </td>
            </tr>
            <tr
              v-for="service in services"
              :key="`${service.groupName}@@${service.name}`"
              class="hover:bg-bg-secondary"
            >
              <td>
                <router-link
                  :to="{
                    name: 'service-detail',
                    query: {
                      serviceName: service.name,
                      groupName: service.groupName,
                      namespaceId: namespace.namespace,
                    },
                  }"
                  class="text-primary hover:underline font-medium"
                >
                  {{ service.name }}
                </router-link>
              </td>
              <td>{{ service.groupName }}</td>
              <td>{{ service.clusterCount }}</td>
              <td>{{ service.ipCount }}</td>
              <td>
                <span :class="service.healthyInstanceCount > 0 ? 'text-success' : 'text-danger'">
                  {{ service.healthyInstanceCount }}
                </span>
              </td>
              <td>{{ service.protectThreshold ?? 0 }}</td>
              <td>
                <div class="flex items-center gap-1">
                  <router-link
                    :to="{
                      name: 'service-detail',
                      query: {
                        serviceName: service.name,
                        groupName: service.groupName,
                        namespaceId: namespace.namespace,
                      },
                    }"
                    class="btn btn-ghost btn-sm"
                    :title="t('view')"
                  >
                    <Eye class="w-3.5 h-3.5" />
                  </router-link>
                  <button
                    @click="handleEdit(service)"
                    class="btn btn-ghost btn-sm"
                    :title="t('edit')"
                  >
                    <Pencil class="w-3.5 h-3.5" />
                  </button>
                  <router-link
                    :to="{
                      name: 'subscribers',
                      query: {
                        serviceName: service.name,
                        groupName: service.groupName,
                        namespaceId: namespace.namespace,
                      },
                    }"
                    class="btn btn-ghost btn-sm"
                    :title="t('subscribers')"
                  >
                    <Users class="w-3.5 h-3.5" />
                  </router-link>
                  <button
                    @click="handleDelete(service)"
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

      <!-- Pagination -->
      <div class="flex items-center justify-between p-4 border-t border-border">
        <div class="text-sm text-text-secondary">
          {{ t('total') }}: {{ total }} {{ t('items') }}
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="handlePageChange(currentPage - 1)"
            :disabled="currentPage <= 1"
            class="btn btn-secondary btn-sm"
          >
            <ChevronLeft class="w-3.5 h-3.5" />
          </button>
          <span class="text-sm text-text-primary px-3"> {{ currentPage }} / {{ totalPages }} </span>
          <button
            @click="handlePageChange(currentPage + 1)"
            :disabled="currentPage >= totalPages"
            class="btn btn-secondary btn-sm"
          >
            <ChevronRight class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>

    <!-- Create/Edit Service Modal -->
    <div v-if="showCreateModal || showEditModal" class="modal-backdrop" @click="closeModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3 class="text-sm font-semibold text-text-primary">
            {{ showEditModal ? t('editService') : t('createService') }}
          </h3>
          <button @click="closeModal" class="btn btn-ghost btn-sm">
            <X class="w-3.5 h-3.5" />
          </button>
        </div>
        <div class="modal-body space-y-3">
          <div>
            <label class="block text-xs font-medium text-text-primary mb-1">
              {{ t('serviceName') }} <span class="text-danger">*</span>
            </label>
            <input
              v-model="serviceForm.serviceName"
              type="text"
              class="input"
              :disabled="showEditModal"
              :placeholder="t('serviceName')"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-text-primary mb-1">
              {{ t('groupName') }}
            </label>
            <input
              v-model="serviceForm.groupName"
              type="text"
              class="input"
              :disabled="showEditModal"
              placeholder="DEFAULT_GROUP"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-text-primary mb-1">
              {{ t('protectThreshold') }}
            </label>
            <input
              v-model.number="serviceForm.protectThreshold"
              type="number"
              class="input"
              min="0"
              max="1"
              step="0.1"
              placeholder="0"
            />
            <p class="text-xs text-text-tertiary mt-1">{{ t('protectThresholdHint') }}</p>
          </div>
          <div>
            <label class="block text-xs font-medium text-text-primary mb-1">
              {{ t('metadata') }}
            </label>
            <textarea
              v-model="metadataText"
              class="input min-h-[80px] font-mono text-sm"
              placeholder='{"key": "value"}'
            />
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeModal" class="btn btn-secondary">
            {{ t('cancel') }}
          </button>
          <button @click="handleSubmit" class="btn btn-primary" :disabled="saving">
            <Loader2 v-if="saving" class="w-3.5 h-3.5 animate-spin" />
            {{ showEditModal ? t('save') : t('create') }}
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
          <p class="text-text-secondary">
            {{ t('confirmDeleteService') }}
            <span class="font-medium text-text-primary">{{ serviceToDelete?.name }}</span
            >?
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
import { ref, reactive, computed, onMounted, watch } from 'vue'
import {
  Search,
  RotateCcw,
  Plus,
  Eye,
  Pencil,
  Users,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
} from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import batataApi from '@/api/batata'
import { toast } from '@/utils/error'
import type { ServiceInfo, Namespace } from '@/types'

const props = defineProps<{
  namespace: Namespace
}>()

const { t } = useI18n()

// State
const loading = ref(false)
const saving = ref(false)
const services = ref<ServiceInfo[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

// Search params
const searchParams = reactive({
  serviceName: '',
  groupName: '',
  hasIpCount: false,
})

// Modals
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const serviceToDelete = ref<ServiceInfo | null>(null)
const metadataText = ref('')

const serviceForm = reactive({
  serviceName: '',
  groupName: 'DEFAULT_GROUP',
  protectThreshold: 0,
  metadata: {} as Record<string, string>,
})

// Computed
const totalPages = computed(() => Math.ceil(total.value / pageSize.value) || 1)

// Methods
const fetchServices = async () => {
  loading.value = true
  try {
    const response = await batataApi.getServiceList({
      pageNo: currentPage.value,
      pageSize: pageSize.value,
      namespaceId: props.namespace.namespace,
      ...searchParams,
    })
    services.value = response.data.data.pageItems || []
    total.value = response.data.data.totalCount || 0
  } catch (error) {
    console.error('Failed to fetch services:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  fetchServices()
}

const handleReset = () => {
  Object.assign(searchParams, {
    serviceName: '',
    groupName: '',
    hasIpCount: false,
  })
  handleSearch()
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchServices()
}

const handleEdit = (service: ServiceInfo) => {
  Object.assign(serviceForm, {
    serviceName: service.name,
    groupName: service.groupName,
    protectThreshold: service.protectThreshold ?? 0,
    metadata: service.metadata || {},
  })
  metadataText.value = JSON.stringify(service.metadata || {}, null, 2)
  showEditModal.value = true
}

const closeModal = () => {
  showCreateModal.value = false
  showEditModal.value = false
  Object.assign(serviceForm, {
    serviceName: '',
    groupName: 'DEFAULT_GROUP',
    protectThreshold: 0,
    metadata: {},
  })
  metadataText.value = ''
}

const handleSubmit = async () => {
  if (!serviceForm.serviceName) {
    toast.warning(t('requiredFieldsMissing'))
    return
  }

  let metadata = {}
  if (metadataText.value) {
    try {
      metadata = JSON.parse(metadataText.value)
    } catch {
      toast.warning(t('invalidJson'))
      return
    }
  }

  saving.value = true
  try {
    const data = {
      serviceName: serviceForm.serviceName,
      groupName: serviceForm.groupName || 'DEFAULT_GROUP',
      namespaceId: props.namespace.namespace,
      protectThreshold: serviceForm.protectThreshold,
      metadata,
    }

    if (showEditModal.value) {
      await batataApi.updateService(data)
    } else {
      await batataApi.createService(data)
    }
    closeModal()
    fetchServices()
  } catch (error) {
    console.error('Failed to save service:', error)
  } finally {
    saving.value = false
  }
}

const handleDelete = (service: ServiceInfo) => {
  serviceToDelete.value = service
  showDeleteModal.value = true
}

const confirmDelete = async () => {
  if (!serviceToDelete.value) return
  try {
    await batataApi.deleteService(
      serviceToDelete.value.name,
      serviceToDelete.value.groupName,
      props.namespace.namespace,
    )
    showDeleteModal.value = false
    fetchServices()
  } catch (error) {
    console.error('Failed to delete service:', error)
  }
}

// Watch namespace change
watch(
  () => props.namespace,
  () => {
    currentPage.value = 1
    fetchServices()
  },
)

// Lifecycle
onMounted(() => {
  fetchServices()
})
</script>
