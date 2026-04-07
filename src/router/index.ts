import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
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
  {
    path: 'config/history/detail',
    name: 'config-history-detail',
    component: () => import('../views/config/ConfigHistoryDetailView.vue'),
    meta: { titleKey: 'routeConfigHistoryDetail' },
  },
  {
    path: 'config/rollback',
    name: 'config-rollback',
    component: () => import('../views/config/ConfigRollbackView.vue'),
    meta: { titleKey: 'routeConfigRollback' },
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
  {
    path: 'agent/detail',
    name: 'agent-detail',
    component: () => import('../views/ai/AgentDetailView.vue'),
    meta: { titleKey: 'routeAgentDetail' },
  },
  // Skill Management
  {
    path: 'skills',
    name: 'skills',
    component: () => import('../views/ai/SkillListView.vue'),
    meta: { titleKey: 'routeSkills' },
  },
  {
    path: 'skill/new',
    name: 'skill-new',
    component: () => import('../views/ai/SkillEditorView.vue'),
    meta: { titleKey: 'routeNewSkill' },
  },
  {
    path: 'skill/detail',
    name: 'skill-detail',
    component: () => import('../views/ai/SkillDetailView.vue'),
    meta: { titleKey: 'routeSkillDetail' },
  },
  // AgentSpec Management
  {
    path: 'agentspecs',
    name: 'agentspecs',
    component: () => import('../views/ai/AgentSpecListView.vue'),
    meta: { titleKey: 'routeAgentSpecs' },
  },
  {
    path: 'agentspec/new',
    name: 'agentspec-new',
    component: () => import('../views/ai/AgentSpecEditorView.vue'),
    meta: { titleKey: 'routeNewAgentSpec' },
  },
  {
    path: 'agentspec/detail',
    name: 'agentspec-detail',
    component: () => import('../views/ai/AgentSpecDetailView.vue'),
    meta: { titleKey: 'routeAgentSpecDetail' },
  },
  // Prompt Management
  {
    path: 'prompts',
    name: 'prompts',
    component: () => import('../views/ai/PromptListView.vue'),
    meta: { titleKey: 'routePrompts' },
  },
  {
    path: 'prompt/new',
    name: 'prompt-new',
    component: () => import('../views/ai/PromptEditorView.vue'),
    meta: { titleKey: 'routeNewPrompt' },
  },
  {
    path: 'prompt/detail',
    name: 'prompt-detail',
    component: () => import('../views/ai/PromptDetailView.vue'),
    meta: { titleKey: 'routePromptDetail' },
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
  // Copilot Settings
  {
    path: 'copilot-settings',
    name: 'copilotSettings',
    component: () => import('../views/settings/CopilotSettingsView.vue'),
    meta: { titleKey: 'routeCopilotSettings' },
  },
]

// Consul route children
const consulChildren: RouteRecordRaw[] = [
  // Dashboard
  {
    path: 'consul',
    redirect: 'consul/dashboard',
  },
  {
    path: 'consul/dashboard',
    name: 'consul-dashboard',
    component: () => import('../views/consul/ConsulDashboardView.vue'),
    meta: { titleKey: 'routeConsulDashboard' },
  },
  // KV Store
  {
    path: 'consul/kv',
    name: 'consul-kv',
    component: () => import('../views/consul/KVListView.vue'),
    meta: { titleKey: 'routeConsulKV' },
  },
  {
    path: 'consul/kv/new',
    name: 'consul-kv-new',
    component: () => import('../views/consul/KVEditorView.vue'),
    meta: { titleKey: 'routeConsulKVNew' },
  },
  {
    path: 'consul/kv/editor',
    name: 'consul-kv-editor',
    component: () => import('../views/consul/KVEditorView.vue'),
    meta: { titleKey: 'routeConsulKVEdit' },
  },
  {
    path: 'consul/kv/detail',
    name: 'consul-kv-detail',
    component: () => import('../views/consul/KVDetailView.vue'),
    meta: { titleKey: 'routeConsulKVDetail' },
  },
  // Catalog Services
  {
    path: 'consul/catalog/services',
    name: 'consul-services',
    component: () => import('../views/consul/CatalogServiceListView.vue'),
    meta: { titleKey: 'routeConsulServices' },
  },
  {
    path: 'consul/catalog/service/:name',
    name: 'consul-service-detail',
    component: () => import('../views/consul/CatalogServiceDetailView.vue'),
    meta: { titleKey: 'routeConsulServiceDetail' },
  },
  {
    path: 'consul/catalog/service/:name/instance',
    name: 'consul-service-instance',
    component: () => import('../views/consul/ServiceInstanceDetailView.vue'),
    meta: { titleKey: 'routeConsulServiceInstance' },
  },
  // Catalog Nodes
  {
    path: 'consul/catalog/nodes',
    name: 'consul-nodes',
    component: () => import('../views/consul/CatalogNodeListView.vue'),
    meta: { titleKey: 'routeConsulNodes' },
  },
  {
    path: 'consul/catalog/node/:name',
    name: 'consul-node-detail',
    component: () => import('../views/consul/CatalogNodeDetailView.vue'),
    meta: { titleKey: 'routeConsulNodeDetail' },
  },
  // Health Checks
  {
    path: 'consul/health',
    name: 'consul-health',
    component: () => import('../views/consul/HealthCheckListView.vue'),
    meta: { titleKey: 'routeConsulHealth' },
  },
  // ACL
  {
    path: 'consul/acl/tokens',
    name: 'consul-tokens',
    component: () => import('../views/consul/ACLTokenListView.vue'),
    meta: { titleKey: 'routeConsulTokens' },
  },
  {
    path: 'consul/acl/token/new',
    name: 'consul-token-new',
    component: () => import('../views/consul/ACLTokenEditorView.vue'),
    meta: { titleKey: 'routeConsulTokenNew' },
  },
  {
    path: 'consul/acl/token/:id/edit',
    name: 'consul-token-edit',
    component: () => import('../views/consul/ACLTokenEditorView.vue'),
    meta: { titleKey: 'routeConsulTokenEdit' },
  },
  {
    path: 'consul/acl/policies',
    name: 'consul-policies',
    component: () => import('../views/consul/ACLPolicyListView.vue'),
    meta: { titleKey: 'routeConsulPolicies' },
  },
  {
    path: 'consul/acl/policy/new',
    name: 'consul-policy-new',
    component: () => import('../views/consul/ACLPolicyEditorView.vue'),
    meta: { titleKey: 'routeConsulPolicyNew' },
  },
  {
    path: 'consul/acl/policy/:id/edit',
    name: 'consul-policy-edit',
    component: () => import('../views/consul/ACLPolicyEditorView.vue'),
    meta: { titleKey: 'routeConsulPolicyEdit' },
  },
  {
    path: 'consul/acl/roles',
    name: 'consul-roles',
    component: () => import('../views/consul/ACLRoleListView.vue'),
    meta: { titleKey: 'routeConsulRoles' },
  },
  {
    path: 'consul/acl/role/new',
    name: 'consul-role-new',
    component: () => import('../views/consul/ACLRoleEditorView.vue'),
    meta: { titleKey: 'routeConsulRoleNew' },
  },
  {
    path: 'consul/acl/role/:id/edit',
    name: 'consul-role-edit',
    component: () => import('../views/consul/ACLRoleEditorView.vue'),
    meta: { titleKey: 'routeConsulRoleEdit' },
  },
  // ACL Auth Methods
  {
    path: 'consul/acl/auth-methods',
    name: 'consul-auth-methods',
    component: () => import('../views/consul/AuthMethodListView.vue'),
    meta: { titleKey: 'routeConsulAuthMethods' },
  },
  {
    path: 'consul/acl/auth-method/:name',
    name: 'consul-auth-method-detail',
    component: () => import('../views/consul/AuthMethodDetailView.vue'),
    meta: { titleKey: 'routeConsulAuthMethodDetail' },
  },
  // Service Mesh
  {
    path: 'consul/intentions',
    name: 'consul-intentions',
    component: () => import('../views/consul/IntentionListView.vue'),
    meta: { titleKey: 'routeConsulIntentions' },
  },
  {
    path: 'consul/config-entries',
    name: 'consul-config-entries',
    component: () => import('../views/consul/ConfigEntryListView.vue'),
    meta: { titleKey: 'routeConsulConfigEntries' },
  },
  {
    path: 'consul/config-entry/:kind/:name',
    name: 'consul-config-entry-detail',
    component: () => import('../views/consul/ConfigEntryDetailView.vue'),
    meta: { titleKey: 'routeConsulConfigEntryDetail' },
  },
  // Peerings
  {
    path: 'consul/peerings',
    name: 'consul-peerings',
    component: () => import('../views/consul/PeeringListView.vue'),
    meta: { titleKey: 'routeConsulPeerings' },
  },
  {
    path: 'consul/peering/:name',
    name: 'consul-peering-detail',
    component: () => import('../views/consul/PeeringDetailView.vue'),
    meta: { titleKey: 'routeConsulPeeringDetail' },
  },
  // Sessions
  {
    path: 'consul/sessions',
    name: 'consul-sessions',
    component: () => import('../views/consul/SessionListView.vue'),
    meta: { titleKey: 'routeConsulSessions' },
  },
  {
    path: 'consul/session/:id',
    name: 'consul-session-detail',
    component: () => import('../views/consul/SessionDetailView.vue'),
    meta: { titleKey: 'routeConsulSessionDetail' },
  },
  // Events
  {
    path: 'consul/events',
    name: 'consul-events',
    component: () => import('../views/consul/EventListView.vue'),
    meta: { titleKey: 'routeConsulEvents' },
  },
  // Exported Services
  {
    path: 'consul/exported-services',
    name: 'consul-exported-services',
    component: () => import('../views/consul/ExportedServicesView.vue'),
    meta: { titleKey: 'routeConsulExportedServices' },
  },
  // Partitions
  {
    path: 'consul/partitions',
    name: 'consul-partitions',
    component: () => import('../views/consul/PartitionListView.vue'),
    meta: { titleKey: 'routeConsulPartitions' },
  },
  // Consul Namespaces
  {
    path: 'consul/namespaces',
    name: 'consul-namespaces',
    component: () => import('../views/consul/ConsulNamespaceListView.vue'),
    meta: { titleKey: 'routeConsulNamespaces' },
  },
  // Operator
  {
    path: 'consul/operator',
    name: 'consul-operator',
    component: () => import('../views/consul/OperatorView.vue'),
    meta: { titleKey: 'routeConsulOperator' },
  },
  // Settings (shared)
  {
    path: 'consul/settings',
    name: 'consul-settings',
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
      path: '/admin-init',
      name: 'admin-init',
      component: () => import('../views/AdminInitView.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/oidc/callback',
      name: 'oidc-callback',
      component: () => import('../views/OIDCCallbackView.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/',
      name: LAYOUT_ROUTE_NAME,
      component: BatataLayout,
      meta: { requiresAuth: true },
      children: getInitialChildren(),
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/NotFoundView.vue'),
      meta: { requiresAuth: false },
    },
  ],
})

/**
 * Determine initial children based on stored provider preference.
 */
function getInitialChildren(): RouteRecordRaw[] {
  const provider = storage.get('batata_provider')
  // Normalize provider value - handle string 'null' or invalid values
  const normalizedProvider = provider === 'null' || !provider ? 'batata' : (provider as string)
  switch (normalizedProvider) {
    case 'consul':
      return consulChildren
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
  const authStore = useAuthStore()

  // Auto-switch provider based on path for direct links
  const provider = storage.get('batata_provider') || 'batata'
  const normalizedProvider = provider === 'null' || !provider ? 'batata' : (provider as string)

  if (to.path.startsWith('/consul') && normalizedProvider !== 'consul') {
    switchProviderRoutes('consul')
  }

  // Consul with ACL disabled: skip auth entirely
  if (normalizedProvider === 'consul' && !authStore.consulAclEnabled) {
    authStore.setConsulAclEnabled(false)
    if (to.path === '/login') {
      next('/consul/dashboard')
    } else {
      next()
    }
    return
  }

  // Restore user session from localStorage if not already in store
  authStore.restoreSession()

  if (to.meta.requiresAuth !== false && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.path === '/login' && authStore.isAuthenticated) {
    switch (normalizedProvider) {
      case 'consul':
        next('/consul/dashboard')
        break
      default:
        next('/')
    }
  } else {
    next()
  }
})

export default router
