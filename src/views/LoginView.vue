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
                : isApollo
                  ? 'bg-orange-500 shadow-orange-500/30'
                  : 'bg-blue-600 shadow-blue-500/30',
            ]"
          >
            {{ isConsulAcl ? 'C' : isApollo ? 'A' : 'B' }}
          </div>
        </div>
        <h1 class="text-3xl font-extrabold text-gray-800 dark:text-gray-100 mb-2 tracking-tight">
          {{
            isApollo
              ? t('apolloLoginTitle')
              : isConsulAcl
                ? t('consulLoginTitle')
                : t('welcomeBack')
          }}
        </h1>
        <p class="text-gray-500 dark:text-gray-400 text-sm font-medium italic">
          {{
            isApollo
              ? t('apolloLoginSlogan')
              : isConsulAcl
                ? t('consulLoginSlogan')
                : t('loginSlogan')
          }}
        </p>
      </div>

      <div class="px-10 pb-10 space-y-6">
        <!-- Provider switcher. Must stay outside the provider-specific forms:
             after signing out of Consul/Apollo the persisted provider still
             points at that provider, so the login page must always offer a way
             back to Batata (and to the other enabled provider). -->
        <div v-if="consulEnabled || apolloEnabled" class="space-y-2">
          <p class="text-xs font-bold text-gray-400 uppercase ml-1">{{ t('providerSwitch') }}</p>
          <div class="flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1">
            <button
              type="button"
              @click="switchTo('batata')"
              :class="[
                'flex-1 py-2 text-xs font-bold rounded-lg transition-all',
                providerTabClass('batata'),
              ]"
            >
              BATATA
            </button>
            <button
              v-if="consulEnabled"
              type="button"
              @click="switchTo('consul')"
              :class="[
                'flex-1 py-2 text-xs font-bold rounded-lg transition-all',
                providerTabClass('consul'),
              ]"
            >
              CONSUL
            </button>
            <button
              v-if="apolloEnabled"
              type="button"
              @click="switchTo('apollo')"
              :class="[
                'flex-1 py-2 text-xs font-bold rounded-lg transition-all',
                providerTabClass('apollo'),
              ]"
            >
              APOLLO
            </button>
          </div>
        </div>

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

        <!-- Apollo token login (open-api X-Apollo-Token) -->
        <form v-else-if="isApollo" @submit.prevent="handleSubmit" class="space-y-6">
          <div class="space-y-1">
            <label class="text-xs font-bold text-gray-400 uppercase ml-1">{{
              t('apolloAclToken')
            }}</label>
            <input
              type="password"
              v-model="apolloToken"
              :placeholder="t('apolloTokenPlaceholder')"
              class="w-full pl-4 pr-4 py-3.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 dark:text-gray-100 outline-none transition-all text-sm"
              required
            />
          </div>

          <div v-if="loginError" class="text-red-500 dark:text-red-400 text-sm text-center">
            {{ loginError }}
          </div>

          <button
            type="submit"
            :disabled="isLoading"
            class="w-full text-white py-4 rounded-xl font-bold text-lg transition-all shadow-xl active:scale-95 transform disabled:opacity-70 disabled:cursor-not-allowed bg-orange-500 hover:bg-orange-600 shadow-orange-500/20"
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
import { Moon, Sun, Languages } from '@lucide/vue'
import { useI18n } from '@/i18n'
import { useBatataStore } from '@/stores/batata'
import { useAuthStore } from '@/stores/auth'
import { useTheme } from '@/composables/useTheme'
import batataApi from '@/api/batata'
import consulApi from '@/api/consul'
import { storage } from '@/composables/useStorage'
import { useProvider } from '@/composables/useProvider'
import { switchProviderRoutes } from '@/router'
import type { ProviderType } from '@/types'

const { t, language, setLanguage } = useI18n()
const router = useRouter()
const batataStore = useBatataStore()
const authStore = useAuthStore()
const { isDark, toggleTheme } = useTheme()
const {
  provider: storedProvider,
  setProvider,
  consulEnabled,
  apolloEnabled,
  setConsulEnabled,
  setApolloEnabled,
} = useProvider()

const username = ref('')
const password = ref('')
const consulToken = ref('')
const apolloToken = ref('')
const isLoading = ref(false)
const loginError = ref('')

// SSO / OIDC state
const consulLoginTab = ref<'token' | 'sso'>('token')
const oidcProviders = ref<Array<{ Name: string; DisplayName?: string; Kind: string }>>([])
const selectedOidcProvider = ref('')
const oidcLoading = ref(false)

// Reactive provider. Reading localStorage directly inside a computed has no
// reactive dependency, so the value was cached for the lifetime of the login
// page and never followed setProvider() - switching provider silently kept
// the old form until a full reload.
const provider = computed<ProviderType>(() =>
  storedProvider.value === 'consul' || storedProvider.value === 'apollo'
    ? storedProvider.value
    : 'batata',
)

const isConsulAcl = computed(() => provider.value === 'consul' && authStore.consulAclEnabled)
const isApollo = computed(() => provider.value === 'apollo')

const providerTabClass = (p: ProviderType): string => {
  if (provider.value !== p) {
    return 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
  }
  const activeColor =
    p === 'batata'
      ? 'text-blue-600 dark:text-blue-400'
      : p === 'consul'
        ? 'text-fuchsia-600 dark:text-fuchsia-400'
        : 'text-emerald-600 dark:text-emerald-400'
  return `bg-white dark:bg-gray-700 shadow-sm ${activeColor}`
}

onMounted(async () => {
  try {
    const res = await batataApi.getServerState()
    const state = res.data

    // Reading the server state also marks the Consul ACL flag as "known".
    // Until then authStore fails closed (ACL assumed enabled), so an
    // unauthenticated cold start cannot bypass the login page.
    authStore.setConsulAclEnabled(state.consul_acl_enabled === 'true')

    // Both flags gate the login-page provider switcher, matching the
    // server-state-driven entries in the post-login layout.
    setConsulEnabled(state.consul_enabled === 'true')
    setApolloEnabled(state.apollo_enabled === 'true')

    // If the remembered provider is no longer supported by the server, fall
    // back to Batata. setProvider() updates the reactive ref, so the form
    // changes immediately instead of only after a reload.
    if (
      (provider.value === 'consul' && !consulEnabled.value) ||
      (provider.value === 'apollo' && !apolloEnabled.value)
    ) {
      setProvider('batata')
      switchProviderRoutes('batata')
    }

    // Consul supported but ACL disabled: no credentials needed.
    if (provider.value === 'consul' && consulEnabled.value && !authStore.consulAclEnabled) {
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
    if (isApollo.value) {
      // Apollo open-api token login
      const success = await authStore.loginWithApolloToken(apolloToken.value)
      if (success) {
        router.push('/apollo/apps')
      } else {
        loginError.value = authStore.error || t('apolloTokenLoginFailed')
      }
    } else if (isConsulAcl.value) {
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
    loginError.value = isApollo.value
      ? t('apolloTokenLoginFailed')
      : isConsulAcl.value
        ? t('consulTokenLoginFailed')
        : t('loginFailed')
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

async function switchTo(p: ProviderType) {
  if (provider.value === p) return
  setProvider(p)
  switchProviderRoutes(p)
  loginError.value = ''
  username.value = ''
  password.value = ''
  consulToken.value = ''
  apolloToken.value = ''
  consulLoginTab.value = 'token'
  if (p === 'consul' && authStore.consulAclEnabled && oidcProviders.value.length === 0) {
    await fetchOidcProviders()
  }
  // Consul with ACL disabled needs no credentials - go straight to the
  // dashboard, consistent with the router guard and onMounted. Only do this
  // once the ACL state is known; before that we fail closed on the login page.
  if (p === 'consul' && authStore.consulAclLoaded && !authStore.consulAclEnabled) {
    await router.replace('/consul/dashboard')
  }
}

const toggleLanguage = () => {
  setLanguage(language.value === 'zh' ? 'en' : 'zh')
}
</script>
