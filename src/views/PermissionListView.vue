<script setup lang="ts">
import { ref, computed } from 'vue'
import { Plus, Trash2, Search } from 'lucide-vue-next'
import { mockPermissions } from '@/mock/data'
import type { PermissionInfo } from '@/types'
import Modal from '@/components/Modal.vue'
import { useI18n } from '@/i18n'

const { t } = useI18n()

const perms = ref<PermissionInfo[]>([...mockPermissions])
const searchTerm = ref('')
const isModalOpen = ref(false)
const newPerm = ref<PermissionInfo>({ role: '', resource: '', action: 'RW' })

const handleAddPerm = () => {
  if (!newPerm.value.role || !newPerm.value.resource) return
  perms.value = [...perms.value, { ...newPerm.value }]
  isModalOpen.value = false
}

const filteredPerms = computed(() =>
  perms.value.filter(
    (p) =>
      p.role.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      p.resource.toLowerCase().includes(searchTerm.value.toLowerCase()),
  ),
)

const handleDelete = (idx: number) => {
  perms.value = perms.value.filter((_, i) => i !== idx)
}

const actionOptions = computed(() => [
  { key: 'R', label: t('readOnly').toUpperCase() },
  { key: 'W', label: t('writeOnly').toUpperCase() },
  { key: 'RW', label: t('readWrite').toUpperCase() },
])
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">{{ t('permissionManagement') }}</h1>
        <p class="text-slate-500 mt-1">{{ t('permissionSubtitle') }}</p>
      </div>
      <button
        @click="isModalOpen = true"
        class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all shadow-sm"
      >
        <Plus :size="18" />
        <span>{{ t('addPermission') }}</span>
      </button>
    </div>

    <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div class="p-4 border-b border-slate-100 bg-slate-50/50">
        <div class="relative w-72">
          <input
            type="text"
            v-model="searchTerm"
            :placeholder="`${t('search')}...`"
            class="w-full pl-4 pr-10 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
          />
          <Search class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" :size="16" />
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead class="bg-slate-50 border-b border-slate-100">
            <tr>
              <th class="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {{ t('roles') }}
              </th>
              <th class="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {{ t('resource') }} (Namespace:Group:DataId)
              </th>
              <th class="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {{ t('action') }}
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
              v-for="(perm, idx) in filteredPerms"
              :key="idx"
              class="hover:bg-slate-50 transition-colors"
            >
              <td class="px-6 py-4">
                <span class="text-sm font-bold text-indigo-600">{{ perm.role }}</span>
              </td>
              <td class="px-6 py-4 font-mono text-xs text-slate-500">{{ perm.resource }}</td>
              <td class="px-6 py-4">
                <span
                  :class="[
                    'px-2 py-1 text-[10px] font-bold rounded',
                    perm.action === 'RW'
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-slate-100 text-slate-600',
                  ]"
                >
                  {{
                    perm.action === 'RW'
                      ? t('readWrite')
                      : perm.action === 'R'
                        ? t('readOnly')
                        : t('writeOnly')
                  }}
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <button
                  @click="handleDelete(idx)"
                  class="text-slate-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 :size="16" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <Modal v-model:visible="isModalOpen" :title="t('addPermission')">
      <div class="space-y-4">
        <div class="space-y-1">
          <label class="text-xs font-bold text-slate-500 uppercase">{{ t('roles') }}</label>
          <select
            v-model="newPerm.role"
            class="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">Select a role</option>
            <option value="ROLE_ADMIN">ROLE_ADMIN</option>
            <option value="ROLE_DEVELOPER">ROLE_DEVELOPER</option>
          </select>
        </div>
        <div class="space-y-1">
          <label class="text-xs font-bold text-slate-500 uppercase">{{ t('resource') }}</label>
          <input
            type="text"
            v-model="newPerm.resource"
            class="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
            placeholder="e.g. public:*:*"
          />
          <p class="text-[10px] text-slate-400 mt-1 italic">
            * represents all. Format: namespace:group:dataId
          </p>
        </div>
        <div class="space-y-1">
          <label class="text-xs font-bold text-slate-500 uppercase">{{ t('action') }}</label>
          <div class="flex space-x-2">
            <button
              v-for="act in actionOptions"
              :key="act.key"
              @click="newPerm.action = act.key as any"
              :class="[
                'px-3 py-1.5 rounded text-xs font-bold border transition-all',
                newPerm.action === act.key
                  ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'border-slate-200 text-slate-500 hover:bg-slate-50',
              ]"
            >
              {{ act.label }}
            </button>
          </div>
        </div>
      </div>
      <template #footer>
        <button @click="isModalOpen = false" class="px-4 py-2 text-sm text-slate-600">
          {{ t('cancel') }}
        </button>
        <button
          @click="handleAddPerm"
          class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium"
        >
          {{ t('confirm') }}
        </button>
      </template>
    </Modal>
  </div>
</template>
