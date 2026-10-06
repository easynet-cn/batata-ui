<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from '@/i18n'
import apolloApi from '@/api/apollo'
import { useConfirm } from '@/composables/useConfirm'
import type { ApolloUserTokenDTO } from '@/api/apollo'
import FormModal from '@/components/common/FormModal.vue'

const { t } = useI18n()
const { confirm } = useConfirm()
const loading = ref(false)
const tokens = ref<ApolloUserTokenDTO[]>([])
const error = ref('')
const showCreate = ref(false)
function openCreate() {
  showCreate.value = true
}
const createdToken = ref('')
const form = ref({ name: '', expires: '', operations: '', appIds: '', envs: '', rateLimit: 0 })

async function load() {
  loading.value = true
  error.value = ''
  try {
    tokens.value = await apolloApi.listUserTokens()
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
    const res = await apolloApi.createUserToken({
      name: form.value.name,
      expires: form.value.expires || undefined,
      operations: form.value.operations
        ? form.value.operations.split(',').map((s) => s.trim())
        : undefined,
      appIds: form.value.appIds ? form.value.appIds.split(',').map((s) => s.trim()) : undefined,
      envs: form.value.envs ? form.value.envs.split(',').map((s) => s.trim()) : undefined,
      rateLimit: form.value.rateLimit || undefined,
    })
    createdToken.value = res.tokenValue
    showCreate.value = false
    form.value = { name: '', expires: '', operations: '', appIds: '', envs: '', rateLimit: 0 }
    await load()
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } }; message?: string }
    error.value = err?.response?.data?.message || err?.message || t('error')
  }
}

async function revoke(id: string) {
  error.value = ''
  try {
    await apolloApi.revokeUserToken(id)
    await load()
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } }; message?: string }
    error.value = err?.response?.data?.message || err?.message || t('error')
  }
}

async function rotate(id: string) {
  error.value = ''
  try {
    const r = await apolloApi.rotateUserToken(id)
    createdToken.value = r.tokenValue
    await load()
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } }; message?: string }
    error.value = err?.response?.data?.message || err?.message || t('error')
  }
}

async function remove(id: string) {
  if (
    !(await confirm({ title: t('confirmDelete'), message: t('confirmDeleteToken'), danger: true }))
  )
    return
  error.value = ''
  try {
    await apolloApi.deleteUserToken(id)
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
      <h1 class="text-xl font-bold">{{ t('apolloUserTokens') }}</h1>
      <button class="btn btn-primary btn-sm" @click="openCreate()">{{ t('add') }}</button>
    </div>
    <div v-if="error" class="text-danger text-sm mb-2">{{ error }}</div>
    <div v-if="createdToken" class="card p-3 mb-2 bg-bg-secondary text-sm break-all">
      {{ t('apolloTokenValue') }}: <span class="font-mono">{{ createdToken }}</span>
    </div>
    <div v-if="loading" class="card p-8 text-center text-text-secondary">{{ t('loading') }}</div>
    <div v-else class="card overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-bg-secondary text-text-secondary">
          <tr>
            <th class="text-left px-3 py-2">{{ t('name') }}</th>
            <th class="text-left px-3 py-2">{{ t('apolloExpires') }}</th>
            <th class="text-left px-3 py-2">{{ t('apolloOperations') }}</th>
            <th class="text-right px-3 py-2">{{ t('actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="tk in tokens" :key="tk.id" class="border-t border-border">
            <td class="px-3 py-2">{{ tk.name }}</td>
            <td class="px-3 py-2">{{ tk.expires }}</td>
            <td class="px-3 py-2">{{ (tk.operations || []).join(',') }}</td>
            <td class="px-3 py-2 text-right whitespace-nowrap">
              <button class="btn btn-ghost btn-xs" @click="rotate(tk.id)">
                {{ t('apolloRotate') }}
              </button>
              <button class="btn btn-ghost btn-xs" @click="revoke(tk.id)">
                {{ t('apolloRevoke') }}
              </button>
              <button class="btn btn-ghost btn-xs text-danger" @click="remove(tk.id)">
                {{ t('delete') }}
              </button>
            </td>
          </tr>
          <tr v-if="tokens.length === 0">
            <td colspan="4" class="text-center py-6 text-text-tertiary">{{ t('noData') }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <FormModal
      v-model="showCreate"
      :title="t('apolloUserTokens')"
      :submit-text="t('create')"
      @submit="create"
    >
      <div class="space-y-3">
        <div>
          <label class="block text-xs mb-1">{{ t('name') }} *</label
          ><input v-model="form.name" class="input" />
        </div>
        <div>
          <label class="block text-xs mb-1">{{ t('apolloExpires') }}</label
          ><input v-model="form.expires" class="input" placeholder="2026-12-31" />
        </div>
        <div>
          <label class="block text-xs mb-1">{{ t('apolloOperations') }}</label
          ><input v-model="form.operations" class="input" placeholder="READ,WRITE" />
        </div>
        <div>
          <label class="block text-xs mb-1">appIds</label
          ><input v-model="form.appIds" class="input" placeholder="app1,app2" />
        </div>
        <div>
          <label class="block text-xs mb-1">envs</label
          ><input v-model="form.envs" class="input" placeholder="DEV,PRO" />
        </div>
        <div>
          <label class="block text-xs mb-1">{{ t('apolloRateLimit') }}</label
          ><input v-model.number="form.rateLimit" type="number" class="input" />
        </div>
      </div>
    </FormModal>
  </div>
</template>
