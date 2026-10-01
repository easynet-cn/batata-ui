<template>
  <div class="mcp-list-view">
    <!-- Header -->
    <div class="flex items-center justify-between gap-3 mb-4">
      <h1 class="text-base font-semibold text-text-primary">MCP 服务</h1>
      <div class="flex items-center gap-2">
        <button class="btn btn-secondary btn-sm" @click="store.openImportDialog()">
          <Upload class="w-3.5 h-3.5" /> 导入
        </button>
        <button class="btn btn-primary btn-sm" @click="goCreate">
          <Plus class="w-3.5 h-3.5" /> 新建
        </button>
      </div>
    </div>

    <!-- Search bar -->
    <div class="flex items-center gap-2 mb-4">
      <div class="relative flex-1 max-w-md">
        <Search class="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
        <input
          v-model="searchInput"
          type="text"
          class="input pl-8 text-xs"
          placeholder="搜索 MCP 服务名称"
          @keyup.enter="handleSearch"
        />
      </div>
      <select v-model="searchModeInput" class="input text-xs w-auto" @change="handleSearch">
        <option value="blur">模糊</option>
        <option value="accurate">精确</option>
      </select>
      <button class="btn btn-ghost btn-sm" @click="handleReset">
        <RotateCcw class="w-3.5 h-3.5" /> 重置
      </button>
    </div>

    <!-- Selection toolbar -->
    <div
      v-if="store.selectedNames.size > 0"
      class="flex items-center justify-between mb-3 px-3 py-2 rounded bg-primary/5 border border-primary/20"
    >
      <span class="text-xs text-text-secondary">
        已选择 <strong class="text-primary">{{ store.selectedNames.size }}</strong> 项
      </span>
      <button class="btn btn-danger btn-sm" :disabled="batchDeleting" @click="handleBatchDelete">
        <Trash2 v-if="!batchDeleting" class="w-3.5 h-3.5" />
        <Loader2 v-else class="w-3.5 h-3.5 animate-spin" />
        批量删除
      </button>
    </div>

    <!-- Error -->
    <div
      v-if="store.error"
      class="mb-3 p-3 rounded border border-danger/30 bg-danger/5 text-xs text-danger"
    >
      {{ store.error }}
      <button class="ml-2 underline" @click="reload">重试</button>
    </div>

    <!-- Loading skeleton -->
    <div
      v-if="store.loading"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
    >
      <div
        v-for="i in 8"
        :key="i"
        class="h-40 rounded-lg border border-border bg-white animate-pulse"
      />
    </div>

    <!-- Grid -->
    <div
      v-else-if="store.mcpServers.length > 0"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
    >
      <McpCard
        v-for="mcp in store.mcpServers"
        :key="mcp.name"
        :mcp="mcp"
        :selected="store.selectedNames.has(mcp.name)"
        selectable
        can-edit
        @view="goDetail"
        @edit="goEdit"
        @toggle="(m) => store.toggleSelect(m.name)"
        @more="handleMore"
      />
    </div>

    <!-- Empty -->
    <div v-else class="flex flex-col items-center justify-center py-16 text-text-tertiary">
      <Inbox class="w-12 h-12 mb-2 opacity-50" />
      <p class="text-sm">暂无 MCP 服务</p>
      <button class="btn btn-primary btn-sm mt-3" @click="goCreate">
        <Plus class="w-3.5 h-3.5" /> 新建第一个 MCP 服务
      </button>
    </div>

    <!-- Pagination -->
    <div
      v-if="store.total > 0"
      class="flex items-center justify-between mt-4 text-xs text-text-secondary"
    >
      <span>共 {{ store.total }} 条</span>
      <div class="flex items-center gap-2">
        <select v-model.number="pageSize" class="input text-xs w-auto" @change="handlePageSize">
          <option :value="12">12 / 页</option>
          <option :value="24">24 / 页</option>
          <option :value="48">48 / 页</option>
        </select>
        <button class="btn btn-ghost btn-sm" :disabled="store.pageNo <= 1" @click="handlePrevPage">
          <ChevronLeft class="w-3.5 h-3.5" />
        </button>
        <span>{{ store.pageNo }} / {{ totalPages }}</span>
        <button
          class="btn btn-ghost btn-sm"
          :disabled="store.pageNo >= totalPages"
          @click="handleNextPage"
        >
          <ChevronRight class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>

    <!-- Import dialog -->
    <ImportAiResourceDialog
      v-model="store.importDialogOpen"
      :namespace-id="namespaceId"
      resource-type="mcp"
      @success="onImportSuccess"
    />

    <!-- More actions popover -->
    <Teleport to="body">
      <div
        v-if="moreMenu.open"
        class="fixed z-50 bg-white border border-border rounded-md shadow-lg py-1 min-w-[120px]"
        :style="{ top: moreMenu.y + 'px', left: moreMenu.x + 'px' }"
      >
        <button
          class="w-full text-left px-3 py-1.5 text-xs hover:bg-bg-secondary text-text-primary"
          @click="handleDelete(moreMenu.mcp!)"
        >
          <Trash2 class="w-3.5 h-3.5 inline mr-1" /> 删除
        </button>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import {
  Plus,
  Search,
  Upload,
  RotateCcw,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Loader2,
} from '@lucide/vue'
import { useMcpStore } from '@/stores/mcp'
import { useNamespaceStore } from '@/stores/namespace'
import McpCard from '@/components/ai/mcp/McpCard.vue'
import ImportAiResourceDialog from '@/components/ai/resource-import/ImportAiResourceDialog.vue'
import type { Namespace } from '@/types'
import type { McpServerBasicInfo } from '@/types/mcp'

const props = defineProps<{
  namespace: Namespace
}>()

const router = useRouter()
const store = useMcpStore()
const namespaceStore = useNamespaceStore()

const namespaceId = computed(() => props.namespace?.namespace || namespaceStore.currentNamespace)

const searchInput = ref('')
const searchModeInput = ref<'blur' | 'accurate'>('blur')
const pageSize = ref(12)
const batchDeleting = ref(false)

const moreMenu = ref<{ open: boolean; x: number; y: number; mcp: McpServerBasicInfo | null }>({
  open: false,
  x: 0,
  y: 0,
  mcp: null,
})

const totalPages = computed(() => Math.max(1, Math.ceil(store.total / store.pageSize)))

async function reload() {
  store.clearError()
  await store.fetchMcpServers(namespaceId.value)
}

function handleSearch() {
  store.setSearchParams({
    searchName: searchInput.value.trim(),
    searchMode: searchModeInput.value,
  })
  reload()
}

function handleReset() {
  searchInput.value = ''
  searchModeInput.value = 'blur'
  store.resetSearch()
  reload()
}

function handlePrevPage() {
  if (store.pageNo > 1) {
    store.setPage(store.pageNo - 1)
    reload()
  }
}

function handleNextPage() {
  if (store.pageNo < totalPages.value) {
    store.setPage(store.pageNo + 1)
    reload()
  }
}

function handlePageSize() {
  store.setPage(1, pageSize.value)
  reload()
}

function goDetail(mcp: McpServerBasicInfo) {
  router.push({ name: 'mcp-detail', query: { mcpName: mcp.name, namespaceId: namespaceId.value } })
}

function goEdit(mcp: McpServerBasicInfo) {
  router.push({ name: 'mcp-edit', query: { mcpName: mcp.name, namespaceId: namespaceId.value } })
}

function goCreate() {
  router.push({ name: 'mcp-new' })
}

function handleMore(mcp: McpServerBasicInfo, event: MouseEvent) {
  moreMenu.value = {
    open: true,
    x: event.clientX,
    y: event.clientY,
    mcp,
  }
}

async function handleDelete(mcp: McpServerBasicInfo) {
  moreMenu.value.open = false
  if (!window.confirm(`确认删除 MCP 服务「${mcp.name}」？`)) return
  const ok = await store.deleteMcpServer(namespaceId.value, mcp.name)
  if (ok) {
    reload()
  }
}

async function handleBatchDelete() {
  if (!window.confirm(`确认删除选中的 ${store.selectedNames.size} 个 MCP 服务？`)) return
  batchDeleting.value = true
  await store.batchDelete(namespaceId.value, Array.from(store.selectedNames))
  batchDeleting.value = false
  reload()
}

function onImportSuccess() {
  reload()
}

function closeMoreMenu(e: MouseEvent) {
  if (moreMenu.value.open) {
    const target = e.target as HTMLElement
    if (!target.closest('.fixed.z-50')) {
      moreMenu.value.open = false
    }
  }
}

onMounted(() => {
  document.addEventListener('click', closeMoreMenu)
  reload()
})

onBeforeUnmount(() => {
  document.removeEventListener('click', closeMoreMenu)
  store.clearSelection()
})

watch(namespaceId, () => {
  store.setPage(1)
  reload()
})
</script>
