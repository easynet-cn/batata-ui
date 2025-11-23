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
        {
          path: '',
          name: 'dashboard',
          component: () => import('../views/DashboardView.vue'),
        },
        {
          path: 'services',
          name: 'services',
          component: () => import('../views/ServicesView.vue'),
        },
        {
          path: 'service-detail',
          name: 'service-detail',
          component: () => import('../views/ServicesView.vue'),
        },
        {
          path: 'configs',
          name: 'configs',
          component: () => import('../views/ConfigsView.vue'),
        },
        {
          path: 'config-editor',
          name: 'config-editor',
          component: () => import('../views/ConfigsView.vue'),
        },
        {
          path: 'config-history',
          name: 'config-history',
          component: () => import('../views/ConfigsView.vue'),
        },
        {
          path: 'namespaces',
          name: 'namespaces',
          component: () => import('../views/NamespacesView.vue'),
        },
        {
          path: 'cluster-nodes',
          name: 'cluster-nodes',
          component: () => import('../views/ClusterNodesView.vue'),
        },
        {
          path: 'cluster-health',
          name: 'cluster-health',
          component: () => import('../views/ClusterNodesView.vue'),
        },
        {
          path: 'permissions',
          name: 'permissions',
          component: () => import('../views/AboutView.vue'),
        },
        {
          path: 'system',
          name: 'system',
          component: () => import('../views/AboutView.vue'),
        },
      ],
    },
  ],
})

// 路由守卫
router.beforeEach((to, _from, next) => {
  const nacosStore = useNacosStore()

  if (to.meta.requiresAuth !== false && !nacosStore.isAuthenticated) {
    // 需要认证但未登录，跳转到登录页
    next('/login')
  } else if (to.path === '/login' && nacosStore.isAuthenticated) {
    // 已登录用户访问登录页，跳转到首页
    next('/')
  } else {
    next()
  }
})

export default router
