<template>
  <div class="mcp-tool-list">
    <div v-if="!tools || tools.length === 0" class="text-center py-8 text-text-tertiary text-xs">
      暂无工具
    </div>
    <div v-else class="space-y-2">
      <div
        v-for="(tool, index) in tools"
        :key="tool.name + index"
        class="border border-border rounded-md p-3 bg-white"
      >
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0">
            <h4 class="text-sm font-semibold text-text-primary font-mono">{{ tool.name }}</h4>
            <p v-if="tool.description" class="text-xs text-text-secondary mt-0.5">
              {{ tool.description }}
            </p>
          </div>
          <span v-if="isToolEnabled(tool)" class="badge badge-success text-[9px]">启用</span>
        </div>

        <div v-if="tool.inputSchema" class="mt-2">
          <details>
            <summary class="text-[10px] text-text-tertiary cursor-pointer select-none">
              inputSchema
            </summary>
            <pre
              class="mt-1 p-2 rounded bg-bg-tertiary text-[10px] text-text-secondary overflow-x-auto"
              >{{ formatJson(tool.inputSchema) }}</pre>
          </details>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { McpTool } from '@/types/mcp'

defineProps<{
  tools?: McpTool[]
  toolsMeta?: Record<string, { enabled?: boolean }>
}>()

function isToolEnabled(tool: McpTool): boolean {
  const meta = (tool as McpTool & { _meta?: { enabled?: boolean } })._meta
  return meta?.enabled !== false
}

function formatJson(schema: unknown): string {
  try {
    return JSON.stringify(schema, null, 2)
  } catch {
    return String(schema)
  }
}
</script>
