<template>
  <div class="space-y-4">
    <!-- Back Button -->
    <div>
      <RouterLink
        :to="{ name: 'consul-config-entries' }"
        class="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft class="w-4 h-4" />
        {{ t('backToConfigEntries') }}
      </RouterLink>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <Loader2 class="w-6 h-6 animate-spin text-primary" />
    </div>

    <!-- Error -->
    <div v-else-if="errorMsg" class="card p-6 text-center text-text-secondary">
      <AlertTriangle class="w-6 h-6 mx-auto mb-2 opacity-50" />
      <p class="text-sm">{{ errorMsg }}</p>
    </div>

    <template v-else-if="entry">
      <!-- Page Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-base font-semibold text-text-primary">{{ entry.Name }}</h1>
          <p class="text-xs text-text-secondary mt-0.5">{{ t('configEntryDetail') }}</p>
        </div>
        <div class="flex items-center gap-2">
          <button @click="copyJson" class="btn btn-secondary btn-sm">
            <Copy class="w-3.5 h-3.5" />
            {{ t('copy') }}
          </button>
        </div>
      </div>

      <!-- Overview Card -->
      <div class="card p-5 space-y-4">
        <h2 class="text-sm font-bold text-text-primary">{{ t('basicInfo') }}</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p class="text-xs text-text-tertiary mb-0.5">{{ t('kind') }}</p>
            <span class="badge badge-fuchsia">{{ entry.Kind }}</span>
          </div>
          <div>
            <p class="text-xs text-text-tertiary mb-0.5">{{ t('name') }}</p>
            <p class="text-sm font-medium text-text-primary">{{ entry.Name }}</p>
          </div>
          <div>
            <p class="text-xs text-text-tertiary mb-0.5">{{ t('namespace') }}</p>
            <p class="text-sm text-text-primary">{{ entry.Namespace || '-' }}</p>
          </div>
          <div>
            <p class="text-xs text-text-tertiary mb-0.5">{{ t('consulPartition') }}</p>
            <p class="text-sm text-text-primary">{{ entry.Partition || '-' }}</p>
          </div>
          <div>
            <p class="text-xs text-text-tertiary mb-0.5">{{ t('createIndex') }}</p>
            <p class="text-sm font-mono text-text-primary">{{ entry.CreateIndex }}</p>
          </div>
          <div>
            <p class="text-xs text-text-tertiary mb-0.5">{{ t('modifyIndex') }}</p>
            <p class="text-sm font-mono text-text-primary">{{ entry.ModifyIndex }}</p>
          </div>
        </div>
      </div>

      <!-- Service Defaults Specific Fields -->
      <div
        v-if="entry.Kind === 'service-defaults' && hasServiceDefaultsFields"
        class="card p-5 space-y-4"
      >
        <h2 class="text-sm font-bold text-text-primary">
          {{ t('consulServiceDefaultsSettings') }}
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div v-if="entry.Protocol">
            <p class="text-xs text-text-tertiary mb-0.5">{{ t('protocol') }}</p>
            <span class="badge badge-info">{{ entry.Protocol }}</span>
          </div>
          <div v-if="entry.MeshGateway">
            <p class="text-xs text-text-tertiary mb-0.5">{{ t('consulMeshGatewayMode') }}</p>
            <span class="badge badge-fuchsia">
              {{ getMeshGatewayMode(entry.MeshGateway) }}
            </span>
          </div>
          <div v-if="entry.TransparentProxy !== undefined">
            <p class="text-xs text-text-tertiary mb-0.5">{{ t('consulTransparentProxy') }}</p>
            <span :class="['badge', entry.TransparentProxy ? 'badge-success' : 'badge-warning']">
              {{ entry.TransparentProxy ? t('enabled') : t('disabled') }}
            </span>
          </div>
        </div>
      </div>

      <!-- Full JSON Content -->
      <div class="card p-5 space-y-4">
        <h2 class="text-sm font-bold text-text-primary">{{ t('consulConfigEntryContent') }}</h2>
        <pre
          class="p-4 bg-bg-secondary rounded-xl border border-border overflow-x-auto text-xs text-text-primary font-mono whitespace-pre-wrap break-all max-h-[60vh]"
        ><code>{{ formattedJson }}</code></pre>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { ArrowLeft, Loader2, AlertTriangle, Copy } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import consulApi from '@/api/consul'
import { toast } from '@/utils/error'
import { logger } from '@/utils/logger'
import type { ConsulConfigEntry, ConsulConfigEntryKind } from '@/types/consul'

const { t } = useI18n()
const route = useRoute()

const loading = ref(false)
const errorMsg = ref('')
const entry = ref<ConsulConfigEntry | null>(null)

const kind = computed(() => route.params.kind as ConsulConfigEntryKind)
const name = computed(() => route.params.name as string)

function getMeshGatewayMode(gateway: unknown): string {
  if (gateway && typeof gateway === 'object' && 'Mode' in gateway) {
    return String((gateway as { Mode: unknown }).Mode) || '-'
  }
  return '-'
}

const formattedJson = computed(() => {
  if (!entry.value) return ''
  try {
    return JSON.stringify(entry.value, null, 2)
  } catch {
    return String(entry.value)
  }
})

const hasServiceDefaultsFields = computed(() => {
  if (!entry.value) return false
  return (
    entry.value.Protocol !== undefined ||
    entry.value.MeshGateway !== undefined ||
    entry.value.TransparentProxy !== undefined
  )
})

async function loadConfigEntry() {
  if (!kind.value || !name.value) {
    errorMsg.value = t('consulConfigEntryNotFound')
    return
  }
  loading.value = true
  errorMsg.value = ''
  try {
    const response = await consulApi.getConfigEntry(kind.value, name.value)
    entry.value = response.data
  } catch (err) {
    logger.error('Failed to load config entry:', err)
    errorMsg.value = t('consulConfigEntryLoadError')
    toast.apiError(err)
  } finally {
    loading.value = false
  }
}

async function copyJson() {
  if (formattedJson.value) {
    try {
      await navigator.clipboard.writeText(formattedJson.value)
      toast.success(t('success'))
    } catch (err) {
      toast.apiError(err)
    }
  }
}

onMounted(() => {
  loadConfigEntry()
})
</script>
