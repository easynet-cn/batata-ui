<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Moon, Sun, Languages, UserPlus } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import batataApi from '@/api/batata'
import { toast } from '@/utils/error'
import { useTheme } from '@/composables/useTheme'

const { t, language, setLanguage } = useI18n()
const router = useRouter()
const { isDark, toggleTheme } = useTheme()

const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const isLoading = ref(false)

const handleSubmit = async () => {
  if (!username.value || !password.value || !confirmPassword.value) {
    toast.warning(t('requiredFieldsMissing'))
    return
  }

  if (password.value !== confirmPassword.value) {
    toast.warning(t('passwordMismatch'))
    return
  }

  if (password.value.length < 6) {
    toast.warning(t('passwordTooShort'))
    return
  }

  isLoading.value = true
  try {
    await batataApi.register({
      username: username.value,
      password: password.value,
    })
    toast.success(t('registerSuccess'))
    router.push('/login')
  } catch (error) {
    console.error('Registration failed:', error)
    toast.error(t('registerFailed'))
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

    <!-- Register Card -->
    <div
      class="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 transition-all duration-500"
    >
      <div class="p-10 text-center">
        <div class="flex justify-center mb-6">
          <div
            class="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/30 transform rotate-6"
          >
            <UserPlus class="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 class="text-3xl font-extrabold text-gray-800 dark:text-gray-100 mb-2 tracking-tight">
          {{ t('createAccount') }}
        </h1>
        <p class="text-gray-500 dark:text-gray-400 text-sm font-medium italic">
          {{ t('registerSubtitle') }}
        </p>
      </div>

      <form @submit.prevent="handleSubmit" class="px-10 pb-10 space-y-5">
        <div class="space-y-1">
          <label class="text-xs font-bold text-gray-400 uppercase ml-1">{{ t('username') }}</label>
          <input
            type="text"
            v-model="username"
            :placeholder="t('loginUserPlaceholder')"
            class="w-full pl-4 pr-4 py-3.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-gray-100 outline-none transition-all text-sm"
            required
          />
        </div>

        <div class="space-y-1">
          <label class="text-xs font-bold text-gray-400 uppercase ml-1">{{ t('password') }}</label>
          <input
            type="password"
            v-model="password"
            :placeholder="t('loginPassPlaceholder')"
            class="w-full pl-4 pr-4 py-3.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-gray-100 outline-none transition-all text-sm"
            required
          />
        </div>

        <div class="space-y-1">
          <label class="text-xs font-bold text-gray-400 uppercase ml-1">{{
            t('confirmPassword')
          }}</label>
          <input
            type="password"
            v-model="confirmPassword"
            :placeholder="t('confirmPasswordPlaceholder')"
            class="w-full pl-4 pr-4 py-3.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 dark:text-gray-100 outline-none transition-all text-sm"
            required
          />
        </div>

        <p class="text-xs text-gray-400 dark:text-gray-500 ml-1">
          {{ t('passwordRequirement') }}
        </p>

        <button
          type="submit"
          :disabled="isLoading"
          class="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-500/20 active:scale-95 transform disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <template v-if="isLoading">
            <div
              class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"
            />
          </template>
          <template v-else>
            {{ t('register') }}
          </template>
        </button>

        <div class="text-center">
          <router-link
            to="/login"
            class="text-gray-400 hover:text-emerald-500 text-sm transition-colors"
          >
            {{ t('alreadyHaveAccount') }}
          </router-link>
        </div>
      </form>
    </div>
  </div>
</template>
