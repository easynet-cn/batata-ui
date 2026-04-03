<template>
  <div class="w-full" style="min-height: 400px">
    <!-- ACL filter warning -->
    <div
      v-if="filterByACLs"
      class="mb-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800"
    >
      <p class="text-xs text-amber-700 dark:text-amber-400">
        {{ t('consulTopologyACLWarning') }}
      </p>
    </div>

    <!-- Empty state -->
    <div
      v-if="upstreams.length === 0 && downstreams.length === 0"
      class="flex flex-col items-center justify-center py-12 text-text-tertiary"
    >
      <GitBranch class="w-8 h-8 mb-2 opacity-50" />
      <p class="text-sm">{{ t('consulNoDependencies') }}</p>
    </div>

    <!-- Topology Graph -->
    <v-chart
      v-else
      :option="chartOption"
      :autoresize="true"
      style="min-height: 400px; width: 100%"
      @click="handleNodeClick"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { GitBranch } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import VChart from 'vue-echarts'

interface TopologyNode {
  Name: string
  Datacenter?: string
  Namespace?: string
  Intention?: {
    Allowed: boolean
    HasExact?: boolean
    ExternalSource?: string
  }
}

const props = defineProps<{
  serviceName: string
  upstreams: TopologyNode[]
  downstreams: TopologyNode[]
  filterByACLs?: boolean
  protocol?: string
}>()

const { t } = useI18n()
const router = useRouter()

const chartOption = computed(() => {
  const categories = [{ name: 'upstream' }, { name: 'current' }, { name: 'downstream' }]

  // Build nodes
  const nodes: Array<{
    name: string
    category: number
    symbolSize: number
    itemStyle: { color: string; borderColor: string; borderWidth: number }
    label: { show: boolean; fontSize: number; color: string }
    value: string
  }> = []

  const links: Array<{
    source: string
    target: string
    lineStyle: { color: string; width: number; type: string }
    label?: { show: boolean; formatter: string; fontSize: number; color: string }
  }> = []

  // Upstreams (left)
  for (const up of props.upstreams) {
    nodes.push({
      name: up.Name,
      category: 0,
      symbolSize: 40,
      itemStyle: {
        color: '#3b82f6',
        borderColor: '#2563eb',
        borderWidth: 2,
      },
      label: { show: true, fontSize: 11, color: '#1e40af' },
      value: up.Datacenter || '',
    })
    const allowed = up.Intention?.Allowed
    links.push({
      source: up.Name,
      target: props.serviceName,
      lineStyle: {
        color: allowed === true ? '#10b981' : allowed === false ? '#ef4444' : '#9ca3af',
        width: 2,
        type: allowed === undefined ? 'dashed' : 'solid',
      },
      label: {
        show: true,
        formatter: allowed === true ? '✓' : allowed === false ? '✗' : '?',
        fontSize: 12,
        color: allowed === true ? '#10b981' : allowed === false ? '#ef4444' : '#9ca3af',
      },
    })
  }

  // Current service (center)
  nodes.push({
    name: props.serviceName,
    category: 1,
    symbolSize: 60,
    itemStyle: {
      color: '#8b5cf6',
      borderColor: '#7c3aed',
      borderWidth: 3,
    },
    label: { show: true, fontSize: 13, color: '#6d28d9' },
    value: props.protocol || '',
  })

  // Downstreams (right)
  for (const down of props.downstreams) {
    nodes.push({
      name: down.Name,
      category: 2,
      symbolSize: 40,
      itemStyle: {
        color: '#10b981',
        borderColor: '#059669',
        borderWidth: 2,
      },
      label: { show: true, fontSize: 11, color: '#047857' },
      value: down.Datacenter || '',
    })
    const allowed = down.Intention?.Allowed
    links.push({
      source: props.serviceName,
      target: down.Name,
      lineStyle: {
        color: allowed === true ? '#10b981' : allowed === false ? '#ef4444' : '#9ca3af',
        width: 2,
        type: allowed === undefined ? 'dashed' : 'solid',
      },
      label: {
        show: true,
        formatter: allowed === true ? '✓' : allowed === false ? '✗' : '?',
        fontSize: 12,
        color: allowed === true ? '#10b981' : allowed === false ? '#ef4444' : '#9ca3af',
      },
    })
  }

  return {
    tooltip: {
      trigger: 'item',
      formatter: (params: {
        dataType: string
        data: { name: string; value: string; category: number }
      }) => {
        if (params.dataType === 'node') {
          const cat = ['Upstream', 'Current Service', 'Downstream'][params.data.category] || ''
          return `<strong>${params.data.name}</strong><br/>${cat}${params.data.value ? '<br/>DC: ' + params.data.value : ''}`
        }
        return ''
      },
    },
    legend: {
      data: [
        { name: 'upstream', icon: 'circle' },
        { name: 'current', icon: 'circle' },
        { name: 'downstream', icon: 'circle' },
      ],
      bottom: 0,
      textStyle: { fontSize: 11 },
    },
    series: [
      {
        type: 'graph',
        layout: 'force',
        categories,
        data: nodes,
        links,
        roam: true,
        draggable: true,
        force: {
          repulsion: 400,
          edgeLength: [150, 250],
          gravity: 0.1,
        },
        emphasis: {
          focus: 'adjacency',
          lineStyle: { width: 4 },
        },
        edgeSymbol: ['none', 'arrow'],
        edgeSymbolSize: 8,
        lineStyle: {
          curveness: 0.1,
        },
        label: {
          show: true,
          position: 'bottom',
        },
      },
    ],
  }
})

const handleNodeClick = (params: Record<string, unknown>) => {
  if (params.dataType === 'node') {
    const data = params.data as { name: string; category: number } | undefined
    if (data && data.category !== 1) {
      router.push({
        name: 'consul-service-detail',
        params: { name: data.name },
      })
    }
  }
}
</script>
