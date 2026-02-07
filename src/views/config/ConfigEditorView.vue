<template>
  <div class="space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <button @click="goBack" class="btn btn-ghost btn-sm">
          <ArrowLeft class="w-3.5 h-3.5" />
        </button>
        <div>
          <h1 class="text-base font-semibold text-text-primary">
            {{ isEdit ? t('editConfig') : t('newConfig') }}
          </h1>
        </div>
      </div>
    </div>

    <!-- Editor Form -->
    <div class="card">
      <div class="p-6 space-y-3">
        <!-- Basic Info -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-xs font-medium text-text-primary mb-1">
              Data ID <span class="text-danger">*</span>
            </label>
            <input
              v-model="form.dataId"
              type="text"
              class="input"
              :disabled="isEdit"
              placeholder="com.example.config"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-text-primary mb-1">
              Group <span class="text-danger">*</span>
            </label>
            <input
              v-model="form.group"
              type="text"
              class="input"
              :disabled="isEdit"
              placeholder="DEFAULT_GROUP"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-text-primary mb-1">
              {{ t('appName') }}
            </label>
            <input v-model="form.appName" type="text" class="input" :placeholder="t('appName')" />
          </div>
          <div>
            <label class="block text-xs font-medium text-text-primary mb-1">
              {{ t('configType') }} <span class="text-danger">*</span>
            </label>
            <select v-model="form.type" class="input">
              <option value="text">{{ t('configTypeText') }}</option>
              <option value="json">{{ t('configTypeJson') }}</option>
              <option value="yaml">{{ t('configTypeYaml') }}</option>
              <option value="properties">{{ t('configTypeProperties') }}</option>
              <option value="xml">{{ t('configTypeXml') }}</option>
              <option value="html">{{ t('configTypeHtml') }}</option>
              <option value="toml">{{ t('configTypeToml') }}</option>
            </select>
          </div>
        </div>

        <!-- Beta Release Toggle -->
        <div
          class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-800"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-8 h-8 rounded-lg flex items-center justify-center"
              :class="
                form.beta ? 'bg-purple-50 dark:bg-purple-950/30' : 'bg-gray-100 dark:bg-gray-800'
              "
            >
              <FlaskConical
                :size="16"
                :class="
                  form.beta
                    ? 'text-purple-600 dark:text-purple-400'
                    : 'text-gray-400 dark:text-gray-500'
                "
              />
            </div>
            <div>
              <p class="text-xs font-medium text-text-primary">{{ t('betaRelease') }}</p>
              <p class="text-xs text-text-tertiary">{{ t('betaReleaseHint') }}</p>
            </div>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" v-model="form.beta" class="sr-only peer" />
            <div
              class="w-9 h-5 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"
            ></div>
          </label>
        </div>

        <!-- Beta IPs (shown when beta is enabled) -->
        <div v-if="form.beta" class="space-y-2">
          <label class="block text-xs font-medium text-text-primary">
            {{ t('betaIps') }}
          </label>
          <textarea
            v-model="form.betaIps"
            class="input min-h-[80px] font-mono text-xs"
            :placeholder="t('betaIpsPlaceholder')"
          />
          <p class="text-xs text-text-tertiary">{{ t('betaIpsHint') }}</p>
        </div>

        <!-- Encryption Toggle -->
        <div
          class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-800"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-8 h-8 bg-amber-50 dark:bg-amber-950/30 rounded-lg flex items-center justify-center"
            >
              <Lock v-if="form.encrypted" :size="16" class="text-amber-600 dark:text-amber-400" />
              <Unlock v-else :size="16" class="text-gray-400 dark:text-gray-500" />
            </div>
            <div>
              <p class="text-xs font-medium text-text-primary">{{ t('configEncryption') }}</p>
              <p class="text-xs text-text-tertiary">{{ t('configEncryptionHint') }}</p>
            </div>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" v-model="form.encrypted" class="sr-only peer" />
            <div
              class="w-9 h-5 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"
            ></div>
          </label>
        </div>

        <!-- Tags -->
        <div>
          <label class="block text-xs font-medium text-text-primary mb-1">
            {{ t('tags') }}
          </label>
          <input
            v-model="form.tags"
            type="text"
            class="input"
            :placeholder="t('tagsPlaceholder')"
          />
          <p class="text-xs text-text-tertiary mt-1">{{ t('tagsHint') }}</p>
        </div>

        <!-- Description -->
        <div>
          <label class="block text-xs font-medium text-text-primary mb-1">
            {{ t('description') }}
          </label>
          <textarea
            v-model="form.desc"
            class="input min-h-[80px]"
            :placeholder="t('description')"
          />
        </div>

        <!-- Content Editor -->
        <div>
          <div class="flex items-center justify-between mb-1">
            <label class="block text-xs font-medium text-text-primary">
              {{ t('configContent') }} <span class="text-danger">*</span>
            </label>
            <div class="flex items-center gap-2">
              <button @click="formatContent" class="btn btn-ghost btn-sm">
                <Code class="w-3.5 h-3.5" />
                {{ t('format') }}
              </button>
            </div>
          </div>
          <textarea
            v-model="form.content"
            class="input font-mono text-sm min-h-[400px]"
            :placeholder="t('configContentPlaceholder')"
          />
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-end gap-2 p-6 border-t border-border">
        <button @click="goBack" class="btn btn-secondary">
          {{ t('cancel') }}
        </button>
        <button @click="handleSubmit" class="btn btn-primary" :disabled="saving">
          <Loader2 v-if="saving" class="w-3.5 h-3.5 animate-spin" />
          {{ isEdit ? t('save') : t('publish') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Code, Loader2, Lock, Unlock, FlaskConical } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import batataApi from '@/api/batata'
import { toast } from '@/utils/error'
import type { Namespace, ConfigType } from '@/types'

const props = defineProps<{
  namespace: Namespace
}>()

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

// State
const saving = ref(false)
const isEdit = computed(() => route.name === 'config-edit')

const form = reactive({
  dataId: '',
  group: 'DEFAULT_GROUP',
  appName: '',
  type: 'text' as ConfigType,
  tags: '',
  desc: '',
  content: '',
  encrypted: false,
  beta: false,
  betaIps: '',
})

// Methods
const goBack = () => {
  router.back()
}

const fetchConfig = async () => {
  const { dataId, groupName, namespaceId: queryNamespaceId } = route.query
  if (!dataId || !groupName) return

  const namespaceId = (queryNamespaceId as string) || props.namespace.namespace

  try {
    // First get the regular config
    const response = await batataApi.getConfig(dataId as string, groupName as string, namespaceId)
    const config = response.data.data
    Object.assign(form, {
      dataId: config.dataId,
      group: config.groupName,
      appName: config.appName || '',
      type: config.type || 'text',
      desc: config.desc || '',
      content: config.content || '',
      encrypted: !!config.encryptedDataKey,
    })

    // Check if there's a beta version
    try {
      const betaResponse = await batataApi.getBetaConfig(
        dataId as string,
        groupName as string,
        namespaceId,
      )
      const betaConfig = betaResponse.data.data
      if (betaConfig) {
        form.beta = true
        form.betaIps = betaConfig.grayRule || ''
        // Use beta content if available
        if (betaConfig.content) {
          form.content = betaConfig.content
        }
      }
    } catch {
      // No beta config exists, that's fine
    }
  } catch (error) {
    console.error('Failed to fetch config:', error)
  }
}

const formatContent = () => {
  if (form.type === 'json') {
    try {
      const parsed = JSON.parse(form.content)
      form.content = JSON.stringify(parsed, null, 2)
    } catch {
      // Invalid JSON, do nothing
    }
  }
}

const handleSubmit = async () => {
  if (!form.dataId || !form.group || !form.content) {
    toast.warning(t('requiredFieldsMissing'))
    return
  }

  saving.value = true
  try {
    if (form.beta) {
      // Publish as beta/gray config
      await batataApi.publishBetaConfig({
        dataId: form.dataId,
        groupName: form.group,
        content: form.content,
        namespaceId: props.namespace.namespace,
        betaIps: form.betaIps,
      })
    } else {
      // Publish as regular config
      await batataApi.publishConfig({
        dataId: form.dataId,
        groupName: form.group,
        content: form.content,
        type: form.type,
        namespaceId: props.namespace.namespace,
        appName: form.appName,
        desc: form.desc,
        configTags: form.tags,
      })
    }
    router.push({ name: 'configs' })
  } catch (error) {
    console.error('Failed to publish config:', error)
  } finally {
    saving.value = false
  }
}

// Lifecycle
onMounted(() => {
  if (isEdit.value) {
    fetchConfig()
  }
})
</script>
