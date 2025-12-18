<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RotateCw, Activity, Shield, Server } from 'lucide-vue-next'
import { mockNodes } from '@/mock/data'
import type { NodeInfo } from '@/types'
import Modal from '@/components/Modal.vue'
import { useI18n } from '@/i18n'

const { t } = useI18n()

const nodes = ref<NodeInfo[]>([])
const loading = ref(false)
const selectedNode = ref<NodeInfo | null>(null)
const isDetailsOpen = ref(false)

onMounted(() => {
  nodes.value = mockNodes
})

const refreshNodes = () => {
  loading.value = true
  setTimeout(() => {
    nodes.value = mockNodes
    loading.value = false
  }, 600)
}

const handleOpenDetails = (node: NodeInfo) => {
  selectedNode.value = node
  isDetailsOpen.value = true
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">{{ t('cluster') }}</h1>
        <p class="text-slate-500 mt-1">
          Monitor the health and distribution of your Nacos server nodes.
        </p>
      </div>
      <button
        @click="refreshNodes"
        class="p-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors bg-white border border-slate-200 shadow-sm"
      >
        <RotateCw :size="18" :class="loading && 'animate-spin'" />
      </button>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div class="flex items-center justify-between mb-4">
          <div class="p-3 rounded-xl bg-blue-100 text-blue-600">
            <Activity :size="24" />
          </div>
          <span
            class="text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full uppercase"
            >Healthy</span
          >
        </div>
        <div class="text-sm text-slate-500 font-medium">Nodes</div>
        <div class="text-3xl font-bold text-slate-900 mt-1">{{ nodes.length }}</div>
      </div>
      <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div class="flex items-center justify-between mb-4">
          <div class="p-3 rounded-xl bg-indigo-100 text-indigo-600">
            <Shield :size="24" />
          </div>
        </div>
        <div class="text-sm text-slate-500 font-medium">{{ t('leader') }}</div>
        <div class="text-xl font-bold text-slate-900 mt-1">
          {{ nodes.find((n) => n.isLeader)?.ip || 'N/A' }}
        </div>
      </div>
      <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div class="flex items-center justify-between mb-4">
          <div class="p-3 rounded-xl bg-slate-100 text-slate-600">
            <Server :size="24" />
          </div>
        </div>
        <div class="text-sm text-slate-500 font-medium">{{ t('version') }}</div>
        <div class="text-3xl font-bold text-slate-900 mt-1">{{ nodes[0]?.version || '2.x' }}</div>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead class="bg-slate-50 border-b border-slate-100">
            <tr>
              <th class="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {{ t('nodeAddress') }}
              </th>
              <th class="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {{ t('state') }}
              </th>
              <th class="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {{ t('uptime') }}
              </th>
              <th class="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {{ t('cpu') }}
              </th>
              <th class="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {{ t('memory') }}
              </th>
              <th
                class="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right"
              >
                {{ t('actions') }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="node in nodes" :key="node.ip" class="hover:bg-slate-50/50 transition-colors">
              <td class="px-6 py-4">
                <div class="text-sm font-bold text-slate-900 flex items-center">
                  {{ node.ip }}:{{ node.port }}
                  <span
                    v-if="node.isLeader"
                    class="ml-2 px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-full border border-blue-100 uppercase tracking-tighter"
                  >
                    {{ t('leader') }}
                  </span>
                </div>
              </td>
              <td class="px-6 py-4">
                <span
                  :class="[
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
                    node.state === 'UP'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      : 'bg-red-50 text-red-700 border-red-100',
                  ]"
                >
                  {{ node.state }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm text-slate-600 font-medium">{{ node.uptime }}</td>
              <td class="px-6 py-4">
                <div class="flex items-center space-x-2">
                  <div class="flex-1 min-w-[60px] h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div class="h-full bg-blue-500" :style="{ width: `${node.cpuUsage}%` }" />
                  </div>
                  <span class="text-xs text-slate-500 font-mono">{{ node.cpuUsage }}%</span>
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center space-x-2">
                  <div class="flex-1 min-w-[60px] h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div class="h-full bg-indigo-500" :style="{ width: `${node.memoryUsage}%` }" />
                  </div>
                  <span class="text-xs text-slate-500 font-mono">{{ node.memoryUsage }}%</span>
                </div>
              </td>
              <td class="px-6 py-4 text-right">
                <button
                  @click="handleOpenDetails(node)"
                  class="text-blue-600 hover:text-blue-800 text-sm font-bold"
                >
                  {{ t('details') }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Details Modal -->
    <Modal v-model:visible="isDetailsOpen" :title="`${t('details')}: ${selectedNode?.ip}`">
      <div v-if="selectedNode" class="space-y-6">
        <div class="grid grid-cols-2 gap-4">
          <div class="p-4 bg-white border border-slate-200 rounded-2xl">
            <div class="text-xs font-bold text-slate-400 uppercase">{{ t('cpu') }}</div>
            <div class="text-2xl font-black text-slate-900">{{ selectedNode.cpuUsage }}%</div>
          </div>
          <div class="p-4 bg-white border border-slate-200 rounded-2xl">
            <div class="text-xs font-bold text-slate-400 uppercase">{{ t('memory') }}</div>
            <div class="text-2xl font-black text-slate-900">{{ selectedNode.memoryUsage }}%</div>
          </div>
        </div>
        <div class="bg-slate-50 rounded-2xl border border-slate-100 divide-y divide-slate-100">
          <div class="p-3 flex items-center justify-between">
            <span class="text-sm text-slate-600">{{ t('version') }}</span>
            <span class="text-sm font-mono text-slate-900">{{ selectedNode.version }}</span>
          </div>
          <div class="p-3 flex items-center justify-between">
            <span class="text-sm text-slate-600">{{ t('state') }}</span>
            <span class="text-xs font-bold px-2 py-1 rounded-lg bg-blue-100 text-blue-700">
              {{ selectedNode.isLeader ? 'LEADER' : 'FOLLOWER' }}
            </span>
          </div>
        </div>
      </div>
      <template #footer>
        <button
          @click="isDetailsOpen = false"
          class="px-6 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-sm"
        >
          {{ t('cancel') }}
        </button>
      </template>
    </Modal>
  </div>
</template>
