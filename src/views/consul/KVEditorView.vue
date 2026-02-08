<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold text-gray-900 dark:text-gray-100">
          {{ isEditMode ? t('consulEditKV') : t('consulCreateKV') }}
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {{ isEditMode ? t('consulEditKVDesc') : t('consulCreateKVDesc') }}
        </p>
      </div>
      <RouterLink
        to="/consul/kv"
        class="flex items-center gap-2 px-5 py-2 text-sm font-bold text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <ArrowLeft :size="16" />
        {{ t('consulBackToKVList') }}
      </RouterLink>
    </div>

    <!-- Editor Form -->
    <div
      class="p-6 bg-white rounded-2xl shadow-sm border border-gray-200 dark:bg-gray-900 dark:border-gray-800"
    >
      <!-- Loading state -->
      <div v-if="loadingDetail" class="text-center py-12 text-gray-400 dark:text-gray-500">
        <RefreshCw :size="24" class="mx-auto mb-2 animate-spin" />
        <p class="text-sm">{{ t('loading') }}</p>
      </div>

      <form v-else @submit.prevent="handleSave" class="space-y-6">
        <!-- Key Input -->
        <div>
          <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
            {{ t('consulKVKey') }}
          </label>
          <input
            v-model="form.key"
            type="text"
            :placeholder="t('consulKVKeyPlaceholder')"
            :disabled="isEditMode"
            class="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 disabled:opacity-60 disabled:cursor-not-allowed"
          />
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {{ t('consulKVKeyHint') }}
          </p>
        </div>

        <!-- Value Textarea -->
        <div>
          <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
            {{ t('consulKVValue') }}
          </label>
          <textarea
            v-model="form.value"
            rows="12"
            :placeholder="t('consulKVValuePlaceholder')"
            class="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 font-mono resize-y"
          ></textarea>
        </div>

        <!-- Flags Input -->
        <div>
          <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
            {{ t('consulKVFlags') }}
          </label>
          <input
            v-model.number="form.flags"
            type="number"
            min="0"
            :placeholder="t('consulKVFlagsPlaceholder')"
            class="w-full max-w-xs px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
          />
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {{ t('consulKVFlagsHint') }}
          </p>
        </div>

        <!-- Error Message -->
        <div
          v-if="errorMsg"
          class="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl"
        >
          <p class="text-sm text-red-700 dark:text-red-400">{{ errorMsg }}</p>
        </div>

        <!-- Action Buttons -->
        <div
          class="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800"
        >
          <RouterLink
            to="/consul/kv"
            class="px-5 py-2 text-sm font-bold text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            {{ t('cancel') }}
          </RouterLink>
          <button
            type="submit"
            :disabled="saving || !form.key.trim()"
            class="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-fuchsia-600 rounded-xl hover:bg-fuchsia-700 transition-colors disabled:opacity-50"
          >
            <Save :size="16" />
            {{ saving ? t('loading') : t('save') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Save, RefreshCw } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import consulApi from '@/api/consul'
import { logger } from '@/utils/logger'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const isEditMode = computed(() => route.query.mode === 'edit')
const editKey = computed(() => (route.query.key as string) || '')

const loadingDetail = ref(false)
const saving = ref(false)
const errorMsg = ref('')

const form = reactive({
  key: '',
  value: '',
  flags: 0,
})

// Decode base64 value safely
function decodeValue(value: string | null): string {
  if (!value) return ''
  try {
    return atob(value)
  } catch {
    return value
  }
}

// Load existing KV pair data for editing
async function loadKVData() {
  if (!isEditMode.value || !editKey.value) return
  loadingDetail.value = true
  try {
    const response = await consulApi.getKV(editKey.value)
    if (response.data && response.data.length > 0) {
      const kvPair = response.data[0]!
      form.key = kvPair.Key
      form.value = decodeValue(kvPair.Value)
      form.flags = kvPair.Flags
    }
  } catch (err) {
    logger.error('Failed to load KV pair:', err)
    errorMsg.value = t('consulKVLoadError')
  } finally {
    loadingDetail.value = false
  }
}

// Save handler
async function handleSave() {
  if (!form.key.trim()) {
    errorMsg.value = t('requiredFieldsMissing')
    return
  }

  saving.value = true
  errorMsg.value = ''
  try {
    // Encode value to base64
    const encodedValue = btoa(form.value)
    await consulApi.putKV(form.key, encodedValue, form.flags || undefined)
    router.push('/consul/kv')
  } catch (err) {
    logger.error('Failed to save KV pair:', err)
    errorMsg.value = t('consulKVSaveError')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  if (isEditMode.value && editKey.value) {
    form.key = editKey.value
    loadKVData()
  }
})
</script>
