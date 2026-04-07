<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold text-gray-900 dark:text-gray-100">
          {{ isEditMode ? t('editPolicy') : t('createPolicy') }}
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {{ isEditMode ? t('editPolicyDesc') : t('createPolicyDesc') }}
        </p>
      </div>
      <RouterLink
        to="/consul/acl/policies"
        class="flex items-center gap-2 px-5 py-2 text-sm font-bold text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <ArrowLeft :size="16" />
        {{ t('backToPolicyList') }}
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
        <!-- Name -->
        <div>
          <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
            {{ t('name') }} <span class="text-red-500">*</span>
          </label>
          <input
            v-model="form.Name"
            type="text"
            :disabled="isEditMode"
            class="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 disabled:opacity-60 disabled:cursor-not-allowed"
            placeholder="my-policy"
          />
        </div>

        <!-- Description -->
        <div>
          <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
            {{ t('description') }}
          </label>
          <input
            v-model="form.Description"
            type="text"
            class="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
            :placeholder="t('descriptionPlaceholder')"
          />
        </div>

        <!-- Datacenters -->
        <div>
          <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
            {{ t('datacenters') }}
          </label>
          <div class="space-y-2">
            <label
              class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
            >
              <input type="radio" v-model="dcScope" value="all" />
              {{ t('allDatacenters') }}
            </label>
            <label
              class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
            >
              <input type="radio" v-model="dcScope" value="scoped" />
              {{ t('scopedDatacenters') }}
            </label>
            <div v-if="dcScope === 'scoped'" class="ml-6">
              <input
                v-model="manualDatacenters"
                type="text"
                class="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                placeholder="dc1, dc2"
              />
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {{ t('datacentersSeparatedByComma') }}
              </p>
            </div>
          </div>
        </div>

        <!-- Rules -->
        <div>
          <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
            {{ t('rules') }} <span class="text-red-500">*</span>
          </label>
          <CodeEditor
            v-model="form.Rules"
            language="hcl"
            min-height="300px"
            :placeholder="t('rulesPlaceholder')"
          />
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
            to="/consul/acl/policies"
            class="px-5 py-2 text-sm font-bold text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            {{ t('cancel') }}
          </RouterLink>
          <button
            type="submit"
            :disabled="saving || !form.Name.trim() || !form.Rules.trim()"
            class="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-fuchsia-600 rounded-xl hover:bg-fuchsia-700 transition-colors disabled:opacity-50"
          >
            <Save :size="16" />
            {{ saving ? t('loading') : isEditMode ? t('updatePolicy') : t('createPolicy') }}
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
import CodeEditor from '@/components/common/CodeEditor.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const isEditMode = computed(() => !!route.params.id)
const policyId = computed(() => route.params.id as string)

const loadingDetail = ref(false)
const saving = ref(false)
const errorMsg = ref('')
const dcScope = ref<'all' | 'scoped'>('all')
const manualDatacenters = ref('')

const form = reactive({
  Name: '',
  Description: '',
  Rules: '',
})

async function loadPolicyData() {
  if (!isEditMode.value || !policyId.value) return
  loadingDetail.value = true
  try {
    const response = await consulApi.getACLPolicy(policyId.value)
    const policy = response.data
    form.Name = policy.Name
    form.Description = policy.Description || ''
    form.Rules = policy.Rules || ''
    if (policy.Datacenters && policy.Datacenters.length > 0) {
      dcScope.value = 'scoped'
      manualDatacenters.value = policy.Datacenters.join(', ')
    } else {
      dcScope.value = 'all'
      manualDatacenters.value = ''
    }
  } catch (err) {
    logger.error('Failed to load policy:', err)
    errorMsg.value = t('loadError')
  } finally {
    loadingDetail.value = false
  }
}

async function handleSave() {
  if (!form.Name.trim() || !form.Rules.trim()) {
    errorMsg.value = t('requiredFieldsMissing')
    return
  }

  saving.value = true
  errorMsg.value = ''
  try {
    let datacenters: string[] | undefined
    if (dcScope.value === 'scoped' && manualDatacenters.value.trim()) {
      datacenters = manualDatacenters.value
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    }

    const payload = {
      Name: form.Name,
      Description: form.Description,
      Rules: form.Rules,
      Datacenters: datacenters,
    }

    if (isEditMode.value && policyId.value) {
      await consulApi.updateACLPolicy(policyId.value, payload)
    } else {
      await consulApi.createACLPolicy(payload)
    }
    router.push('/consul/acl/policies')
  } catch (err) {
    logger.error('Failed to save policy:', err)
    errorMsg.value = t('saveError')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  if (isEditMode.value) {
    loadPolicyData()
  }
})
</script>
