<template>
  <Teleport to="body">
    <div v-if="modelValue" class="modal-backdrop" @click="handleClose" role="presentation">
      <div
        class="modal max-w-4xl"
        role="dialog"
        aria-modal="true"
        @click.stop
        @keydown.escape="handleClose"
      >
        <div class="modal-header">
          <h3 class="text-sm font-semibold text-text-primary">从注册中心导入</h3>
          <button @click="handleClose" class="btn btn-ghost btn-sm" aria-label="关闭">
            <X class="w-3.5 h-3.5" />
          </button>
        </div>

        <div class="modal-body space-y-4 max-h-[70vh] overflow-y-auto">
          <!-- Source + search -->
          <div
            class="grid grid-cols-[minmax(14rem,18rem)_1fr_auto] gap-3 items-end max-sm:grid-cols-1"
          >
            <div class="space-y-2">
              <label class="block text-xs font-medium text-text-primary">导入源</label>
              <select
                v-model="sourceId"
                class="input text-xs"
                :disabled="loading || sources.length === 0"
                @change="handleSourceChange(($event.target as HTMLSelectElement).value)"
              >
                <option v-for="s in sources" :key="s.sourceId" :value="s.sourceId">
                  {{ s.displayName || s.sourceId }}
                </option>
              </select>
            </div>
            <div class="space-y-2">
              <label class="block text-xs font-medium text-text-primary">搜索</label>
              <input
                v-model="query"
                class="input text-xs"
                placeholder="搜索资源..."
                @keydown.enter="handleSearch"
              />
            </div>
            <button
              class="btn btn-primary btn-sm"
              @click="handleSearch"
              :disabled="!sourceId || loading"
            >
              {{ loading ? '加载中...' : '搜索' }}
            </button>
          </div>

          <!-- Source info -->
          <div v-if="selectedSource" class="flex flex-wrap gap-2 text-xs text-text-tertiary">
            <span>{{
              selectedSource.description || selectedSource.displayName || selectedSource.sourceId
            }}</span>
            <span v-if="selectedSource.pluginName" class="badge badge-secondary">{{
              selectedSource.pluginName
            }}</span>
            <span
              v-for="cap in selectedSource.capabilities || []"
              :key="cap"
              class="badge badge-outline"
              >{{ cap }}</span
            >
          </div>

          <!-- Conflict policy + skip invalid -->
          <div class="flex flex-wrap gap-6">
            <div class="flex items-center gap-2">
              <label class="text-xs text-text-primary">冲突策略:</label>
              <div class="inline-flex rounded-md border border-border bg-white p-0.5">
                <button
                  class="px-3 py-0.5 text-xs rounded transition-colors"
                  :class="
                    !overwriteExisting
                      ? 'bg-primary text-white'
                      : 'text-text-secondary hover:bg-bg-secondary'
                  "
                  @click="setOverwrite(false)"
                >
                  跳过
                </button>
                <button
                  class="px-3 py-0.5 text-xs rounded transition-colors"
                  :class="
                    overwriteExisting
                      ? 'bg-primary text-white'
                      : 'text-text-secondary hover:bg-bg-secondary'
                  "
                  @click="setOverwrite(true)"
                >
                  覆盖
                </button>
              </div>
            </div>
            <label class="flex items-center gap-1.5 cursor-pointer">
              <input
                v-model="skipInvalid"
                type="checkbox"
                class="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary"
              />
              <span class="text-xs text-text-primary">跳过无效项</span>
            </label>
          </div>

          <!-- Selection summary + actions -->
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex flex-wrap gap-4 text-xs text-text-tertiary">
              <span
                >已选择 <strong class="text-primary">{{ selectedKeys.size }}</strong> 项</span
              >
              <span v-if="validationItems">
                校验后可导入
                <strong class="text-text-primary">{{ importableValidatedItems.length }}</strong> 项
              </span>
            </div>
            <div class="flex items-center gap-2">
              <button
                class="btn btn-outline btn-sm"
                @click="selectAllCandidates"
                :disabled="selectableCandidateKeys.length === 0 || allSelectableSelected || loading"
              >
                <CheckSquare class="w-3.5 h-3.5" /> 全选
              </button>
              <button
                class="btn btn-ghost btn-sm"
                @click="clearSelection"
                :disabled="selectedKeys.size === 0 || loading"
              >
                <X class="w-3.5 h-3.5" /> 清空
              </button>
            </div>
          </div>

          <!-- Candidate list -->
          <div class="border border-border rounded-md p-3 max-h-96 overflow-y-auto">
            <div
              v-if="sources.length === 0 && !loading"
              class="h-72 flex items-center justify-center text-sm text-text-tertiary"
            >
              没有可用的导入源
            </div>
            <div
              v-else-if="candidates.length > 0"
              class="grid grid-cols-2 gap-3 max-sm:grid-cols-1"
            >
              <button
                v-for="candidate in candidates"
                :key="itemKey(candidate)"
                type="button"
                :disabled="isDisabled(candidate)"
                class="text-left border border-border rounded-md p-3 transition-colors"
                :class="[
                  isSelected(candidate)
                    ? 'border-primary bg-primary/5'
                    : 'hover:bg-bg-secondary/50',
                  isDisabled(candidate) ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
                ]"
                @click="toggleCandidate(candidate)"
              >
                <div class="flex items-start gap-3">
                  <input
                    type="checkbox"
                    class="mt-1 w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary"
                    :checked="isSelected(candidate)"
                    :disabled="isDisabled(candidate)"
                    @click.stop
                  />
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2 min-w-0">
                      <span class="text-sm font-medium truncate text-text-primary">
                        {{ candidate.name || candidate.externalId || '未命名' }}
                      </span>
                      <span
                        v-if="candidate.version"
                        class="badge badge-outline text-[10px] shrink-0"
                      >
                        v{{ candidate.version }}
                      </span>
                      <span
                        v-if="validationOf(candidate)"
                        :class="statusBadgeClass(validationOf(candidate)!.status!)"
                        class="badge text-[10px] shrink-0"
                      >
                        {{ statusLabel(validationOf(candidate)!.status!) }}
                      </span>
                    </div>
                    <p class="text-xs text-text-secondary line-clamp-2 mt-1">
                      {{ candidate.description || '--' }}
                    </p>
                    <div
                      class="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-text-tertiary"
                    >
                      <span
                        v-for="[k, v] in metadataEntries(candidate)"
                        :key="k"
                        class="badge badge-secondary text-[10px]"
                        >{{ k }}: {{ v }}</span
                      >
                      <span
                        v-if="validationOf(candidate)?.errors?.length"
                        class="text-danger truncate"
                      >
                        {{ validationOf(candidate)!.errors!.join('; ') }}
                      </span>
                      <span
                        v-else-if="validationOf(candidate)?.warnings?.length"
                        class="text-amber-600 truncate"
                      >
                        {{ validationOf(candidate)!.warnings!.join('; ') }}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            </div>
            <div v-else class="h-72 flex items-center justify-center text-sm text-text-tertiary">
              {{ loading ? '加载中...' : '暂无数据' }}
            </div>
          </div>

          <!-- Load more -->
          <div v-if="hasMore" class="flex justify-center">
            <button class="btn btn-outline btn-sm" @click="loadMore" :disabled="loading">
              {{ loading ? '加载中...' : '加载更多' }}
            </button>
          </div>

          <p v-if="errorMessage" class="text-xs text-danger">{{ errorMessage }}</p>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="handleClose" :disabled="loading || executing">
            取消
          </button>
          <button
            class="btn btn-secondary"
            @click="validateSelected"
            :disabled="selectedKeys.size === 0 || loading || executing"
          >
            {{ loading ? '加载中...' : '校验' }}
          </button>
          <button
            class="btn btn-primary"
            @click="executeImport(false)"
            :disabled="
              !validationItems ||
              selectedKeys.size === 0 ||
              selectedImportableCount !== selectedKeys.size ||
              loading ||
              executing
            "
          >
            {{ executing ? '执行中...' : '执行导入' }}
          </button>
          <button
            class="btn btn-secondary"
            @click="executeImport(true)"
            :disabled="
              !validationItems || importableValidatedItems.length === 0 || loading || executing
            "
          >
            导入所有有效
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { X, CheckSquare } from '@lucide/vue'
import { aiResourceImportApi } from '@/api/aiResourceImport'
import type {
  AiResourceImportCandidateItem,
  AiResourceImportItem,
  AiResourceImportSourceInfo,
  AiResourceImportValidationItem,
  AiResourceImportValidationStatus,
} from '@/types/aiResourceImport'

const props = defineProps<{
  modelValue: boolean
  namespaceId: string
  resourceType: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  success: []
}>()

const DEFAULT_PAGE_SIZE = 12

const sources = ref<AiResourceImportSourceInfo[]>([])
const sourceId = ref('')
const query = ref('')
const overwriteExisting = ref(false)
const skipInvalid = ref(true)
const loading = ref(false)
const executing = ref(false)
const errorMessage = ref('')
const candidates = ref<AiResourceImportCandidateItem[]>([])
const nextCursor = ref('')
const hasMore = ref(false)
const validationItems = ref<AiResourceImportValidationItem[] | null>(null)
const validationToken = ref('')
const validatedImportItems = ref<Map<string, AiResourceImportItem>>(new Map())
const selectedKeys = ref<Set<string>>(new Set())

// Abort in-flight requests when the dialog is closed or a new request starts.
let abortController: AbortController | null = null

function newAbortSignal(): AbortSignal {
  abortController?.abort()
  abortController = new AbortController()
  return abortController.signal
}

function abortAll() {
  abortController?.abort()
  abortController = null
}

const selectedSource = computed(() => sources.value.find((s) => s.sourceId === sourceId.value))

const validationMap = computed(() => {
  const map = new Map<string, AiResourceImportValidationItem>()
  validationItems.value?.forEach((item) => map.set(itemKey(item), item))
  return map
})

function itemKey(item: AiResourceImportCandidateItem | AiResourceImportValidationItem): string {
  return `${item.externalId || item.name || 'unknown'}__${item.version || ''}`
}

function toImportItem(item: AiResourceImportCandidateItem): AiResourceImportItem {
  return {
    externalId: item.externalId,
    name: item.name,
    version: item.version,
    metadata: item.metadata,
  }
}

function isImportable(
  item?: AiResourceImportValidationItem,
  overwrite = overwriteExisting.value,
): boolean {
  const status = item?.status
  if (!status) return true
  if (status === 'VALID' || status === 'WARNING') return true
  if (status === 'CONFLICT') return overwrite
  return false
}

function isSelectableCandidate(candidate: AiResourceImportCandidateItem): boolean {
  if (!validationItems.value) return true
  const validation = validationMap.value.get(itemKey(candidate))
  return !validation || isImportable(validation)
}

const selectableCandidateKeys = computed(() =>
  candidates.value.filter(isSelectableCandidate).map(itemKey),
)

const allSelectableSelected = computed(
  () =>
    selectableCandidateKeys.value.length > 0 &&
    selectableCandidateKeys.value.every((k) => selectedKeys.value.has(k)),
)

const importableValidatedItems = computed(() =>
  Array.from(validatedImportItems.value.entries())
    .filter(([key]) => validationMap.value.has(key))
    .filter(([key]) => isImportable(validationMap.value.get(key)))
    .map(([, item]) => item),
)

function selectedImportItems(onlyImportable = false): AiResourceImportItem[] {
  return candidates.value
    .filter((c) => selectedKeys.value.has(itemKey(c)))
    .filter((c) => {
      if (!onlyImportable) return true
      const validation = validationMap.value.get(itemKey(c))
      return !!validation && isImportable(validation)
    })
    .map(toImportItem)
}

const selectedImportableCount = computed(() => selectedImportItems(true).length)

function isSelected(candidate: AiResourceImportCandidateItem): boolean {
  return selectedKeys.value.has(itemKey(candidate))
}

function isDisabled(candidate: AiResourceImportCandidateItem): boolean {
  if (!validationItems.value) return false
  return !isSelectableCandidate(candidate)
}

function validationOf(
  candidate: AiResourceImportCandidateItem,
): AiResourceImportValidationItem | undefined {
  return validationMap.value.get(itemKey(candidate))
}

function statusBadgeClass(status: AiResourceImportValidationStatus): string {
  switch (status) {
    case 'VALID':
      return 'badge-success'
    case 'WARNING':
      return 'badge-warning'
    case 'CONFLICT':
      return 'badge-secondary'
    default:
      return 'badge-danger'
  }
}

function statusLabel(status: AiResourceImportValidationStatus): string {
  switch (status) {
    case 'VALID':
      return '有效'
    case 'WARNING':
      return '警告'
    case 'CONFLICT':
      return '冲突'
    default:
      return '无效'
  }
}

function metadataEntries(candidate: AiResourceImportCandidateItem): [string, string][] {
  const metadata = candidate.metadata || {}
  return Object.entries(metadata)
    .filter(([, v]) => v)
    .slice(0, 4) as [string, string][]
}

function resetForm() {
  sources.value = []
  sourceId.value = ''
  query.value = ''
  overwriteExisting.value = false
  skipInvalid.value = true
  candidates.value = []
  nextCursor.value = ''
  hasMore.value = false
  validationItems.value = null
  validationToken.value = ''
  validatedImportItems.value = new Map()
  selectedKeys.value = new Set()
  errorMessage.value = ''
}

async function searchCandidates(
  targetSourceId: string,
  append = false,
  cursor = '',
  targetQuery = '',
) {
  if (!targetSourceId) return
  loading.value = true
  try {
    const response = await aiResourceImportApi.search(
      {
        namespaceId: props.namespaceId,
        resourceType: props.resourceType,
        sourceId: targetSourceId,
        query: targetQuery.trim() || undefined,
        cursor: cursor || undefined,
        limit: DEFAULT_PAGE_SIZE,
      },
      newAbortSignal(),
    )
    const items = response.data.data?.items || []
    if (append) {
      const keys = new Set(candidates.value.map(itemKey))
      items.forEach((item) => {
        const key = itemKey(item)
        if (!keys.has(key)) {
          candidates.value.push(item)
        }
      })
    } else {
      candidates.value = [...items]
      selectedKeys.value = new Set()
    }
    nextCursor.value = response.data.data?.nextCursor || ''
    hasMore.value = !!response.data.data?.hasMore
  } catch (err) {
    if (err instanceof Error && err.name === 'CanceledError') return
    errorMessage.value = err instanceof Error ? err.message : '搜索失败'
  } finally {
    loading.value = false
  }
}

async function loadSources() {
  loading.value = true
  try {
    const response = await aiResourceImportApi.listSources(
      { resourceType: props.resourceType },
      newAbortSignal(),
    )
    const enabledSources = (response.data.data || []).filter((s) => s.enabled !== false)
    sources.value = enabledSources
    const firstSourceId = enabledSources[0]?.sourceId || ''
    sourceId.value = firstSourceId
    if (firstSourceId) {
      await searchCandidates(firstSourceId, false, '', '')
    }
  } catch (err) {
    if (err instanceof Error && err.name === 'CanceledError') return
    errorMessage.value = err instanceof Error ? err.message : '加载导入源失败'
  } finally {
    loading.value = false
  }
}

function handleSourceChange(value: string) {
  sourceId.value = value
  candidates.value = []
  selectedKeys.value = new Set()
  validationItems.value = null
  validationToken.value = ''
  validatedImportItems.value = new Map()
  nextCursor.value = ''
  hasMore.value = false
  searchCandidates(value, false, '', query.value)
}

function handleSearch() {
  candidates.value = []
  selectedKeys.value = new Set()
  nextCursor.value = ''
  hasMore.value = false
  searchCandidates(sourceId.value, false, '', query.value)
}

function loadMore() {
  searchCandidates(sourceId.value, true, nextCursor.value, query.value)
}

function toggleCandidate(candidate: AiResourceImportCandidateItem) {
  const key = itemKey(candidate)
  const validation = validationMap.value.get(key)
  if (validationItems.value && validation && !isImportable(validation)) return
  selectedKeys.value = new Set(selectedKeys.value)
  if (selectedKeys.value.has(key)) {
    selectedKeys.value.delete(key)
  } else {
    selectedKeys.value.add(key)
  }
}

function selectAllCandidates() {
  selectedKeys.value = new Set(selectableCandidateKeys.value)
}

function clearSelection() {
  selectedKeys.value = new Set()
}

function setOverwrite(value: boolean) {
  overwriteExisting.value = value
  validationItems.value = null
  validatedImportItems.value = new Map()
  validationToken.value = ''
}

async function validateSelected() {
  const items = selectedImportItems()
  if (!items.length) return
  loading.value = true
  errorMessage.value = ''
  try {
    const response = await aiResourceImportApi.validate(
      {
        namespaceId: props.namespaceId,
        resourceType: props.resourceType,
        sourceId: sourceId.value,
        selectedItems: JSON.stringify(items),
        overwriteExisting: overwriteExisting.value,
      },
      newAbortSignal(),
    )
    const nextValidationItems = response.data.data?.items || []
    const nextValidationMap = new Map(nextValidationItems.map((item) => [itemKey(item), item]))

    // Merge validation items
    const merged = new Map<string, AiResourceImportValidationItem>()
    validationItems.value?.forEach((item) => merged.set(itemKey(item), item))
    nextValidationItems.forEach((item) => merged.set(itemKey(item), item))
    validationItems.value = Array.from(merged.values())

    validationToken.value = response.data.data?.validationToken || ''

    const nextValidated = new Map(validatedImportItems.value)
    items.forEach((item) => nextValidated.set(itemKey(item), item))
    validatedImportItems.value = nextValidated

    const nextSelected = new Set<string>()
    selectedKeys.value.forEach((key) => {
      const validation = nextValidationMap.get(key)
      if (!validation || isImportable(validation)) nextSelected.add(key)
    })
    selectedKeys.value = nextSelected
  } catch (err) {
    if (err instanceof Error && err.name === 'CanceledError') return
    errorMessage.value = err instanceof Error ? err.message : '校验失败'
  } finally {
    loading.value = false
  }
}

async function executeImport(allImportable = false) {
  if (!validationItems.value) return
  const items = allImportable ? importableValidatedItems.value : selectedImportItems(true)
  if (!items.length) return
  executing.value = true
  errorMessage.value = ''
  try {
    const response = await aiResourceImportApi.execute(
      {
        namespaceId: props.namespaceId,
        resourceType: props.resourceType,
        sourceId: sourceId.value,
        selectedItems: JSON.stringify(items),
        overwriteExisting: overwriteExisting.value,
        skipInvalid: skipInvalid.value,
        validationToken: validationToken.value,
      },
      newAbortSignal(),
    )
    const data = response.data.data || {}
    if (data.failedCount) {
      errorMessage.value = `导入结果：成功 ${data.successCount || 0}，失败 ${data.failedCount || 0}，跳过 ${data.skippedCount || 0}`
      await searchCandidates(sourceId.value, false, '', query.value)
      return
    }
    emit('success')
    handleClose()
  } catch (err) {
    if (err instanceof Error && err.name === 'CanceledError') return
    errorMessage.value = err instanceof Error ? err.message : '导入失败'
  } finally {
    executing.value = false
  }
}

function handleClose() {
  abortAll()
  emit('update:modelValue', false)
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      resetForm()
      loadSources()
    }
  },
)
</script>
