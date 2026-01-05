<template>
  <div class="space-y-3">
    <!-- Page Header -->
    <div class="flex items-center gap-3">
      <button @click="goBack" class="btn btn-ghost btn-sm">
        <ArrowLeft class="w-3.5 h-3.5" />
      </button>
      <div>
        <h1 class="text-base font-semibold text-text-primary">{{ t('subscribers') }}</h1>
        <p class="text-xs text-text-secondary mt-0.5">
          {{ route.query.serviceName || t('allServices') }}
        </p>
      </div>
    </div>

    <!-- Search Bar -->
    <div class="card">
      <div class="p-3">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label class="block text-xs font-medium text-text-secondary mb-1">{{
              t('serviceName')
            }}</label>
            <input
              v-model="searchParams.serviceName"
              type="text"
              class="input"
              :placeholder="t('serviceName')"
              @keyup.enter="handleSearch"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-text-secondary mb-1">{{
              t('groupName')
            }}</label>
            <input
              v-model="searchParams.groupName"
              type="text"
              class="input"
              :placeholder="t('groupName')"
              @keyup.enter="handleSearch"
            />
          </div>
          <div class="md:col-span-2 flex items-end gap-2">
            <button @click="handleSearch" class="btn btn-primary">
              <Search class="w-3.5 h-3.5" />
              {{ t('search') }}
            </button>
            <button @click="handleReset" class="btn btn-secondary">
              <RotateCcw class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Subscriber List -->
    <div class="card">
      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>{{ t('clientAddress') }}</th>
              <th>{{ t('clientVersion') }}</th>
              <th>{{ t('appName') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="3" class="text-center py-6">
                <Loader2 class="w-5 h-5 animate-spin mx-auto text-primary" />
              </td>
            </tr>
            <tr v-else-if="subscribers.length === 0">
              <td colspan="3" class="text-center py-6 text-text-secondary">
                {{ t('noData') }}
              </td>
            </tr>
            <tr v-for="(item, index) in subscribers" :key="index" class="hover:bg-bg-secondary">
              <td class="font-mono text-sm">{{ item.addrStr }}</td>
              <td>{{ item.agent || '-' }}</td>
              <td>{{ item.app || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="flex items-center justify-between p-4 border-t border-border">
        <div class="text-sm text-text-secondary">
          {{ t('total') }}: {{ total }} {{ t('items') }}
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="handlePageChange(currentPage - 1)"
            :disabled="currentPage <= 1"
            class="btn btn-secondary btn-sm"
          >
            <ChevronLeft class="w-3.5 h-3.5" />
          </button>
          <span class="text-sm text-text-primary px-3"> {{ currentPage }} / {{ totalPages }} </span>
          <button
            @click="handlePageChange(currentPage + 1)"
            :disabled="currentPage >= totalPages"
            class="btn btn-secondary btn-sm"
          >
            <ChevronRight class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Search, RotateCcw, Loader2, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import nacosApi from '@/api/nacos'
import type { SubscriberInfo, Namespace } from '@/types'

const props = defineProps<{
  namespace: Namespace
}>()

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

// State
const loading = ref(false)
const subscribers = ref<SubscriberInfo[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

const searchParams = reactive({
  serviceName: (route.query.serviceName as string) || '',
  groupName: (route.query.groupName as string) || '',
})

// Computed
const totalPages = computed(() => Math.ceil(total.value / pageSize.value) || 1)

// Methods
const goBack = () => {
  router.back()
}

const fetchSubscribers = async () => {
  loading.value = true
  try {
    const response = await nacosApi.getSubscriberList({
      ...searchParams,
      namespaceId: props.namespace.namespace,
      pageNo: currentPage.value,
      pageSize: pageSize.value,
    })
    subscribers.value = response.data.data.subscribers || []
    total.value = response.data.data.count || 0
  } catch (error) {
    console.error('Failed to fetch subscribers:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  fetchSubscribers()
}

const handleReset = () => {
  Object.assign(searchParams, {
    serviceName: '',
    groupName: '',
  })
  handleSearch()
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchSubscribers()
}

// Lifecycle
onMounted(() => {
  fetchSubscribers()
})
</script>
