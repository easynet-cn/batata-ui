<template>
  <div class="flex h-screen bg-slate-50 overflow-hidden">
    <!-- Sidebar - 紧凑侧边栏 -->
    <aside
      :class="[
        isSidebarOpen ? 'w-52' : 'w-14',
        'bg-[#001529] text-slate-300 transition-all duration-200 ease-out flex flex-col z-20 shadow-lg',
      ]"
    >
      <div class="h-12 flex items-center px-4 border-b border-slate-700/30 bg-[#002140]">
        <div
          class="w-6 h-6 bg-blue-500 rounded flex items-center justify-center mr-2 shrink-0 shadow shadow-blue-500/20"
        >
          <span class="text-white font-bold text-sm">B</span>
        </div>
        <span v-if="isSidebarOpen" class="font-semibold text-white text-sm tracking-tight truncate"
          >BATATA</span
        >
      </div>

      <nav class="flex-1 py-2 px-2 space-y-4 overflow-y-auto scrollbar-hide">
        <div v-for="(group, groupIdx) in navGroups" :key="groupIdx" class="space-y-0.5">
          <p
            v-if="isSidebarOpen"
            class="px-2 text-[9px] font-semibold text-slate-500 uppercase tracking-wider mb-1"
          >
            {{ group.title }}
          </p>
          <RouterLink
            v-for="item in group.items"
            :key="item.path"
            :to="item.path"
            :class="[
              'flex items-center px-2 py-1.5 rounded-md transition-all group relative',
              route.path === item.path
                ? 'bg-blue-600 text-white shadow shadow-blue-600/30'
                : 'hover:bg-slate-800/50 hover:text-white text-slate-400',
            ]"
          >
            <component :is="item.icon" :size="15" class="shrink-0" />
            <span v-if="isSidebarOpen" class="ml-2 font-medium text-xs">{{ item.label }}</span>
            <div
              v-if="!isSidebarOpen && route.path === item.path"
              class="absolute left-0 w-0.5 h-4 bg-white rounded-r-full"
            />
          </RouterLink>
        </div>
      </nav>

      <div class="p-2 border-t border-slate-700/30">
        <button
          @click="isSidebarOpen = !isSidebarOpen"
          class="w-full flex items-center justify-center py-1.5 hover:bg-slate-800 rounded-md transition-colors text-slate-400"
        >
          <X v-if="isSidebarOpen" :size="16" />
          <Menu v-else :size="16" />
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <!-- Header - 紧凑头部 -->
      <header
        class="h-11 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0 z-10 shadow-sm"
      >
        <div class="flex items-center space-x-4">
          <div class="flex items-center text-slate-500 text-xs font-medium">
            {{ t('dashboard') }} /
            <span class="text-slate-900 ml-1">{{ currentPageLabel }}</span>
          </div>

          <!-- Namespace Selector -->
          <div class="relative border-l pl-4 border-slate-100 hidden sm:block">
            <button
              @click="showNamespaceMenu = !showNamespaceMenu"
              class="flex items-center space-x-1.5 px-2 py-1 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 transition-colors group"
            >
              <Globe :size="12" class="text-blue-500" />
              <span class="text-[10px] font-semibold text-slate-700">{{ t('namespace') }}:</span>
              <span class="text-[10px] font-medium text-slate-600">{{
                currentNamespace.namespaceShowName
              }}</span>
              <ChevronDown
                :size="12"
                :class="['text-slate-400 transition-transform', showNamespaceMenu && 'rotate-180']"
              />
            </button>

            <template v-if="showNamespaceMenu">
              <div class="fixed inset-0 z-40" @click="showNamespaceMenu = false" />
              <div
                class="absolute left-4 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50"
              >
                <div
                  class="px-3 py-1 text-[9px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-50"
                >
                  {{ t('selectNamespace') }}
                </div>
                <button
                  v-for="ns in namespaces"
                  :key="ns.namespace"
                  @click="switchNamespace(ns)"
                  :class="[
                    'w-full text-left px-3 py-1.5 text-xs flex items-center justify-between transition-colors',
                    currentNamespace.namespace === ns.namespace
                      ? 'bg-blue-50 text-blue-600 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50',
                  ]"
                >
                  <span>{{ ns.namespaceShowName }}</span>
                  <div
                    v-if="currentNamespace.namespace === ns.namespace"
                    class="w-1 h-1 rounded-full bg-blue-600"
                  />
                </button>
              </div>
            </template>
          </div>
        </div>

        <div class="flex items-center space-x-3 text-slate-600">
          <!-- Connection Status -->
          <div
            v-if="wsEnabled"
            class="flex items-center gap-1.5 px-2 py-1 rounded-md"
            :class="connectionStatusClass"
            :title="connectionStatusText"
          >
            <div
              class="w-2 h-2 rounded-full"
              :class="{
                'bg-emerald-500 animate-pulse': wsStatus === 'connected',
                'bg-amber-500 animate-pulse': wsStatus === 'connecting',
                'bg-slate-400': wsStatus === 'disconnected',
                'bg-red-500': wsStatus === 'error',
              }"
            ></div>
            <span class="text-[10px] font-medium hidden sm:inline">{{ connectionStatusText }}</span>
          </div>

          <!-- Notifications -->
          <div class="relative">
            <button
              @click="showNotifications = !showNotifications"
              class="relative p-1.5 hover:bg-slate-50 rounded-md transition-all"
            >
              <Bell :size="14" class="text-slate-400" />
              <span
                v-if="unreadCount > 0"
                class="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center"
              >
                {{ unreadCount > 9 ? '9+' : unreadCount }}
              </span>
            </button>
            <template v-if="showNotifications">
              <div class="fixed inset-0 z-40" @click="showNotifications = false" />
              <div
                class="absolute right-0 mt-1 w-72 bg-white border border-slate-200 rounded-lg shadow-lg z-50"
              >
                <div class="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                  <span class="text-xs font-semibold text-slate-900">{{ t('notifications') }}</span>
                  <button
                    v-if="notifications.length > 0"
                    @click="clearNotifications"
                    class="text-[10px] text-slate-500 hover:text-slate-700"
                  >
                    {{ t('clearAll') }}
                  </button>
                </div>
                <div class="max-h-64 overflow-y-auto">
                  <div
                    v-if="notifications.length === 0"
                    class="p-4 text-center text-xs text-slate-400"
                  >
                    {{ t('noNotifications') }}
                  </div>
                  <div
                    v-for="notification in notifications.slice(0, 5)"
                    :key="notification.id"
                    class="px-3 py-2 hover:bg-slate-50 border-b border-slate-50 last:border-0"
                    :class="{ 'bg-blue-50/50': !notification.read }"
                    @click="markNotificationAsRead(notification.id)"
                  >
                    <div class="flex items-start gap-2">
                      <div
                        class="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                        :class="{
                          'bg-blue-100 text-blue-600': notification.type === 'info',
                          'bg-emerald-100 text-emerald-600': notification.type === 'success',
                          'bg-amber-100 text-amber-600': notification.type === 'warning',
                          'bg-red-100 text-red-600': notification.type === 'error',
                        }"
                      >
                        <Info v-if="notification.type === 'info'" :size="10" />
                        <CheckCircle v-else-if="notification.type === 'success'" :size="10" />
                        <AlertTriangle v-else-if="notification.type === 'warning'" :size="10" />
                        <XCircle v-else :size="10" />
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="text-xs font-medium text-slate-900 truncate">
                          {{ notification.title }}
                        </p>
                        <p v-if="notification.message" class="text-[10px] text-slate-500 truncate">
                          {{ notification.message }}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </div>

          <!-- Language Selector -->
          <div class="relative">
            <button
              @click="showLangMenu = !showLangMenu"
              class="flex items-center space-x-1 p-1.5 hover:bg-slate-50 rounded-md transition-all"
            >
              <Languages :size="14" class="text-slate-400" />
              <span class="text-[10px] font-semibold uppercase">{{ language }}</span>
            </button>
            <template v-if="showLangMenu">
              <div class="fixed inset-0 z-40" @click="showLangMenu = false" />
              <div
                class="absolute right-0 mt-1 w-28 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50"
              >
                <button
                  @click="handlerChangeLanguage('en')"
                  :class="[
                    'w-full text-left px-3 py-1.5 text-xs',
                    language === 'en'
                      ? 'text-blue-600 font-semibold bg-blue-50'
                      : 'text-slate-600 hover:bg-slate-50',
                  ]"
                >
                  English
                </button>
                <button
                  @click="handlerChangeLanguage('zh')"
                  :class="[
                    'w-full text-left px-3 py-1.5 text-xs',
                    language === 'zh'
                      ? 'text-blue-600 font-semibold bg-blue-50'
                      : 'text-slate-600 hover:bg-slate-50',
                  ]"
                >
                  中文
                </button>
              </div>
            </template>
          </div>

          <!-- User Menu -->
          <div class="relative border-l pl-3 border-slate-200">
            <button
              @click="showUserMenu = !showUserMenu"
              class="flex items-center space-x-1.5 p-1 hover:bg-slate-50 rounded-md transition-all"
            >
              <div
                class="w-6 h-6 rounded bg-blue-600 flex items-center justify-center text-white text-xs font-semibold shadow-sm uppercase"
              >
                {{ user?.name?.charAt(0) || 'U' }}
              </div>
              <div class="hidden sm:block text-left">
                <div class="text-[10px] font-semibold text-slate-900 leading-none">
                  {{ user?.name || 'User' }}
                </div>
                <div class="text-[9px] text-slate-400 leading-none mt-0.5 uppercase">
                  {{ t('administrator') }}
                </div>
              </div>
              <ChevronDown
                :size="12"
                :class="['text-slate-400 transition-transform', showUserMenu && 'rotate-180']"
              />
            </button>
            <template v-if="showUserMenu">
              <div class="fixed inset-0 z-40" @click="showUserMenu = false" />
              <div
                class="absolute right-0 mt-1 w-36 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50"
              >
                <button
                  @click="handleLogout"
                  class="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 flex items-center"
                >
                  <LogOut :size="12" class="mr-1.5" />
                  {{ t('signOut') }}
                </button>
              </div>
            </template>
          </div>
        </div>
      </header>

      <!-- Main Content Area - 紧凑内容区 -->
      <main class="flex-1 overflow-y-auto p-3 md:p-4 bg-[#f8fafc]">
        <div class="max-w-7xl mx-auto">
          <RouterView v-slot="{ Component }">
            <component :is="Component" :namespace="currentNamespace" @switch="switchNamespace" />
          </RouterView>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import {
  Server,
  Layers,
  Menu,
  X,
  LogOut,
  ChevronDown,
  Users,
  ShieldAlert,
  Key,
  Network,
  Globe,
  Globe2,
  Languages,
  FileCode,
  Cog,
  LayoutDashboard,
  Bell,
  Info,
  CheckCircle,
  AlertTriangle,
  XCircle,
  FileText,
  Bot,
  Cpu,
  Activity,
  RefreshCw,
  Puzzle,
} from 'lucide-vue-next'
import { useI18n, type Language } from '@/i18n'
import type { Namespace } from '@/types'
import { useBatataStore } from '@/stores/batata'
import batataApi from '@/api/batata'
import { useGlobalWebSocket } from '@/composables/useWebSocket'
import { globalNotifications } from '@/composables/useNotifications'
import { config } from '@/config'

const { t, language, setLanguage } = useI18n()
const route = useRoute()
const router = useRouter()
const batataStore = useBatataStore()

const isSidebarOpen = ref(true)
const showUserMenu = ref(false)
const showNamespaceMenu = ref(false)
const showLangMenu = ref(false)
const showNotifications = ref(false)

// WebSocket
const wsEnabled = config.websocket.enabled
const { status: wsStatus } = useGlobalWebSocket()

// Notifications
const { notifications, unreadCount, markAsRead, clearAll } = globalNotifications

const connectionStatusClass = computed(() => {
  switch (wsStatus.value) {
    case 'connected':
      return 'bg-emerald-50 text-emerald-700'
    case 'connecting':
      return 'bg-amber-50 text-amber-700'
    case 'error':
      return 'bg-red-50 text-red-700'
    default:
      return 'bg-slate-100 text-slate-600'
  }
})

const connectionStatusText = computed(() => {
  switch (wsStatus.value) {
    case 'connected':
      return t('connected')
    case 'connecting':
      return t('connecting')
    case 'error':
      return t('connectionError')
    default:
      return t('disconnected')
  }
})

const markNotificationAsRead = (id: string) => {
  markAsRead(id)
}

const clearNotifications = () => {
  clearAll()
  showNotifications.value = false
}

const user = ref<{ name: string } | null>(null)
const defaultNamespace: Namespace = {
  namespace: '',
  namespaceShowName: 'public',
  type: 0,
  quota: 200,
  configCount: 0,
}
const namespaces = ref<Namespace[]>([defaultNamespace])
const currentNamespace = ref<Namespace>(defaultNamespace)

const fetchNamespaces = async () => {
  try {
    const response = await batataApi.getNamespaceList()
    const list = response.data?.data
    if (list && list.length > 0) {
      namespaces.value = list
      // Restore saved namespace or use the first one
      const savedNs = localStorage.getItem('batata_current_ns')
      if (savedNs) {
        const parsed = JSON.parse(savedNs) as Namespace
        const found = list.find((ns: Namespace) => ns.namespace === parsed.namespace)
        if (found) {
          currentNamespace.value = found
          return
        }
      }
      if (list[0]) {
        currentNamespace.value = list[0]
      }
    }
  } catch {
    // Fallback to default namespace on error
  }
}

onMounted(() => {
  const savedUser = localStorage.getItem('batata_user')
  const savedToken = localStorage.getItem('batata-token')
  if (savedUser) {
    user.value = JSON.parse(savedUser)
    // Also restore store state for router guard
    if (savedToken) {
      batataStore.currentUser = { username: user.value!.name, token: savedToken }
    }
  }

  fetchNamespaces()
})

const handlerChangeLanguage = (lang: Language) => {
  setLanguage(lang)
  showLangMenu.value = false
}

const handleLogout = () => {
  user.value = null
  localStorage.removeItem('batata_user')
  localStorage.removeItem('batata-token')
  batataStore.logout()
  router.push('/login')
}

const switchNamespace = (ns: Namespace) => {
  currentNamespace.value = ns
  localStorage.setItem('batata_current_ns', JSON.stringify(ns))
  showNamespaceMenu.value = false
}

const navGroups = computed(() => [
  {
    title: t('overview'),
    items: [{ path: '/', label: t('dashboard'), icon: LayoutDashboard }],
  },
  {
    title: t('coreFeatures'),
    items: [
      { path: '/configs', label: t('configuration'), icon: FileCode },
      { path: '/config/sync', label: t('configSync'), icon: RefreshCw },
      { path: '/services', label: t('services'), icon: Server },
      { path: '/namespaces', label: t('namespaces'), icon: Layers },
      { path: '/cluster', label: t('cluster'), icon: Network },
      { path: '/datacenters', label: t('multiDatacenter'), icon: Globe2 },
    ],
  },
  {
    title: t('authorityControl'),
    items: [
      { path: '/users', label: t('users'), icon: Users },
      { path: '/roles', label: t('roles'), icon: ShieldAlert },
      { path: '/permissions', label: t('permissions'), icon: Key },
    ],
  },
  {
    title: t('aiMcp'),
    items: [
      { path: '/mcp', label: t('mcpServers'), icon: Cpu },
      { path: '/agents', label: t('agents'), icon: Bot },
    ],
  },
  {
    title: t('observability'),
    items: [
      { path: '/tracing', label: t('tracing'), icon: Activity },
      { path: '/audit', label: t('auditLog'), icon: FileText },
    ],
  },
  {
    title: t('system'),
    items: [
      { path: '/plugins', label: t('plugins'), icon: Puzzle },
      { path: '/settings', label: t('settings'), icon: Cog },
    ],
  },
])

const currentPageLabel = computed(() => {
  const allItems = navGroups.value.flatMap((g) => g.items)
  return allItems.find((i) => i.path === route.path)?.label || 'Overview'
})
</script>
