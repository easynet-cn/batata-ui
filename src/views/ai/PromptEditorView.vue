<template>
  <div class="space-y-3">
    <!-- Page Header -->
    <div class="flex items-center gap-3">
      <button @click="goBack" class="btn btn-ghost btn-sm">
        <ArrowLeft class="w-3.5 h-3.5" />
      </button>
      <div>
        <h1 class="text-base font-semibold text-text-primary">
          {{ isEdit ? t('publishVersion') : t('createPrompt') }}
        </h1>
        <p class="text-xs text-text-secondary mt-0.5">
          {{ isEdit ? t('publishVersion') : t('createPrompt') }}
        </p>
      </div>
    </div>

    <!-- Form -->
    <div class="card">
      <div class="p-4 space-y-3">
        <!-- Basic Info -->
        <div class="space-y-3">
          <h3 class="text-sm font-medium text-text-primary border-b border-border pb-2">
            {{ t('basicInfo') }}
          </h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-text-primary mb-1">
                {{ t('promptKey') }} <span class="text-danger">*</span>
              </label>
              <input
                v-model="form.promptKey"
                type="text"
                class="input"
                :disabled="isEdit"
                :placeholder="t('promptKeyPlaceholder')"
              />
            </div>

            <div>
              <label class="block text-xs font-medium text-text-primary mb-1">
                {{ t('promptVersion') }} <span class="text-danger">*</span>
              </label>
              <input
                v-model="form.version"
                type="text"
                class="input"
                :placeholder="t('promptVersionPlaceholder')"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-text-primary mb-1">
              {{ t('description') }}
            </label>
            <textarea
              v-model="form.description"
              class="input min-h-[60px]"
              :placeholder="t('descriptionPlaceholder')"
            />
          </div>

          <div>
            <label class="block text-xs font-medium text-text-primary mb-1">
              {{ t('promptCommitMsg') }}
            </label>
            <input
              v-model="form.commitMsg"
              type="text"
              class="input"
              :placeholder="t('promptCommitMsgPlaceholder')"
            />
          </div>

          <div>
            <label class="block text-xs font-medium text-text-primary mb-1">
              {{ t('tags') }}
            </label>
            <input
              v-model="form.bizTags"
              type="text"
              class="input"
              placeholder="tag1, tag2, tag3"
            />
            <p class="text-[10px] text-text-tertiary mt-1">{{ t('tagsHint') }}</p>
          </div>
        </div>

        <!-- Template -->
        <div class="space-y-3">
          <h3 class="text-sm font-medium text-text-primary border-b border-border pb-2">
            {{ t('promptTemplate') }}
            <span class="text-danger">*</span>
          </h3>

          <CodeEditor
            v-model="form.template"
            language="text"
            min-height="300px"
            :placeholder="t('promptTemplatePlaceholder')"
          />
        </div>

        <!-- Extracted Variables (read-only) -->
        <div v-if="extractedVariables.length > 0" class="space-y-3">
          <h3 class="text-sm font-medium text-text-primary border-b border-border pb-2">
            {{ t('promptVariables') }}
          </h3>

          <div class="flex flex-wrap gap-1.5">
            <span v-for="varName in extractedVariables" :key="varName" class="badge badge-info">
              {{ wrapVar(varName) }}
            </span>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-end gap-2 pt-3 border-t border-border">
          <button @click="goBack" class="btn btn-secondary">
            {{ t('cancel') }}
          </button>
          <button
            @click="handlePublish"
            class="btn btn-primary"
            :disabled="publishing || !isFormValid"
          >
            <Loader2 v-if="publishing" class="w-3.5 h-3.5 animate-spin" />
            {{ t('publish') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeft, Loader2 } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import batataApi from '@/api/batata'
import { toast } from '@/utils/error'
import { logger } from '@/utils/logger'
import { useBatataStore } from '@/stores/batata'
import CodeEditor from '@/components/common/CodeEditor.vue'
import type { PromptPublishData } from '@/types'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const store = useBatataStore()
const namespace = computed(() => store.currentNamespace)

// State
const publishing = ref(false)

const form = reactive({
  promptKey: '',
  version: '',
  template: '',
  description: '',
  commitMsg: '',
  bizTags: '',
})

// Computed
const isEdit = computed(() => !!route.query.promptKey)

const wrapVar = (name: string) => `\u007B\u007B${name}\u007D\u007D`

const extractVariables = (template: string): string[] => {
  const matches = template.match(/\{\{(\w+)\}\}/g)
  if (!matches) return []
  return [...new Set(matches.map((m) => m.replace(/\{\{|\}\}/g, '')))]
}

const extractedVariables = computed(() => {
  return extractVariables(form.template)
})

const isFormValid = computed(() => {
  return form.promptKey.trim() && form.version.trim() && form.template.trim()
})

// Methods
const goBack = () => {
  if (isEdit.value) {
    router.push(`/prompt/detail?promptKey=${encodeURIComponent(form.promptKey)}`)
  } else {
    router.push('/prompts')
  }
}

const loadExistingPrompt = async () => {
  const promptKey = String(route.query.promptKey || '')
  if (!promptKey) return

  form.promptKey = promptKey
  try {
    const response = await batataApi.getPromptMetadata(promptKey, namespace.value)
    const meta = response.data.data
    form.description = meta.description || ''
    form.bizTags = meta.bizTags?.join(', ') || ''
  } catch (error) {
    logger.error('Failed to load prompt metadata:', error)
  }
}

const handlePublish = async () => {
  if (!isFormValid.value) return

  publishing.value = true
  try {
    const variables = extractedVariables.value.map((name) => ({
      name,
      defaultValue: '',
      description: '',
    }))

    const data: PromptPublishData = {
      promptKey: form.promptKey,
      version: form.version,
      template: form.template,
      commitMsg: form.commitMsg || undefined,
      description: form.description || undefined,
      bizTags: form.bizTags || undefined,
      variables: variables.length > 0 ? JSON.stringify(variables) : undefined,
      namespaceId: namespace.value,
    }

    await batataApi.publishPrompt(data)
    toast.success(t('publish'))
    router.push(`/prompt/detail?promptKey=${encodeURIComponent(form.promptKey)}`)
  } catch (error) {
    logger.error('Failed to publish prompt:', error)
    toast.apiError(error)
  } finally {
    publishing.value = false
  }
}

onMounted(() => {
  loadExistingPrompt()
})
</script>
