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
          name: 'configs',
          component: () => import('../views/ConfigListView.vue'),
        },
        {
          path: 'services',
          name: 'services',
          component: () => import('../views/ServiceListView.vue'),
        },
        {
          path: 'namespaces',
          name: 'namespaces',
          component: () => import('../views/NamespaceListView.vue'),
        },
        {
          path: 'cluster',
          name: 'cluster',
          component: () => import('../views/ClusterListView.vue'),
        },
        {
          path: 'users',
          name: 'users',
          component: () => import('../views/UserListView.vue'),
        },
        {
          path: 'roles',
          name: 'roles',
          component: () => import('../views/RoleListView.vue'),
        },
        {
          path: 'permissions',
          name: 'permissions',
          component: () => import('../views/PermissionListView.vue'),
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
      nacosStore.currentUser = { username: user.name, token: savedToken }
    }
  }

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
