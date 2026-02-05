<template>
  <div class="space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <button @click="goBack" class="btn btn-ghost btn-sm">
          <ArrowLeft class="w-3.5 h-3.5" />
        </button>
        <div>
          <h1 class="text-base font-semibold text-text-primary">{{ t('serviceDetail') }}</h1>
          <p class="text-xs text-text-secondary mt-0.5">{{ route.query.serviceName }}</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button @click="handleEditService" class="btn btn-secondary btn-sm">
          <Pencil class="w-3.5 h-3.5" />
          {{ t('editService') }}
        </button>
        <router-link
          :to="{ name: 'subscribers', query: route.query }"
          class="btn btn-secondary btn-sm"
        >
          <Users class="w-3.5 h-3.5" />
          {{ t('subscribers') }}
        </router-link>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="card p-8 flex items-center justify-center">
      <Loader2 class="w-8 h-8 animate-spin text-primary" />
    </div>

    <template v-else-if="service">
      <!-- Service Info -->
      <div class="card">
        <div class="p-4">
          <h2 class="text-sm font-semibold text-text-primary mb-4">{{ t('basicInfo') }}</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label class="block text-sm text-text-tertiary mb-1">{{ t('serviceName') }}</label>
              <p class="text-text-primary font-medium">{{ service.name }}</p>
            </div>
            <div>
              <label class="block text-sm text-text-tertiary mb-1">{{ t('groupName') }}</label>
              <p class="text-text-primary font-medium">{{ service.groupName }}</p>
            </div>
            <div>
              <label class="block text-sm text-text-tertiary mb-1">{{ t('clusterCount') }}</label>
              <p class="text-text-primary font-medium">{{ service.clusterCount }}</p>
            </div>
            <div>
              <label class="block text-sm text-text-tertiary mb-1">{{ t('instanceCount') }}</label>
              <p class="text-text-primary font-medium">
                <span class="text-success">{{ service.healthyInstanceCount }}</span>
                /
                {{ service.ipCount }}
              </p>
            </div>
            <div>
              <label class="block text-sm text-text-tertiary mb-1">{{
                t('protectThreshold')
              }}</label>
              <p class="text-text-primary font-medium">{{ service.protectThreshold ?? 0 }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Clusters -->
      <div class="card">
        <div class="p-4">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-sm font-semibold text-text-primary">{{ t('clusters') }}</h2>
          </div>

          <div
            v-if="!service.clusters || service.clusters.length === 0"
            class="text-center py-6 text-text-secondary"
          >
            {{ t('noCluster') }}
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="cluster in service.clusters"
              :key="cluster.name"
              class="border border-border rounded-lg"
            >
              <div
                class="flex items-center justify-between p-4 bg-bg-secondary rounded-t-lg border-b border-border"
              >
                <div class="flex items-center gap-2">
                  <Server class="w-5 h-5 text-primary" />
                  <span class="font-medium text-text-primary">{{ cluster.name }}</span>
                  <span class="badge badge-info text-xs">
                    {{ cluster.healthChecker?.type || 'TCP' }}
                  </span>
                </div>
                <button @click="handleEditCluster(cluster)" class="btn btn-ghost btn-sm">
                  <Pencil class="w-3.5 h-3.5" />
                </button>
              </div>

              <!-- Instances in this cluster -->
              <div class="overflow-x-auto">
                <table class="table">
                  <thead>
                    <tr>
                      <th>IP</th>
                      <th>{{ t('port') }}</th>
                      <th>{{ t('weight') }}</th>
                      <th>{{ t('healthy') }}</th>
                      <th>{{ t('enabled') }}</th>
                      <th>{{ t('ephemeral') }}</th>
                      <th class="w-32">{{ t('actions') }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="!cluster.instances || cluster.instances.length === 0">
                      <td colspan="7" class="text-center py-4 text-text-secondary">
                        {{ t('noInstance') }}
                      </td>
                    </tr>
                    <tr
                      v-for="instance in cluster.instances"
                      :key="instance.instanceId"
                      class="hover:bg-bg-secondary"
                    >
                      <td class="font-mono text-sm">{{ instance.ip }}</td>
                      <td>{{ instance.port }}</td>
                      <td>{{ instance.weight }}</td>
                      <td>
                        <span
                          :class="instance.healthy ? 'badge badge-success' : 'badge badge-danger'"
                        >
                          {{ instance.healthy ? t('yes') : t('no') }}
                        </span>
                      </td>
                      <td>
                        <span
                          :class="instance.enabled ? 'badge badge-success' : 'badge badge-warning'"
                        >
                          {{ instance.enabled ? t('yes') : t('no') }}
                        </span>
                      </td>
                      <td>{{ instance.ephemeral ? t('yes') : t('no') }}</td>
                      <td>
                        <div class="flex items-center gap-1">
                          <button
                            @click="handleEditInstance(instance)"
                            class="btn btn-ghost btn-sm"
                            :title="t('edit')"
                          >
                            <Pencil class="w-3.5 h-3.5" />
                          </button>
                          <button
                            @click="toggleInstanceStatus(instance)"
                            class="btn btn-ghost btn-sm"
                            :title="instance.enabled ? t('offline') : t('online')"
                          >
                            <Power
                              class="w-3.5 h-3.5"
                              :class="instance.enabled ? 'text-success' : 'text-danger'"
                            />
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Edit Instance Modal -->
    <div v-if="showInstanceModal" class="modal-backdrop" @click="showInstanceModal = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3 class="text-sm font-semibold text-text-primary">{{ t('editInstance') }}</h3>
          <button @click="showInstanceModal = false" class="btn btn-ghost btn-sm">
            <X class="w-3.5 h-3.5" />
          </button>
        </div>
        <div class="modal-body space-y-3">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-text-primary mb-1">IP</label>
              <input :value="instanceForm.ip" type="text" class="input" disabled />
            </div>
            <div>
              <label class="block text-xs font-medium text-text-primary mb-1">{{
                t('port')
              }}</label>
              <input :value="instanceForm.port" type="text" class="input" disabled />
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-text-primary mb-1">{{
              t('weight')
            }}</label>
            <input
              v-model.number="instanceForm.weight"
              type="number"
              class="input"
              min="0"
              max="10000"
            />
          </div>
          <div class="flex items-center gap-3">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                v-model="instanceForm.enabled"
                class="w-3.5 h-3.5 rounded text-primary"
              />
              <span class="text-sm text-text-primary">{{ t('enabled') }}</span>
            </label>
          </div>
          <div>
            <label class="block text-xs font-medium text-text-primary mb-1">{{
              t('metadata')
            }}</label>
            <textarea
              v-model="instanceMetadataText"
              class="input min-h-[80px] font-mono text-sm"
              placeholder='{"key": "value"}'
            />
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showInstanceModal = false" class="btn btn-secondary">
            {{ t('cancel') }}
          </button>
          <button @click="submitInstance" class="btn btn-primary" :disabled="saving">
            <Loader2 v-if="saving" class="w-3.5 h-3.5 animate-spin" />
            {{ t('save') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Edit Cluster Modal -->
    <div v-if="showClusterModal" class="modal-backdrop" @click="showClusterModal = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3 class="text-sm font-semibold text-text-primary">{{ t('editCluster') }}</h3>
          <button @click="showClusterModal = false" class="btn btn-ghost btn-sm">
            <X class="w-3.5 h-3.5" />
          </button>
        </div>
        <div class="modal-body space-y-3">
          <div>
            <label class="block text-xs font-medium text-text-primary mb-1">{{
              t('clusterName')
            }}</label>
            <input :value="clusterForm.clusterName" type="text" class="input" disabled />
          </div>
          <div>
            <label class="block text-xs font-medium text-text-primary mb-1">{{
              t('healthCheckType')
            }}</label>
            <select v-model="clusterForm.healthChecker.type" class="input">
              <option value="TCP">TCP</option>
              <option value="HTTP">HTTP</option>
              <option value="MYSQL">MYSQL</option>
              <option value="NONE">NONE</option>
            </select>
          </div>
          <div v-if="clusterForm.healthChecker.type === 'HTTP'">
            <label class="block text-xs font-medium text-text-primary mb-1">{{
              t('healthCheckPath')
            }}</label>
            <input
              v-model="clusterForm.healthChecker.path"
              type="text"
              class="input"
              placeholder="/health"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-text-primary mb-1">{{
              t('metadata')
            }}</label>
            <textarea
              v-model="clusterMetadataText"
              class="input min-h-[80px] font-mono text-sm"
              placeholder='{"key": "value"}'
            />
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showClusterModal = false" class="btn btn-secondary">
            {{ t('cancel') }}
          </button>
          <button @click="submitCluster" class="btn btn-primary" :disabled="saving">
            <Loader2 v-if="saving" class="w-3.5 h-3.5 animate-spin" />
            {{ t('save') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Pencil, Users, Loader2, Server, Power, X } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import batataApi from '@/api/batata'
import { toast } from '@/utils/error'
import type { ServiceDetail, ClusterInfo, InstanceInfo, Namespace } from '@/types'

const props = defineProps<{
  namespace: Namespace
}>()

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

// State
const loading = ref(false)
const saving = ref(false)
const service = ref<ServiceDetail | null>(null)

// Modals
const showInstanceModal = ref(false)
const showClusterModal = ref(false)
const instanceMetadataText = ref('')
const clusterMetadataText = ref('')

const instanceForm = reactive({
  ip: '',
  port: 0,
  weight: 1,
  enabled: true,
  clusterName: '',
  metadata: {} as Record<string, string>,
})

const clusterForm = reactive({
  clusterName: '',
  healthChecker: {
    type: 'TCP' as 'TCP' | 'HTTP' | 'MYSQL' | 'NONE',
    path: '',
  },
  metadata: {} as Record<string, string>,
})

// Methods
const goBack = () => {
  router.back()
}

const fetchService = async () => {
  const { serviceName, groupName, namespaceId } = route.query
  if (!serviceName || !groupName) return

  loading.value = true
  try {
    const response = await batataApi.getServiceDetail(
      serviceName as string,
      groupName as string,
      (namespaceId as string) || props.namespace.namespace,
    )
    service.value = response.data.data
  } catch (error) {
    console.error('Failed to fetch service:', error)
  } finally {
    loading.value = false
  }
}

const handleEditService = () => {
  // Navigate to edit or show modal
}

const handleEditInstance = (instance: InstanceInfo) => {
  Object.assign(instanceForm, {
    ip: instance.ip,
    port: instance.port,
    weight: instance.weight,
    enabled: instance.enabled,
    clusterName: instance.clusterName,
    metadata: instance.metadata || {},
  })
  instanceMetadataText.value = JSON.stringify(instance.metadata || {}, null, 2)
  showInstanceModal.value = true
}

const toggleInstanceStatus = async (instance: InstanceInfo) => {
  const { serviceName, groupName, namespaceId } = route.query
  try {
    await batataApi.updateInstance({
      serviceName: serviceName as string,
      groupName: groupName as string,
      namespaceId: (namespaceId as string) || props.namespace.namespace,
      ip: instance.ip,
      port: instance.port,
      enabled: !instance.enabled,
      clusterName: instance.clusterName,
    })
    fetchService()
  } catch (error) {
    console.error('Failed to toggle instance status:', error)
  }
}

const submitInstance = async () => {
  let metadata = {}
  if (instanceMetadataText.value) {
    try {
      metadata = JSON.parse(instanceMetadataText.value)
    } catch {
      toast.warning(t('invalidJson'))
      return
    }
  }

  const { serviceName, groupName, namespaceId } = route.query
  saving.value = true
  try {
    await batataApi.updateInstance({
      serviceName: serviceName as string,
      groupName: groupName as string,
      namespaceId: (namespaceId as string) || props.namespace.namespace,
      ip: instanceForm.ip,
      port: instanceForm.port,
      weight: instanceForm.weight,
      enabled: instanceForm.enabled,
      clusterName: instanceForm.clusterName,
      metadata,
    })
    showInstanceModal.value = false
    fetchService()
  } catch (error) {
    console.error('Failed to update instance:', error)
  } finally {
    saving.value = false
  }
}

const handleEditCluster = (cluster: ClusterInfo) => {
  Object.assign(clusterForm, {
    clusterName: cluster.name,
    healthChecker: {
      type: cluster.healthChecker?.type || 'TCP',
      path: cluster.healthChecker?.path || '',
    },
    metadata: cluster.metadata || {},
  })
  clusterMetadataText.value = JSON.stringify(cluster.metadata || {}, null, 2)
  showClusterModal.value = true
}

const submitCluster = async () => {
  let metadata = {}
  if (clusterMetadataText.value) {
    try {
      metadata = JSON.parse(clusterMetadataText.value)
    } catch {
      toast.warning(t('invalidJson'))
      return
    }
  }

  const { serviceName, groupName, namespaceId } = route.query
  saving.value = true
  try {
    await batataApi.updateCluster({
      serviceName: serviceName as string,
      groupName: groupName as string,
      namespaceId: (namespaceId as string) || props.namespace.namespace,
      clusterName: clusterForm.clusterName,
      healthChecker: clusterForm.healthChecker,
      metadata,
    })
    showClusterModal.value = false
    fetchService()
  } catch (error) {
    console.error('Failed to update cluster:', error)
  } finally {
    saving.value = false
  }
}

// Lifecycle
onMounted(() => {
  fetchService()
})
</script>
