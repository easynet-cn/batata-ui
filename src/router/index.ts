import { createRouter, createWebHistory } from 'vue-router'
import { useNacosStore } from '@/stores/nacos'
import NacosLayout from '@/layout/NacosLayout.vue'

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
      path: '/',
      component: NacosLayout,
      meta: { requiresAuth: true },
      children: [
        // 配置管理
        {
          path: '',
          name: 'configs',
          component: () => import('../views/config/ConfigListView.vue'),
          meta: { title: '配置列表' },
        },
        {
          path: 'config/new',
          name: 'config-new',
          component: () => import('../views/config/ConfigEditorView.vue'),
          meta: { title: '新建配置' },
        },
        {
          path: 'config/edit',
          name: 'config-edit',
          component: () => import('../views/config/ConfigEditorView.vue'),
          meta: { title: '编辑配置' },
        },
        {
          path: 'config/detail',
          name: 'config-detail',
          component: () => import('../views/config/ConfigDetailView.vue'),
          meta: { title: '配置详情' },
        },
        {
          path: 'config/history',
          name: 'config-history',
          component: () => import('../views/config/ConfigHistoryView.vue'),
          meta: { title: '历史版本' },
        },
        {
          path: 'config/listeners',
          name: 'config-listeners',
          component: () => import('../views/config/ConfigListenersView.vue'),
          meta: { title: '监听查询' },
        },
        // 服务管理
        {
          path: 'services',
          name: 'services',
          component: () => import('../views/service/ServiceListView.vue'),
          meta: { title: '服务列表' },
        },
        {
          path: 'service/detail',
          name: 'service-detail',
          component: () => import('../views/service/ServiceDetailView.vue'),
          meta: { title: '服务详情' },
        },
        {
          path: 'subscribers',
          name: 'subscribers',
          component: () => import('../views/service/SubscriberListView.vue'),
          meta: { title: '订阅者列表' },
        },
        // 命名空间
        {
          path: 'namespaces',
          name: 'namespaces',
          component: () => import('../views/namespace/NamespaceListView.vue'),
          meta: { title: '命名空间' },
        },
        // 集群管理
        {
          path: 'cluster',
          name: 'cluster',
          component: () => import('../views/cluster/ClusterListView.vue'),
          meta: { title: '集群节点' },
        },
        // 权限控制
        {
          path: 'users',
          name: 'users',
          component: () => import('../views/auth/UserListView.vue'),
          meta: { title: '用户管理' },
        },
        {
          path: 'roles',
          name: 'roles',
          component: () => import('../views/auth/RoleListView.vue'),
          meta: { title: '角色管理' },
        },
        {
          path: 'permissions',
          name: 'permissions',
          component: () => import('../views/auth/PermissionListView.vue'),
          meta: { title: '权限管理' },
        },
        // AI/MCP 管理
        {
          path: 'mcp',
          name: 'mcp',
          component: () => import('../views/ai/McpListView.vue'),
          meta: { title: 'MCP 管理' },
        },
        {
          path: 'mcp/new',
          name: 'mcp-new',
          component: () => import('../views/ai/McpEditorView.vue'),
          meta: { title: '新建 MCP' },
        },
        {
          path: 'mcp/edit',
          name: 'mcp-edit',
          component: () => import('../views/ai/McpEditorView.vue'),
          meta: { title: '编辑 MCP' },
        },
        {
          path: 'mcp/detail',
          name: 'mcp-detail',
          component: () => import('../views/ai/McpDetailView.vue'),
          meta: { title: 'MCP 详情' },
        },
        {
          path: 'agents',
          name: 'agents',
          component: () => import('../views/ai/AgentListView.vue'),
          meta: { title: 'Agent 管理' },
        },
        {
          path: 'agent/new',
          name: 'agent-new',
          component: () => import('../views/ai/AgentEditorView.vue'),
          meta: { title: '新建 Agent' },
        },
        {
          path: 'agent/edit',
          name: 'agent-edit',
          component: () => import('../views/ai/AgentEditorView.vue'),
          meta: { title: '编辑 Agent' },
        },
        // 设置中心
        {
          path: 'settings',
          name: 'settings',
          component: () => import('../views/settings/SettingsView.vue'),
          meta: { title: '设置中心' },
        },
      ],
    },
  ],
})

// 路由守卫
router.beforeEach((to, _from, next) => {
  const nacosStore = useNacosStore()

  // Restore user session from localStorage if not already in store
  if (!nacosStore.isAuthenticated) {
    const savedUser = localStorage.getItem('nacos_user')
    const savedToken = localStorage.getItem('nacos-token')
    if (savedUser && savedToken) {
      const user = JSON.parse(savedUser)
      nacosStore.currentUser = {
        username: user.name,
        token: savedToken,
      }
    }
  }

  if (to.meta.requiresAuth !== false && !nacosStore.isAuthenticated) {
    next('/login')
  } else if (to.path === '/login' && nacosStore.isAuthenticated) {
    next('/')
  } else {
    next()
  }
})

export default router
