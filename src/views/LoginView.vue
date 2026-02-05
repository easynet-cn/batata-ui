<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Lock, User, ShieldCheck, ArrowRight } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import { useBatataStore } from '@/stores/batata'

const { t } = useI18n()
const router = useRouter()
const batataStore = useBatataStore()

const username = ref('')
const password = ref('')
const isLoading = ref(false)

const loginError = ref('')

const handleSubmit = async () => {
  isLoading.value = true
  loginError.value = ''
  try {
    const success = await batataStore.login(username.value, password.value)
    if (success) {
      const user = { name: username.value }
      localStorage.setItem('batata_user', JSON.stringify(user))
      router.push('/')
    } else {
      loginError.value = batataStore.error || t('loginFailed')
    }
  } catch {
    loginError.value = t('loginFailed')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  const savedUser = localStorage.getItem('batata_user')
  const savedToken = localStorage.getItem('batata-token')
  if (savedUser && savedToken) {
    const user = JSON.parse(savedUser)
    batataStore.currentUser = { username: user.name, token: savedToken }
    router.push('/')
  }
})
</script>

<template>
  <div
    class="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden"
  >
    <div class="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
      <div
        class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full"
      />
      <div
        class="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full"
      />
    </div>

    <div class="w-full max-w-md z-10">
      <div
        class="bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
      >
        <div class="p-8 pb-0 text-center">
          <div
            class="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-lg mb-6 transform -rotate-6 group"
          >
            <span class="text-white font-black text-3xl group-hover:rotate-6 transition-transform"
              >B</span
            >
          </div>
          <h1 class="text-base font-semibold text-white mb-1">{{ t('welcomeBack') }}</h1>
          <p class="text-slate-400 text-sm">{{ t('loginSubtitle') }}</p>
        </div>

        <form @submit.prevent="handleSubmit" class="p-8 space-y-3">
          <div class="space-y-3">
            <div class="relative group">
              <div
                class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors"
              >
                <User :size="18" />
              </div>
              <input
                type="text"
                v-model="username"
                :placeholder="t('username')"
                class="w-full bg-slate-800/50 border border-slate-700 text-white pl-10 pr-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm placeholder:text-slate-600"
                required
              />
            </div>

            <div class="relative group">
              <div
                class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors"
              >
                <Lock :size="18" />
              </div>
              <input
                type="password"
                v-model="password"
                :placeholder="t('password')"
                class="w-full bg-slate-800/50 border border-slate-700 text-white pl-10 pr-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm placeholder:text-slate-600"
                required
              />
            </div>
          </div>

          <div v-if="loginError" class="text-red-400 text-sm text-center">
            {{ loginError }}
          </div>

          <div class="flex items-center justify-between text-xs">
            <label class="flex items-center text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                class="mr-2 rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-offset-slate-900"
              />
              {{ t('rememberMe') }}
            </label>
            <a href="#" class="text-blue-400 hover:text-blue-300 transition-colors">{{
              t('forgotPassword')
            }}</a>
          </div>

          <button
            type="submit"
            :disabled="isLoading"
            class="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-600/20 flex items-center justify-center space-x-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <template v-if="isLoading">
              <div
                class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"
              />
            </template>
            <template v-else>
              <span>{{ t('signIn') }}</span>
              <ArrowRight :size="18" />
            </template>
          </button>

          <div class="text-center">
            <router-link
              to="/register"
              class="text-slate-400 hover:text-blue-400 text-sm transition-colors"
            >
              {{ t('noAccount') }}
            </router-link>
          </div>
        </form>

        <div class="p-6 bg-slate-800/30 border-t border-white/5 text-center">
          <p class="text-slate-500 text-xs flex items-center justify-center">
            <ShieldCheck :size="14" class="mr-1 text-emerald-500" />
            Secure connection established via Batata Node
          </p>
        </div>
      </div>

      <p class="text-center mt-8 text-slate-600 text-xs">
        &copy; {{ new Date().getFullYear() }} Alibaba Group. All rights reserved.
      </p>
    </div>
  </div>
</template>
