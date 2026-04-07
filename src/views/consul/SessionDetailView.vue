<template>
  <div class="space-y-4">
    <!-- Back Button -->
    <div>
      <RouterLink
        :to="{ name: 'consul-sessions' }"
        class="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft class="w-4 h-4" />
        {{ t('backToSessions') }}
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

    <template v-else-if="session">
      <!-- Page Header -->
      <div>
        <h1 class="text-base font-semibold text-text-primary">
          {{ session.Name || t('consulSessionDetail') }}
        </h1>
        <p class="text-xs text-text-secondary mt-0.5">{{ t('consulSessionDetail') }}</p>
      </div>

      <!-- Overview Card -->
      <div class="card p-5 space-y-4">
        <h2 class="text-sm font-bold text-text-primary">{{ t('basicInfo') }}</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p class="text-xs text-text-tertiary mb-0.5">{{ t('sessionId') }}</p>
            <p class="text-sm font-mono text-text-primary break-all">{{ session.ID }}</p>
          </div>
          <div>
            <p class="text-xs text-text-tertiary mb-0.5">{{ t('name') }}</p>
            <p class="text-sm font-medium text-text-primary">{{ session.Name || '-' }}</p>
          </div>
          <div>
            <p class="text-xs text-text-tertiary mb-0.5">{{ t('node') }}</p>
            <p class="text-sm text-text-primary">{{ session.Node }}</p>
          </div>
          <div>
            <p class="text-xs text-text-tertiary mb-0.5">{{ t('behavior') }}</p>
            <span
              :class="['badge', session.Behavior === 'release' ? 'badge-success' : 'badge-danger']"
            >
              {{ session.Behavior === 'release' ? t('release') : t('delete') }}
            </span>
          </div>
          <div>
            <p class="text-xs text-text-tertiary mb-0.5">{{ t('ttl') }}</p>
            <p class="text-sm text-text-primary">{{ session.TTL || '-' }}</p>
          </div>
          <div>
            <p class="text-xs text-text-tertiary mb-0.5">{{ t('consulLockDelay') }}</p>
            <p class="text-sm font-mono text-text-primary">
              {{ formatLockDelay(session.LockDelay) }}
            </p>
          </div>
          <div>
            <p class="text-xs text-text-tertiary mb-0.5">{{ t('createIndex') }}</p>
            <p class="text-sm font-mono text-text-primary">{{ session.CreateIndex }}</p>
          </div>
          <div>
            <p class="text-xs text-text-tertiary mb-0.5">{{ t('modifyIndex') }}</p>
            <p class="text-sm font-mono text-text-primary">{{ session.ModifyIndex }}</p>
          </div>
        </div>
      </div>

      <!-- Associated Checks -->
      <div class="card p-5 space-y-4">
        <h2 class="text-sm font-bold text-text-primary">{{ t('consulAssociatedChecks') }}</h2>
        <div v-if="session.Checks && session.Checks.length > 0" class="flex flex-wrap gap-2">
          <span v-for="check in session.Checks" :key="check" class="badge badge-info">
            {{ check }}
          </span>
        </div>
        <p v-else class="text-sm text-text-tertiary">{{ t('consulNoAssociatedChecks') }}</p>

        <!-- Node Checks -->
        <template v-if="session.NodeChecks && session.NodeChecks.length > 0">
          <h3 class="text-xs font-bold text-text-secondary uppercase tracking-wider mt-3">
            {{ t('consulNodeChecks') }}
          </h3>
          <div class="flex flex-wrap gap-2">
            <span v-for="check in session.NodeChecks" :key="check" class="badge badge-warning">
              {{ check }}
            </span>
          </div>
        </template>

        <!-- Service Checks -->
        <template v-if="session.ServiceChecks && session.ServiceChecks.length > 0">
          <h3 class="text-xs font-bold text-text-secondary uppercase tracking-wider mt-3">
            {{ t('consulServiceChecks') }}
          </h3>
          <div class="flex flex-wrap gap-2">
            <span v-for="sc in session.ServiceChecks" :key="sc.ID" class="badge badge-fuchsia">
              {{ sc.ID }}
              <span v-if="sc.Namespace" class="opacity-70">({{ sc.Namespace }})</span>
            </span>
          </div>
        </template>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import consulApi from '@/api/consul'
import { toast } from '@/utils/error'
import { logger } from '@/utils/logger'
import type { ConsulSession } from '@/types/consul'

const { t } = useI18n()
const route = useRoute()

const loading = ref(false)
const errorMsg = ref('')
const session = ref<ConsulSession | null>(null)

const sessionId = computed(() => route.params.id as string)

// Format lock delay from nanoseconds to human-readable
function formatLockDelay(ns: number): string {
  if (!ns) return '0s'
  const seconds = ns / 1e9
  if (seconds >= 60) return `${Math.round(seconds / 60)}m`
  return `${seconds}s`
}

async function loadSession() {
  if (!sessionId.value) {
    errorMsg.value = t('consulSessionNotFound')
    return
  }
  loading.value = true
  errorMsg.value = ''
  try {
    const response = await consulApi.getSession(sessionId.value)
    const sessions = response.data
    if (sessions && sessions.length > 0) {
      session.value = sessions[0] ?? null
    } else {
      errorMsg.value = t('consulSessionNotFound')
    }
  } catch (err) {
    logger.error('Failed to load session:', err)
    errorMsg.value = t('consulSessionLoadError')
    toast.apiError(err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadSession()
})
</script>
