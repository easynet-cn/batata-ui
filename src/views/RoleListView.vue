<script setup lang="ts">
import { ref, computed } from 'vue'
import { Plus, Trash2, Search } from 'lucide-vue-next'
import { mockRoles } from '@/mock/data'
import type { RoleInfo } from '@/types'
import Modal from '@/components/Modal.vue'
import { useI18n } from '@/i18n'

const { t } = useI18n()

const roles = ref<RoleInfo[]>([...mockRoles])
const searchTerm = ref('')
const isModalOpen = ref(false)
const newRole = ref({ username: '', role: '' })

const handleAddRole = () => {
  if (!newRole.value.username || !newRole.value.role) return
  roles.value = [...roles.value, { ...newRole.value }]
  isModalOpen.value = false
}

const filteredRoles = computed(() =>
  roles.value.filter(
    (r) =>
      r.username.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      r.role.toLowerCase().includes(searchTerm.value.toLowerCase()),
  ),
)

const handleDelete = (idx: number) => {
  roles.value = roles.value.filter((_, i) => i !== idx)
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">{{ t('roleManagement') }}</h1>
        <p class="text-slate-500 mt-1">{{ t('roleSubtitle') }}</p>
      </div>
      <button
        @click="isModalOpen = true"
        class="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all shadow-sm"
      >
        <Plus :size="18" />
        <span>{{ t('bindRole') }}</span>
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
                {{ t('roleName') }}
              </th>
              <th class="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {{ t('username') }}
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
              v-for="(role, idx) in filteredRoles"
              :key="idx"
              class="hover:bg-slate-50 transition-colors"
            >
              <td class="px-6 py-4">
                <span
                  class="px-2 py-1 text-[10px] font-bold uppercase rounded bg-emerald-50 text-emerald-600 border border-emerald-100"
                >
                  {{ role.role }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm font-medium text-slate-700">{{ role.username }}</td>
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

    <Modal v-model:visible="isModalOpen" :title="t('bindRole')">
      <div class="space-y-4">
        <div class="space-y-1">
          <label class="text-xs font-bold text-slate-500 uppercase">{{ t('username') }}</label>
          <input
            type="text"
            v-model="newRole.username"
            class="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
            :placeholder="t('username')"
          />
        </div>
        <div class="space-y-1">
          <label class="text-xs font-bold text-slate-500 uppercase">{{ t('roleName') }}</label>
          <select
            v-model="newRole.role"
            class="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="">Select a role</option>
            <option value="ROLE_ADMIN">ROLE_ADMIN</option>
            <option value="ROLE_DEVELOPER">ROLE_DEVELOPER</option>
            <option value="ROLE_OPERATOR">ROLE_OPERATOR</option>
          </select>
        </div>
      </div>
      <template #footer>
        <button @click="isModalOpen = false" class="px-4 py-2 text-sm text-slate-600">
          {{ t('cancel') }}
        </button>
        <button
          @click="handleAddRole"
          class="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium"
        >
          {{ t('confirm') }}
        </button>
      </template>
    </Modal>
  </div>
</template>
