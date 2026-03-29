<template>
  <div class="border border-border rounded-lg">
    <!-- Header / Toggle -->
    <button
      @click="isOpen = !isOpen"
      class="w-full flex items-center justify-between p-3 hover:bg-bg-secondary/50 transition-colors"
    >
      <div class="flex items-center gap-2">
        <Wrench class="w-4 h-4 text-text-secondary" />
        <span class="text-sm font-medium text-text-primary">MCP Tools</span>
        <span v-if="selectedTools.length > 0" class="badge badge-primary text-xs">
          {{ selectedTools.length }} selected
        </span>
      </div>
      <ChevronDown
        class="w-4 h-4 text-text-secondary transition-transform"
        :class="{ 'rotate-180': isOpen }"
      />
    </button>

    <!-- Expanded Content -->
    <div v-if="isOpen" class="border-t border-border p-3 space-y-3">
      <!-- Server Selector -->
      <div>
        <label class="block text-xs font-medium text-text-secondary mb-1">MCP Server</label>
        <select v-model="selectedServer" @change="handleServerChange" class="input text-sm">
          <option value="">Select a server...</option>
          <option v-for="server in servers" :key="server.name" :value="server.name">
            {{ server.name }}
          </option>
        </select>
      </div>

      <!-- Tool Search -->
      <div v-if="selectedServer">
        <input
          v-model="searchKeyword"
          type="text"
          class="input text-sm"
          placeholder="Search tools..."
        />
      </div>

      <!-- Tool List -->
      <div v-if="loadingTools" class="text-center py-4">
        <Loader2 class="w-5 h-5 animate-spin mx-auto text-primary" />
      </div>
      <div v-else-if="filteredTools.length > 0" class="max-h-[200px] overflow-y-auto space-y-1">
        <label
          v-for="tool in filteredTools"
          :key="tool.name"
          class="flex items-start gap-2 p-2 rounded hover:bg-bg-secondary/50 cursor-pointer"
        >
          <input
            type="checkbox"
            :checked="isToolSelected(tool.name)"
            @change="toggleTool(tool)"
            class="mt-0.5 accent-primary"
          />
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium text-text-primary truncate">{{ tool.name }}</div>
            <div v-if="tool.description" class="text-xs text-text-secondary line-clamp-2">
              {{ tool.description }}
            </div>
          </div>
        </label>
      </div>
      <div
        v-else-if="selectedServer && !loadingTools"
        class="text-xs text-text-secondary text-center py-3"
      >
        No tools available
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ChevronDown, Wrench, Loader2 } from 'lucide-vue-next'
import batataApi from '@/api/batata'
import { useBatataStore } from '@/stores/batata'
import type { SelectedMcpTool } from '@/types/copilot'

interface McpTool {
  name: string
  description?: string
  inputSchema?: Record<string, unknown>
}

interface McpServerBasic {
  name: string
}

const props = defineProps<{
  modelValue: SelectedMcpTool[]
}>()

const emit = defineEmits<{
  'update:modelValue': [tools: SelectedMcpTool[]]
}>()

const store = useBatataStore()
const namespace = computed(() => store.currentNamespace)

const isOpen = ref(false)
const selectedServer = ref('')
const searchKeyword = ref('')
const servers = ref<McpServerBasic[]>([])
const tools = ref<McpTool[]>([])
const loadingTools = ref(false)

const selectedTools = computed(() => props.modelValue)

const filteredTools = computed(() => {
  if (!searchKeyword.value) return tools.value
  const kw = searchKeyword.value.toLowerCase()
  return tools.value.filter(
    (t) =>
      t.name.toLowerCase().includes(kw) ||
      (t.description && t.description.toLowerCase().includes(kw)),
  )
})

const isToolSelected = (name: string) => selectedTools.value.some((t) => t.name === name)

const toggleTool = (tool: McpTool) => {
  if (isToolSelected(tool.name)) {
    emit(
      'update:modelValue',
      selectedTools.value.filter((t) => t.name !== tool.name),
    )
  } else {
    emit('update:modelValue', [
      ...selectedTools.value,
      { name: tool.name, description: tool.description, inputSchema: tool.inputSchema },
    ])
  }
}

const handleServerChange = async () => {
  tools.value = []
  searchKeyword.value = ''
  if (!selectedServer.value) return

  loadingTools.value = true
  try {
    const response = await batataApi.getMcpServerDetail(namespace.value, selectedServer.value)
    const detail = response.data.data
    // Extract tools from server detail — tools may be in toolSpec.tools or tools array
    if (detail && typeof detail === 'object') {
      const d = detail as unknown as Record<string, unknown>
      if (Array.isArray(d.tools)) {
        tools.value = d.tools as McpTool[]
      } else if (d.toolSpec && typeof d.toolSpec === 'object') {
        const spec = d.toolSpec as Record<string, unknown>
        if (Array.isArray(spec.tools)) {
          tools.value = spec.tools as McpTool[]
        }
      }
    }
  } catch {
    tools.value = []
  } finally {
    loadingTools.value = false
  }
}

// Load server list on first open
watch(isOpen, async (open) => {
  if (open && servers.value.length === 0) {
    try {
      const response = await batataApi.getMcpServerList({
        namespaceId: namespace.value,
        pageNo: 1,
        pageSize: 200,
      })
      const data = response.data.data
      if (data && typeof data === 'object' && 'pageItems' in data) {
        servers.value = (data as { pageItems: McpServerBasic[] }).pageItems || []
      }
    } catch {
      servers.value = []
    }
  }
})
</script>
