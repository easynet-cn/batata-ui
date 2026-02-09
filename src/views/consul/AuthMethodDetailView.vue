<template>
  <div class="space-y-4">
    <!-- Back Button -->
    <div>
      <RouterLink
        :to="{ name: 'consul-auth-methods' }"
        class="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft class="w-4 h-4" />
        {{ t('backToAuthMethods') }}
      </RouterLink>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <Loader2 class="w-6 h-6 animate-spin text-primary" />
    </div>

    <template v-else-if="authMethod">
      <!-- Page Header -->
      <div>
        <h1 class="text-base font-semibold text-text-primary">{{ authMethod.Name }}</h1>
        <p class="text-xs text-text-secondary mt-0.5">{{ t('authMethodDetail') }}</p>
      </div>

      <!-- Info Card -->
      <div class="card p-5 space-y-4">
        <h2 class="text-sm font-bold text-text-primary">{{ t('basicInfo') }}</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p class="text-xs text-text-tertiary mb-0.5">{{ t('name') }}</p>
            <p class="text-sm font-medium text-text-primary">{{ authMethod.Name }}</p>
          </div>
          <div>
            <p class="text-xs text-text-tertiary mb-0.5">{{ t('authMethodType') }}</p>
            <span class="badge badge-info">{{ authMethod.Type }}</span>
          </div>
          <div>
            <p class="text-xs text-text-tertiary mb-0.5">{{ t('authMethodDisplayName') }}</p>
            <p class="text-sm text-text-primary">{{ authMethod.DisplayName || '-' }}</p>
          </div>
          <div>
            <p class="text-xs text-text-tertiary mb-0.5">{{ t('tokenLocality') }}</p>
            <p class="text-sm text-text-primary">{{ authMethod.TokenLocality || '-' }}</p>
          </div>
          <div>
            <p class="text-xs text-text-tertiary mb-0.5">{{ t('maxTokenTTL') }}</p>
            <p class="text-sm text-text-primary">{{ authMethod.MaxTokenTTL || '-' }}</p>
          </div>
          <div>
            <p class="text-xs text-text-tertiary mb-0.5">{{ t('description') }}</p>
            <p class="text-sm text-text-primary">{{ authMethod.Description || '-' }}</p>
          </div>
        </div>

        <!-- Config JSON -->
        <div v-if="authMethod.Config && Object.keys(authMethod.Config).length > 0">
          <p class="text-xs text-text-tertiary mb-1.5">{{ t('configuration') }}</p>
          <pre
            class="text-xs font-mono bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-border overflow-x-auto"
            >{{ JSON.stringify(authMethod.Config, null, 2) }}</pre
          >
        </div>
      </div>

      <!-- Binding Rules -->
      <div class="card">
        <div class="px-5 py-4 border-b border-border">
          <h2 class="text-sm font-bold text-text-primary">{{ t('bindingRules') }}</h2>
        </div>
        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>{{ t('bindingRuleId') }}</th>
                <th>{{ t('description') }}</th>
                <th>{{ t('selector') }}</th>
                <th>{{ t('bindType') }}</th>
                <th>{{ t('bindName') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="bindingRules.length === 0">
                <td colspan="5" class="text-center py-6 text-text-secondary">
                  {{ t('noBindingRules') }}
                </td>
              </tr>
              <tr v-for="rule in bindingRules" :key="rule.ID">
                <td>
                  <span class="font-mono text-xs" :title="rule.ID">
                    {{ rule.ID.length > 8 ? rule.ID.substring(0, 8) + '...' : rule.ID }}
                  </span>
                </td>
                <td>
                  <span class="text-text-secondary">{{ rule.Description || '-' }}</span>
                </td>
                <td>
                  <span class="text-text-secondary font-mono text-xs">{{
                    rule.Selector || '-'
                  }}</span>
                </td>
                <td>
                  <span class="badge badge-primary">{{ rule.BindType }}</span>
                </td>
                <td>
                  <span class="text-text-primary font-medium">{{ rule.BindName }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { ArrowLeft, Loader2 } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import consulApi from '@/api/consul'
import { toast } from '@/utils/error'
import { logger } from '@/utils/logger'
import type { ConsulACLAuthMethod, ConsulACLBindingRule } from '@/types/consul'

const { t } = useI18n()
const route = useRoute()

const loading = ref(true)
const authMethod = ref<ConsulACLAuthMethod | null>(null)
const bindingRules = ref<ConsulACLBindingRule[]>([])

async function loadData() {
  const name = route.params.name as string
  loading.value = true
  try {
    const [methodRes, rulesRes] = await Promise.all([
      consulApi.getACLAuthMethod(name),
      consulApi.listBindingRules(name),
    ])
    authMethod.value = methodRes.data
    bindingRules.value = rulesRes.data || []
  } catch (error) {
    logger.error('Failed to fetch auth method detail:', error)
    toast.error(t('operationFailed'))
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>
