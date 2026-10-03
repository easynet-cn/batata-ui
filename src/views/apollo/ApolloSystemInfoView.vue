<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from '@/i18n'
import apolloApi from '@/api/apollo'
import type { ApolloSystemInfoDTO } from '@/api/apollo'

const { t } = useI18n()
const loading = ref(false)
const info = ref<ApolloSystemInfoDTO | null>(null)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    info.value = await apolloApi.getSystemInfo()
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } }; message?: string }
    error.value = err?.response?.data?.message || err?.message || t('error')
  } finally {
    loading.value = false
  }
}
onMounted(load)
</script>

<template>
  <div class="p-4">
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-xl font-bold">{{ t('apolloSystemInfo') }}</h1>
      <button class="btn btn-ghost btn-sm" :disabled="loading" @click="load">
        {{ t('refresh') }}
      </button>
    </div>
    <div v-if="error" class="text-danger text-sm">{{ error }}</div>
    <div v-else-if="loading" class="card p-8 text-center text-text-secondary">
      {{ t('loading') }}
    </div>
    <div v-else-if="info" class="space-y-4">
      <div class="card p-4 grid grid-cols-2 gap-4">
        <div>
          <div class="text-xs text-text-tertiary">{{ t('apolloVersion') }}</div>
          <div class="font-mono">{{ info.apolloVersion || '-' }}</div>
        </div>
        <div>
          <div class="text-xs text-text-tertiary">{{ t('apolloCommitId') }}</div>
          <div class="font-mono">{{ info.gitCommitId || '-' }}</div>
        </div>
      </div>
      <div v-for="env in info.environments || []" :key="env.env" class="card p-4">
        <div class="flex items-center justify-between mb-1">
          <span class="font-semibold">{{ env.env }}</span>
          <span :class="env.active ? 'text-success' : 'text-danger'">
            {{ env.active ? t('apolloActive') : t('apolloInactive') }}
          </span>
        </div>
        <div class="text-xs text-text-tertiary">{{ env.metaServerAddress }}</div>
        <div class="mt-2 text-sm">
          <div class="text-text-secondary">{{ t('apolloConfigServices') }}</div>
          <ul class="list-disc ml-5">
            <li v-for="s in env.configServices || []" :key="s.instanceId">
              {{ s.appName }} ({{ s.homepageUrl }})
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
