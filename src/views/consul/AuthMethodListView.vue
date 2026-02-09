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

    <!-- Auth Method List -->
    <div class="card">
      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>{{ t('name') }}</th>
              <th>{{ t('authMethodType') }}</th>
              <th>{{ t('authMethodDisplayName') }}</th>
              <th>{{ t('maxTokenTTL') }}</th>
              <th>{{ t('description') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="store.loading">
              <td colspan="5" class="text-center py-6">
                <Loader2 class="w-5 h-5 animate-spin mx-auto text-primary" />
              </td>
            </tr>
            <tr v-else-if="store.authMethods.length === 0">
              <td colspan="5" class="text-center py-6 text-text-secondary">
                {{ t('noAuthMethods') }}
              </td>
            </tr>
            <tr v-for="method in store.authMethods" :key="method.Name">
              <td>
                <RouterLink
                  :to="{ name: 'consul-auth-method-detail', params: { name: method.Name } }"
                  class="font-medium text-primary hover:underline"
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
                <span class="text-text-secondary">{{ method.MaxTokenTTL || '-' }}</span>
              </td>
              <td>
                <span class="text-text-secondary">{{ method.Description || '-' }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { RefreshCw, Loader2 } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import { useConsulStore } from '@/stores/consul'
import { toast } from '@/utils/error'
import { logger } from '@/utils/logger'

const { t } = useI18n()
const store = useConsulStore()

async function loadAuthMethods() {
  try {
    await store.fetchAuthMethods()
  } catch (error) {
    logger.error('Failed to fetch auth methods:', error)
    toast.error(t('operationFailed'))
  }
}

onMounted(() => {
  loadAuthMethods()
})
</script>
