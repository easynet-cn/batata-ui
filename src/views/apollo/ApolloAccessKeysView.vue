<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from '@/i18n'
import { KeyRound, Plus, Trash2, ShieldCheck, ShieldOff } from '@lucide/vue'
import apolloApi from '@/api/apollo'
import type { ApolloAccessKeyDTO } from '@/types/apollo'

const { t } = useI18n()
const route = useRoute()
const appId = ref<string>((route.query.appId as string) || '')

const keys = ref<ApolloAccessKeyDTO[]>([])
const loading = ref(false)

async function load() {
  if (!appId.value) return
  loading.value = true
  try {
    keys.value = await apolloApi.listAccessKeys(appId.value)
  } finally {
    loading.value = false
  }
}

async function createKey() {
  await apolloApi.createAccessKey(appId.value)
  await load()
}

async function removeKey(k: ApolloAccessKeyDTO) {
  if (!confirm('Delete access key?')) return
  await apolloApi.deleteAccessKey(appId.value, k.id!)
  await load()
}

async function toggle(k: ApolloAccessKeyDTO) {
  await apolloApi.setAccessKeyEnabled(appId.value, 'DEV', k.id!, !k.isEnabled)
  await load()
}

onMounted(load)
</script>

<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-2">
        <KeyRound class="w-5 h-5 text-emerald-600" />
        <h1 class="text-lg font-semibold text-text-primary">{{ t('apolloAccessKeys') }}</h1>
        <span v-if="appId" class="text-xs text-text-secondary font-mono">{{ appId }}</span>
      </div>
      <button v-if="appId" class="btn btn-primary btn-sm" @click="createKey">
        <Plus class="w-4 h-4" /> {{ t('create') }}
      </button>
    </div>

    <div v-if="!appId" class="card p-8 text-center text-text-tertiary">
      Open from an App to manage access keys.
    </div>
    <div v-else class="card overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-bg-secondary text-text-secondary">
          <tr>
            <th class="text-left px-4 py-2">ID</th>
            <th class="text-left px-4 py-2">{{ t('apolloSecret') }}</th>
            <th class="text-left px-4 py-2">{{ t('apolloEnabled') }}</th>
            <th class="text-right px-4 py-2"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="4" class="text-center py-8 text-text-secondary">{{ t('loading') }}</td>
          </tr>
          <tr v-else-if="keys.length === 0">
            <td colspan="4" class="text-center py-8 text-text-secondary">{{ t('noData') }}</td>
          </tr>
          <tr v-for="k in keys" :key="k.id" class="border-t border-border">
            <td class="px-4 py-2 text-text-primary">{{ k.id }}</td>
            <td class="px-4 py-2 font-mono text-text-secondary">{{ k.secret }}</td>
            <td class="px-4 py-2">
              <span v-if="k.isEnabled" class="badge badge-success">{{ t('apolloEnabled') }}</span>
              <span v-else class="badge badge-warning">{{ t('apolloDisabled') }}</span>
            </td>
            <td class="px-4 py-2 text-right whitespace-nowrap">
              <button class="btn btn-ghost btn-sm" @click="toggle(k)">
                <ShieldCheck v-if="!k.isEnabled" class="w-4 h-4" />
                <ShieldOff v-else class="w-4 h-4" />
              </button>
              <button class="btn btn-ghost btn-sm text-danger" @click="removeKey(k)">
                <Trash2 class="w-4 h-4" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
