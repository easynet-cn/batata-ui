<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold text-slate-900">{{ t('dashboard') }}</h1>
        <p class="text-sm text-slate-500 mt-1">{{ t('systemOverview') }}</p>
      </div>
      <button
        @click="refreshData"
        :disabled="loading"
        class="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
      >
        <RefreshCw :size="14" :class="{ 'animate-spin': loading }" />
        {{ t('refresh') }}
      </button>
    </div>

    <!-- Statistics Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Services Card -->
      <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-slate-500">{{ t('totalServices') }}</p>
            <p class="text-2xl font-bold text-slate-900 mt-1">{{ stats.totalServices }}</p>
            <p class="text-xs text-emerald-600 mt-1 flex items-center gap-1">
              <CheckCircle :size="12" />
              {{ stats.healthyServices }} {{ t('healthy') }}
            </p>
          </div>
          <div class="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
            <Server :size="24" class="text-blue-500" />
          </div>
        </div>
      </div>

      <!-- Configurations Card -->
      <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-slate-500">{{ t('totalConfigs') }}</p>
            <p class="text-2xl font-bold text-slate-900 mt-1">{{ stats.totalConfigs }}</p>
            <p class="text-xs text-slate-500 mt-1">{{ stats.configGroups }} {{ t('groups') }}</p>
          </div>
          <div class="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center">
            <FileCode :size="24" class="text-indigo-500" />
          </div>
        </div>
      </div>

      <!-- Namespaces Card -->
      <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-slate-500">{{ t('totalNamespaces') }}</p>
            <p class="text-2xl font-bold text-slate-900 mt-1">{{ stats.totalNamespaces }}</p>
            <p class="text-xs text-slate-500 mt-1">
              {{ stats.customNamespaces }} {{ t('custom') }}
            </p>
          </div>
          <div class="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
            <Layers :size="24" class="text-purple-500" />
          </div>
        </div>
      </div>

      <!-- Cluster Nodes Card -->
      <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-slate-500">{{ t('clusterNodes') }}</p>
            <p class="text-2xl font-bold text-slate-900 mt-1">{{ stats.totalNodes }}</p>
            <p class="text-xs text-emerald-600 mt-1 flex items-center gap-1">
              <Activity :size="12" />
              {{ stats.healthyNodes }} {{ t('online') }}
            </p>
          </div>
          <div class="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center">
            <Network :size="24" class="text-emerald-500" />
          </div>
        </div>
      </div>
    </div>

    <!-- Charts Section -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- Service Health Distribution -->
      <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <h3 class="text-sm font-semibold text-slate-900 mb-4">
          {{ t('serviceHealthDistribution') }}
        </h3>
        <div ref="healthChartRef" class="h-64"></div>
      </div>

      <!-- Config Types Distribution -->
      <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <h3 class="text-sm font-semibold text-slate-900 mb-4">{{ t('configTypeDistribution') }}</h3>
        <div ref="configChartRef" class="h-64"></div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <h3 class="text-sm font-semibold text-slate-900 mb-4">{{ t('quickActions') }}</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        <RouterLink
          to="/config/new"
          class="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all"
        >
          <div class="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
            <Plus :size="16" class="text-indigo-500" />
          </div>
          <span class="text-sm font-medium text-slate-700">{{ t('createConfig') }}</span>
        </RouterLink>

        <RouterLink
          to="/services"
          class="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all"
        >
          <div class="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
            <Server :size="16" class="text-blue-500" />
          </div>
          <span class="text-sm font-medium text-slate-700">{{ t('manageServices') }}</span>
        </RouterLink>

        <RouterLink
          to="/namespaces"
          class="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all"
        >
          <div class="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
            <Layers :size="16" class="text-purple-500" />
          </div>
          <span class="text-sm font-medium text-slate-700">{{ t('manageNamespaces') }}</span>
        </RouterLink>

        <RouterLink
          to="/cluster"
          class="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all"
        >
          <div class="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
            <Network :size="16" class="text-emerald-500" />
          </div>
          <span class="text-sm font-medium text-slate-700">{{ t('viewCluster') }}</span>
        </RouterLink>
      </div>
    </div>

    <!-- Cluster Nodes Status -->
    <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <h3 class="text-sm font-semibold text-slate-900 mb-4">{{ t('clusterNodesStatus') }}</h3>
      <div v-if="clusterNodes.length === 0" class="text-center py-8 text-slate-400">
        <Network :size="32" class="mx-auto mb-2 opacity-50" />
        <p class="text-sm">{{ t('noClusterNodes') }}</p>
      </div>
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div
          v-for="node in clusterNodes"
          :key="node.address"
          class="flex items-center gap-3 p-3 rounded-lg border border-slate-200"
        >
          <div
            :class="[
              'w-3 h-3 rounded-full',
              node.state === 'UP'
                ? 'bg-emerald-500'
                : node.state === 'SUSPICIOUS'
                  ? 'bg-amber-500'
                  : 'bg-red-500',
            ]"
          ></div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-slate-900 truncate">{{ node.address }}</p>
            <p class="text-xs text-slate-500">{{ node.state }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { RouterLink } from 'vue-router'
import {
  Server,
  FileCode,
  Layers,
  Network,
  RefreshCw,
  CheckCircle,
  Activity,
  Plus,
} from 'lucide-vue-next'
import * as echarts from 'echarts'
import { useI18n } from '@/i18n'
import { useBatataStore } from '@/stores/batata'
import type { NodeInfo, Namespace } from '@/types'

// Props
defineProps<{
  namespace?: Namespace
}>()

const { t } = useI18n()
const batataStore = useBatataStore()

// Refs
const loading = ref(false)
const healthChartRef = ref<HTMLElement | null>(null)
const configChartRef = ref<HTMLElement | null>(null)
let healthChart: echarts.ECharts | null = null
let configChart: echarts.ECharts | null = null

// Data
const clusterNodes = ref<NodeInfo[]>([])

// Statistics
const stats = ref({
  totalServices: 0,
  healthyServices: 0,
  totalConfigs: 0,
  configGroups: 0,
  totalNamespaces: 0,
  customNamespaces: 0,
  totalNodes: 0,
  healthyNodes: 0,
})

// Config types distribution data
const configTypeData = ref([
  { name: 'YAML', value: 35 },
  { name: 'Properties', value: 25 },
  { name: 'JSON', value: 20 },
  { name: 'XML', value: 10 },
  { name: 'Text', value: 10 },
])

// Initialize health chart
const initHealthChart = () => {
  if (!healthChartRef.value) return

  healthChart = echarts.init(healthChartRef.value)
  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      textStyle: {
        fontSize: 12,
        color: '#64748b',
      },
    },
    series: [
      {
        name: 'Service Health',
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 4,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: false,
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
          },
        },
        data: [
          {
            value: stats.value.healthyServices,
            name: t('healthy'),
            itemStyle: { color: '#10b981' },
          },
          {
            value: stats.value.totalServices - stats.value.healthyServices,
            name: t('unhealthy'),
            itemStyle: { color: '#ef4444' },
          },
        ],
      },
    ],
  }
  healthChart.setOption(option)
}

// Initialize config chart
const initConfigChart = () => {
  if (!configChartRef.value) return

  configChart = echarts.init(configChartRef.value)
  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      textStyle: {
        fontSize: 12,
        color: '#64748b',
      },
    },
    series: [
      {
        name: 'Config Types',
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 4,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: false,
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
          },
        },
        data: configTypeData.value.map((item, index) => ({
          value: item.value,
          name: item.name,
          itemStyle: {
            color: ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#64748b'][index],
          },
        })),
      },
    ],
  }
  configChart.setOption(option)
}

// Update charts with new data
const updateCharts = () => {
  if (healthChart) {
    healthChart.setOption({
      series: [
        {
          data: [
            {
              value: stats.value.healthyServices,
              name: t('healthy'),
              itemStyle: { color: '#10b981' },
            },
            {
              value: Math.max(0, stats.value.totalServices - stats.value.healthyServices),
              name: t('unhealthy'),
              itemStyle: { color: '#ef4444' },
            },
          ],
        },
      ],
    })
  }
}

// Update config chart with new data
const updateConfigChart = () => {
  if (configChart) {
    configChart.setOption({
      series: [
        {
          data: configTypeData.value.map((item, index) => ({
            value: item.value,
            name: item.name,
            itemStyle: {
              color: ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#64748b'][index % 5],
            },
          })),
        },
      ],
    })
  }
}

// Fetch all data
const fetchData = async () => {
  loading.value = true

  // Fetch services
  try {
    const servicesData = await batataStore.fetchServices({ pageSize: 1000 })
    stats.value.totalServices = servicesData.totalCount
    stats.value.healthyServices = batataStore.healthyServicesCount
  } catch (error) {
    console.error('Failed to fetch services:', error)
  }

  // Fetch configs
  try {
    const configsData = await batataStore.fetchConfigs({ pageSize: 1000 })
    stats.value.totalConfigs = configsData.totalCount
    // Count unique groups
    const groups = new Set(configsData.pageItems.map((c) => c.groupName))
    stats.value.configGroups = groups.size

    // Update config type distribution based on actual data
    const typeCount: Record<string, number> = {}
    configsData.pageItems.forEach((c) => {
      const type = c.type || 'text'
      typeCount[type] = (typeCount[type] || 0) + 1
    })
    configTypeData.value = Object.entries(typeCount).map(([name, value]) => ({
      name: name.toUpperCase(),
      value,
    }))
  } catch (error) {
    console.error('Failed to fetch configs:', error)
  }

  // Fetch namespaces
  try {
    const namespacesData = await batataStore.fetchNamespaces()
    stats.value.totalNamespaces = namespacesData.length
    stats.value.customNamespaces = namespacesData.filter((n) => n.type === 2).length
  } catch (error) {
    console.error('Failed to fetch namespaces:', error)
  }

  // Fetch cluster nodes
  try {
    const nodesData = await batataStore.fetchClusterNodes()
    clusterNodes.value = nodesData
    stats.value.totalNodes = nodesData.length
    stats.value.healthyNodes = nodesData.filter((n) => n.state === 'UP').length
  } catch (error) {
    console.error('Failed to fetch cluster nodes:', error)
  }

  // Update charts
  updateCharts()
  updateConfigChart()
  loading.value = false
}

// Refresh data
const refreshData = () => {
  fetchData()
}

// Handle window resize
const handleResize = () => {
  healthChart?.resize()
  configChart?.resize()
}

onMounted(() => {
  fetchData()
  initHealthChart()
  initConfigChart()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  healthChart?.dispose()
  configChart?.dispose()
  window.removeEventListener('resize', handleResize)
})

// Watch stats changes to update charts
watch(
  () => stats.value.healthyServices,
  () => {
    updateCharts()
  },
)
</script>
