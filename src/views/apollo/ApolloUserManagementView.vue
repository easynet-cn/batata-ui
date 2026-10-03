<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from '@/i18n'
import apolloApi from '@/api/apollo'
import { useConfirm } from '@/composables/useConfirm'
import type { ApolloUserDTO } from '@/api/apollo'
import FormModal from '@/components/common/FormModal.vue'

const { t } = useI18n()
const { confirm } = useConfirm()
const loading = ref(false)
const users = ref<ApolloUserDTO[]>([])
const error = ref('')
const keyword = ref('')
const showCreate = ref(false)
const form = ref({ userId: '', name: '', email: '', password: '' })

async function load() {
  loading.value = true
  error.value = ''
  try {
    users.value = await apolloApi.listUsers({
      keyword: keyword.value || undefined,
      limit: 100,
    })
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } }; message?: string }
    error.value = err?.response?.data?.message || err?.message || t('error')
  } finally {
    loading.value = false
  }
}

async function create() {
  error.value = ''
  try {
    await apolloApi.createUser(form.value)
    showCreate.value = false
    form.value = { userId: '', name: '', email: '', password: '' }
    await load()
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } }; message?: string }
    error.value = err?.response?.data?.message || err?.message || t('error')
  }
}

async function toggle(u: ApolloUserDTO) {
  error.value = ''
  try {
    await apolloApi.updateUserEnabled(u.userId, !u.enabled)
    await load()
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } }; message?: string }
    error.value = err?.response?.data?.message || err?.message || t('error')
  }
}

async function remove(u: ApolloUserDTO) {
  if (
    !(await confirm({ title: t('confirmDelete'), message: t('confirmDeleteUser'), danger: true }))
  )
    return
  error.value = ''
  try {
    await apolloApi.deleteUser(u.userId)
    await load()
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } }; message?: string }
    error.value = err?.response?.data?.message || err?.message || t('error')
  }
}
onMounted(load)
</script>

<template>
  <div class="p-4">
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-xl font-bold">{{ t('apolloUserManagement') }}</h1>
      <div class="flex gap-2">
        <input
          v-model="keyword"
          class="input input-sm"
          :placeholder="t('search')"
          @keyup.enter="load"
        />
        <button class="btn btn-primary btn-sm" @click="showCreate = true">
          {{ t('apolloCreateUser') }}
        </button>
      </div>
    </div>
    <div v-if="error" class="text-danger text-sm mb-2">{{ error }}</div>
    <div v-if="loading" class="card p-8 text-center text-text-secondary">{{ t('loading') }}</div>
    <div v-else class="card overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-bg-secondary text-text-secondary">
          <tr>
            <th class="text-left px-3 py-2">{{ t('username') }}</th>
            <th class="text-left px-3 py-2">{{ t('name') }}</th>
            <th class="text-left px-3 py-2">{{ t('email') }}</th>
            <th class="text-left px-3 py-2">{{ t('status') }}</th>
            <th class="text-right px-3 py-2">{{ t('actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u.userId" class="border-t border-border">
            <td class="px-3 py-2 font-mono">{{ u.userId }}</td>
            <td class="px-3 py-2">{{ u.name }}</td>
            <td class="px-3 py-2">{{ u.email }}</td>
            <td class="px-3 py-2">
              <span :class="u.enabled ? 'text-success' : 'text-danger'">
                {{ u.enabled ? t('apolloEnable') : t('apolloDisable') }}
              </span>
            </td>
            <td class="px-3 py-2 text-right whitespace-nowrap">
              <button class="btn btn-ghost btn-xs" @click="toggle(u)">
                {{ u.enabled ? t('apolloDisable') : t('apolloEnable') }}
              </button>
              <button class="btn btn-ghost btn-xs text-danger" @click="remove(u)">
                {{ t('delete') }}
              </button>
            </td>
          </tr>
          <tr v-if="users.length === 0">
            <td colspan="5" class="text-center py-6 text-text-tertiary">{{ t('noData') }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <FormModal
      v-model="showCreate"
      :title="t('apolloCreateUser')"
      :submit-text="t('create')"
      @submit="create"
    >
      <div class="space-y-3">
        <div>
          <label class="block text-xs mb-1">{{ t('username') }} *</label
          ><input v-model="form.userId" class="input" />
        </div>
        <div>
          <label class="block text-xs mb-1">{{ t('name') }}</label
          ><input v-model="form.name" class="input" />
        </div>
        <div>
          <label class="block text-xs mb-1">{{ t('email') }}</label
          ><input v-model="form.email" class="input" />
        </div>
        <div>
          <label class="block text-xs mb-1">{{ t('password') }} *</label
          ><input v-model="form.password" type="password" class="input" />
        </div>
      </div>
    </FormModal>
  </div>
</template>
