<template>
  <div class="space-y-3">
    <!-- Page Header -->
    <div class="flex items-center gap-3">
      <button @click="goBack" class="btn btn-ghost btn-sm">
        <ArrowLeft class="w-3.5 h-3.5" />
      </button>
      <div>
        <h1 class="text-base font-semibold text-text-primary">{{ t('createAgentSpec') }}</h1>
        <p class="text-xs text-text-secondary mt-0.5">{{ t('agentSpecsDesc') }}</p>
      </div>
    </div>

    <!-- Form -->
    <div class="card">
      <div class="p-6 space-y-3">
        <div class="space-y-3">
          <h3 class="text-sm font-medium text-text-primary border-b border-border pb-2">
            {{ t('basicInfo') }}
          </h3>

          <div>
            <label class="block text-xs font-medium text-text-primary mb-1">
              {{ t('agentSpecName') }} <span class="text-danger">*</span>
            </label>
            <input
              v-model="form.name"
              type="text"
              class="input"
              :placeholder="t('agentSpecNamePlaceholder')"
            />
          </div>

          <div>
            <label class="block text-xs font-medium text-text-primary mb-1">
              {{ t('description') }}
            </label>
            <textarea
              v-model="form.description"
              class="input min-h-[80px]"
              :placeholder="t('descriptionPlaceholder')"
            />
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-end gap-3 pt-3 border-t border-border">
          <button @click="goBack" class="btn btn-secondary">
            {{ t('cancel') }}
          </button>
          <button @click="handleSubmit" class="btn btn-primary" :disabled="saving">
            <Loader2 v-if="saving" class="w-3.5 h-3.5 animate-spin" />
            {{ t('create') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Loader2 } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import batataApi from '@/api/batata'
import { toast } from '@/utils/error'
import { logger } from '@/utils/logger'
import { useBatataStore } from '@/stores/batata'

const router = useRouter()
const { t } = useI18n()
const store = useBatataStore()
const namespace = computed(() => store.currentNamespace)

// State
const saving = ref(false)

const form = reactive({
  name: '',
  description: '',
})

// Methods
const goBack = () => {
  router.push('/ai/agent-specs')
}

const handleSubmit = async () => {
  if (!form.name.trim()) {
    toast.warning(t('requiredFieldsMissing'))
    return
  }

  saving.value = true
  try {
    await batataApi.createAgentSpecDraft({
      namespaceId: namespace.value,
      agentSpecName: form.name.trim(),
    })
    router.push(`/ai/agent-specs/detail?agentSpecName=${encodeURIComponent(form.name.trim())}`)
  } catch (error) {
    logger.error('Failed to create agent spec:', error)
    toast.apiError(error)
  } finally {
    saving.value = false
  }
}
</script>
