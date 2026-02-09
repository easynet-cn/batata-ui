<template>
  <div class="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
    <!-- Sidebar -->
    <aside
      :class="[
        isSidebarOpen ? 'w-60' : 'w-16',
        'bg-white dark:bg-gray-950 text-gray-700 dark:text-gray-300 transition-all duration-200 ease-out flex flex-col z-20 shadow-sm border-r border-gray-200 dark:border-gray-800',
      ]"
    >
      <div class="h-14 flex items-center px-4 border-b border-gray-200 dark:border-gray-800">
        <div
          :class="[
            'w-8 h-8 rounded-lg flex items-center justify-center mr-2.5 shrink-0 shadow',
            providerBgClass,
            providerShadowClass,
          ]"
        >
          <span class="text-white font-extrabold text-sm">{{ providerLetter }}</span>
        </div>
        <span
          v-if="isSidebarOpen"
          class="font-extrabold text-gray-900 dark:text-white text-base tracking-tight truncate uppercase"
          >{{ provider.toUpperCase() }}</span
        >
      </div>

      <nav class="flex-1 py-4 px-3 space-y-6 overflow-y-auto scrollbar-hide">
        <div v-for="(group, groupIdx) in navGroups" :key="groupIdx" class="space-y-1">
          <p
            v-if="isSidebarOpen && group.title"
            class="px-3 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2"
          >
            {{ group.title }}
          </p>
          <RouterLink
            v-for="item in group.items"
            :key="item.path"
            :to="item.path"
            :class="[
              'flex items-center px-3 py-2.5 rounded-xl transition-all group relative',
              isActiveRoute(item.path)
                ? `${providerBgClass} text-white shadow-md ${providerShadowClass}`
                : 'hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white text-gray-500 dark:text-gray-400',
            ]"
          >
            <component :is="item.icon" :size="20" class="shrink-0" />
            <span v-if="isSidebarOpen" class="ml-3 font-semibold text-sm">{{ item.label }}</span>
            <div
              v-if="!isSidebarOpen && isActiveRoute(item.path)"
              class="absolute left-0 w-0.5 h-5 rounded-r-full"
              :class="providerBgClass"
            />
          </RouterLink>
        </div>
      </nav>

      <div class="p-3 border-t border-gray-200 dark:border-gray-800">
        <button
          @click="isSidebarOpen = !isSidebarOpen"
          class="w-full flex items-center justify-center py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-400"
        >
          <X v-if="isSidebarOpen" :size="16" />
          <Menu v-else :size="16" />
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <!-- Header -->
      <header
        class="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-5 shrink-0 z-10 shadow-sm"
      >
        <div class="flex items-center space-x-4">
          <!-- Provider Switcher (shown when consul or apollo is enabled on server) -->
          <template v-if="consulEnabled || apolloEnabled">
            <div class="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
              <button
                @click="handleSwitchProvider('batata')"
                :class="[
                  'px-3 py-1.5 text-xs font-bold rounded-md transition-all',
                  provider === 'batata'
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
                ]"
              >
                BATATA
              </button>
              <button
                v-if="consulEnabled"
                @click="handleSwitchProvider('consul')"
                :class="[
                  'px-3 py-1.5 text-xs font-bold rounded-md transition-all',
                  provider === 'consul'
                    ? 'bg-white dark:bg-gray-700 text-fuchsia-600 dark:text-fuchsia-400 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
                ]"
              >
                CONSUL
              </button>
              <button
                v-if="apolloEnabled"
                @click="handleSwitchProvider('apollo')"
                :class="[
                  'px-3 py-1.5 text-xs font-bold rounded-md transition-all',
                  provider === 'apollo'
                    ? 'bg-white dark:bg-gray-700 text-orange-600 dark:text-orange-400 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
                ]"
              >
                APOLLO
              </button>
            </div>

            <!-- Divider -->
            <div class="h-6 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block" />
          </template>

          <!-- Namespace Selector (Nacos only) -->
          <div v-if="provider === 'batata'" class="relative hidden sm:block">
            <button
              @click="showNamespaceMenu = !showNamespaceMenu"
              class="flex items-center space-x-1.5 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors group"
            >
              <Globe :size="13" :class="providerTextClass" />
              <span class="text-[11px] font-bold text-gray-700 dark:text-gray-300"
                >{{ t('namespace') }}:</span
              >
              <span class="text-[11px] font-medium text-gray-500 dark:text-gray-400">{{
                currentNamespace.namespaceShowName
              }}</span>
              <ChevronDown
                :size="12"
                :class="['text-gray-400 transition-transform', showNamespaceMenu && 'rotate-180']"
              />
            </button>

            <template v-if="showNamespaceMenu">
              <div class="fixed inset-0 z-40" @click="showNamespaceMenu = false" />
              <div
                class="absolute left-0 mt-1.5 w-52 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg py-1 z-50"
              >
                <div
                  class="px-3 py-1.5 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800"
                >
                  {{ t('selectNamespace') }}
                </div>
                <button
                  v-for="ns in namespaces"
                  :key="ns.namespace"
                  @click="switchNamespace(ns)"
                  :class="[
                    'w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors',
                    currentNamespace.namespace === ns.namespace
                      ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 font-bold'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800',
                  ]"
                >
                  <span>{{ ns.namespaceShowName }}</span>
                  <div
                    v-if="currentNamespace.namespace === ns.namespace"
                    class="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400"
                  />
                </button>
              </div>
            </template>
          </div>
        </div>

        <div class="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
          <!-- Theme Toggle -->
          <button
            @click="toggleTheme"
            class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all"
            :title="t('themeToggle')"
          >
            <Moon v-if="!isDark" :size="16" class="text-gray-500" />
            <Sun v-else :size="16" class="text-amber-400" />
          </button>

          <!-- Connection Status -->
          <div
            v-if="wsEnabled"
            class="flex items-center gap-1.5 px-2 py-1.5 rounded-lg"
            :class="connectionStatusClass"
            :title="connectionStatusText"
          >
            <div
              class="w-2 h-2 rounded-full"
              :class="{
                'bg-emerald-500 animate-pulse': wsStatus === 'connected',
                'bg-amber-500 animate-pulse': wsStatus === 'connecting',
                'bg-gray-400': wsStatus === 'disconnected',
                'bg-red-500': wsStatus === 'error',
              }"
            ></div>
            <span class="text-[10px] font-bold hidden sm:inline">{{ connectionStatusText }}</span>
          </div>

          <!-- Notifications -->
          <div class="relative">
            <button
              @click="showNotifications = !showNotifications"
              class="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all"
            >
              <Bell :size="16" class="text-gray-500 dark:text-gray-400" />
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
                class="absolute right-0 mt-1.5 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg z-50"
              >
                <div
                  class="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between"
                >
                  <span class="text-sm font-bold text-gray-900 dark:text-gray-100">{{
                    t('notifications')
                  }}</span>
                  <button
                    v-if="notifications.length > 0"
                    @click="clearNotifications"
                    class="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-medium"
                  >
                    {{ t('clearAll') }}
                  </button>
                </div>
                <div class="max-h-72 overflow-y-auto">
                  <div
                    v-if="notifications.length === 0"
                    class="p-6 text-center text-sm text-gray-400 dark:text-gray-500"
                  >
                    {{ t('noNotifications') }}
                  </div>
                  <div
                    v-for="notification in notifications.slice(0, 5)"
                    :key="notification.id"
                    class="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-50 dark:border-gray-800 last:border-0"
                    :class="{
                      'bg-blue-50/50 dark:bg-blue-950/20': !notification.read,
                    }"
                    @click="markNotificationAsRead(notification.id)"
                  >
                    <div class="flex items-start gap-2.5">
                      <div
                        class="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                        :class="{
                          'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400':
                            notification.type === 'info',
                          'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400':
                            notification.type === 'success',
                          'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400':
                            notification.type === 'warning',
                          'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400':
                            notification.type === 'error',
                        }"
                      >
                        <Info v-if="notification.type === 'info'" :size="12" />
                        <CheckCircle v-else-if="notification.type === 'success'" :size="12" />
                        <AlertTriangle v-else-if="notification.type === 'warning'" :size="12" />
                        <XCircle v-else :size="12" />
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
                          {{ notification.title }}
                        </p>
                        <p
                          v-if="notification.message"
                          class="text-[11px] text-gray-500 dark:text-gray-400 truncate"
                        >
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
              class="flex items-center space-x-1 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all"
            >
              <Languages :size="16" class="text-gray-500 dark:text-gray-400" />
              <span class="text-[11px] font-bold uppercase">{{ language }}</span>
            </button>
            <template v-if="showLangMenu">
              <div class="fixed inset-0 z-40" @click="showLangMenu = false" />
              <div
                class="absolute right-0 mt-1.5 w-32 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg py-1 z-50"
              >
                <button
                  @click="handlerChangeLanguage('en')"
                  :class="[
                    'w-full text-left px-3 py-2 text-xs font-medium',
                    language === 'en'
                      ? 'text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/30'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800',
                  ]"
                >
                  English
                </button>
                <button
                  @click="handlerChangeLanguage('zh')"
                  :class="[
                    'w-full text-left px-3 py-2 text-xs font-medium',
                    language === 'zh'
                      ? 'text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/30'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800',
                  ]"
                >
                  中文
                </button>
              </div>
            </template>
          </div>

          <!-- User Menu -->
          <div class="relative border-l pl-2 border-gray-200 dark:border-gray-700">
            <button
              @click="showUserMenu = !showUserMenu"
              class="flex items-center space-x-1.5 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all"
            >
              <div
                :class="[
                  'w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-sm uppercase',
                  providerBgClass,
                ]"
              >
                {{ user?.name?.charAt(0) || 'U' }}
              </div>
              <div class="hidden sm:block text-left">
                <div class="text-xs font-bold text-gray-900 dark:text-gray-100 leading-none">
                  {{ user?.name || 'User' }}
                </div>
                <div
                  class="text-[10px] text-gray-400 dark:text-gray-500 leading-none mt-0.5 uppercase"
                >
                  {{ t('administrator') }}
                </div>
              </div>
              <ChevronDown
                :size="12"
                :class="['text-gray-400 transition-transform', showUserMenu && 'rotate-180']"
              />
            </button>
            <template v-if="showUserMenu">
              <div class="fixed inset-0 z-40" @click="showUserMenu = false" />
              <div
                class="absolute right-0 mt-1.5 w-40 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg py-1 z-50"
              >
                <button
                  @click="handleLogout"
                  class="w-full text-left px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center font-medium"
                >
                  <LogOut :size="13" class="mr-2" />
                  {{ t('signOut') }}
                </button>
              </div>
            </template>
          </div>
        </div>
      </header>

      <!-- Main Content Area -->
      <main class="flex-1 overflow-y-auto p-4 md:p-5 bg-gray-50 dark:bg-gray-950">
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
  Languages,
  FileCode,
  Cog,
  LayoutDashboard,
  Bell,
  Info,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Bot,
  Cpu,
  Activity,
  RefreshCw,
  Puzzle,
  Radio,
  UserCheck,
  Globe2,
  Moon,
  Sun,
  Database,
  HeartPulse,
  Link,
  Settings2,
  Timer,
  HardDrive,
  Shield,
  Fingerprint,
  GitBranch,
  Box,
} from 'lucide-vue-next'
import { useI18n, type Language } from '@/i18n'
import type { Namespace } from '@/types'
import { useBatataStore } from '@/stores/batata'
import batataApi from '@/api/batata'
import { useGlobalWebSocket } from '@/composables/useWebSocket'
import { globalNotifications } from '@/composables/useNotifications'
import { config } from '@/config'
import { useTheme } from '@/composables/useTheme'
import { useProvider } from '@/composables/useProvider'
import { switchProviderRoutes } from '@/router'
import { storage } from '@/composables/useStorage'

const { t, language, setLanguage } = useI18n()
const route = useRoute()
const router = useRouter()
const batataStore = useBatataStore()
const { isDark, toggleTheme } = useTheme()
const {
  provider,
  consulEnabled,
  apolloEnabled,
  providerBgClass,
  providerShadowClass,
  providerTextClass,
  providerLetter,
  setProvider,
  setConsulEnabled,
  setApolloEnabled,
} = useProvider()

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
      return 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
    case 'connecting':
      return 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400'
    case 'error':
      return 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400'
    default:
      return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
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
      const parsed = storage.getJSON<Namespace>('batata_current_ns')
      if (parsed) {
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

const fetchServerState = async () => {
  try {
    const response = await batataApi.getServerState()
    const state = response.data
    const consulOn = state?.consul_enabled === 'true'
    const apolloOn = state?.apollo_enabled === 'true'
    setConsulEnabled(consulOn)
    setApolloEnabled(apolloOn)
    // If consul is not enabled but user was on consul provider, switch back to batata
    if (!consulOn && provider.value === 'consul') {
      setProvider('batata')
      switchProviderRoutes('batata')
      router.push('/')
    }
    // If apollo is not enabled but user was on apollo provider, switch back to batata
    if (!apolloOn && provider.value === 'apollo') {
      setProvider('batata')
      switchProviderRoutes('batata')
      router.push('/')
    }
  } catch {
    // Default to disabled on error
    setConsulEnabled(false)
    setApolloEnabled(false)
    if (provider.value === 'consul' || provider.value === 'apollo') {
      setProvider('batata')
      switchProviderRoutes('batata')
      router.push('/')
    }
  }
}

onMounted(() => {
  const savedUser = storage.getJSON<{ name: string }>('batata_user')
  const savedToken = storage.get('batata-token')
  if (savedUser) {
    user.value = savedUser
    // Also restore store state for router guard
    if (savedToken) {
      batataStore.currentUser = { username: user.value!.name, token: savedToken }
    }
  }

  fetchServerState()
  fetchNamespaces()
})

const handlerChangeLanguage = (lang: Language) => {
  setLanguage(lang)
  showLangMenu.value = false
}

const handleLogout = () => {
  user.value = null
  storage.remove('batata_user')
  storage.remove('batata-token')
  batataStore.logout()
  router.push('/login')
}

const switchNamespace = (ns: Namespace) => {
  currentNamespace.value = ns
  storage.setJSON('batata_current_ns', ns)
  showNamespaceMenu.value = false
}

const isActiveRoute = (path: string) => {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

const handleSwitchProvider = (p: 'batata' | 'consul' | 'apollo') => {
  if (provider.value === p) return
  setProvider(p)
  switchProviderRoutes(p)
  router.push('/')
}

const nacosNavGroups = computed(() => [
  {
    title: t('overview'),
    items: [{ path: '/', label: t('dashboard'), icon: LayoutDashboard }],
  },
  {
    title: t('configManagement'),
    items: [
      { path: '/configs', label: t('configList'), icon: FileCode },
      { path: '/config/listeners', label: t('listeningToQuery'), icon: Radio },
      { path: '/config/sync', label: t('configSync'), icon: RefreshCw },
    ],
  },
  {
    title: t('serviceManagement'),
    items: [
      { path: '/services', label: t('serviceList'), icon: Server },
      { path: '/subscribers', label: t('subscriberList'), icon: Users },
    ],
  },
  {
    title: t('aiControl'),
    items: [{ path: '/mcp', label: t('mcpServers'), icon: Cpu }],
  },
  {
    title: t('agentManagement'),
    items: [{ path: '/agents', label: t('agents'), icon: Bot }],
  },
  {
    title: t('pluginManagement'),
    items: [{ path: '/plugins', label: t('plugins'), icon: Puzzle }],
  },
  {
    title: t('authorityControl'),
    items: [
      { path: '/users', label: t('users'), icon: UserCheck },
      { path: '/roles', label: t('roles'), icon: ShieldAlert },
      { path: '/permissions', label: t('permissions'), icon: Key },
    ],
  },
  {
    title: '',
    items: [
      { path: '/namespaces', label: t('namespaces'), icon: Layers },
      { path: '/cluster', label: t('cluster'), icon: Network },
      { path: '/datacenters', label: t('multiDatacenter'), icon: Globe2 },
      { path: '/tracing', label: t('tracing'), icon: Activity },
      { path: '/settings', label: t('settingCenter'), icon: Cog },
    ],
  },
])

const consulNavGroups = computed(() => [
  {
    title: t('overview'),
    items: [{ path: '/', label: t('dashboard'), icon: LayoutDashboard }],
  },
  {
    title: t('catalog'),
    items: [
      { path: '/catalog/services', label: t('services'), icon: Server },
      { path: '/catalog/nodes', label: t('nodes'), icon: HardDrive },
      { path: '/health', label: t('healthChecks'), icon: HeartPulse },
    ],
  },
  {
    title: t('kvStore'),
    items: [{ path: '/kv', label: t('kvStore'), icon: Database }],
  },
  {
    title: t('serviceMesh'),
    items: [
      { path: '/intentions', label: t('intentions'), icon: Link },
      { path: '/config-entries', label: t('configEntries'), icon: Settings2 },
    ],
  },
  {
    title: t('peerings'),
    items: [{ path: '/peerings', label: t('peerings'), icon: GitBranch }],
  },
  {
    title: t('acl'),
    items: [
      { path: '/acl/tokens', label: t('aclTokens'), icon: Key },
      { path: '/acl/policies', label: t('aclPolicies'), icon: Shield },
      { path: '/acl/roles', label: t('roles'), icon: ShieldAlert },
      { path: '/acl/auth-methods', label: t('authMethods'), icon: Fingerprint },
    ],
  },
  {
    title: t('cluster'),
    items: [{ path: '/sessions', label: t('consulSessions'), icon: Timer }],
  },
  {
    title: t('system'),
    items: [{ path: '/settings', label: t('settings'), icon: Cog }],
  },
])

const apolloNavGroups = computed(() => [
  {
    title: t('overview'),
    items: [{ path: '/', label: t('dashboard'), icon: LayoutDashboard }],
  },
  {
    title: t('apolloConfigManagement'),
    items: [
      { path: '/apps', label: t('apolloApps'), icon: Box },
      { path: '/search', label: t('apolloGlobalSearch'), icon: Globe2 },
    ],
  },
  {
    title: t('apolloAccessControl'),
    items: [
      { path: '/users', label: t('apolloUserManagement'), icon: Users },
      { path: '/consumers', label: t('apolloConsumers'), icon: Key },
    ],
  },
  {
    title: t('system'),
    items: [
      { path: '/system-info', label: t('apolloSystemInfo'), icon: Activity },
      { path: '/server-config', label: t('apolloServerConfig'), icon: Database },
      { path: '/settings', label: t('settings'), icon: Cog },
    ],
  },
])

const navGroups = computed(() => {
  switch (provider.value) {
    case 'consul':
      return consulNavGroups.value
    case 'apollo':
      return apolloNavGroups.value
    default:
      return nacosNavGroups.value
  }
})
</script>
