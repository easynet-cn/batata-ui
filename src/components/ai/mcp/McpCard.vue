<template>
  <div
    class="relative group bg-white border border-border rounded-lg flex flex-col overflow-hidden transition-all hover:shadow-md hover:border-primary/20 cursor-pointer"
    :class="{ 'ring-2 ring-primary border-primary/40': selected }"
    @click="onCardClick"
  >
    <!-- Checkbox -->
    <div
      v-if="selectable"
      class="absolute top-2.5 right-2.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
      :class="selected && 'opacity-100'"
      @click.stop
    >
      <input
        type="checkbox"
        class="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary"
        :checked="selected"
        @change="onToggle"
      />
    </div>

    <div class="flex items-start gap-3 px-4 pt-3.5 pb-2">
      <!-- Icon -->
      <div
        class="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-sm"
      >
        <Cpu class="w-5 h-5 text-white" />
      </div>

      <!-- Title + meta -->
      <div class="flex-1 min-w-0">
        <h3 class="text-sm font-semibold text-text-primary truncate" :title="mcp.name">
          {{ mcp.name }}
        </h3>
        <div class="flex items-center gap-1.5 mt-1 flex-wrap">
          <!-- Protocol pill -->
          <span
            class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
            :class="protocolStyle"
          >
            <span class="w-1.5 h-1.5 rounded-full" :class="protocolDot" />
            {{ protocolLabel }}
          </span>
          <!-- Version -->
          <span
            v-if="version"
            class="text-[10px] text-text-tertiary font-mono bg-bg-tertiary px-1 py-0.5 rounded"
          >
            {{ version }}
          </span>
        </div>
      </div>
    </div>

    <!-- Description -->
    <div class="px-4 pb-2 flex-1">
      <p
        class="text-xs text-text-secondary line-clamp-2 leading-relaxed"
        style="
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        "
      >
        {{ mcp.description || '暂无描述' }}
      </p>

      <!-- Capabilities + tools -->
      <div
        v-if="capabilities.length > 0 || tools.length > 0"
        class="flex items-center gap-2 mt-2 flex-wrap"
      >
        <span
          v-for="cap in capabilities"
          :key="cap"
          class="inline-flex items-center gap-1 rounded-md bg-bg-tertiary px-1.5 py-0.5 text-[10px] font-medium text-text-secondary"
        >
          <component :is="capabilityIcon(cap)" class="w-3 h-3" :class="capabilityColor(cap)" />
          {{ cap }}
        </span>
        <span
          v-if="tools.length > 0"
          class="inline-flex items-center gap-1 text-[10px] text-text-tertiary"
        >
          <Wrench class="w-3 h-3" />
          {{ tools.length }} {{ tools.length === 1 ? 'tool' : 'tools' }}
        </span>
      </div>
    </div>

    <!-- Footer -->
    <div
      class="px-4 py-1.5 border-t border-border bg-bg-tertiary/40 flex items-center justify-between"
      @click.stop
    >
      <span
        class="badge text-[10px] px-1.5 py-0 h-4 font-medium"
        :class="enabledBadgeClass(mcp.enabled)"
      >
        {{ mcp.enabled ? '已启用' : '已禁用' }}
      </span>
      <div class="flex items-center -mr-1">
        <button class="btn btn-ghost btn-sm !h-6 !w-6 !p-0" @click="onView" title="详情">
          <Eye class="w-3 h-3" />
        </button>
        <button
          v-if="canEdit"
          class="btn btn-ghost btn-sm !h-6 !w-6 !p-0"
          @click="onEdit"
          title="编辑"
        >
          <Pencil class="w-3 h-3" />
        </button>
        <button class="btn btn-ghost btn-sm !h-6 !w-6 !p-0" @click="onMore($event)" title="更多">
          <MoreHorizontal class="w-3 h-3" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Eye, Pencil, MoreHorizontal, Wrench, Cpu, MessageSquare, Database, Zap } from '@lucide/vue'
import type { McpServerBasicInfo } from '@/types/mcp'

const props = defineProps<{
  mcp: McpServerBasicInfo
  selected?: boolean
  selectable?: boolean
  canEdit?: boolean
}>()

const emit = defineEmits<{
  view: [mcp: McpServerBasicInfo]
  edit: [mcp: McpServerBasicInfo]
  toggle: [mcp: McpServerBasicInfo]
  more: [mcp: McpServerBasicInfo, event: MouseEvent]
}>()

const version = computed(() => props.mcp.versionDetail?.version || props.mcp.version || '')
const protocolLabel = computed(() => props.mcp.frontProtocol || props.mcp.protocol || 'unknown')

const protocolStyles: Record<string, { pill: string; dot: string }> = {
  stdio: { pill: 'bg-purple-50 text-purple-700', dot: 'bg-purple-500' },
  'mcp-sse': { pill: 'bg-blue-50 text-blue-700', dot: 'bg-blue-500' },
  'mcp-streamable': { pill: 'bg-cyan-50 text-cyan-700', dot: 'bg-cyan-500' },
  http: { pill: 'bg-orange-50 text-orange-700', dot: 'bg-orange-500' },
  dubbo: { pill: 'bg-green-50 text-green-700', dot: 'bg-green-500' },
}

const protocolStyle = computed(
  () => protocolStyles[protocolLabel.value]?.pill || 'bg-gray-100 text-gray-600',
)
const protocolDot = computed(() => protocolStyles[protocolLabel.value]?.dot || 'bg-gray-400')

const tools = computed(() => {
  const spec = (props.mcp as unknown as { toolSpec?: { tools?: { name: string }[] } }).toolSpec
  return spec?.tools || []
})

const capabilities = computed(() => props.mcp.capabilities || [])

const capabilityIcon = (cap: string) => {
  const map: Record<string, typeof Wrench> = {
    TOOL: Wrench,
    PROMPT: MessageSquare,
    RESOURCE: Database,
  }
  return map[cap] || Zap
}

const capabilityColor = (cap: string) => {
  const map: Record<string, string> = {
    TOOL: 'text-amber-500',
    PROMPT: 'text-blue-500',
    RESOURCE: 'text-emerald-500',
  }
  return map[cap] || 'text-gray-400'
}

const enabledBadgeClass = (enabled: boolean) => (enabled ? 'badge-success' : 'badge-secondary')

const onCardClick = () => emit('view', props.mcp)
const onView = () => emit('view', props.mcp)
const onEdit = () => emit('edit', props.mcp)
const onToggle = () => emit('toggle', props.mcp)
const onMore = (e: MouseEvent) => emit('more', props.mcp, e)
</script>
