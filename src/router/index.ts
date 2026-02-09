import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useBatataStore } from '@/stores/batata'
import BatataLayout from '@/layout/BatataLayout.vue'
import { storage } from '@/composables/useStorage'
import type { ProviderType } from '@/types'

// Nacos/Batata route children
const nacosChildren: RouteRecordRaw[] = [
  // Dashboard
  {
    path: '',
    name: 'dashboard',
    component: () => import('../views/dashboard/DashboardView.vue'),
    meta: { titleKey: 'routeDashboard' },
  },
  // Configuration Management
  {
    path: 'configs',
    name: 'configs',
    component: () => import('../views/config/ConfigListView.vue'),
    meta: { titleKey: 'routeConfigs' },
  },
  {
    path: 'config/new',
    name: 'config-new',
    component: () => import('../views/config/ConfigEditorView.vue'),
    meta: { titleKey: 'routeNewConfig' },
  },
  {
    path: 'config/edit',
    name: 'config-edit',
    component: () => import('../views/config/ConfigEditorView.vue'),
    meta: { titleKey: 'routeEditConfig' },
  },
  {
    path: 'config/detail',
    name: 'config-detail',
    component: () => import('../views/config/ConfigDetailView.vue'),
    meta: { titleKey: 'routeConfigDetail' },
  },
  {
    path: 'config/history',
    name: 'config-history',
    component: () => import('../views/config/ConfigHistoryView.vue'),
    meta: { titleKey: 'routeConfigHistory' },
  },
  {
    path: 'config/listeners',
    name: 'config-listeners',
    component: () => import('../views/config/ConfigListenersView.vue'),
    meta: { titleKey: 'routeConfigListeners' },
  },
  {
    path: 'config/sync',
    name: 'config-sync',
    component: () => import('../views/config/ConfigSyncView.vue'),
    meta: { titleKey: 'routeConfigSync' },
  },
  // Service Management
  {
    path: 'services',
    name: 'services',
    component: () => import('../views/service/ServiceListView.vue'),
    meta: { titleKey: 'routeServices' },
  },
  {
    path: 'service/detail',
    name: 'service-detail',
    component: () => import('../views/service/ServiceDetailView.vue'),
    meta: { titleKey: 'routeServiceDetail' },
  },
  {
    path: 'subscribers',
    name: 'subscribers',
    component: () => import('../views/service/SubscriberListView.vue'),
    meta: { titleKey: 'routeSubscribers' },
  },
  // Namespace
  {
    path: 'namespaces',
    name: 'namespaces',
    component: () => import('../views/namespace/NamespaceListView.vue'),
    meta: { titleKey: 'routeNamespaces' },
  },
  // Cluster Management
  {
    path: 'cluster',
    name: 'cluster',
    component: () => import('../views/cluster/ClusterListView.vue'),
    meta: { titleKey: 'routeCluster' },
  },
  // Authority Control
  {
    path: 'users',
    name: 'users',
    component: () => import('../views/auth/UserListView.vue'),
    meta: { titleKey: 'routeUsers' },
  },
  {
    path: 'roles',
    name: 'roles',
    component: () => import('../views/auth/RoleListView.vue'),
    meta: { titleKey: 'routeRoles' },
  },
  {
    path: 'permissions',
    name: 'permissions',
    component: () => import('../views/auth/PermissionListView.vue'),
    meta: { titleKey: 'routePermissions' },
  },
  // AI/MCP Management
  {
    path: 'mcp',
    name: 'mcp',
    component: () => import('../views/ai/McpListView.vue'),
    meta: { titleKey: 'routeMcp' },
  },
  {
    path: 'mcp/new',
    name: 'mcp-new',
    component: () => import('../views/ai/McpEditorView.vue'),
    meta: { titleKey: 'routeNewMcp' },
  },
  {
    path: 'mcp/edit',
    name: 'mcp-edit',
    component: () => import('../views/ai/McpEditorView.vue'),
    meta: { titleKey: 'routeEditMcp' },
  },
  {
    path: 'mcp/detail',
    name: 'mcp-detail',
    component: () => import('../views/ai/McpDetailView.vue'),
    meta: { titleKey: 'routeMcpDetail' },
  },
  {
    path: 'agents',
    name: 'agents',
    component: () => import('../views/ai/AgentListView.vue'),
    meta: { titleKey: 'routeAgents' },
  },
  {
    path: 'agent/new',
    name: 'agent-new',
    component: () => import('../views/ai/AgentEditorView.vue'),
    meta: { titleKey: 'routeNewAgent' },
  },
  {
    path: 'agent/edit',
    name: 'agent-edit',
    component: () => import('../views/ai/AgentEditorView.vue'),
    meta: { titleKey: 'routeEditAgent' },
  },
  // Multi-datacenter
  {
    path: 'datacenters',
    name: 'datacenters',
    component: () => import('../views/datacenter/DatacenterView.vue'),
    meta: { titleKey: 'routeDatacenters' },
  },
  // Tracing
  {
    path: 'tracing',
    name: 'tracing',
    component: () => import('../views/tracing/TracingView.vue'),
    meta: { titleKey: 'routeTracing' },
  },
  // Audit Log
  {
    path: 'audit',
    name: 'audit',
    component: () => import('../views/audit/AuditLogView.vue'),
    meta: { titleKey: 'routeAudit' },
  },
  // Plugin Management
  {
    path: 'plugins',
    name: 'plugins',
    component: () => import('../views/plugin/PluginListView.vue'),
    meta: { titleKey: 'routePlugins' },
  },
  // Settings
  {
    path: 'settings',
    name: 'settings',
    component: () => import('../views/settings/SettingsView.vue'),
    meta: { titleKey: 'routeSettings' },
  },
]

// Consul route children
const consulChildren: RouteRecordRaw[] = [
  // Dashboard
  {
    path: '',
    name: 'consul-dashboard',
    component: () => import('../views/consul/ConsulDashboardView.vue'),
    meta: { titleKey: 'routeConsulDashboard' },
  },
  // KV Store
  {
    path: 'kv',
    name: 'consul-kv',
    component: () => import('../views/consul/KVListView.vue'),
    meta: { titleKey: 'routeConsulKV' },
  },
  {
    path: 'kv/new',
    name: 'consul-kv-new',
    component: () => import('../views/consul/KVEditorView.vue'),
    meta: { titleKey: 'routeConsulKVNew' },
  },
  {
    path: 'kv/edit',
    name: 'consul-kv-edit',
    component: () => import('../views/consul/KVEditorView.vue'),
    meta: { titleKey: 'routeConsulKVEdit' },
  },
  {
    path: 'kv/detail',
    name: 'consul-kv-detail',
    component: () => import('../views/consul/KVDetailView.vue'),
    meta: { titleKey: 'routeConsulKVDetail' },
  },
  // Catalog Services
  {
    path: 'catalog/services',
    name: 'consul-services',
    component: () => import('../views/consul/CatalogServiceListView.vue'),
    meta: { titleKey: 'routeConsulServices' },
  },
  {
    path: 'catalog/service/:name',
    name: 'consul-service-detail',
    component: () => import('../views/consul/CatalogServiceDetailView.vue'),
    meta: { titleKey: 'routeConsulServiceDetail' },
  },
  // Catalog Nodes
  {
    path: 'catalog/nodes',
    name: 'consul-nodes',
    component: () => import('../views/consul/CatalogNodeListView.vue'),
    meta: { titleKey: 'routeConsulNodes' },
  },
  {
    path: 'catalog/node/:name',
    name: 'consul-node-detail',
    component: () => import('../views/consul/CatalogNodeDetailView.vue'),
    meta: { titleKey: 'routeConsulNodeDetail' },
  },
  // Health Checks
  {
    path: 'health',
    name: 'consul-health',
    component: () => import('../views/consul/HealthCheckListView.vue'),
    meta: { titleKey: 'routeConsulHealth' },
  },
  // ACL
  {
    path: 'acl/tokens',
    name: 'consul-tokens',
    component: () => import('../views/consul/ACLTokenListView.vue'),
    meta: { titleKey: 'routeConsulTokens' },
  },
  {
    path: 'acl/policies',
    name: 'consul-policies',
    component: () => import('../views/consul/ACLPolicyListView.vue'),
    meta: { titleKey: 'routeConsulPolicies' },
  },
  {
    path: 'acl/roles',
    name: 'consul-roles',
    component: () => import('../views/consul/ACLRoleListView.vue'),
    meta: { titleKey: 'routeConsulRoles' },
  },
  // ACL Auth Methods
  {
    path: 'acl/auth-methods',
    name: 'consul-auth-methods',
    component: () => import('../views/consul/AuthMethodListView.vue'),
    meta: { titleKey: 'routeConsulAuthMethods' },
  },
  {
    path: 'acl/auth-method/:name',
    name: 'consul-auth-method-detail',
    component: () => import('../views/consul/AuthMethodDetailView.vue'),
    meta: { titleKey: 'routeConsulAuthMethodDetail' },
  },
  // Service Mesh
  {
    path: 'intentions',
    name: 'consul-intentions',
    component: () => import('../views/consul/IntentionListView.vue'),
    meta: { titleKey: 'routeConsulIntentions' },
  },
  {
    path: 'config-entries',
    name: 'consul-config-entries',
    component: () => import('../views/consul/ConfigEntryListView.vue'),
    meta: { titleKey: 'routeConsulConfigEntries' },
  },
  // Peerings
  {
    path: 'peerings',
    name: 'consul-peerings',
    component: () => import('../views/consul/PeeringListView.vue'),
    meta: { titleKey: 'routeConsulPeerings' },
  },
  {
    path: 'peering/:name',
    name: 'consul-peering-detail',
    component: () => import('../views/consul/PeeringDetailView.vue'),
    meta: { titleKey: 'routeConsulPeeringDetail' },
  },
  // Sessions
  {
    path: 'sessions',
    name: 'consul-sessions',
    component: () => import('../views/consul/SessionListView.vue'),
    meta: { titleKey: 'routeConsulSessions' },
  },
  // Settings (shared)
  {
    path: 'settings',
    name: 'consul-settings',
    component: () => import('../views/settings/SettingsView.vue'),
    meta: { titleKey: 'routeSettings' },
  },
]

// Apollo route children
const apolloChildren: RouteRecordRaw[] = [
  // Dashboard
  {
    path: '',
    name: 'apollo-dashboard',
    component: () => import('../views/apollo/ApolloDashboardView.vue'),
    meta: { titleKey: 'routeApolloDashboard' },
  },
  // Apps
  {
    path: 'apps',
    name: 'apollo-apps',
    component: () => import('../views/apollo/ApolloAppListView.vue'),
    meta: { titleKey: 'routeApolloApps' },
  },
  // App Detail
  {
    path: 'app/:appId',
    name: 'apollo-app-detail',
    component: () => import('../views/apollo/ApolloAppDetailView.vue'),
    meta: { titleKey: 'routeApolloAppDetail' },
  },
  // Namespace Detail
  {
    path: 'namespace/:appId/:env/:clusterName/:namespaceName',
    name: 'apollo-namespace-detail',
    component: () => import('../views/apollo/ApolloNamespaceDetailView.vue'),
    meta: { titleKey: 'routeApolloNamespaceDetail' },
  },
  // Release History
  {
    path: 'releases/:appId/:env/:clusterName/:namespaceName',
    name: 'apollo-release-history',
    component: () => import('../views/apollo/ApolloReleaseHistoryView.vue'),
    meta: { titleKey: 'routeApolloReleaseHistory' },
  },
  // Gray Release
  {
    path: 'gray-release/:appId/:env/:clusterName/:namespaceName',
    name: 'apollo-gray-release',
    component: () => import('../views/apollo/ApolloGrayReleaseView.vue'),
    meta: { titleKey: 'routeApolloGrayRelease' },
  },
  // Instances
  {
    path: 'instances/:appId/:env/:clusterName/:namespaceName',
    name: 'apollo-instances',
    component: () => import('../views/apollo/ApolloInstancesView.vue'),
    meta: { titleKey: 'routeApolloInstances' },
  },
  // Settings (shared)
  {
    path: 'settings',
    name: 'apollo-settings',
    component: () => import('../views/settings/SettingsView.vue'),
    meta: { titleKey: 'routeSettings' },
  },
]

// Layout route name used for dynamic route swapping
const LAYOUT_ROUTE_NAME = 'layout'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/RegisterView.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/',
      name: LAYOUT_ROUTE_NAME,
      component: BatataLayout,
      meta: { requiresAuth: true },
      children: getInitialChildren(),
    },
  ],
})

/**
 * Determine initial children based on stored provider preference.
 */
function getInitialChildren(): RouteRecordRaw[] {
  const provider = storage.get('batata_provider') || 'batata'
  switch (provider) {
    case 'consul':
      return consulChildren
    case 'apollo':
      return apolloChildren
    default:
      return nacosChildren
  }
}

/**
 * Switch route tree when provider changes.
 * Removes the layout route and re-adds it with new children.
 */
export function switchProviderRoutes(provider: ProviderType) {
  let children: RouteRecordRaw[]
  switch (provider) {
    case 'consul':
      children = consulChildren
      break
    case 'apollo':
      children = apolloChildren
      break
    default:
      children = nacosChildren
  }

  // Remove existing layout route
  router.removeRoute(LAYOUT_ROUTE_NAME)

  // Re-add with new children
  router.addRoute({
    path: '/',
    name: LAYOUT_ROUTE_NAME,
    component: BatataLayout,
    meta: { requiresAuth: true },
    children,
  })
}

// Auth guard
router.beforeEach((to, _from, next) => {
  const batataStore = useBatataStore()

  // Restore user session from localStorage if not already in store
  if (!batataStore.isAuthenticated) {
    const savedUser = storage.getJSON<{ name: string }>('batata_user')
    const savedToken = storage.get('batata-token')
    if (savedUser && savedToken) {
      const user = savedUser
      batataStore.currentUser = {
        username: user.name,
        token: savedToken,
      }
    }
  }

  if (to.meta.requiresAuth !== false && !batataStore.isAuthenticated) {
    next('/login')
  } else if (to.path === '/login' && batataStore.isAuthenticated) {
    next('/')
  } else {
    next()
  }
})

export default router
