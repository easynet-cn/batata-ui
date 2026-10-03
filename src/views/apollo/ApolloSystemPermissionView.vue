<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from '@/i18n'
import apolloApi from '@/api/apollo'

const { t } = useI18n()
const loading = ref(false)
const hasRoot = ref(false)
const users = ref<string[]>([])
const error = ref('')
const newUser = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    const root = await apolloApi.getRootPermission()
    hasRoot.value = root.hasPermission
    if (hasRoot.value) users.value = await apolloApi.listCreateAppPermissionUsers()
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } }; message?: string }
    error.value = err?.response?.data?.message || err?.message || t('error')
  } finally {
    loading.value = false
  }
}

async function grant() {
  const uid = newUser.value.trim()
  if (!uid) return
  error.value = ''
  try {
    await apolloApi.grantCreateAppPermission([uid])
    newUser.value = ''
    await load()
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } }; message?: string }
    error.value = err?.response?.data?.message || err?.message || t('error')
  }
}

async function revoke(uid: string) {
  error.value = ''
  try {
    await apolloApi.revokeCreateAppPermission(uid)
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
    <h1 class="text-xl font-bold mb-4">{{ t('apolloSystemPermission') }}</h1>
    <div v-if="error" class="text-danger text-sm mb-2">{{ error }}</div>
    <div v-if="loading" class="card p-8 text-center text-text-secondary">{{ t('loading') }}</div>
    <div v-else-if="!hasRoot" class="card p-6 text-center text-text-secondary">
      {{ t('apolloNoRootPermission') }}
    </div>
    <div v-else class="card p-4">
      <div class="text-sm text-text-secondary mb-2">{{ t('apolloCreateAppPermissionUsers') }}</div>
      <div class="flex gap-2 mb-3">
        <input
          v-model="newUser"
          class="input input-sm flex-1"
          :placeholder="t('username')"
          @keyup.enter="grant"
        />
        <button class="btn btn-primary btn-sm" @click="grant">{{ t('apolloGrant') }}</button>
      </div>
      <ul class="space-y-1">
        <li
          v-for="u in users"
          :key="u"
          class="flex items-center justify-between bg-bg-secondary rounded px-2 py-1 text-sm"
        >
          <span class="font-mono">{{ u }}</span>
          <button class="btn btn-ghost btn-xs text-danger" @click="revoke(u)">
            {{ t('apolloRevoke') }}
          </button>
        </li>
        <li v-if="users.length === 0" class="text-text-tertiary text-sm">{{ t('noData') }}</li>
      </ul>
    </div>
  </div>
</template>
