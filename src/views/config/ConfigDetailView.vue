<template>
  <div class="space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <button @click="goBack" class="btn btn-ghost btn-sm">
          <ArrowLeft class="w-3.5 h-3.5" />
        </button>
        <div>
          <h1 class="text-base font-semibold text-text-primary">{{ t('configDetail') }}</h1>
          <p class="text-xs text-text-secondary mt-0.5">{{ config?.dataId }}</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <router-link
          :to="{
            name: 'config-history',
            query: { dataId: config?.dataId, group: config?.group, tenant: namespace.namespace },
          }"
          class="btn btn-secondary btn-sm"
        >
          <History class="w-3.5 h-3.5" />
          {{ t('history') }}
        </router-link>
        <router-link
          :to="{
            name: 'config-edit',
            query: { dataId: config?.dataId, group: config?.group, tenant: namespace.namespace },
          }"
          class="btn btn-primary btn-sm"
        >
          <Pencil class="w-3.5 h-3.5" />
          {{ t('edit') }}
        </router-link>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="card p-8 flex items-center justify-center">
      <Loader2 class="w-8 h-8 animate-spin text-primary" />
    </div>

    <!-- Config Info -->
    <template v-else-if="config">
      <div class="card">
        <div class="p-4">
          <h2 class="text-sm font-semibold text-text-primary mb-4">{{ t('basicInfo') }}</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label class="block text-sm text-text-tertiary mb-1">{{ t('dataId') }}</label>
              <p class="text-text-primary font-medium">{{ config.dataId }}</p>
            </div>
            <div>
              <label class="block text-sm text-text-tertiary mb-1">{{ t('group') }}</label>
              <p class="text-text-primary font-medium">{{ config.group }}</p>
            </div>
            <div>
              <label class="block text-sm text-text-tertiary mb-1">{{ t('namespace') }}</label>
              <p class="text-text-primary font-medium">{{ namespace.namespaceShowName }}</p>
            </div>
            <div>
              <label class="block text-sm text-text-tertiary mb-1">{{ t('appName') }}</label>
              <p class="text-text-primary font-medium">{{ config.appName || '-' }}</p>
            </div>
            <div>
              <label class="block text-sm text-text-tertiary mb-1">{{ t('configType') }}</label>
              <span class="badge badge-info">{{ config.type?.toUpperCase() || 'TEXT' }}</span>
            </div>
            <div>
              <label class="block text-sm text-text-tertiary mb-1">MD5</label>
              <p class="text-text-primary font-mono text-sm">{{ config.md5 }}</p>
            </div>
            <div>
              <label class="block text-sm text-text-tertiary mb-1">{{ t('createTime') }}</label>
              <p class="text-text-primary">{{ formatTime(config.createTime) }}</p>
            </div>
            <div>
              <label class="block text-sm text-text-tertiary mb-1">{{ t('modifyTime') }}</label>
              <p class="text-text-primary">{{ formatTime(config.modifyTime) }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Config Content -->
      <div class="card">
        <div class="p-4">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-sm font-semibold text-text-primary">{{ t('configContent') }}</h2>
            <button @click="copyContent" class="btn btn-ghost btn-sm">
              <Copy class="w-3.5 h-3.5" />
              {{ t('copy') }}
            </button>
          </div>
          <pre
            class="bg-bg-tertiary rounded-lg p-4 overflow-x-auto text-sm font-mono text-text-primary"
            >{{ config.content }}</pre
          >
        </div>
      </div>

      <!-- Description -->
      <div v-if="config.desc" class="card">
        <div class="p-4">
          <h2 class="text-sm font-semibold text-text-primary mb-4">{{ t('description') }}</h2>
          <p class="text-text-secondary">{{ config.desc }}</p>
        </div>
      </div>
    </template>

    <!-- Not Found -->
    <div v-else class="card p-8 text-center">
      <p class="text-text-secondary">{{ t('configNotFound') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, History, Pencil, Loader2, Copy } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import nacosApi from '@/api/nacos'
import type { ConfigInfo, Namespace } from '@/types'

const props = defineProps<{
  namespace: Namespace
}>()

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

// State
const loading = ref(false)
const config = ref<ConfigInfo | null>(null)

// Methods
const goBack = () => {
  router.back()
}

const fetchConfig = async () => {
  const { dataId, group, tenant } = route.query
  if (!dataId || !group) return

  loading.value = true
  try {
    const response = await nacosApi.getConfig(
      dataId as string,
      group as string,
      (tenant as string) || props.namespace.namespace,
    )
    config.value = response.data.data
  } catch (error) {
    console.error('Failed to fetch config:', error)
  } finally {
    loading.value = false
  }
}

const copyContent = async () => {
  if (!config.value?.content) return
  try {
    await navigator.clipboard.writeText(config.value.content)
  } catch (error) {
    console.error('Failed to copy:', error)
  }
}

const formatTime = (timestamp: number) => {
  if (!timestamp) return '-'
  return new Date(timestamp).toLocaleString()
}

// Lifecycle
onMounted(() => {
  fetchConfig()
})
</script>
