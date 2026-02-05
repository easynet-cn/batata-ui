import { createRouter, createWebHistory } from 'vue-router'
import { useBatataStore } from '@/stores/batata'
import BatataLayout from '@/layout/BatataLayout.vue'

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
      component: BatataLayout,
      meta: { requiresAuth: true },
      children: [
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
      ],
    },
  ],
})

// 路由守卫
router.beforeEach((to, _from, next) => {
  const batataStore = useBatataStore()

  // Restore user session from localStorage if not already in store
  if (!batataStore.isAuthenticated) {
    const savedUser = localStorage.getItem('batata_user')
    const savedToken = localStorage.getItem('batata-token')
    if (savedUser && savedToken) {
      const user = JSON.parse(savedUser)
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
