<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Lock, User, ShieldCheck, ArrowRight, UserPlus } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import nacosApi from '@/api/nacos'
import { toast } from '@/utils/error'

const { t } = useI18n()
const router = useRouter()

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
    await nacosApi.register({
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

const goToLogin = () => {
  router.push('/login')
}
</script>

<template>
  <div
    class="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden"
  >
    <div class="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
      <div
        class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-600/20 blur-[120px] rounded-full"
      />
      <div
        class="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full"
      />
    </div>

    <div class="w-full max-w-md z-10">
      <div
        class="bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
      >
        <div class="p-8 pb-0 text-center">
          <div
            class="inline-flex items-center justify-center w-16 h-16 bg-emerald-600 rounded-2xl shadow-lg mb-6 transform rotate-6 group"
          >
            <UserPlus class="w-8 h-8 text-white group-hover:-rotate-6 transition-transform" />
          </div>
          <h1 class="text-base font-semibold text-white mb-1">{{ t('createAccount') }}</h1>
          <p class="text-slate-400 text-sm">{{ t('registerSubtitle') }}</p>
        </div>

        <form @submit.prevent="handleSubmit" class="p-8 space-y-3">
          <div class="space-y-3">
            <div class="relative group">
              <div
                class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors"
              >
                <User :size="18" />
              </div>
              <input
                type="text"
                v-model="username"
                :placeholder="t('username')"
                class="w-full bg-slate-800/50 border border-slate-700 text-white pl-10 pr-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-sm placeholder:text-slate-600"
                required
              />
            </div>

            <div class="relative group">
              <div
                class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors"
              >
                <Lock :size="18" />
              </div>
              <input
                type="password"
                v-model="password"
                :placeholder="t('password')"
                class="w-full bg-slate-800/50 border border-slate-700 text-white pl-10 pr-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-sm placeholder:text-slate-600"
                required
              />
            </div>

            <div class="relative group">
              <div
                class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors"
              >
                <Lock :size="18" />
              </div>
              <input
                type="password"
                v-model="confirmPassword"
                :placeholder="t('confirmPassword')"
                class="w-full bg-slate-800/50 border border-slate-700 text-white pl-10 pr-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-sm placeholder:text-slate-600"
                required
              />
            </div>
          </div>

          <p class="text-xs text-slate-500">
            {{ t('passwordRequirement') }}
          </p>

          <button
            type="submit"
            :disabled="isLoading"
            class="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center space-x-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <template v-if="isLoading">
              <div
                class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"
              />
            </template>
            <template v-else>
              <span>{{ t('register') }}</span>
              <ArrowRight :size="18" />
            </template>
          </button>

          <div class="text-center">
            <button
              type="button"
              @click="goToLogin"
              class="text-slate-400 hover:text-emerald-400 text-sm transition-colors"
            >
              {{ t('alreadyHaveAccount') }}
            </button>
          </div>
        </form>

        <div class="p-6 bg-slate-800/30 border-t border-white/5 text-center">
          <p class="text-slate-500 text-xs flex items-center justify-center">
            <ShieldCheck :size="14" class="mr-1 text-emerald-500" />
            {{ t('secureRegistration') }}
          </p>
        </div>
      </div>

      <p class="text-center mt-8 text-slate-600 text-xs">
        &copy; {{ new Date().getFullYear() }} Alibaba Group. All rights reserved.
      </p>
    </div>
  </div>
</template>
