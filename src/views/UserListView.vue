<script setup lang="ts">
import { ref, computed } from 'vue'
import { Plus, Trash2, Search, UserCircle } from 'lucide-vue-next'
import { mockUsers } from '@/mock/data'
import type { UserInfo } from '@/types'
import Modal from '@/components/Modal.vue'
import { useI18n } from '@/i18n'

const { t } = useI18n()

const users = ref<UserInfo[]>([...mockUsers])
const searchTerm = ref('')
const isModalOpen = ref(false)
const newUser = ref({ username: '', password: '' })

const handleAddUser = () => {
  if (!newUser.value.username) return
  users.value = [...users.value, { username: newUser.value.username }]
  newUser.value = { username: '', password: '' }
  isModalOpen.value = false
}

const handleDelete = (username: string) => {
  if (username === 'admin' || username === 'nacos') {
    alert('System users cannot be deleted.')
    return
  }
  if (confirm(`Delete user ${username}?`)) {
    users.value = users.value.filter((u) => u.username !== username)
  }
}

const filteredUsers = computed(() =>
  users.value.filter((u) => u.username.toLowerCase().includes(searchTerm.value.toLowerCase())),
)
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">{{ t('userManagement') }}</h1>
        <p class="text-slate-500 mt-1">{{ t('userSubtitle') }}</p>
      </div>
      <button
        @click="isModalOpen = true"
        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all shadow-sm"
      >
        <Plus :size="18" />
        <span>{{ t('create') }}</span>
      </button>
    </div>

    <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div class="p-4 border-b border-slate-100 bg-slate-50/50">
        <div class="relative w-72">
          <input
            type="text"
            v-model="searchTerm"
            :placeholder="`${t('search')} ${t('username')}...`"
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
                {{ t('username') }}
              </th>
              <th class="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {{ t('password') }}
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
              v-for="user in filteredUsers"
              :key="user.username"
              class="hover:bg-slate-50 transition-colors"
            >
              <td class="px-6 py-4 flex items-center">
                <div
                  class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3"
                >
                  <UserCircle :size="20" />
                </div>
                <span class="text-sm font-semibold text-slate-800">{{ user.username }}</span>
              </td>
              <td class="px-6 py-4 text-sm text-slate-400 font-mono">********</td>
              <td class="px-6 py-4 text-right">
                <button class="text-blue-600 hover:text-blue-800 text-sm font-medium mr-4">
                  {{ t('resetPassword') }}
                </button>
                <button
                  @click="handleDelete(user.username)"
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

    <Modal v-model:visible="isModalOpen" :title="t('create')">
      <div class="space-y-4">
        <div class="space-y-1">
          <label class="text-xs font-bold text-slate-500 uppercase">{{ t('username') }}</label>
          <input
            type="text"
            v-model="newUser.username"
            class="w-full px-3 py-2 border rounded-lg text-sm"
            :placeholder="t('username')"
          />
        </div>
        <div class="space-y-1">
          <label class="text-xs font-bold text-slate-500 uppercase">{{ t('password') }}</label>
          <input
            type="password"
            v-model="newUser.password"
            class="w-full px-3 py-2 border rounded-lg text-sm"
            :placeholder="t('password')"
          />
        </div>
      </div>
      <template #footer>
        <button @click="isModalOpen = false" class="px-4 py-2 text-sm text-slate-600">
          {{ t('cancel') }}
        </button>
        <button
          @click="handleAddUser"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium"
        >
          {{ t('confirm') }}
        </button>
      </template>
    </Modal>
  </div>
</template>
