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
        <button @click="handleVersionCompare" class="btn btn-secondary btn-sm">
          <GitCompare class="w-3.5 h-3.5" />
          {{ t('versionCompare') }}
        </button>
        <button @click="handleCrossCompare" class="btn btn-secondary btn-sm">
          <ArrowLeftRight class="w-3.5 h-3.5" />
          {{ t('configCompare') }}
        </button>
        <router-link
          :to="{
            name: 'config-history',
            query: {
              dataId: config?.dataId,
              groupName: config?.groupName,
              namespaceId: namespace.namespace,
            },
          }"
          class="btn btn-secondary btn-sm"
        >
          <History class="w-3.5 h-3.5" />
          {{ t('history') }}
        </router-link>
        <router-link
          :to="{
            name: 'config-edit',
            query: {
              dataId: config?.dataId,
              groupName: config?.groupName,
              namespaceId: namespace.namespace,
            },
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
              <p class="text-text-primary font-medium">{{ config.groupName }}</p>
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
          <CodeEditor
            :model-value="config.content"
            :language="config.type || 'text'"
            readonly
            min-height="200px"
          />
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

    <!-- Version Compare Modal -->
    <Teleport to="body">
      <div v-if="showDiffModal" class="modal-backdrop" @click="showDiffModal = false">
        <div class="modal !max-w-4xl" @click.stop>
          <div class="modal-header">
            <h3 class="text-sm font-semibold text-text-primary">{{ t('versionCompare') }}</h3>
            <button @click="showDiffModal = false" class="btn btn-ghost btn-sm">
              <X class="w-3.5 h-3.5" />
            </button>
          </div>
          <div class="modal-body">
            <div class="flex items-center gap-4 mb-2">
              <div class="flex items-center gap-2">
                <span class="badge badge-info text-[10px]">{{ t('previousVersion') }}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="badge badge-success text-[10px]">{{ t('currentVersion') }}</span>
              </div>
            </div>
            <DiffEditor
              :original="previousContent"
              :modified="config?.content || ''"
              :language="config?.type || 'text'"
              min-height="350px"
            />
          </div>
          <div class="modal-footer">
            <button @click="showDiffModal = false" class="btn btn-primary">{{ t('close') }}</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Cross-Config Compare Modal - Step 1: Select target -->
    <FormModal
      v-model="showCrossCompareForm"
      :title="t('configCompare')"
      :submit-text="t('compare')"
      @submit="fetchCrossCompareConfig"
    >
      <div class="space-y-3">
        <div>
          <label class="block text-xs font-medium text-text-primary mb-1">{{
            t('namespace')
          }}</label>
          <select v-model="crossCompareForm.namespaceId" class="input">
            <option v-for="ns in allNamespaces" :key="ns.namespace" :value="ns.namespace">
              {{ ns.namespaceShowName }}
            </option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-text-primary mb-1">
            {{ t('targetDataId') }} <span class="text-danger">*</span>
          </label>
          <input
            v-model="crossCompareForm.dataId"
            type="text"
            class="input"
            :placeholder="t('targetDataId')"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-text-primary mb-1">
            {{ t('targetGroup') }} <span class="text-danger">*</span>
          </label>
          <input
            v-model="crossCompareForm.groupName"
            type="text"
            class="input"
            placeholder="DEFAULT_GROUP"
          />
        </div>
      </div>
    </FormModal>

    <!-- Cross-Config Compare Modal - Step 2: Show diff -->
    <Teleport to="body">
      <div
        v-if="showCrossCompareResult"
        class="modal-backdrop"
        @click="showCrossCompareResult = false"
      >
        <div class="modal !max-w-4xl" @click.stop>
          <div class="modal-header">
            <h3 class="text-sm font-semibold text-text-primary">{{ t('configCompare') }}</h3>
            <button @click="showCrossCompareResult = false" class="btn btn-ghost btn-sm">
              <X class="w-3.5 h-3.5" />
            </button>
          </div>
          <div class="modal-body">
            <div class="flex items-center gap-4 mb-2">
              <div class="flex items-center gap-2">
                <span class="badge badge-info text-[10px]">{{ config?.dataId }}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="badge badge-success text-[10px]">{{ crossCompareForm.dataId }}</span>
              </div>
            </div>
            <DiffEditor
              :original="config?.content || ''"
              :modified="compareConfigContent"
              :language="config?.type || 'text'"
              min-height="350px"
            />
          </div>
          <div class="modal-footer">
            <button @click="showCrossCompareResult = false" class="btn btn-primary">
              {{ t('close') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  History,
  Pencil,
  Loader2,
  Copy,
  GitCompare,
  ArrowLeftRight,
  X,
} from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import batataApi from '@/api/batata'
import { logger } from '@/utils/logger'
import { toast } from '@/utils/error'
import CodeEditor from '@/components/common/CodeEditor.vue'
import DiffEditor from '@/components/common/DiffEditor.vue'
import FormModal from '@/components/common/FormModal.vue'
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

// Version compare state
const showDiffModal = ref(false)
const previousContent = ref('')

// Cross-config compare state
const showCrossCompareForm = ref(false)
const showCrossCompareResult = ref(false)
const compareConfigContent = ref('')
const allNamespaces = ref<Namespace[]>([])
const crossCompareForm = reactive({
  namespaceId: '',
  dataId: '',
  groupName: 'DEFAULT_GROUP',
})

// Methods
const goBack = () => {
  router.back()
}

const fetchConfig = async () => {
  const { dataId, groupName, namespaceId } = route.query
  if (!dataId || !groupName) return

  loading.value = true
  try {
    const response = await batataApi.getConfig(
      dataId as string,
      groupName as string,
      (namespaceId as string) || props.namespace.namespace,
    )
    config.value = response.data.data
  } catch (error) {
    logger.error('Failed to fetch config:', error)
  } finally {
    loading.value = false
  }
}

const copyContent = async () => {
  if (!config.value?.content) return
  try {
    await navigator.clipboard.writeText(config.value.content)
  } catch (error) {
    logger.error('Failed to copy:', error)
  }
}

const formatTime = (timestamp: number) => {
  if (!timestamp) return '-'
  return new Date(timestamp).toLocaleString()
}

// Version Compare: compare current with previous version
const handleVersionCompare = async () => {
  if (!config.value) return

  try {
    const nsId = (route.query.namespaceId as string) || props.namespace.namespace
    // Get the latest history entry to find its ID
    const historyRes = await batataApi.getConfigHistoryList({
      dataId: config.value.dataId,
      groupName: config.value.groupName,
      namespaceId: nsId,
      pageNo: 1,
      pageSize: 1,
    })

    const latestHistory = historyRes.data.data.pageItems?.[0]
    if (!latestHistory) {
      toast.warning(t('noPreviousVersionAvailable'))
      return
    }

    // Get previous version
    const prevRes = await batataApi.getHistoryPrevious({
      id: latestHistory.id,
      dataId: config.value.dataId,
      groupName: config.value.groupName,
      namespaceId: nsId,
    })

    previousContent.value = prevRes.data.data?.content || ''
    showDiffModal.value = true
  } catch {
    toast.warning(t('noPreviousVersionAvailable'))
  }
}

// Cross-config compare
const handleCrossCompare = async () => {
  crossCompareForm.namespaceId = props.namespace.namespace
  crossCompareForm.dataId = ''
  crossCompareForm.groupName = 'DEFAULT_GROUP'

  // Fetch all namespaces for the dropdown
  try {
    const response = await batataApi.getNamespaceList()
    allNamespaces.value = response.data.data || []
  } catch (error) {
    logger.error('Failed to fetch namespaces:', error)
  }

  showCrossCompareForm.value = true
}

const fetchCrossCompareConfig = async () => {
  if (!crossCompareForm.dataId || !crossCompareForm.groupName) {
    toast.warning(t('requiredFieldsMissing'))
    return
  }

  try {
    const response = await batataApi.getConfig(
      crossCompareForm.dataId,
      crossCompareForm.groupName,
      crossCompareForm.namespaceId,
    )
    compareConfigContent.value = response.data.data?.content || ''
    showCrossCompareForm.value = false
    showCrossCompareResult.value = true
  } catch (error) {
    logger.error('Failed to fetch target config:', error)
    toast.apiError(error)
  }
}

// Lifecycle
onMounted(() => {
  fetchConfig()
})
</script>
