<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from '@/i18n'
import { Network, Plus } from '@lucide/vue'
import apolloApi from '@/api/apollo'
import type { ApolloEnvCluster } from '@/types/apollo'

const { t } = useI18n()
const route = useRoute()
const appId = ref<string>((route.query.appId as string) || '')

const envClusters = ref<ApolloEnvCluster[]>([])
const loading = ref(false)
const showCreate = ref(false)
const saving = ref(false)
const form = ref({ env: 'DEV', name: '', comment: '' })

async function load() {
  if (!appId.value) return
  loading.value = true
  try {
    envClusters.value = await apolloApi.getEnvClusters(appId.value)
    if (envClusters.value.length > 0) form.value.env = envClusters.value[0].env
  } finally {
    loading.value = false
  }
}

async function createCluster() {
  if (!form.value.name) return
  saving.value = true
  try {
    await apolloApi.createCluster(form.value.env, appId.value, {
      name: form.value.name,
      comment: form.value.comment,
    })
    showCreate.value = false
    form.value = { env: form.value.env, name: '', comment: '' }
    await load()
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-2">
        <Network class="w-5 h-5 text-emerald-600" />
        <h1 class="text-lg font-semibold text-text-primary">{{ t('apolloClusters') }}</h1>
        <span v-if="appId" class="text-xs text-text-secondary font-mono">{{ appId }}</span>
      </div>
      <button v-if="appId" class="btn btn-primary btn-sm" @click="showCreate = true">
        <Plus class="w-4 h-4" /> {{ t('apolloCreateCluster') }}
      </button>
    </div>

    <div v-if="!appId" class="card p-8 text-center text-text-tertiary">
      Open from an App to manage its clusters.
    </div>
    <div v-else class="space-y-4">
      <div v-for="ec in envClusters" :key="ec.env" class="card p-4">
        <p class="text-sm font-semibold text-text-primary mb-2">{{ ec.env }}</p>
        <div class="flex flex-wrap gap-2">
          <span v-for="c in ec.clusters" :key="c" class="badge badge-info">{{ c }}</span>
          <span v-if="ec.clusters.length === 0" class="text-xs text-text-tertiary">—</span>
        </div>
      </div>
    </div>

    <div
      v-if="showCreate"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="showCreate = false"
    >
      <div class="bg-bg rounded-xl shadow-lg w-full max-w-md p-6">
        <h3 class="text-base font-semibold mb-4">{{ t('apolloCreateCluster') }}</h3>
        <div class="space-y-3">
          <div>
            <label class="block text-xs mb-1">{{ t('apolloEnvs') }}</label>
            <select v-model="form.env" class="input">
              <option v-for="ec in envClusters" :key="ec.env" :value="ec.env">{{ ec.env }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs mb-1">{{ t('apolloClusterName') }} *</label>
            <input v-model="form.name" class="input" />
          </div>
          <div>
            <label class="block text-xs mb-1">{{ t('apolloComment') }}</label>
            <input v-model="form.comment" class="input" />
          </div>
        </div>
        <div class="flex justify-end gap-2 mt-6">
          <button class="btn btn-ghost btn-sm" @click="showCreate = false">
            {{ t('cancel') }}
          </button>
          <button class="btn btn-primary btn-sm" :disabled="saving" @click="createCluster">
            {{ t('create') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
