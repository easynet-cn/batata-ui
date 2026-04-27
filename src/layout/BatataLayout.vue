<template>
  <a href="#main-content" class="skip-to-content">{{ t('skipToContent') }}</a>
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

      <nav
        class="flex-1 py-4 px-3 space-y-6 overflow-y-auto scrollbar-hide"
        aria-label="Main navigation"
      >
        <div
          v-if="!consoleUiEnabled"
          class="px-3 py-4 text-xs text-gray-400 dark:text-gray-500 text-center"
        >
          {{ t('consoleUiDisabled') }}
        </div>
        <div v-for="(group, groupIdx) in navGroups" v-else :key="groupIdx" class="space-y-1">
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
          <!-- Provider Switcher (shown when consul is enabled on server) -->
          <template v-if="consulEnabled">
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
            </div>

            <!-- Divider -->
            <div class="h-6 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block" />
          </template>

          <!-- Datacenter Selector (Consul only) -->
          <div
            v-if="provider === 'consul' && consulStore.datacenters.length > 0"
            class="relative hidden sm:block"
          >
            <button
              @click="showDcMenu = !showDcMenu"
              class="flex items-center space-x-1.5 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors group"
            >
              <Globe :size="13" :class="providerTextClass" />
              <span class="text-[11px] font-bold text-gray-700 dark:text-gray-300"
                >{{ t('datacenter') }}:</span
              >
              <span class="text-[11px] font-medium text-gray-500 dark:text-gray-400">{{
                consulStore.currentDc
              }}</span>
              <span
                v-if="
                  consulAgentInfo?.primaryDc && consulStore.currentDc === consulAgentInfo.primaryDc
                "
                class="text-[9px] font-bold px-1 py-0.5 rounded bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-950/30 dark:text-fuchsia-400"
              >
                {{ t('consulPrimaryDc') }}
              </span>
              <ChevronDown
                :size="12"
                :class="['text-gray-400 transition-transform', showDcMenu && 'rotate-180']"
              />
            </button>

            <template v-if="showDcMenu">
              <div class="fixed inset-0 z-40" @click="showDcMenu = false" />
              <div
                class="absolute left-0 mt-1.5 w-52 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg py-1 z-50"
              >
                <div
                  class="px-3 py-1.5 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-gray-800"
                >
                  {{ t('consulSelectDatacenter') }}
                </div>
                <button
                  v-for="dc in consulStore.datacenters"
                  :key="dc"
                  @click="switchDatacenter(dc)"
                  :class="[
                    'w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors',
                    consulStore.currentDc === dc
                      ? 'bg-fuchsia-50 dark:bg-fuchsia-950/30 text-fuchsia-600 dark:text-fuchsia-400 font-bold'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800',
                  ]"
                >
                  <span class="flex items-center gap-1.5">
                    {{ dc }}
                    <span
                      v-if="consulAgentInfo?.primaryDc === dc"
                      class="text-[9px] font-bold px-1 py-0.5 rounded bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-950/30 dark:text-fuchsia-400"
                    >
                      {{ t('consulPrimaryDc') }}
                    </span>
                    <span
                      v-if="consulAgentInfo?.datacenter === dc && consulAgentInfo?.primaryDc !== dc"
                      class="text-[9px] font-bold px-1 py-0.5 rounded bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                    >
                      {{ t('consulLocalDc') }}
                    </span>
                  </span>
                  <div
                    v-if="consulStore.currentDc === dc"
                    class="w-1.5 h-1.5 rounded-full bg-fuchsia-600 dark:bg-fuchsia-400"
                  />
                </button>
              </div>
            </template>
          </div>

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
                  {{ isConsulProvider ? consulTokenDisplay : user?.name || 'User' }}
                </div>
                <div
                  class="text-[10px] text-gray-400 dark:text-gray-500 leading-none mt-0.5 uppercase"
                >
                  {{ isConsulProvider ? 'Consul' : t('administrator') }}
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
                class="absolute right-0 mt-1.5 w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg py-1 z-50"
              >
                <!-- Consul token info -->
                <template v-if="isConsulProvider && consulTokenId">
                  <div class="px-3 py-2 border-b border-gray-100 dark:border-gray-800">
                    <div class="text-[10px] font-bold text-gray-400 uppercase">
                      {{ t('consulAccessorId') }}
                    </div>
                    <div class="text-xs font-mono text-gray-600 dark:text-gray-400 mt-0.5">
                      ...{{ consulTokenId.slice(-8) }}
                    </div>
                  </div>
                  <button
                    @click="handleSwitchToken"
                    class="w-full text-left px-3 py-2 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center font-medium"
                  >
                    <KeyRound :size="13" class="mr-2" />
                    {{ t('consulSwitchToken') }}
                  </button>
                </template>
                <!-- Batata: change password -->
                <button
                  v-if="!isConsulProvider"
                  @click="handleChangePassword"
                  class="w-full text-left px-3 py-2 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center font-medium"
                >
                  <KeyRound :size="13" class="mr-2" />
                  {{ t('changePassword') }}
                </button>
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
      <main id="main-content" class="flex-1 overflow-y-auto p-4 md:p-5 bg-gray-50 dark:bg-gray-950">
        <div v-if="!consoleUiEnabled" class="flex items-center justify-center h-full">
          <div class="text-center space-y-3">
            <Settings2 class="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto" />
            <h2 class="text-lg font-semibold text-gray-500 dark:text-gray-400">
              {{ t('consoleUiDisabledTitle') }}
            </h2>
            <p class="text-sm text-gray-400 dark:text-gray-500">{{ t('consoleUiDisabledDesc') }}</p>
          </div>
        </div>
        <div v-else class="max-w-7xl mx-auto">
          <RouterView v-slot="{ Component }">
            <component :is="Component" :namespace="currentNamespace" @switch="switchNamespace" />
          </RouterView>
        </div>
      </main>
    </div>
  </div>

  <!-- Change Password Modal -->
  <FormModal
    v-model="showPasswordModal"
    :title="t('changePassword')"
    :loading="passwordSaving"
    :submit-disabled="!newPassword || !confirmNewPassword"
    @submit="submitChangePassword"
  >
    <div class="space-y-4">
      <div>
        <label class="block text-xs font-medium text-text-primary mb-1">
          {{ t('username') }}
        </label>
        <input type="text" class="input" :value="user?.name || ''" disabled />
      </div>
      <div>
        <label class="block text-xs font-medium text-text-primary mb-1">
          {{ t('newPassword') }} <span class="text-danger">*</span>
        </label>
        <input
          v-model="newPassword"
          type="password"
          class="input"
          :placeholder="t('newPassword')"
        />
      </div>
      <div>
        <label class="block text-xs font-medium text-text-primary mb-1">
          {{ t('confirmPassword') }} <span class="text-danger">*</span>
        </label>
        <input
          v-model="confirmNewPassword"
          type="password"
          class="input"
          :placeholder="t('confirmPassword')"
          :class="{ 'border-red-500': confirmNewPassword && newPassword !== confirmNewPassword }"
        />
        <p
          v-if="confirmNewPassword && newPassword !== confirmNewPassword"
          class="text-xs text-red-500 mt-1"
        >
          {{ t('passwordMismatch') }}
        </p>
      </div>
    </div>
  </FormModal>
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
  History,
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
  ExternalLink,
  Zap,
  Wrench,
  KeyRound,
  Sparkles,
  MessageSquare,
  Package,
  FolderTree,
} from 'lucide-vue-next'
import { useI18n, type Language } from '@/i18n'
import type { Namespace } from '@/types'
import { useBatataStore } from '@/stores/batata'
import { useConsulStore } from '@/stores/consul'
import { useConsulAbilities } from '@/composables/useConsulAbilities'
import batataApi from '@/api/batata'
import { useGlobalWebSocket } from '@/composables/useWebSocket'
import { globalNotifications } from '@/composables/useNotifications'
import { config } from '@/config'
import { useTheme } from '@/composables/useTheme'
import { useProvider } from '@/composables/useProvider'
import { switchProviderRoutes } from '@/router'
import { storage } from '@/composables/useStorage'
import FormModal from '@/components/common/FormModal.vue'
import { toast } from '@/utils/error'
import { logger } from '@/utils/logger'

const { t, language, setLanguage } = useI18n()
const route = useRoute()
const router = useRouter()
const batataStore = useBatataStore()
const consulStore = useConsulStore()
const {
  fetchPermissions: fetchConsulPermissions,
  canReadServices,
  canReadNodes,
  canReadKV,
  canReadIntentions,
  canReadSessions,
  canReadPeerings,
  canReadACL,
  canReadOperator,
} = useConsulAbilities()
const { isDark, toggleTheme } = useTheme()
const {
  provider,
  consulEnabled,
  providerBgClass,
  providerShadowClass,
  providerTextClass,
  providerLetter,
  setProvider,
  setConsulEnabled,
  consoleUiEnabled,
  setConsoleUiEnabled,
} = useProvider()

const isSidebarOpen = ref(true)
const showUserMenu = ref(false)
const showNamespaceMenu = ref(false)
const showLangMenu = ref(false)
const showNotifications = ref(false)
const showDcMenu = ref(false)
const consulAgentInfo = ref<{ datacenter?: string; primaryDc?: string } | null>(null)

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

const user = computed(() =>
  batataStore.currentUser ? { name: batataStore.currentUser.username } : null,
)
const isConsulProvider = computed(() => provider.value === 'consul')
const consulTokenId = computed(() => {
  if (!isConsulProvider.value) return ''
  return batataStore.currentUser?.token || ''
})
const consulTokenDisplay = computed(() => {
  if (!consulTokenId.value) return user.value?.name || 'Anonymous'
  return '...' + consulTokenId.value.slice(-8)
})
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
    setConsulEnabled(consulOn)
    // Set console UI enabled state (default to true if not specified)
    setConsoleUiEnabled(state?.console_ui_enabled !== 'false')
    // If consul is not enabled but user was on consul provider, switch back to batata
    if (!consulOn && provider.value === 'consul') {
      setProvider('batata')
      switchProviderRoutes('batata')
      router.push('/')
    }
  } catch {
    // Default to disabled on error
    setConsulEnabled(false)
    if (provider.value === 'consul') {
      setProvider('batata')
      switchProviderRoutes('batata')
      router.push('/')
    }
  }
}

onMounted(async () => {
  await fetchServerState()
  fetchNamespaces()
  if (provider.value === 'consul') {
    initConsul()
  }
})

const handlerChangeLanguage = (lang: Language) => {
  setLanguage(lang)
  showLangMenu.value = false
}

const handleSwitchToken = () => {
  showUserMenu.value = false
  batataStore.logout()
  router.push('/login')
}

const handleLogout = () => {
  batataStore.logout()
  router.push('/login')
}

// Change password
const showPasswordModal = ref(false)
const newPassword = ref('')
const confirmNewPassword = ref('')
const passwordSaving = ref(false)

const handleChangePassword = () => {
  showUserMenu.value = false
  newPassword.value = ''
  confirmNewPassword.value = ''
  showPasswordModal.value = true
}

const submitChangePassword = async () => {
  if (!newPassword.value || !confirmNewPassword.value) return
  if (newPassword.value !== confirmNewPassword.value) {
    toast.error(t('passwordMismatch'))
    return
  }
  if (newPassword.value.length < 6) {
    toast.error(t('passwordTooShort'))
    return
  }

  const username = batataStore.currentUser?.username
  if (!username) return

  passwordSaving.value = true
  try {
    await batataApi.updateUser({ username, newPassword: newPassword.value })
    toast.success(t('changePasswordSuccess'))
    showPasswordModal.value = false
  } catch (error) {
    logger.error('Failed to change password:', error)
    toast.apiError(error)
  } finally {
    passwordSaving.value = false
  }
}

const switchNamespace = (ns: Namespace) => {
  currentNamespace.value = ns
  storage.setJSON('batata_current_ns', ns)
  showNamespaceMenu.value = false
}

const switchDatacenter = (dc: string) => {
  consulStore.setCurrentDc(dc)
  showDcMenu.value = false
}

const initConsul = async () => {
  try {
    await consulStore.fetchDatacenters()
    const info = await consulStore.probeACLCapabilities()
    if (info) {
      consulAgentInfo.value = info
    }
    // Fetch ACL permissions after probing capabilities
    await fetchConsulPermissions()
  } catch {
    // Silently ignore
  }
}

const isActiveRoute = (path: string) => {
  if (path === '/') return route.path === '/'

  const routePath = route.path

  // Exact match
  if (routePath === path) return true

  // Starts with path (for subroutes like /services -> /service/detail)
  if (routePath.startsWith(path + '/')) return true

  // Special case for consul detail routes
  // /consul/catalog/services should match /consul/catalog/service/:name
  if (path === '/consul/catalog/services' && routePath.startsWith('/consul/catalog/service/')) {
    return true
  }
  // /consul/catalog/nodes should match /consul/catalog/node/:name
  if (path === '/consul/catalog/nodes' && routePath.startsWith('/consul/catalog/node/')) {
    return true
  }
  // /consul/kv should match /consul/kv/new, /consul/kv/editor, /consul/kv/detail
  if (path === '/consul/kv' && routePath.startsWith('/consul/kv/')) {
    return true
  }
  // /consul/peerings should match /consul/peering/:name
  if (path === '/consul/peerings' && routePath.startsWith('/consul/peering/')) {
    return true
  }
  // /consul/acl/auth-methods should match /consul/acl/auth-method/:name
  if (path === '/consul/acl/auth-methods' && routePath.startsWith('/consul/acl/auth-method/')) {
    return true
  }

  // Special case for batata service routes
  // /services should match /service/detail
  if (path === '/services' && routePath.startsWith('/service/')) {
    return true
  }
  // /configs should match /config/new, /config/edit, /config/detail, /config/history
  // But NOT /config/listeners or /config/sync (these are separate pages)
  if (path === '/configs' && routePath.startsWith('/config/')) {
    // Exclude pages that have their own sidebar items
    if (!['/config/listeners', '/config/sync', '/config/history'].includes(routePath)) {
      return true
    }
  }
  // /mcp should match /mcp/new, /mcp/edit, /mcp/detail
  if (path === '/mcp' && routePath.startsWith('/mcp/')) {
    return true
  }
  // /agents should match /agent/new, /agent/edit
  if (path === '/agents' && routePath.startsWith('/agent/')) {
    return true
  }

  return false
}

const handleSwitchProvider = (p: 'batata' | 'consul') => {
  if (provider.value === p) return
  setProvider(p)
  switchProviderRoutes(p)
  switch (p) {
    case 'consul':
      initConsul()
      router.push('/consul/dashboard')
      break
    default:
      // Batata mode requires authentication, redirect to login if not authenticated
      if (!batataStore.isAuthenticated) {
        router.push('/login')
      } else {
        router.push('/')
      }
  }
}

const nacosNavGroups = computed(() => {
  const groups = [
    {
      title: t('overview'),
      items: [{ path: '/', label: t('dashboard'), icon: LayoutDashboard }],
    },
    {
      title: t('configManagement'),
      items: [
        { path: '/configs', label: t('configList'), icon: FileCode },
        { path: '/config/history', label: t('historicalVersions'), icon: History },
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
      title: t('aiRegistry'),
      items: [
        { path: '/skills', label: t('skills'), icon: Sparkles },
        { path: '/prompts', label: t('prompts'), icon: MessageSquare },
        { path: '/agents', label: t('agents'), icon: Bot },
        { path: '/agentspecs', label: t('agentSpecs'), icon: Package },
        { path: '/mcp', label: t('mcpServers'), icon: Cpu },
      ],
    },
    {
      title: t('pluginManagement'),
      items: [{ path: '/plugins', label: t('plugins'), icon: Puzzle }],
    },
  ]

  // Authority control is admin-only
  if (batataStore.isGlobalAdmin) {
    groups.push({
      title: t('authorityControl'),
      items: [
        { path: '/users', label: t('users'), icon: UserCheck },
        { path: '/roles', label: t('roles'), icon: ShieldAlert },
        { path: '/permissions', label: t('permissions'), icon: Key },
      ],
    })
  }

  groups.push({
    title: '',
    items: [
      { path: '/namespaces', label: t('namespaces'), icon: Layers },
      { path: '/cluster', label: t('cluster'), icon: Network },
      { path: '/datacenters', label: t('multiDatacenter'), icon: Globe2 },
      { path: '/tracing', label: t('tracing'), icon: Activity },
      { path: '/settings', label: t('settingCenter'), icon: Cog },
      { path: '/copilot-settings', label: t('copilotSettings'), icon: Sparkles },
    ],
  })

  return groups
})

const consulNavGroups = computed(() => {
  const groups = [
    {
      title: t('overview'),
      items: [{ path: '/consul/dashboard', label: t('dashboard'), icon: LayoutDashboard }],
    },
  ]

  // Catalog section - filter by read permissions
  const catalogItems = []
  if (canReadServices.value) {
    catalogItems.push({ path: '/consul/catalog/services', label: t('services'), icon: Server })
  }
  if (canReadNodes.value) {
    catalogItems.push({ path: '/consul/catalog/nodes', label: t('nodes'), icon: HardDrive })
  }
  // Health checks are always visible if any catalog item is visible
  if (catalogItems.length > 0) {
    catalogItems.push({ path: '/consul/health', label: t('healthChecks'), icon: HeartPulse })
  }
  if (catalogItems.length > 0) {
    groups.push({ title: t('catalog'), items: catalogItems })
  }

  // KV Store - requires key read permission
  if (canReadKV.value) {
    groups.push({
      title: t('kvStore'),
      items: [{ path: '/consul/kv', label: t('kvStore'), icon: Database }],
    })
  }

  // Service Mesh - filter by intention read permission
  const meshItems = []
  if (canReadIntentions.value) {
    meshItems.push({ path: '/consul/intentions', label: t('intentions'), icon: Link })
  }
  meshItems.push({ path: '/consul/config-entries', label: t('configEntries'), icon: Settings2 })
  meshItems.push({
    path: '/consul/exported-services',
    label: t('consulExportedServices'),
    icon: ExternalLink,
  })
  if (meshItems.length > 0) {
    groups.push({ title: t('serviceMesh'), items: meshItems })
  }

  // Peerings - requires peering read permission
  if (canReadPeerings.value) {
    groups.push({
      title: t('peerings'),
      items: [{ path: '/consul/peerings', label: t('peerings'), icon: GitBranch }],
    })
  }

  // ACL section - requires ACL enabled and ACL read permission
  if (consulStore.aclEnabled && canReadACL.value) {
    groups.push({
      title: t('acl'),
      items: [
        { path: '/consul/acl/tokens', label: t('aclTokens'), icon: Key },
        { path: '/consul/acl/policies', label: t('aclPolicies'), icon: Shield },
        { path: '/consul/acl/roles', label: t('roles'), icon: ShieldAlert },
        { path: '/consul/acl/auth-methods', label: t('authMethods'), icon: Fingerprint },
      ],
    })
  }

  // Cluster section - filter by permissions
  const clusterItems = [
    { path: '/consul/partitions', label: t('consulPartitions'), icon: Layers },
    { path: '/consul/namespaces', label: t('consulNamespaces'), icon: FolderTree },
  ]
  if (canReadSessions.value) {
    clusterItems.push({ path: '/consul/sessions', label: t('consulSessions'), icon: Timer })
  }
  clusterItems.push({ path: '/consul/events', label: t('consulEvents'), icon: Zap })
  if (canReadOperator.value) {
    clusterItems.push({ path: '/consul/operator', label: t('consulOperator'), icon: Wrench })
  }
  groups.push({ title: t('cluster'), items: clusterItems })

  groups.push({
    title: t('system'),
    items: [{ path: '/consul/settings', label: t('settings'), icon: Cog }],
  })

  return groups
})

const navGroups = computed(() => {
  switch (provider.value) {
    case 'consul':
      return consulNavGroups.value
    default:
      return nacosNavGroups.value
  }
})
</script>
