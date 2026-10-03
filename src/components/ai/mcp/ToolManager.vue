<template>
  <div class="tool-manager space-y-3">
    <div class="flex items-center justify-between">
      <h4 class="text-sm font-semibold text-text-primary">工具列表 ({{ localTools.length }})</h4>
      <div class="flex items-center gap-2">
        <button class="btn btn-ghost btn-sm" @click="showImport = !showImport">
          <Download class="w-3.5 h-3.5" /> 从 MCP 端点导入
        </button>
        <button class="btn btn-primary btn-sm" @click="addTool">
          <Plus class="w-3.5 h-3.5" /> 新增工具
        </button>
      </div>
    </div>

    <!-- Import from endpoint -->
    <div v-if="showImport" class="p-3 rounded border border-border bg-bg-tertiary space-y-2">
      <div class="grid grid-cols-2 gap-2">
        <select v-model="importForm.transportType" class="input text-xs">
          <option value="sse">SSE</option>
          <option value="streamable-http">Streamable HTTP</option>
        </select>
        <input
          v-model="importForm.baseUrl"
          class="input text-xs"
          placeholder="Base URL (e.g. https://api.example.com)"
        />
      </div>
      <input
        v-model="importForm.endpoint"
        class="input text-xs"
        placeholder="Endpoint path (e.g. /mcp)"
      />
      <input v-model="importForm.authToken" class="input text-xs" placeholder="Auth Token (可选)" />
      <div class="flex justify-end gap-2">
        <button class="btn btn-secondary btn-sm" @click="showImport = false">取消</button>
        <button
          class="btn btn-primary btn-sm"
          :disabled="importing || !importForm.baseUrl"
          @click="handleImport"
        >
          <Loader2 v-if="importing" class="w-3.5 h-3.5 animate-spin" />
          导入工具
        </button>
      </div>
    </div>

    <!-- Empty -->
    <div v-if="localTools.length === 0" class="text-center py-8 text-text-tertiary text-xs">
      暂无工具，点击「新增工具」或从 MCP 端点导入
    </div>

    <!-- Tool list -->
    <div class="space-y-2">
      <div
        v-for="(tool, index) in localTools"
        :key="tool.name + index"
        class="border border-border rounded-md p-3 bg-white"
      >
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <input
                v-model="tool.name"
                class="input text-xs font-semibold flex-1"
                placeholder="tool_name"
                @input="emitTools"
              />
              <button class="btn btn-ghost btn-sm" @click="removeTool(index)" title="删除">
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
            <input
              v-model="tool.description"
              class="input text-xs mt-1.5 w-full"
              placeholder="工具描述"
              @input="emitTools"
            />
          </div>
        </div>

        <div class="mt-2">
          <label class="text-[10px] text-text-tertiary mb-1 block">inputSchema (JSON)</label>
          <textarea
            :value="getSchemaDisplay(index)"
            rows="4"
            class="input font-mono text-[10px] w-full"
            placeholder='{ "type": "object", "properties": {} }'
            @input="onSchemaChange(index, ($event.target as HTMLTextAreaElement).value)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Plus, Trash2, Download, Loader2 } from '@lucide/vue'
import { mcpApi } from '@/api/mcp'
import { logger } from '@/utils/logger'
import type { McpTool } from '@/types/mcp'

const props = defineProps<{
  tools: McpTool[]
}>()

const emit = defineEmits<{
  'update:tools': [tools: McpTool[]]
}>()

const showImport = ref(false)
const importing = ref(false)
const importForm = ref({
  transportType: 'sse',
  baseUrl: '',
  endpoint: '',
  authToken: '',
})

// Local copy to avoid mutating the prop directly
const localTools = ref<McpTool[]>(props.tools.map((t) => ({ ...t })))
// Holds raw (possibly invalid) JSON text per tool index so invalid input is
// never written back into `inputSchema` and sent to the backend.
const rawSchemaTexts = ref<Record<number, string>>({})

watch(
  () => props.tools,
  (next) => {
    localTools.value = next.map((t) => ({ ...t }))
  },
)

function emitTools() {
  emit(
    'update:tools',
    localTools.value.map((t) => ({ ...t })),
  )
}

function addTool() {
  localTools.value.push({
    name: '',
    description: '',
    inputSchema: { type: 'object', properties: {} },
  })
  emitTools()
}

function removeTool(index: number) {
  localTools.value.splice(index, 1)
  delete rawSchemaTexts.value[index]
  emitTools()
}

function formatJson(schema: unknown): string {
  if (!schema) return ''
  try {
    return JSON.stringify(schema, null, 2)
  } catch {
    return String(schema)
  }
}

function onSchemaChange(index: number, raw: string) {
  if (raw.trim()) {
    try {
      localTools.value[index].inputSchema = JSON.parse(raw)
      delete rawSchemaTexts.value[index]
    } catch {
      // Keep invalid text out of inputSchema; store it separately for display.
      rawSchemaTexts.value[index] = raw
      localTools.value[index].inputSchema = {}
    }
  } else {
    localTools.value[index].inputSchema = {}
    delete rawSchemaTexts.value[index]
  }
  emitTools()
}

function getSchemaDisplay(index: number): string {
  // Show the raw (invalid) text if present, otherwise the formatted schema.
  if (rawSchemaTexts.value[index] !== undefined) return rawSchemaTexts.value[index]
  return formatJson(localTools.value[index].inputSchema)
}

async function handleImport() {
  importing.value = true
  try {
    const response = await mcpApi.importToolsFromMcp({
      transportType: importForm.value.transportType,
      baseUrl: importForm.value.baseUrl,
      endpoint: importForm.value.endpoint,
      authToken: importForm.value.authToken,
    })
    const imported = response.data.data || []
    for (const tool of imported) {
      const exists = localTools.value.some((t) => t.name === tool.name)
      if (!exists) localTools.value.push(tool)
    }
    emitTools()
    showImport.value = false
    importForm.value.baseUrl = ''
    importForm.value.endpoint = ''
    importForm.value.authToken = ''
  } catch (err) {
    logger.error('Import tools failed:', err)
  } finally {
    importing.value = false
  }
}
</script>
