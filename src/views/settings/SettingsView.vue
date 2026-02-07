<template>
  <div class="space-y-3">
    <!-- Page Header -->
    <div>
      <h1 class="text-base font-semibold text-text-primary">{{ t('settings') }}</h1>
      <p class="text-xs text-text-secondary mt-0.5">{{ t('settingsDesc') }}</p>
    </div>

    <!-- Settings Sections -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left Column - Settings List -->
      <div class="lg:col-span-2 space-y-3">
        <!-- Appearance -->
        <div class="card">
          <div class="p-4 border-b border-border">
            <h3 class="text-sm font-medium text-text-primary flex items-center gap-2">
              <Palette class="w-5 h-5 text-primary" />
              {{ t('appearance') }}
            </h3>
          </div>
          <div class="p-4 space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium text-text-primary">{{ t('theme') }}</p>
                <p class="text-sm text-text-secondary">{{ t('themeDesc') }}</p>
              </div>
              <select v-model="settings.theme" class="input w-40">
                <option value="light">{{ t('light') }}</option>
                <option value="dark">{{ t('dark') }}</option>
                <option value="system">{{ t('system') }}</option>
              </select>
            </div>

            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium text-text-primary">{{ t('language') }}</p>
                <p class="text-sm text-text-secondary">{{ t('languageDesc') }}</p>
              </div>
              <select v-model="settings.language" class="input w-40">
                <option value="zh-CN">简体中文</option>
                <option value="en-US">English</option>
              </select>
            </div>

            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium text-text-primary">{{ t('sidebarCollapsed') }}</p>
                <p class="text-sm text-text-secondary">{{ t('sidebarCollapsedDesc') }}</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input v-model="settings.sidebarCollapsed" type="checkbox" class="sr-only peer" />
                <div
                  class="w-11 h-6 bg-bg-tertiary peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:after:border-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"
                ></div>
              </label>
            </div>
          </div>
        </div>

        <!-- Editor Settings -->
        <div class="card">
          <div class="p-4 border-b border-border">
            <h3 class="text-sm font-medium text-text-primary flex items-center gap-2">
              <Code class="w-5 h-5 text-primary" />
              {{ t('editorSettings') }}
            </h3>
          </div>
          <div class="p-4 space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium text-text-primary">{{ t('editorFontSize') }}</p>
                <p class="text-sm text-text-secondary">{{ t('editorFontSizeDesc') }}</p>
              </div>
              <select v-model="settings.editorFontSize" class="input w-40">
                <option :value="12">12px</option>
                <option :value="14">14px</option>
                <option :value="16">16px</option>
                <option :value="18">18px</option>
              </select>
            </div>

            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium text-text-primary">{{ t('tabSize') }}</p>
                <p class="text-sm text-text-secondary">{{ t('tabSizeDesc') }}</p>
              </div>
              <select v-model="settings.tabSize" class="input w-40">
                <option :value="2">2 {{ t('spaces') }}</option>
                <option :value="4">4 {{ t('spaces') }}</option>
              </select>
            </div>

            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium text-text-primary">{{ t('wordWrap') }}</p>
                <p class="text-sm text-text-secondary">{{ t('wordWrapDesc') }}</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input v-model="settings.wordWrap" type="checkbox" class="sr-only peer" />
                <div
                  class="w-11 h-6 bg-bg-tertiary peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:after:border-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"
                ></div>
              </label>
            </div>

            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium text-text-primary">{{ t('showLineNumbers') }}</p>
                <p class="text-sm text-text-secondary">{{ t('showLineNumbersDesc') }}</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input v-model="settings.showLineNumbers" type="checkbox" class="sr-only peer" />
                <div
                  class="w-11 h-6 bg-bg-tertiary peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:after:border-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"
                ></div>
              </label>
            </div>
          </div>
        </div>

        <!-- Notifications -->
        <div class="card">
          <div class="p-4 border-b border-border">
            <h3 class="text-sm font-medium text-text-primary flex items-center gap-2">
              <Bell class="w-5 h-5 text-primary" />
              {{ t('notifications') }}
            </h3>
          </div>
          <div class="p-4 space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium text-text-primary">{{ t('enableNotifications') }}</p>
                <p class="text-sm text-text-secondary">{{ t('enableNotificationsDesc') }}</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input
                  v-model="settings.enableNotifications"
                  type="checkbox"
                  class="sr-only peer"
                />
                <div
                  class="w-11 h-6 bg-bg-tertiary peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:after:border-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"
                ></div>
              </label>
            </div>

            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium text-text-primary">{{ t('autoRefresh') }}</p>
                <p class="text-sm text-text-secondary">{{ t('autoRefreshDesc') }}</p>
              </div>
              <select v-model="settings.autoRefreshInterval" class="input w-40">
                <option :value="0">{{ t('disabled') }}</option>
                <option :value="5000">5 {{ t('seconds') }}</option>
                <option :value="10000">10 {{ t('seconds') }}</option>
                <option :value="30000">30 {{ t('seconds') }}</option>
                <option :value="60000">60 {{ t('seconds') }}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column - Server Info -->
      <div class="space-y-3">
        <!-- Server Status -->
        <div class="card">
          <div class="p-4 border-b border-border">
            <h3 class="text-sm font-medium text-text-primary flex items-center gap-2">
              <Server class="w-5 h-5 text-primary" />
              {{ t('serverInfo') }}
            </h3>
          </div>
          <div class="p-4 space-y-3">
            <div v-if="loadingServer" class="text-center py-4">
              <Loader2 class="w-5 h-5 animate-spin mx-auto text-primary" />
            </div>
            <template v-else>
              <div class="flex justify-between">
                <span class="text-text-secondary">{{ t('version') }}</span>
                <span class="font-mono text-text-primary">{{ serverInfo.version || '-' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-text-secondary">{{ t('mode') }}</span>
                <span class="badge badge-info">{{ serverInfo.mode || 'standalone' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-text-secondary">{{ t('status') }}</span>
                <span class="badge badge-success">{{ t('running') }}</span>
              </div>
            </template>
          </div>
        </div>

        <!-- Actions -->
        <div class="card">
          <div class="p-4 space-y-3">
            <button @click="handleSave" class="btn btn-primary w-full" :disabled="saving">
              <Loader2 v-if="saving" class="w-3.5 h-3.5 animate-spin" />
              <Save v-else class="w-3.5 h-3.5" />
              {{ t('saveSettings') }}
            </button>
            <button @click="handleReset" class="btn btn-secondary w-full">
              <RotateCcw class="w-3.5 h-3.5" />
              {{ t('resetToDefault') }}
            </button>
          </div>
        </div>

        <!-- About -->
        <div class="card">
          <div class="p-4 border-b border-border">
            <h3 class="text-sm font-medium text-text-primary flex items-center gap-2">
              <Info class="w-5 h-5 text-primary" />
              {{ t('about') }}
            </h3>
          </div>
          <div class="p-4 space-y-3">
            <div class="flex justify-between">
              <span class="text-text-secondary">{{ t('uiVersion') }}</span>
              <span class="font-mono text-text-primary">1.0.0</span>
            </div>
            <div class="flex justify-between">
              <span class="text-text-secondary">{{ t('license') }}</span>
              <span class="text-text-primary">Apache-2.0</span>
            </div>
            <a
              href="https://github.com/easynet-cn/batata"
              target="_blank"
              class="btn btn-ghost btn-sm w-full justify-start"
            >
              <ExternalLink class="w-3.5 h-3.5" />
              {{ t('viewOnGithub') }}
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import {
  Palette,
  Code,
  Bell,
  Server,
  Save,
  RotateCcw,
  Info,
  ExternalLink,
  Loader2,
} from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import type { Namespace } from '@/types'

defineProps<{
  namespace: Namespace
}>()

const { t } = useI18n()

// State
const saving = ref(false)
const loadingServer = ref(false)

const settings = reactive({
  theme: 'light',
  language: 'zh-CN',
  sidebarCollapsed: false,
  editorFontSize: 14,
  tabSize: 2,
  wordWrap: true,
  showLineNumbers: true,
  enableNotifications: true,
  autoRefreshInterval: 0,
})

const serverInfo = reactive({
  version: '',
  mode: '',
})

// Methods
const loadSettings = () => {
  const saved = localStorage.getItem('batata-settings')
  if (saved) {
    try {
      Object.assign(settings, JSON.parse(saved))
    } catch {
      console.error('Failed to load settings')
    }
  }
}

const handleSave = async () => {
  saving.value = true
  try {
    localStorage.setItem('batata-settings', JSON.stringify(settings))
    // Apply theme
    document.documentElement.setAttribute('data-theme', settings.theme)
  } catch (error) {
    console.error('Failed to save settings:', error)
  } finally {
    saving.value = false
  }
}

const handleReset = () => {
  Object.assign(settings, {
    theme: 'light',
    language: 'zh-CN',
    sidebarCollapsed: false,
    editorFontSize: 14,
    tabSize: 2,
    wordWrap: true,
    showLineNumbers: true,
    enableNotifications: true,
    autoRefreshInterval: 0,
  })
}

const fetchServerInfo = async () => {
  loadingServer.value = true
  try {
    // This would normally call the server info API
    serverInfo.version = '2.3.0'
    serverInfo.mode = 'standalone'
  } catch (error) {
    console.error('Failed to fetch server info:', error)
  } finally {
    loadingServer.value = false
  }
}

// Lifecycle
onMounted(() => {
  loadSettings()
  fetchServerInfo()
})
</script>
