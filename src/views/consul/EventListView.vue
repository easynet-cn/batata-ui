<template>
  <div class="space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-base font-semibold text-text-primary">{{ t('consulEvents') }}</h1>
        <p class="text-xs text-text-secondary mt-0.5">{{ t('consulEventsDesc') }}</p>
      </div>
      <div class="flex items-center gap-2">
        <button @click="loadEvents" class="btn btn-secondary btn-sm">
          <RefreshCw class="w-3.5 h-3.5" />
          {{ t('refresh') }}
        </button>
        <button @click="openFireModal" class="btn btn-primary btn-sm">
          <Zap class="w-3.5 h-3.5" />
          {{ t('consulFireEvent') }}
        </button>
      </div>
    </div>

    <!-- Search -->
    <div class="card">
      <div class="p-3">
        <input
          v-model="searchQuery"
          type="text"
          class="input"
          :placeholder="t('searchPlaceholder')"
        />
      </div>
    </div>

    <!-- Events Table -->
    <div class="card">
      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>{{ t('name') }}</th>
              <th>ID</th>
              <th>{{ t('consulEventPayload') }}</th>
              <th>{{ t('node') }}</th>
              <th>{{ t('service') }}</th>
              <th>LTime</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="6" class="text-center py-6">
                <Loader2 class="w-5 h-5 animate-spin mx-auto text-primary" />
              </td>
            </tr>
            <tr v-else-if="filteredEvents.length === 0">
              <td colspan="6" class="text-center py-6 text-text-secondary">
                <Zap class="w-6 h-6 mx-auto mb-2 opacity-50" />
                <p>{{ t('consulNoEvents') }}</p>
              </td>
            </tr>
            <tr v-for="event in filteredEvents" :key="event.ID" class="hover:bg-bg-secondary">
              <td class="font-medium text-text-primary">{{ event.Name }}</td>
              <td class="text-text-secondary font-mono text-xs">
                {{ event.ID.substring(0, 8) }}...
              </td>
              <td>
                <span class="text-xs text-text-secondary max-w-xs truncate block">
                  {{ event.Payload ? atob(event.Payload) : '-' }}
                </span>
              </td>
              <td class="text-text-secondary text-xs">{{ event.NodeFilter || '-' }}</td>
              <td class="text-text-secondary text-xs">{{ event.ServiceFilter || '-' }}</td>
              <td class="text-text-secondary font-mono text-xs">{{ event.LTime }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Fire Event Modal -->
    <FormModal
      v-model="showFireModal"
      :title="t('consulFireEvent')"
      :submit-text="t('consulFireEvent')"
      :loading="firing"
      @submit="submitFireEvent"
    >
      <div class="space-y-3">
        <div>
          <label class="block text-xs font-medium text-text-primary mb-1">
            {{ t('consulEventName') }} <span class="text-danger">*</span>
          </label>
          <input v-model="fireForm.name" type="text" class="input" placeholder="my-event" />
        </div>
        <div>
          <label class="block text-xs font-medium text-text-primary mb-1">
            {{ t('consulEventPayload') }}
          </label>
          <textarea
            v-model="fireForm.payload"
            rows="3"
            class="input"
            :placeholder="t('consulEventPayload')"
          />
        </div>
        <div class="grid grid-cols-3 gap-3">
          <div>
            <label class="block text-xs font-medium text-text-primary mb-1">
              {{ t('node') }}
            </label>
            <input v-model="fireForm.node" type="text" class="input" />
          </div>
          <div>
            <label class="block text-xs font-medium text-text-primary mb-1">
              {{ t('service') }}
            </label>
            <input v-model="fireForm.service" type="text" class="input" />
          </div>
          <div>
            <label class="block text-xs font-medium text-text-primary mb-1">
              {{ t('tag') }}
            </label>
            <input v-model="fireForm.tag" type="text" class="input" />
          </div>
        </div>
      </div>
    </FormModal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { RefreshCw, Zap, Loader2 } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import consulApi from '@/api/consul'
import { toast } from '@/utils/error'
import { logger } from '@/utils/logger'
import FormModal from '@/components/common/FormModal.vue'
import type { ConsulUserEvent } from '@/types/consul'

const { t } = useI18n()

// State
const loading = ref(false)
const firing = ref(false)
const events = ref<ConsulUserEvent[]>([])
const searchQuery = ref('')
const showFireModal = ref(false)

const fireForm = reactive({
  name: '',
  payload: '',
  node: '',
  service: '',
  tag: '',
})

// Computed
const filteredEvents = computed(() => {
  if (!searchQuery.value) return events.value
  const q = searchQuery.value.toLowerCase()
  return events.value.filter((e) => e.Name.toLowerCase().includes(q))
})

// Helpers
function atob(str: string): string {
  try {
    return globalThis.atob(str)
  } catch {
    return str
  }
}

// Actions
async function loadEvents() {
  loading.value = true
  try {
    const response = await consulApi.listEvents()
    events.value = response.data || []
  } catch (error) {
    logger.error('Failed to fetch events:', error)
    toast.apiError(error)
  } finally {
    loading.value = false
  }
}

function openFireModal() {
  fireForm.name = ''
  fireForm.payload = ''
  fireForm.node = ''
  fireForm.service = ''
  fireForm.tag = ''
  showFireModal.value = true
}

async function submitFireEvent() {
  if (!fireForm.name) {
    toast.warning(t('requiredFieldsMissing'))
    return
  }
  firing.value = true
  try {
    await consulApi.fireEvent(
      fireForm.name,
      fireForm.payload || undefined,
      fireForm.node || undefined,
      fireForm.service || undefined,
      fireForm.tag || undefined,
    )
    showFireModal.value = false
    toast.success(t('success'))
    await loadEvents()
  } catch (error) {
    logger.error('Failed to fire event:', error)
    toast.apiError(error)
  } finally {
    firing.value = false
  }
}

// Lifecycle
onMounted(() => {
  loadEvents()
})
</script>
