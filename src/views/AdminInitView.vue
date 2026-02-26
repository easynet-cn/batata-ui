<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Moon, Sun, Languages, ShieldAlert } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import { useTheme } from '@/composables/useTheme'
import batataApi from '@/api/batata'
import { storage } from '@/composables/useStorage'
import { config } from '@/config'

const { t, language, setLanguage } = useI18n()
const router = useRouter()
const { isDark, toggleTheme } = useTheme()

const password = ref('')
const isLoading = ref(false)
const errorMsg = ref('')

onMounted(async () => {
  try {
    const res = await batataApi.getServerState()
    if (res.data.auth_admin_request !== 'true') {
      router.replace('/login')
    }
  } catch {
    router.replace('/login')
  }
})

const handleSubmit = async () => {
  if (!password.value) return

  isLoading.value = true
  errorMsg.value = ''

  try {
    const res = await batataApi.initAdmin(password.value)
    const { accessToken, username } = res.data

    storage.set(config.storage.tokenKey, accessToken)
    storage.set(config.storage.usernameKey, username)
    storage.setJSON(config.storage.userKey, { name: username })

    router.replace('/')
  } catch (err: unknown) {
    if (
      err &&
      typeof err === 'object' &&
      'status' in err &&
      (err as { status: number }).status === 409
    ) {
      errorMsg.value = t('adminAlreadyExists')
    } else if (err && typeof err === 'object' && 'message' in err) {
      errorMsg.value = (err as { message: string }).message
    } else {
      errorMsg.value = t('loginFailed')
    }
  } finally {
    isLoading.value = false
  }
}

const toggleLanguage = () => {
  setLanguage(language.value === 'zh' ? 'en' : 'zh')
}
</script>

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

    <!-- Admin Init Card -->
    <div
      class="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 transition-all duration-500"
    >
      <div class="p-10 text-center">
        <div class="flex justify-center mb-6">
          <div
            class="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center font-bold text-white text-4xl italic shadow-xl shadow-blue-500/30 transform -rotate-6"
          >
            B
          </div>
        </div>
        <h1 class="text-3xl font-extrabold text-gray-800 dark:text-gray-100 mb-2 tracking-tight">
          {{ t('initPassword') }}
        </h1>
        <p class="text-gray-500 dark:text-gray-400 text-sm font-medium italic">
          {{ t('initPasswordSubtitle') }}
        </p>
      </div>

      <form @submit.prevent="handleSubmit" class="px-10 pb-10 space-y-6">
        <!-- Warning messages -->
        <div
          class="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 space-y-2"
        >
          <div class="flex items-start space-x-2">
            <ShieldAlert
              :size="16"
              class="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0"
            />
            <p class="text-xs text-amber-700 dark:text-amber-300">
              {{ t('initPasswordWarning1') }}
            </p>
          </div>
          <div class="flex items-start space-x-2">
            <ShieldAlert
              :size="16"
              class="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0"
            />
            <p class="text-xs text-amber-700 dark:text-amber-300">
              {{ t('initPasswordWarning2') }}
            </p>
          </div>
        </div>

        <div class="space-y-1">
          <label class="text-xs font-bold text-gray-400 uppercase ml-1">{{
            t('adminUsername')
          }}</label>
          <input
            type="text"
            value="nacos"
            readonly
            class="w-full pl-4 pr-4 py-3.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 dark:text-gray-400 outline-none text-sm cursor-not-allowed"
          />
        </div>

        <div class="space-y-1">
          <label class="text-xs font-bold text-gray-400 uppercase ml-1">{{ t('password') }}</label>
          <input
            type="password"
            v-model="password"
            :placeholder="t('setAdminPassword')"
            class="w-full pl-4 pr-4 py-3.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:text-gray-100 outline-none transition-all text-sm"
            required
          />
        </div>

        <div v-if="errorMsg" class="text-red-500 dark:text-red-400 text-sm text-center">
          {{ errorMsg }}
        </div>

        <button
          type="submit"
          :disabled="isLoading || !password"
          class="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95 transform disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <template v-if="isLoading">
            <div
              class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"
            />
          </template>
          <template v-else>
            {{ t('initPassword') }}
          </template>
        </button>
      </form>
    </div>
  </div>
</template>
