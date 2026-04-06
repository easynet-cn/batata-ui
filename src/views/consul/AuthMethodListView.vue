<template>
  <div class="space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-base font-semibold text-text-primary">{{ t('authMethods') }}</h1>
        <p class="text-xs text-text-secondary mt-0.5">{{ t('authMethodsDesc') }}</p>
      </div>
      <div class="flex items-center gap-2">
        <button @click="loadAuthMethods" class="btn btn-secondary btn-sm">
          <RefreshCw class="w-3.5 h-3.5" />
          {{ t('refresh') }}
        </button>
      </div>
    </div>

    <!-- Search & Filter Bar -->
    <div class="card">
      <div class="p-3">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div class="md:col-span-2">
            <div class="relative">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input
                v-model="searchQuery"
                type="text"
                class="input pl-10"
                :placeholder="t('searchAuthMethods')"
              />
            </div>
          </div>
          <div>
            <select v-model="typeFilter" class="input">
              <option value="">{{ t('consulFilterAll') }}</option>
              <option value="kubernetes">Kubernetes</option>
              <option value="jwt">JWT</option>
              <option value="oidc">OIDC</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Auth Method List -->
    <div class="card">
      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>{{ t('name') }}</th>
              <th>{{ t('authMethodType') }}</th>
              <th>{{ t('authMethodDisplayName') }}</th>
              <th>{{ t('tokenLocality') }}</th>
              <th>{{ t('maxTokenTTL') }}</th>
              <th>{{ t('description') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="store.loading">
              <td colspan="6" class="text-center py-6">
                <Loader2 class="w-5 h-5 animate-spin mx-auto text-primary" />
              </td>
            </tr>
            <tr v-else-if="filteredMethods.length === 0">
              <td colspan="6" class="text-center py-6 text-text-secondary">
                {{ t('noAuthMethods') }}
              </td>
            </tr>
            <tr v-for="method in filteredMethods" :key="method.Name" class="hover:bg-bg-secondary">
              <td>
                <RouterLink
                  :to="{ name: 'consul-auth-method-detail', params: { name: method.Name } }"
                  class="font-medium text-fuchsia-600 hover:text-fuchsia-700 hover:underline dark:text-fuchsia-400 dark:hover:text-fuchsia-300"
                >
                  {{ method.Name }}
                </RouterLink>
              </td>
              <td>
                <span class="badge badge-info">{{ method.Type }}</span>
              </td>
              <td>
                <span class="text-text-primary">{{ method.DisplayName || '-' }}</span>
              </td>
              <td>
                <span v-if="method.TokenLocality" class="badge badge-warning text-xs">
                  {{ method.TokenLocality }}
                </span>
                <span v-else class="text-xs text-text-tertiary">-</span>
              </td>
              <td>
                <span class="text-text-secondary">{{ method.MaxTokenTTL || '-' }}</span>
              </td>
              <td>
                <span class="text-text-secondary text-xs">{{ method.Description || '-' }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="flex items-center justify-between p-4 border-t border-border">
        <div class="text-sm text-text-secondary">
          {{ t('total') }}: {{ filteredMethods.length }} {{ t('items') }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { RefreshCw, Loader2, Search } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import { useConsulStore } from '@/stores/consul'
import { toast } from '@/utils/error'
import { logger } from '@/utils/logger'

const { t } = useI18n()
const store = useConsulStore()

const searchQuery = ref('')
const typeFilter = ref('')

const filteredMethods = computed(() => {
  let methods = store.authMethods

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    methods = methods.filter(
      (m) => m.Name.toLowerCase().includes(q) || (m.DisplayName || '').toLowerCase().includes(q),
    )
  }

  if (typeFilter.value) {
    methods = methods.filter((m) => m.Type === typeFilter.value)
  }

  return methods
})

async function loadAuthMethods() {
  try {
    await store.fetchAuthMethods()
  } catch (error) {
    logger.error('Failed to fetch auth methods:', error)
    toast.apiError(error)
  }
}

onMounted(() => {
  loadAuthMethods()
})
</script>
