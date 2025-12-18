<script setup lang="ts">
import { ref } from 'vue'
import { Plus, Globe, Folder, Trash2, Edit2, CheckCircle2 } from 'lucide-vue-next'
import { mockNamespaces } from '@/mock/data'
import type { Namespace } from '@/types'
import Modal from '@/components/Modal.vue'
import { useI18n } from '@/i18n'

const props = defineProps<{
  namespace: Namespace
}>()

const emit = defineEmits<{
  (e: 'switch', ns: Namespace): void
}>()

const { t } = useI18n()

const namespaces = ref<Namespace[]>([...mockNamespaces])
const isModalOpen = ref(false)
const modalMode = ref<'add' | 'edit'>('add')
const editingNs = ref<Partial<Namespace>>({})

const handleOpenAdd = () => {
  modalMode.value = 'add'
  editingNs.value = { namespaceShowName: '', namespace: '', quota: 200, configCount: 0, type: 1 }
  isModalOpen.value = true
}

const handleOpenEdit = (ns: Namespace) => {
  modalMode.value = 'edit'
  editingNs.value = { ...ns }
  isModalOpen.value = true
}

const handleSave = () => {
  if (modalMode.value === 'add') {
    const newNs: Namespace = {
      ...editingNs.value,
      namespace: editingNs.value.namespace || Math.random().toString(36).substr(2, 9),
    } as Namespace
    namespaces.value = [...namespaces.value, newNs]
  } else {
    namespaces.value = namespaces.value.map((n) =>
      n.namespace === editingNs.value.namespace ? ({ ...n, ...editingNs.value } as Namespace) : n,
    )
  }
  isModalOpen.value = false
}

const handleDelete = (id: string) => {
  if (
    confirm(
      'Are you sure you want to delete this namespace? All configurations in it will be lost.',
    )
  ) {
    namespaces.value = namespaces.value.filter((n) => n.namespace !== id)
  }
}

const handleSwitch = (ns: Namespace) => {
  localStorage.setItem('nacos_current_ns', JSON.stringify(ns))
  emit('switch', ns)
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">{{ t('namespaceManagement') }}</h1>
        <p class="text-slate-500 mt-1">{{ t('namespaceSubtitle') }}</p>
      </div>
      <button
        @click="handleOpenAdd"
        class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all shadow-sm"
      >
        <Plus :size="18" />
        <span>{{ t('addNamespace') }}</span>
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="ns in namespaces"
        :key="ns.namespace || 'public'"
        :class="[
          'bg-white rounded-2xl border-2 transition-all overflow-hidden shadow-sm hover:shadow-md group',
          namespace.namespace === ns.namespace
            ? 'border-blue-600 ring-4 ring-blue-500/10'
            : 'border-slate-200',
        ]"
      >
        <div class="p-6">
          <div class="flex items-start justify-between">
            <div
              :class="[
                'p-3 rounded-xl transition-colors',
                namespace.namespace === ns.namespace
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : ns.type === 0
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-indigo-100 text-indigo-600',
              ]"
            >
              <Globe v-if="ns.type === 0" :size="24" />
              <Folder v-else :size="24" />
            </div>
            <div class="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                @click="handleOpenEdit(ns)"
                class="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-colors"
                :title="t('edit')"
              >
                <Edit2 :size="14" />
              </button>
              <button
                v-if="ns.type !== 0"
                @click="handleDelete(ns.namespace)"
                class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                :title="t('delete')"
              >
                <Trash2 :size="14" />
              </button>
            </div>
          </div>

          <div class="mt-4">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-bold text-slate-800 flex items-center">
                {{ ns.namespaceShowName }}
                <span
                  v-if="ns.type === 0"
                  class="ml-2 px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded uppercase border border-blue-100 tracking-tighter"
                >
                  {{ t('system') }}
                </span>
              </h3>
              <CheckCircle2
                v-if="namespace.namespace === ns.namespace"
                :size="18"
                class="text-blue-600"
              />
            </div>
            <p
              class="text-xs text-slate-400 font-mono mt-1 truncate"
              :title="ns.namespace || 'public'"
            >
              ID: {{ ns.namespace || 'public' }}
            </p>
          </div>

          <div class="mt-6 flex items-center justify-between border-t border-slate-50 pt-4">
            <div class="flex space-x-4">
              <div class="text-left">
                <div class="text-sm font-bold text-slate-900">{{ ns.configCount }}</div>
                <div class="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">
                  Configs
                </div>
              </div>
              <div class="text-left border-l pl-4 border-slate-50">
                <div class="text-sm font-bold text-slate-900">{{ ns.quota }}</div>
                <div class="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">
                  Quota
                </div>
              </div>
            </div>

            <button
              v-if="namespace.namespace !== ns.namespace"
              @click="handleSwitch(ns)"
              class="text-blue-600 hover:bg-blue-50 px-3 py-1 rounded-lg text-sm font-bold transition-all border border-blue-100 hover:border-blue-200"
            >
              {{ t('switchTo') }}
            </button>
            <span v-else class="text-emerald-500 text-sm font-bold flex items-center">
              <CheckCircle2 :size="14" class="mr-1" />
              {{ t('active') }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <Modal
      v-model:visible="isModalOpen"
      :title="modalMode === 'add' ? t('addNamespace') : t('edit')"
    >
      <div class="space-y-4">
        <div class="space-y-1">
          <label class="text-xs font-bold text-slate-500 uppercase"
            >{{ t('namespaceId') }} (Optional)</label
          >
          <input
            :disabled="modalMode === 'edit'"
            type="text"
            v-model="editingNs.namespace"
            class="w-full px-3 py-2 border rounded-lg text-sm disabled:bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500/20"
            placeholder="Auto-generated if blank"
          />
        </div>
        <div class="space-y-1">
          <label class="text-xs font-bold text-slate-500 uppercase">{{ t('displayName') }}</label>
          <input
            type="text"
            v-model="editingNs.namespaceShowName"
            class="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
            placeholder="e.g. Production Environment"
          />
        </div>
      </div>
      <template #footer>
        <button @click="isModalOpen = false" class="px-4 py-2 text-sm text-slate-600">
          {{ t('cancel') }}
        </button>
        <button
          @click="handleSave"
          class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium"
        >
          {{ t('save') }}
        </button>
      </template>
    </Modal>
  </div>
</template>
