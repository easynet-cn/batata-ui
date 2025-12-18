<template>
  <div class="flex h-screen bg-slate-50 overflow-hidden">
    <!-- Sidebar -->
    <aside
      :class="[
        isSidebarOpen ? 'w-64' : 'w-20',
        'bg-[#001529] text-slate-300 transition-all duration-300 ease-in-out flex flex-col z-20 shadow-xl',
      ]"
    >
      <div class="h-16 flex items-center px-6 border-b border-slate-700/30 bg-[#002140]">
        <div
          class="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3 shrink-0 shadow-lg shadow-blue-500/20"
        >
          <span class="text-white font-bold text-xl">N</span>
        </div>
        <span v-if="isSidebarOpen" class="font-bold text-white text-lg tracking-tight truncate"
          >NACOS 2.0</span
        >
      </div>

      <nav class="flex-1 py-4 px-3 space-y-6 overflow-y-auto">
        <div v-for="(group, groupIdx) in navGroups" :key="groupIdx" class="space-y-1">
          <p
            v-if="isSidebarOpen"
            class="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2"
          >
            {{ group.title }}
          </p>
          <RouterLink
            v-for="item in group.items"
            :key="item.path"
            :to="item.path"
            :class="[
              'flex items-center px-3 py-2.5 rounded-xl transition-all group relative',
              route.path === item.path
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'hover:bg-slate-800/50 hover:text-white text-slate-400',
            ]"
          >
            <component :is="item.icon" :size="18" class="shrink-0" />
            <span v-if="isSidebarOpen" class="ml-3 font-medium text-sm">{{ item.label }}</span>
            <div
              v-if="!isSidebarOpen && route.path === item.path"
              class="absolute left-0 w-1 h-5 bg-white rounded-r-full"
            />
          </RouterLink>
        </div>
      </nav>

      <div class="p-4 border-t border-slate-700/30">
        <button
          @click="isSidebarOpen = !isSidebarOpen"
          class="w-full flex items-center justify-center py-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400"
        >
          <X v-if="isSidebarOpen" :size="20" />
          <Menu v-else :size="20" />
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <!-- Header -->
      <header
        class="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-10 shadow-sm"
      >
        <div class="flex items-center space-x-6">
          <div class="flex items-center text-slate-500 text-sm font-medium">
            {{ t('dashboard') }} /
            <span class="text-slate-900 ml-1">{{ currentPageLabel }}</span>
          </div>

          <!-- Namespace Selector -->
          <div class="relative border-l pl-6 border-slate-100 hidden sm:block">
            <button
              @click="showNamespaceMenu = !showNamespaceMenu"
              class="flex items-center space-x-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors group"
            >
              <Globe :size="14" class="text-blue-500" />
              <span class="text-xs font-bold text-slate-700">{{ t('namespace') }}:</span>
              <span class="text-xs font-medium text-slate-600">{{
                currentNamespace.namespaceShowName
              }}</span>
              <ChevronDown
                :size="14"
                :class="['text-slate-400 transition-transform', showNamespaceMenu && 'rotate-180']"
              />
            </button>

            <template v-if="showNamespaceMenu">
              <div class="fixed inset-0 z-40" @click="showNamespaceMenu = false" />
              <div
                class="absolute left-6 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50"
              >
                <div
                  class="px-4 py-1.5 mb-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50"
                >
                  {{ t('selectNamespace') }}
                </div>
                <button
                  v-for="ns in mockNamespaces"
                  :key="ns.namespace"
                  @click="switchNamespace(ns)"
                  :class="[
                    'w-full text-left px-4 py-2 text-sm flex items-center justify-between transition-colors',
                    currentNamespace.namespace === ns.namespace
                      ? 'bg-blue-50 text-blue-600 font-bold'
                      : 'text-slate-600 hover:bg-slate-50',
                  ]"
                >
                  <span>{{ ns.namespaceShowName }}</span>
                  <div
                    v-if="currentNamespace.namespace === ns.namespace"
                    class="w-1.5 h-1.5 rounded-full bg-blue-600"
                  />
                </button>
              </div>
            </template>
          </div>
        </div>

        <div class="flex items-center space-x-4 md:space-x-6 text-slate-600">
          <!-- Language Selector -->
          <div class="relative">
            <button
              @click="showLangMenu = !showLangMenu"
              class="flex items-center space-x-2 p-2 hover:bg-slate-50 rounded-xl transition-all"
            >
              <Languages :size="18" class="text-slate-400" />
              <span class="text-xs font-bold uppercase">{{ language }}</span>
            </button>
            <template v-if="showLangMenu">
              <div class="fixed inset-0 z-40" @click="showLangMenu = false" />
              <div
                class="absolute right-0 mt-2 w-32 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50"
              >
                <button
                  @click="handlerChangeLanguage('en')"
                  :class="[
                    'w-full text-left px-4 py-2 text-sm',
                    language === 'en'
                      ? 'text-blue-600 font-bold bg-blue-50'
                      : 'text-slate-600 hover:bg-slate-50',
                  ]"
                >
                  English
                </button>
                <button
                  @click="handlerChangeLanguage('zh')"
                  :class="[
                    'w-full text-left px-4 py-2 text-sm',
                    language === 'zh'
                      ? 'text-blue-600 font-bold bg-blue-50'
                      : 'text-slate-600 hover:bg-slate-50',
                  ]"
                >
                  中文
                </button>
              </div>
            </template>
          </div>

          <!-- User Menu -->
          <div class="relative border-l pl-4 md:pl-6 border-slate-200">
            <button
              @click="showUserMenu = !showUserMenu"
              class="flex items-center space-x-2 p-1 pr-2 hover:bg-slate-50 rounded-xl transition-all"
            >
              <div
                class="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-600/20 uppercase"
              >
                {{ user?.name?.charAt(0) || 'U' }}
              </div>
              <div class="hidden sm:block text-left">
                <div class="text-xs font-bold text-slate-900 leading-none">
                  {{ user?.name || 'User' }}
                </div>
                <div class="text-[10px] text-slate-400 leading-none mt-1 uppercase font-semibold">
                  {{ t('administrator') }}
                </div>
              </div>
              <ChevronDown
                :size="14"
                :class="['text-slate-400 transition-transform', showUserMenu && 'rotate-180']"
              />
            </button>
            <template v-if="showUserMenu">
              <div class="fixed inset-0 z-40" @click="showUserMenu = false" />
              <div
                class="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50"
              >
                <button
                  @click="handleLogout"
                  class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                >
                  <LogOut :size="14" class="mr-2" />
                  {{ t('signOut') }}
                </button>
              </div>
            </template>
          </div>
        </div>
      </header>

      <!-- Main Content Area -->
      <main class="flex-1 overflow-y-auto p-4 md:p-6 bg-[#f8fafc]">
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
import { ref, computed, onMounted, reactive } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import {
  Settings,
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
} from 'lucide-vue-next'
import { useI18n, type Language } from '@/i18n'
import { mockNamespaces } from '@/mock/data'
import type { Namespace } from '@/types'
import { useNacosStore } from '@/stores/nacos'
import { reactify } from '@vueuse/core'

const { t, language, setLanguage } = useI18n()
const route = useRoute()
const router = useRouter()
const nacosStore = useNacosStore()

const isSidebarOpen = ref(true)
const showUserMenu = ref(false)
const showNamespaceMenu = ref(false)
const showLangMenu = ref(false)

const langClass = reactive([])

const user = ref<{ name: string } | null>(null)
const defaultNamespace: Namespace = {
  namespace: '',
  namespaceShowName: 'public',
  type: 0,
  quota: 200,
  configCount: 0,
}
const currentNamespace = ref<Namespace>(mockNamespaces[0] || defaultNamespace)

onMounted(() => {
  const savedUser = localStorage.getItem('nacos_user')
  const savedToken = localStorage.getItem('nacos-token')
  if (savedUser) {
    user.value = JSON.parse(savedUser)
    // Also restore store state for router guard
    if (savedToken) {
      nacosStore.currentUser = { username: user.value!.name, token: savedToken }
    }
  }

  const savedNs = localStorage.getItem('nacos_current_ns')
  if (savedNs) {
    currentNamespace.value = JSON.parse(savedNs)
  }
})

const handlerChangeLanguage = (lang: Language) => {
  setLanguage(lang)
  showLangMenu.value = false
}

const handleLogout = () => {
  user.value = null
  localStorage.removeItem('nacos_user')
  localStorage.removeItem('nacos-token')
  nacosStore.logout()
  router.push('/login')
}

const switchNamespace = (ns: Namespace) => {
  currentNamespace.value = ns
  localStorage.setItem('nacos_current_ns', JSON.stringify(ns))
  showNamespaceMenu.value = false
}

const navGroups = computed(() => [
  {
    title: t('coreFeatures'),
    items: [
      { path: '/', label: t('configuration'), icon: Settings },
      { path: '/services', label: t('services'), icon: Server },
      { path: '/namespaces', label: t('namespaces'), icon: Layers },
      { path: '/cluster', label: t('cluster'), icon: Network },
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
])

const currentPageLabel = computed(() => {
  const allItems = navGroups.value.flatMap((g) => g.items)
  return allItems.find((i) => i.path === route.path)?.label || 'Overview'
})
</script>
