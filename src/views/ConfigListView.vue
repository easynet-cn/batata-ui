<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Search, Plus, RotateCw, Trash2, Edit, FileCode, Info } from 'lucide-vue-next'
import { mockConfigs } from '@/mock/data'
import type { ConfigInfo, Namespace } from '@/types'
import Modal from '@/components/Modal.vue'
import { useI18n } from '@/i18n'

const props = defineProps<{
  namespace: Namespace
}>()

const { t } = useI18n()

const configs = ref<ConfigInfo[]>([])
const searchTerm = ref('')
const loading = ref(false)
const isModalOpen = ref(false)
const modalMode = ref<'create' | 'edit'>('create')
const editingConfig = ref<Partial<ConfigInfo>>({})

const fetchConfigs = () => {
  loading.value = true
  setTimeout(() => {
    const filtered = mockConfigs.filter((c) => {
      const matchesNamespace = c.tenant === (props.namespace.namespace || 'public')
      const matchesSearch =
        c.dataId.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
        c.group.toLowerCase().includes(searchTerm.value.toLowerCase())
      return matchesNamespace && matchesSearch
    })
    configs.value = filtered
    loading.value = false
  }, 300)
}

onMounted(fetchConfigs)
watch([() => props.namespace, searchTerm], fetchConfigs)

const openCreateModal = () => {
  modalMode.value = 'create'
  editingConfig.value = {
    dataId: '',
    group: 'DEFAULT_GROUP',
    appName: '',
    type: 'yaml',
    content: '',
  }
  isModalOpen.value = true
}

const openEditModal = (config: ConfigInfo) => {
  modalMode.value = 'edit'
  editingConfig.value = { ...config }
  isModalOpen.value = true
}

const handleDelete = (id: string) => {
  if (confirm('Are you sure?')) {
    configs.value = configs.value.filter((c) => c.id !== id)
  }
}

const handleSave = () => {
  if (modalMode.value === 'create') {
    const newConfig: ConfigInfo = {
      ...editingConfig.value,
      id: Math.random().toString(36).substr(2, 9),
      lastModifiedTime: Date.now(),
      md5: 'mock-md5-hash',
      tenant: props.namespace.namespace || 'public',
    } as ConfigInfo
    configs.value = [newConfig, ...configs.value]
  } else {
    configs.value = configs.value.map((c) =>
      c.id === editingConfig.value.id
        ? ({ ...c, ...editingConfig.value, lastModifiedTime: Date.now() } as ConfigInfo)
        : c,
    )
  }
  isModalOpen.value = false
}

const configTypes = ['text', 'json', 'xml', 'yaml', 'properties']
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">{{ t('configuration') }}</h1>
        <div class="flex items-center mt-1 text-slate-500 text-sm">
          <span>{{ t('namespace') }}:</span>
          <span
            class="ml-1 px-2 py-0.5 bg-blue-50 text-blue-600 font-bold rounded-full text-xs border border-blue-100 uppercase tracking-tighter"
          >
            {{ namespace.namespaceShowName }}
          </span>
        </div>
      </div>
      <button
        @click="openCreateModal"
        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all shadow-sm"
      >
        <Plus :size="18" />
        <span>{{ t('create') }}</span>
      </button>
    </div>

    <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div
        class="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-4"
      >
        <div class="relative flex-1 max-w-md">
          <input
            type="text"
            v-model="searchTerm"
            :placeholder="t('search') + ' Data ID...'"
            class="w-full pl-4 pr-10 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
          />
          <Search :size="16" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
        <button
          @click="fetchConfigs"
          class="p-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
        >
          <RotateCw :size="18" :class="loading && 'animate-spin'" />
        </button>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead class="bg-slate-50 border-b border-slate-100">
            <tr>
              <th class="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {{ t('dataId') }}
              </th>
              <th class="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {{ t('group') }}
              </th>
              <th class="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {{ t('format') }}
              </th>
              <th class="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {{ t('lastModified') }}
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
              v-for="config in configs"
              :key="config.id"
              class="hover:bg-blue-50/30 transition-colors group"
            >
              <td class="px-6 py-4">
                <div class="flex items-center">
                  <div
                    class="w-8 h-8 rounded bg-slate-100 flex items-center justify-center mr-3 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors"
                  >
                    <FileCode :size="16" />
                  </div>
                  <span class="text-sm font-medium text-slate-900 truncate max-w-[200px]">{{
                    config.dataId
                  }}</span>
                </div>
              </td>
              <td class="px-6 py-4 text-sm text-slate-600">{{ config.group }}</td>
              <td class="px-6 py-4">
                <span
                  class="px-2 py-1 text-[10px] font-bold uppercase rounded bg-slate-100 text-slate-500"
                  >{{ config.type }}</span
                >
              </td>
              <td class="px-6 py-4 text-sm text-slate-400">
                {{ new Date(config.lastModifiedTime).toLocaleString() }}
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex items-center justify-end space-x-1">
                  <button
                    @click="openEditModal(config)"
                    class="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                  >
                    <Edit :size="16" />
                  </button>
                  <button
                    @click="handleDelete(config.id)"
                    class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 :size="16" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div
          v-if="configs.length === 0"
          class="py-20 flex flex-col items-center justify-center text-slate-400"
        >
          <Info :size="48" class="mb-4 opacity-20" />
          <p class="text-sm">{{ t('noData') }}</p>
        </div>
      </div>
    </div>

    <Modal v-model:visible="isModalOpen" :title="modalMode === 'create' ? t('create') : t('edit')">
      <div class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-500 uppercase">{{ t('dataId') }}</label>
            <input
              type="text"
              v-model="editingConfig.dataId"
              class="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>
          <div class="space-y-1">
            <label class="text-xs font-bold text-slate-500 uppercase">{{ t('group') }}</label>
            <input
              type="text"
              v-model="editingConfig.group"
              class="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>
        </div>
        <div class="space-y-1">
          <label class="text-xs font-bold text-slate-500 uppercase">{{ t('format') }}</label>
          <div class="flex space-x-2">
            <button
              v-for="type in configTypes"
              :key="type"
              @click="editingConfig.type = type as any"
              :class="[
                'px-3 py-1 rounded text-xs font-medium border',
                editingConfig.type === type
                  ? 'bg-blue-50 border-blue-200 text-blue-600'
                  : 'border-slate-200 text-slate-500',
              ]"
            >
              {{ type.toUpperCase() }}
            </button>
          </div>
        </div>
        <textarea
          v-model="editingConfig.content"
          rows="8"
          class="w-full px-3 py-2 border rounded-lg text-sm font-mono"
        />
      </div>
      <template #footer>
        <button @click="isModalOpen = false" class="px-4 py-2 text-sm text-slate-600">
          {{ t('cancel') }}
        </button>
        <button
          @click="handleSave"
          class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg"
        >
          {{ t('save') }}
        </button>
      </template>
    </Modal>
  </div>
</template>
