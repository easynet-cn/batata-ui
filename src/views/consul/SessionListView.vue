<template>
  <div class="space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-base font-semibold text-text-primary">{{ t('consulSessions') }}</h1>
        <p class="text-xs text-text-secondary mt-0.5">{{ t('consulSessionsDesc') }}</p>
      </div>
      <button @click="loadSessions" class="btn btn-secondary btn-sm">
        <RefreshCw class="w-3.5 h-3.5" />
        {{ t('refresh') }}
      </button>
    </div>

    <!-- Session List -->
    <div class="card">
      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>{{ t('sessionId') }}</th>
              <th>{{ t('name') }}</th>
              <th>{{ t('node') }}</th>
              <th>{{ t('ttl') }}</th>
              <th>{{ t('behavior') }}</th>
              <th>{{ t('checks') }}</th>
              <th class="w-24">{{ t('actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="store.loading">
              <td colspan="7" class="text-center py-6">
                <Loader2 class="w-5 h-5 animate-spin mx-auto text-primary" />
              </td>
            </tr>
            <tr v-else-if="store.sessions.length === 0">
              <td colspan="7" class="text-center py-6 text-text-secondary">
                {{ t('noSessions') }}
              </td>
            </tr>
            <tr v-for="session in store.sessions" :key="session.ID">
              <td>
                <span class="font-mono text-xs" :title="session.ID">
                  {{ truncateId(session.ID) }}
                </span>
              </td>
              <td>
                <span class="font-medium text-text-primary">{{ session.Name || '-' }}</span>
              </td>
              <td>
                <span class="text-text-secondary">{{ session.Node }}</span>
              </td>
              <td>
                <span class="text-text-secondary">{{ session.TTL || '-' }}</span>
              </td>
              <td>
                <span
                  :class="[
                    'badge',
                    session.Behavior === 'release' ? 'badge-success' : 'badge-danger',
                  ]"
                >
                  {{ session.Behavior === 'release' ? t('release') : t('delete') }}
                </span>
              </td>
              <td>
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="check in session.Checks || []"
                    :key="check"
                    class="badge badge-info text-[10px]"
                  >
                    {{ check }}
                  </span>
                  <span v-if="!session.Checks?.length" class="text-text-tertiary">-</span>
                </div>
              </td>
              <td>
                <button
                  @click="handleDestroy(session)"
                  class="btn btn-ghost btn-sm text-danger"
                  :title="t('destroy')"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Destroy Confirm Modal -->
    <ConfirmModal
      v-model="showDestroyModal"
      :title="t('confirmDelete')"
      :confirm-text="t('destroy')"
      danger
      @confirm="confirmDestroy"
    >
      <div>
        <p class="text-text-secondary">{{ t('confirmDestroySession') }}</p>
        <p class="text-xs text-text-tertiary mt-2">
          <span class="font-mono text-text-primary">
            {{ truncateId(sessionToDestroy?.ID || '') }}
          </span>
          - {{ t('destroySessionWarning') }}
        </p>
      </div>
    </ConfirmModal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RefreshCw, Trash2, Loader2 } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import { useConsulStore } from '@/stores/consul'
import consulApi from '@/api/consul'
import { toast } from '@/utils/error'
import { logger } from '@/utils/logger'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import type { ConsulSession } from '@/types/consul'

const { t } = useI18n()
const store = useConsulStore()

// State
const showDestroyModal = ref(false)
const sessionToDestroy = ref<ConsulSession | null>(null)

// Helpers
function truncateId(id: string): string {
  if (!id) return '-'
  return id.length > 8 ? `${id.substring(0, 8)}...` : id
}

// Actions
async function loadSessions() {
  try {
    await store.fetchSessions()
  } catch (error) {
    logger.error('Failed to fetch sessions:', error)
    toast.error(t('operationFailed'))
  }
}

function handleDestroy(session: ConsulSession) {
  sessionToDestroy.value = session
  showDestroyModal.value = true
}

async function confirmDestroy() {
  if (!sessionToDestroy.value) return
  try {
    await consulApi.destroySession(sessionToDestroy.value.ID)
    showDestroyModal.value = false
    toast.success(t('success'))
    await loadSessions()
  } catch (error) {
    logger.error('Failed to destroy session:', error)
    toast.error(t('operationFailed'))
  }
}

// Lifecycle
onMounted(() => {
  loadSessions()
})
</script>
