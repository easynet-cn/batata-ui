<template>
  <div class="space-y-3">
    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <Loader2 class="w-6 h-6 animate-spin text-primary" />
    </div>

    <!-- Error / No chain -->
    <div
      v-else-if="!chain"
      class="flex flex-col items-center justify-center py-12 text-text-tertiary"
    >
      <Route class="w-8 h-8 mb-2 opacity-50" />
      <p class="text-sm">{{ t('consulNoDiscoveryChain') }}</p>
      <p class="text-xs mt-1">{{ t('consulDiscoveryChainHint') }}</p>
    </div>

    <!-- Chain Visualization -->
    <template v-else>
      <!-- Protocol Badge -->
      <div class="flex items-center gap-2 mb-2">
        <span class="badge badge-info">{{ chain.Protocol || 'tcp' }}</span>
        <span class="text-xs text-text-tertiary">{{ chain.ServiceName }}</span>
      </div>

      <!-- Three-column flow: Routes → Splitters → Resolvers -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <!-- Routes Column -->
        <div>
          <h3 class="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
            <Route class="w-3 h-3 inline mr-1" />
            Routes ({{ routes.length }})
          </h3>
          <div class="space-y-2">
            <div
              v-for="(rt, idx) in routes"
              :key="idx"
              class="card p-3 border-l-4 border-l-blue-500"
            >
              <div class="text-xs font-medium text-text-primary mb-1">
                {{ rt.name || 'default' }}
              </div>
              <div
                v-for="(match, mIdx) in rt.matches"
                :key="mIdx"
                class="text-[10px] text-text-secondary"
              >
                <span v-if="match.PathPrefix" class="font-mono">
                  prefix: {{ match.PathPrefix }}
                </span>
                <span v-if="match.PathExact" class="font-mono"> exact: {{ match.PathExact }} </span>
                <span v-if="match.PathRegex" class="font-mono"> regex: {{ match.PathRegex }} </span>
                <span v-if="match.Methods && match.Methods.length" class="ml-1">
                  [{{ match.Methods.join(', ') }}]
                </span>
              </div>
              <div class="text-[10px] text-text-tertiary mt-1">→ {{ rt.destination }}</div>
            </div>
            <div v-if="routes.length === 0" class="text-xs text-text-tertiary p-3">
              {{ t('consulDefaultRoute') }}
            </div>
          </div>
        </div>

        <!-- Splitters Column -->
        <div>
          <h3 class="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
            <GitBranch class="w-3 h-3 inline mr-1" />
            Splitters ({{ splitters.length }})
          </h3>
          <div class="space-y-2">
            <div
              v-for="sp in splitters"
              :key="sp.name"
              class="card p-3 border-l-4 border-l-amber-500"
            >
              <div class="text-xs font-medium text-text-primary mb-2">{{ sp.name }}</div>
              <div v-for="(split, sIdx) in sp.splits" :key="sIdx" class="mb-1.5">
                <div class="flex items-center justify-between text-[10px]">
                  <span class="text-text-secondary">{{ split.service }}</span>
                  <span class="font-bold text-text-primary">{{ split.weight }}%</span>
                </div>
                <div class="w-full h-1.5 bg-bg-tertiary rounded-full mt-0.5">
                  <div
                    class="h-full bg-amber-500 rounded-full"
                    :style="{ width: split.weight + '%' }"
                  />
                </div>
              </div>
            </div>
            <div v-if="splitters.length === 0" class="text-xs text-text-tertiary p-3">
              {{ t('consulNoSplitters') }}
            </div>
          </div>
        </div>

        <!-- Resolvers Column -->
        <div>
          <h3 class="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
            <Target class="w-3 h-3 inline mr-1" />
            Resolvers ({{ resolvers.length }})
          </h3>
          <div class="space-y-2">
            <div
              v-for="res in resolvers"
              :key="res.name"
              class="card p-3 border-l-4 border-l-emerald-500"
            >
              <div class="text-xs font-medium text-text-primary mb-1">{{ res.name }}</div>
              <div
                v-for="(target, tIdx) in res.targets"
                :key="tIdx"
                class="text-[10px] text-text-secondary"
              >
                <span class="font-mono">{{ target.service }}</span>
                <span v-if="target.serviceSubset" class="ml-1 badge badge-default">
                  {{ target.serviceSubset }}
                </span>
                <span v-if="target.datacenter" class="ml-1 text-text-tertiary">
                  ({{ target.datacenter }})
                </span>
              </div>
              <div v-if="res.failover" class="mt-1 text-[10px] text-amber-600">
                failover → {{ res.failover }}
              </div>
            </div>
            <div v-if="resolvers.length === 0" class="text-xs text-text-tertiary p-3">
              {{ t('consulNoResolvers') }}
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Loader2, Route, GitBranch, Target } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import consulApi from '@/api/consul'
import { logger } from '@/utils/logger'

const props = defineProps<{
  serviceName: string
}>()

const { t } = useI18n()

const loading = ref(false)
const chain = ref<Record<string, unknown> | null>(null)

interface RouteInfo {
  name: string
  matches: Array<{
    PathPrefix?: string
    PathExact?: string
    PathRegex?: string
    Methods?: string[]
  }>
  destination: string
}

interface SplitInfo {
  name: string
  splits: Array<{ service: string; weight: number }>
}

interface ResolverInfo {
  name: string
  targets: Array<{ service: string; serviceSubset?: string; datacenter?: string }>
  failover?: string
}

// Extract routes from chain nodes
const routes = computed<RouteInfo[]>(() => {
  if (!chain.value?.Chain) return []
  const c = chain.value.Chain as {
    Nodes?: Record<
      string,
      {
        Type: string
        Routes?: Array<{
          Match?: { HTTP?: Record<string, unknown> }
          Destination?: { Service?: string; ServiceSubset?: string }
        }>
      }
    >
  }
  const result: RouteInfo[] = []
  if (!c.Nodes) return result
  for (const [id, node] of Object.entries(c.Nodes)) {
    if (node.Type !== 'router') continue
    const routeNode: RouteInfo = {
      name: id.replace('router:', ''),
      matches: [],
      destination: '',
    }
    if (node.Routes) {
      for (const rt of node.Routes) {
        if (rt.Match?.HTTP) {
          routeNode.matches.push(rt.Match.HTTP as RouteInfo['matches'][0])
        }
        if (rt.Destination?.Service) {
          routeNode.destination =
            rt.Destination.Service +
            (rt.Destination.ServiceSubset ? '.' + rt.Destination.ServiceSubset : '')
        }
      }
    }
    result.push(routeNode)
  }
  return result
})

// Extract splitters from chain nodes
const splitters = computed<SplitInfo[]>(() => {
  if (!chain.value?.Chain) return []
  const c = chain.value.Chain as {
    Nodes?: Record<string, { Type: string; Splits?: Array<{ Weight: number; NextNode: string }> }>
  }
  const result: SplitInfo[] = []
  if (!c.Nodes) return result
  for (const [id, node] of Object.entries(c.Nodes)) {
    if (node.Type !== 'splitter') continue
    result.push({
      name: id.replace('splitter:', ''),
      splits: (node.Splits || []).map((s) => ({
        service: s.NextNode?.replace('resolver:', '') || '',
        weight: s.Weight,
      })),
    })
  }
  return result
})

// Extract resolvers from chain targets
const resolvers = computed<ResolverInfo[]>(() => {
  if (!chain.value?.Chain) return []
  const c = chain.value.Chain as {
    Nodes?: Record<
      string,
      {
        Type: string
        Resolver?: { Default?: boolean; Target?: string; Failover?: { Targets?: string[] } }
      }
    >
    Targets?: Record<string, { Service: string; ServiceSubset?: string; Datacenter?: string }>
  }
  const result: ResolverInfo[] = []
  if (!c.Nodes) return result
  for (const [id, node] of Object.entries(c.Nodes)) {
    if (node.Type !== 'resolver') continue
    const targets: ResolverInfo['targets'] = []
    if (node.Resolver?.Target && c.Targets?.[node.Resolver.Target]) {
      const t = c.Targets[node.Resolver.Target]
      targets.push({
        service: t.Service,
        serviceSubset: t.ServiceSubset,
        datacenter: t.Datacenter,
      })
    }
    result.push({
      name: id.replace('resolver:', ''),
      targets,
      failover: node.Resolver?.Failover?.Targets?.[0]?.replace('resolver:', ''),
    })
  }
  return result
})

async function fetchChain() {
  loading.value = true
  try {
    const response = await consulApi.getDiscoveryChain(props.serviceName)
    chain.value = response.data
  } catch (error) {
    logger.error('Failed to fetch discovery chain:', error)
    chain.value = null
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchChain()
})
</script>
