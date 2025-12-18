<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import {
  Search,
  Plus,
  RotateCw,
  Activity,
  ShieldCheck,
  Database,
  Trash2,
  Info,
  ExternalLink,
} from 'lucide-vue-next'
import { mockServices } from '@/mock/data'
import type { ServiceInfo, Namespace } from '@/types'
import Modal from '@/components/Modal.vue'
import { useI18n } from '@/i18n'

const props = defineProps<{
  namespace: Namespace
}>()

const { t } = useI18n()

const services = ref<ServiceInfo[]>([])
const searchTerm = ref('')
const loading = ref(false)
const isModalOpen = ref(false)
const newService = ref<Partial<ServiceInfo>>({ name: '', groupName: 'DEFAULT_GROUP' })
const selectedService = ref<ServiceInfo | null>(null)
const isDetailsOpen = ref(false)

const fetchServices = () => {
  loading.value = true
  setTimeout(() => {
    const filtered = mockServices.filter((s) =>
      s.name.toLowerCase().includes(searchTerm.value.toLowerCase()),
    )
    services.value = filtered
    loading.value = false
  }, 400)
}

onMounted(fetchServices)
watch([() => props.namespace, searchTerm], fetchServices)

const handleOpenDetails = (service: ServiceInfo) => {
  selectedService.value = service
  isDetailsOpen.value = true
}

const handleCreateService = () => {
  if (!newService.value.name) return
  const s: ServiceInfo = {
    ...newService.value,
    ipCount: 0,
    healthyInstanceCount: 0,
    instances: [],
    clusterCount: 1,
    triggerThreshold: 0.6,
  } as ServiceInfo
  services.value = [s, ...services.value]
  isModalOpen.value = false
}

const handleDelete = (name: string) => {
  if (confirm('Are you sure?')) {
    services.value = services.value.filter((s) => s.name !== name)
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">{{ t('services') }}</h1>
        <div class="flex items-center mt-1 text-slate-500 text-sm">
          <span>{{ t('namespace') }}:</span>
          <span
            class="ml-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 font-bold rounded-full text-xs border border-emerald-100 uppercase tracking-tighter"
          >
            {{ namespace.namespaceShowName }}
          </span>
        </div>
      </div>
      <button
        @click="isModalOpen = true"
        class="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all shadow-sm"
      >
        <Plus :size="18" />
        <span>{{ t('create') }}</span>
      </button>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div
        class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4"
      >
        <div class="p-3 rounded-lg bg-blue-100 text-blue-600">
          <Activity :size="24" />
        </div>
        <div>
          <div class="text-sm text-slate-500">{{ t('services') }}</div>
          <div class="text-2xl font-bold text-slate-900">{{ services.length }}</div>
        </div>
      </div>
      <div
        class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4"
      >
        <div class="p-3 rounded-lg bg-emerald-100 text-emerald-600">
          <ShieldCheck :size="24" />
        </div>
        <div>
          <div class="text-sm text-slate-500">Healthy</div>
          <div class="text-2xl font-bold text-slate-900">
            {{ services.reduce((acc, s) => acc + s.healthyInstanceCount, 0) }}
          </div>
        </div>
      </div>
      <div
        class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4"
      >
        <div class="p-3 rounded-lg bg-indigo-100 text-indigo-600">
          <Database :size="24" />
        </div>
        <div>
          <div class="text-sm text-slate-500">{{ t('clusters') }}</div>
          <div class="text-2xl font-bold text-slate-900">
            {{ services.reduce((acc, s) => acc + s.clusterCount, 0) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div class="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div class="relative w-72">
          <input
            type="text"
            v-model="searchTerm"
            :placeholder="t('search') + '...'"
            class="w-full pl-4 pr-10 py-2 border rounded-lg text-sm"
          />
          <Search class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" :size="16" />
        </div>
        <button @click="fetchServices" class="p-2 text-slate-600 hover:bg-slate-200 rounded-lg">
          <RotateCw :size="18" :class="loading && 'animate-spin'" />
        </button>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead class="bg-slate-50 border-b border-slate-100">
            <tr>
              <th class="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {{ t('serviceName') }}
              </th>
              <th class="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {{ t('group') }}
              </th>
              <th class="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {{ t('clusters') }}
              </th>
              <th class="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {{ t('instances') }}
              </th>
              <th class="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {{ t('healthStatus') }}
              </th>
              <th
                class="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right"
              >
                {{ t('actions') }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="(service, idx) in services"
              :key="idx"
              class="hover:bg-slate-50 transition-colors"
            >
              <td class="px-6 py-4">
                <span
                  @click="handleOpenDetails(service)"
                  class="text-sm font-semibold text-blue-600 hover:underline cursor-pointer flex items-center"
                >
                  {{ service.name }}
                  <ExternalLink :size="12" class="ml-1 opacity-50" />
                </span>
              </td>
              <td class="px-6 py-4 text-sm text-slate-600">{{ service.groupName }}</td>
              <td class="px-6 py-4 text-sm text-slate-600">{{ service.clusterCount }}</td>
              <td class="px-6 py-4 text-sm text-slate-600">{{ service.ipCount }}</td>
              <td class="px-6 py-4">
                <div class="flex items-center space-x-2">
                  <div class="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      :class="[
                        'h-full',
                        service.healthyInstanceCount === 0 ? 'bg-red-400' : 'bg-emerald-500',
                      ]"
                      :style="{
                        width: `${service.ipCount > 0 ? (service.healthyInstanceCount / service.ipCount) * 100 : 0}%`,
                      }"
                    />
                  </div>
                  <span class="text-xs text-slate-500"
                    >{{ service.healthyInstanceCount }}/{{ service.ipCount }}</span
                  >
                </div>
              </td>
              <td class="px-6 py-4 text-right">
                <button
                  @click="handleOpenDetails(service)"
                  class="text-blue-600 hover:text-blue-800 text-sm font-medium mr-4"
                >
                  {{ t('details') }}
                </button>
                <button
                  @click="handleDelete(service.name)"
                  class="text-slate-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 :size="16" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <div
          v-if="services.length === 0"
          class="py-20 flex flex-col items-center justify-center text-slate-400"
        >
          <Info :size="48" class="mb-4 opacity-20" />
          <p class="text-sm">{{ t('noData') }}</p>
        </div>
      </div>
    </div>

    <!-- Create Modal -->
    <Modal v-model:visible="isModalOpen" :title="t('create')">
      <div class="space-y-4">
        <div class="space-y-1">
          <label class="text-xs font-bold text-slate-500 uppercase">{{ t('serviceName') }}</label>
          <input
            type="text"
            v-model="newService.name"
            class="w-full px-3 py-2 border rounded-lg text-sm"
          />
        </div>
        <div class="space-y-1">
          <label class="text-xs font-bold text-slate-500 uppercase">{{ t('group') }}</label>
          <input
            type="text"
            v-model="newService.groupName"
            class="w-full px-3 py-2 border rounded-lg text-sm"
          />
        </div>
      </div>
      <template #footer>
        <button @click="isModalOpen = false" class="px-4 py-2 text-sm text-slate-600">
          {{ t('cancel') }}
        </button>
        <button
          @click="handleCreateService"
          class="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium"
        >
          {{ t('confirm') }}
        </button>
      </template>
    </Modal>

    <!-- Details Modal -->
    <Modal v-model:visible="isDetailsOpen" :title="`${t('details')}: ${selectedService?.name}`">
      <div v-if="selectedService" class="space-y-6">
        <div class="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <div>
            <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {{ t('group') }}
            </div>
            <div class="text-sm font-medium text-slate-900 mt-1">
              {{ selectedService.groupName }}
            </div>
          </div>
          <div>
            <div class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Threshold
            </div>
            <div class="text-sm font-medium text-slate-900 mt-1">
              {{ selectedService.triggerThreshold * 100 }}%
            </div>
          </div>
        </div>
        <div class="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50 border-b border-slate-100">
              <tr>
                <th class="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">IP:Port</th>
                <th class="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">Weight</th>
                <th class="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase text-center">
                  Health
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              <tr
                v-for="(instance, idx) in selectedService.instances"
                :key="idx"
                class="hover:bg-slate-50/50"
              >
                <td class="px-4 py-3 font-mono text-xs text-slate-700">
                  {{ instance.ip }}:{{ instance.port }}
                </td>
                <td class="px-4 py-3 text-xs text-slate-500">{{ instance.weight.toFixed(1) }}</td>
                <td class="px-4 py-3">
                  <div class="flex justify-center">
                    <div
                      :class="[
                        'w-2 h-2 rounded-full',
                        instance.healthy ? 'bg-emerald-500' : 'bg-red-500',
                      ]"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <template #footer>
        <button
          @click="isDetailsOpen = false"
          class="px-6 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-sm"
        >
          {{ t('cancel') }}
        </button>
      </template>
    </Modal>
  </div>
</template>
