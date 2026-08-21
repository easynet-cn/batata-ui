<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from '@/i18n'
import { Search, Globe } from '@lucide/vue'
import apolloApi from '@/api/apollo'
import type { ApolloSearchResultDTO } from '@/types/apollo'

const { t } = useI18n()

const key = ref('')
const value = ref('')
const results = ref<ApolloSearchResultDTO[]>([])
const loading = ref(false)
const searched = ref(false)

async function runSearch() {
  if (!key.value && !value.value) return
  loading.value = true
  searched.value = true
  try {
    results.value = await apolloApi.search(key.value || undefined, value.value || undefined)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="p-6 max-w-5xl">
    <div class="flex items-center gap-2 mb-6">
      <Globe class="w-5 h-5 text-emerald-600" />
      <h1 class="text-lg font-semibold text-text-primary">{{ t('apolloGlobalSearch') }}</h1>
    </div>

    <div class="flex flex-wrap items-end gap-3 mb-4">
      <div>
        <label class="block text-xs mb-1">{{ t('apolloSearchKey') }}</label>
        <input v-model="key" class="input" :placeholder="'timeout'" />
      </div>
      <div>
        <label class="block text-xs mb-1">{{ t('apolloSearchValue') }}</label>
        <input v-model="value" class="input" :placeholder="'3000'" />
      </div>
      <button class="btn btn-primary btn-sm" :disabled="loading" @click="runSearch">
        <Search class="w-4 h-4" />{{ t('apolloGlobalSearch') }}
      </button>
    </div>

    <div v-if="loading" class="card p-8 text-center text-text-secondary">{{ t('loading') }}</div>
    <div
      v-else-if="searched && results.length === 0"
      class="card p-8 text-center text-text-secondary"
    >
      {{ t('noData') }}
    </div>
    <div v-else-if="results.length" class="card overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-bg-secondary text-text-secondary">
          <tr>
            <th class="text-left px-4 py-2">{{ t('apolloAppId') }}</th>
            <th class="text-left px-4 py-2">{{ t('apolloEnvs') }}</th>
            <th class="text-left px-4 py-2">{{ t('apolloClusterName') }}</th>
            <th class="text-left px-4 py-2">{{ t('apolloNamespaceName') }}</th>
            <th class="text-left px-4 py-2">{{ t('apolloItemKey') }}</th>
            <th class="text-left px-4 py-2">{{ t('apolloItemValue') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(r, i) in results" :key="i" class="border-t border-border">
            <td class="px-4 py-2 font-mono text-text-primary">{{ r.appId }}</td>
            <td class="px-4 py-2 text-text-secondary">{{ r.env }}</td>
            <td class="px-4 py-2 text-text-secondary">{{ r.clusterName }}</td>
            <td class="px-4 py-2 text-text-secondary">{{ r.namespaceName }}</td>
            <td class="px-4 py-2 font-mono text-text-primary">{{ r.key }}</td>
            <td class="px-4 py-2 text-text-primary max-w-xs truncate">{{ r.value }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
