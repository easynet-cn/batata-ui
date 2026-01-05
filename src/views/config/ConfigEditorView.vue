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
              <option value="text">Text</option>
              <option value="json">JSON</option>
              <option value="yaml">YAML</option>
              <option value="properties">Properties</option>
              <option value="xml">XML</option>
              <option value="html">HTML</option>
              <option value="toml">TOML</option>
            </select>
          </div>
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
import { ArrowLeft, Code, Loader2 } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import nacosApi from '@/api/nacos'
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
})

// Methods
const goBack = () => {
  router.back()
}

const fetchConfig = async () => {
  const { dataId, group, tenant } = route.query
  if (!dataId || !group) return

  try {
    const response = await nacosApi.getConfig(
      dataId as string,
      group as string,
      (tenant as string) || props.namespace.namespace,
    )
    const config = response.data.data
    Object.assign(form, {
      dataId: config.dataId,
      group: config.group,
      appName: config.appName || '',
      type: config.type || 'text',
      desc: config.desc || '',
      content: config.content || '',
    })
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
    await nacosApi.publishConfig({
      dataId: form.dataId,
      group: form.group,
      content: form.content,
      type: form.type,
      tenant: props.namespace.namespace,
      appName: form.appName,
      desc: form.desc,
      tags: form.tags,
    })
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
