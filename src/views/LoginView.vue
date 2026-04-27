<template>
  <div
    class="min-h-screen bg-[#f0f2f5] dark:bg-gray-950 flex flex-col items-center justify-center p-4 transition-colors duration-300 relative"
  >
    <!-- Top-right controls -->
    <div class="absolute top-6 right-6 flex items-center space-x-3">
      <button
        @click="toggleTheme"
        class="p-2.5 text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 rounded-full transition-all shadow-sm border border-transparent hover:border-gray-200 dark:hover:border-gray-700 bg-white/50 dark:bg-gray-900/50"
        :title="t('themeToggle')"
      >
        <Moon v-if="!isDark" :size="20" />
        <Sun v-else :size="20" />
      </button>
      <button
        @click="toggleLanguage"
        class="flex items-center space-x-2 text-sm font-semibold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-full bg-white/50 dark:bg-gray-900/50 hover:bg-white dark:hover:bg-gray-800 transition-all shadow-sm"
      >
        <Languages :size="16" />
        <span>{{ language === 'zh' ? 'English' : '中文' }}</span>
      </button>
    </div>

    <!-- Login Card -->
    <div
      class="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 transition-all duration-500"
    >
      <div class="p-10 text-center">
        <div class="flex justify-center mb-6">
          <div
            :class="[
              'w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-white text-4xl italic shadow-xl transform -rotate-6',
              isConsulAcl
                ? 'bg-fuchsia-600 shadow-fuchsia-500/30'
                : 'bg-blue-600 shadow-blue-500/30',
            ]"
          >
            {{ isConsulAcl ? 'C' : 'B' }}
          </div>
        </div>
        <h1 class="text-3xl font-extrabold text-gray-800 dark:text-gray-100 mb-2 tracking-tight">
          {{ isConsulAcl ? t('consulLoginTitle') : t('welcomeBack') }}
        </h1>
        <p class="text-gray-500 dark:text-gray-400 text-sm font-medium italic">
          {{ isConsulAcl ? t('consulLoginSlogan') : t('loginSlogan') }}
        </p>
      </div>

      <div class="px-10 pb-10 space-y-6">
        <!-- Consul ACL: Tab switcher (Token / SSO) -->
        <div
          v-if="isConsulAcl && oidcProviders.length > 0"
          class="flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1"
        >
          <button
            type="button"
            @click="consulLoginTab = 'token'"
            :class="[
              'flex-1 py-2.5 text-sm font-bold rounded-lg transition-all',
              consulLoginTab === 'token'
                ? 'bg-white dark:bg-gray-700 text-fuchsia-600 dark:text-fuchsia-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
            ]"
          >
            {{ t('consulTokenLogin') }}
          </button>
          <button
            type="button"
            @click="consulLoginTab = 'sso'"
            :class="[
              'flex-1 py-2.5 text-sm font-bold rounded-lg transition-all',
              consulLoginTab === 'sso'
                ? 'bg-white dark:bg-gray-700 text-fuchsia-600 dark:text-fuchsia-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
            ]"
          >
            {{ t('consulSsoLogin') }}
          </button>
        </div>

        <!-- Consul ACL Token login -->
        <form
          v-if="isConsulAcl && consulLoginTab === 'token'"
          @submit.prevent="handleSubmit"
          class="space-y-6"
        >
          <div class="space-y-1">
            <label class="text-xs font-bold text-gray-400 uppercase ml-1">{{
              t('consulAclToken')
            }}</label>
            <input
              type="password"
              v-model="consulToken"
              :placeholder="t('consulTokenPlaceholder')"
              class="w-full pl-4 pr-4 py-3.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-fuchsia-500 dark:text-gray-100 outline-none transition-all text-sm"
              required
            />
          </div>

          <div v-if="loginError" class="text-red-500 dark:text-red-400 text-sm text-center">
            {{ loginError }}
          </div>

          <button
            type="submit"
            :disabled="isLoading"
            class="w-full text-white py-4 rounded-xl font-bold text-lg transition-all shadow-xl active:scale-95 transform disabled:opacity-70 disabled:cursor-not-allowed bg-fuchsia-600 hover:bg-fuchsia-700 shadow-fuchsia-500/20"
          >
            <template v-if="isLoading">
              <div
                class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"
              />
            </template>
            <template v-else>
              {{ t('signIn') }}
            </template>
          </button>
        </form>

        <!-- Consul SSO / OIDC login -->
        <div v-else-if="isConsulAcl && consulLoginTab === 'sso'" class="space-y-6">
          <div v-if="oidcProviders.length === 0" class="text-center py-4">
            <p class="text-gray-500 dark:text-gray-400 text-sm">{{ t('consulNoOidcProviders') }}</p>
          </div>
          <template v-else>
            <div class="space-y-1">
              <label class="text-xs font-bold text-gray-400 uppercase ml-1">{{
                t('consulSelectOidcProvider')
              }}</label>
              <select
                v-model="selectedOidcProvider"
                class="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-fuchsia-500 dark:text-gray-100 outline-none transition-all text-sm"
              >
                <option v-for="p in oidcProviders" :key="p.Name" :value="p.Name">
                  {{ p.DisplayName || p.Name }}
                </option>
              </select>
            </div>

            <div v-if="loginError" class="text-red-500 dark:text-red-400 text-sm text-center">
              {{ loginError }}
            </div>

            <button
              type="button"
              :disabled="oidcLoading || !selectedOidcProvider"
              @click="handleOidcLogin"
              class="w-full text-white py-4 rounded-xl font-bold text-lg transition-all shadow-xl active:scale-95 transform disabled:opacity-70 disabled:cursor-not-allowed bg-fuchsia-600 hover:bg-fuchsia-700 shadow-fuchsia-500/20"
            >
              <template v-if="oidcLoading">
                <div
                  class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"
                />
              </template>
              <template v-else>
                {{ t('consulOidcSignInWith') }} {{ selectedOidcProvider }}
              </template>
            </button>
          </template>
        </div>

        <!-- Batata username/password login -->
        <form v-else @submit.prevent="handleSubmit" class="space-y-6">
          <div class="space-y-1">
            <label class="text-xs font-bold text-gray-400 uppercase ml-1">{{
              t('username')
            }}</label>
            <input
              type="text"
              v-model="username"
              :placeholder="t('loginUserPlaceholder')"
              class="w-full pl-4 pr-4 py-3.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:text-gray-100 outline-none transition-all text-sm"
              required
            />
          </div>

          <div class="space-y-1">
            <label class="text-xs font-bold text-gray-400 uppercase ml-1">{{
              t('password')
            }}</label>
            <input
              type="password"
              v-model="password"
              :placeholder="t('loginPassPlaceholder')"
              class="w-full pl-4 pr-4 py-3.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:text-gray-100 outline-none transition-all text-sm"
              required
            />
          </div>

          <div v-if="loginError" class="text-red-500 dark:text-red-400 text-sm text-center">
            {{ loginError }}
          </div>

          <button
            type="submit"
            :disabled="isLoading"
            class="w-full text-white py-4 rounded-xl font-bold text-lg transition-all shadow-xl active:scale-95 transform disabled:opacity-70 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-700 shadow-blue-500/20"
          >
            <template v-if="isLoading">
              <div
                class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"
              />
            </template>
            <template v-else>
              {{ t('signIn') }}
            </template>
          </button>

          <div class="pt-2 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              @click="enterConsul"
              class="w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-50 dark:bg-fuchsia-950/30 hover:bg-fuchsia-100 dark:hover:bg-fuchsia-900/40 transition-colors"
            >
              <span>{{ t('enterConsul') }}</span>
              <span aria-hidden="true">→</span>
            </button>
            <p class="mt-2 text-xs text-center text-gray-400 dark:text-gray-500">
              {{ authStore.consulAclEnabled ? t('consulAclRequired') : t('consulNoAclHint') }}
            </p>
          </div>
        </form>

        <div v-if="isConsulAcl" class="text-center">
          <button
            type="button"
            @click="continueWithoutLogin"
            class="text-gray-400 hover:text-fuchsia-500 text-sm transition-colors"
          >
            {{ t('consulContinueWithout') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Moon, Sun, Languages } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import { useBatataStore } from '@/stores/batata'
import { useAuthStore } from '@/stores/auth'
import { useTheme } from '@/composables/useTheme'
import batataApi from '@/api/batata'
import consulApi from '@/api/consul'
import { storage } from '@/composables/useStorage'
import { useProvider } from '@/composables/useProvider'
import { switchProviderRoutes } from '@/router'

const { t, language, setLanguage } = useI18n()
const router = useRouter()
const batataStore = useBatataStore()
const authStore = useAuthStore()
const { isDark, toggleTheme } = useTheme()
const { setProvider } = useProvider()

const username = ref('')
const password = ref('')
const consulToken = ref('')
const isLoading = ref(false)
const loginError = ref('')

// SSO / OIDC state
const consulLoginTab = ref<'token' | 'sso'>('token')
const oidcProviders = ref<Array<{ Name: string; DisplayName?: string; Kind: string }>>([])
const selectedOidcProvider = ref('')
const oidcLoading = ref(false)

const provider = computed(() => {
  const p = storage.get('batata_provider') || 'batata'
  return p === 'null' || !p ? 'batata' : (p as string)
})

const isConsulAcl = computed(() => provider.value === 'consul' && authStore.consulAclEnabled)

onMounted(async () => {
  try {
    const res = await batataApi.getServerState()
    const state = res.data

    // Set consul ACL state
    if (state.consul_acl_enabled === 'true') {
      authStore.setConsulAclEnabled(true)
    } else {
      authStore.setConsulAclEnabled(false)
    }

    // Consul with ACL disabled: redirect directly
    if (provider.value === 'consul' && !authStore.consulAclEnabled) {
      router.replace('/consul/dashboard')
      return
    }

    // Batata: check if admin init is needed
    if (provider.value !== 'consul' && state.auth_admin_request === 'true') {
      router.replace('/admin-init')
    }
  } catch {
    // ignore - server might not be ready
  }

  // Fetch OIDC providers for Consul ACL mode
  if (isConsulAcl.value) {
    await fetchOidcProviders()
  }
})

async function fetchOidcProviders() {
  try {
    const res = await consulApi.listOIDCAuthMethods()
    oidcProviders.value = res.data || []
    if (oidcProviders.value.length > 0) {
      selectedOidcProvider.value = oidcProviders.value[0].Name
    }
  } catch {
    // OIDC not available - that's fine, token login still works
    oidcProviders.value = []
  }
}

const handleSubmit = async () => {
  isLoading.value = true
  loginError.value = ''
  try {
    if (isConsulAcl.value) {
      // Consul ACL token login
      const success = await batataStore.loginWithToken(consulToken.value)
      if (success) {
        router.push('/consul/dashboard')
      } else {
        loginError.value = batataStore.error || t('consulTokenLoginFailed')
      }
    } else {
      // Batata username/password login
      const success = await batataStore.login(username.value, password.value)
      if (success) {
        router.push('/')
      } else {
        loginError.value = batataStore.error || t('loginFailed')
      }
    }
  } catch {
    loginError.value = isConsulAcl.value ? t('consulTokenLoginFailed') : t('loginFailed')
  } finally {
    isLoading.value = false
  }
}

async function handleOidcLogin() {
  if (!selectedOidcProvider.value) return

  oidcLoading.value = true
  loginError.value = ''

  try {
    const redirectURI = window.location.origin + '/oidc/callback'
    // Save auth method to localStorage so callback page can retrieve it
    storage.set('consul_oidc_auth_method', selectedOidcProvider.value)

    const authURL = await authStore.loginWithOIDC(selectedOidcProvider.value, redirectURI)
    if (authURL) {
      // Redirect current page to the OIDC auth URL
      window.location.href = authURL
    } else {
      loginError.value = authStore.error || t('consulOidcLoginFailed')
    }
  } catch {
    loginError.value = t('consulOidcLoginFailed')
  } finally {
    oidcLoading.value = false
  }
}

const continueWithoutLogin = () => {
  // Allow anonymous access - set user with empty token
  authStore.setConsulAclEnabled(false)
  router.push('/consul/dashboard')
}

const enterConsul = () => {
  setProvider('consul')
  switchProviderRoutes('consul')
  if (authStore.consulAclEnabled) {
    // Stay on login page; UI re-renders into the Consul ACL form
    loginError.value = ''
    if (oidcProviders.value.length === 0) {
      fetchOidcProviders()
    }
  } else {
    router.replace('/consul/dashboard')
  }
}

const toggleLanguage = () => {
  setLanguage(language.value === 'zh' ? 'en' : 'zh')
}
</script>
