<template>
  <div class="space-y-3">
    <!-- Page Header -->
    <div class="flex items-center gap-3">
      <button @click="goBack" class="btn btn-ghost btn-sm">
        <ArrowLeft class="w-3.5 h-3.5" />
      </button>
      <div>
        <h1 class="text-base font-semibold text-text-primary">
          {{ isEdit ? t('editAgent') : t('createAgent') }}
        </h1>
        <p class="text-xs text-text-secondary mt-0.5">
          {{ isEdit ? t('editAgentDesc') : t('createAgentDesc') }}
        </p>
      </div>
    </div>

    <!-- Form -->
    <div class="card">
      <div class="p-6 space-y-3">
        <!-- Basic Info -->
        <div class="space-y-3">
          <h3 class="text-sm font-medium text-text-primary border-b border-border pb-2">
            {{ t('basicInfo') }}
          </h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-text-primary mb-1">
                {{ t('agentName') }} <span class="text-danger">*</span>
              </label>
              <input
                v-model="form.name"
                type="text"
                class="input"
                :placeholder="t('agentNamePlaceholder')"
              />
            </div>

            <div>
              <label class="block text-xs font-medium text-text-primary mb-1">
                {{ t('agentDisplayName') }}
              </label>
              <input v-model="form.displayName" type="text" class="input" />
            </div>

            <div>
              <label class="block text-xs font-medium text-text-primary mb-1">
                {{ t('agentVersion') }}
              </label>
              <input v-model="form.version" type="text" class="input" placeholder="1.0.0" />
            </div>

            <div>
              <label class="block text-xs font-medium text-text-primary mb-1">
                {{ t('agentUrl') }} <span class="text-danger">*</span>
              </label>
              <input v-model="form.url" type="text" class="input" placeholder="https://..." />
            </div>

            <div>
              <label class="block text-xs font-medium text-text-primary mb-1">
                {{ t('agentProtocolVersion') }}
              </label>
              <input v-model="form.protocolVersion" type="text" class="input" placeholder="1.0" />
            </div>

            <div>
              <label class="block text-xs font-medium text-text-primary mb-1">
                {{ t('agentPreferredTransport') }}
              </label>
              <select v-model="form.preferredTransport" class="input">
                <option value="">{{ t('defaultValue') }}</option>
                <option value="JSONRPC">JSONRPC</option>
                <option value="HTTP+JSON">HTTP+JSON</option>
                <option value="SSE">SSE</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-text-primary mb-1">
              {{ t('description') }}
            </label>
            <textarea
              v-model="form.description"
              class="input min-h-[80px]"
              :placeholder="t('agentDescriptionPlaceholder')"
            />
          </div>

          <div class="flex items-center gap-2">
            <input
              id="enabled"
              v-model="form.enabled"
              type="checkbox"
              class="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary"
            />
            <label for="enabled" class="text-sm text-text-primary">
              {{ t('enableAgent') }}
            </label>
          </div>
        </div>

        <!-- Capabilities -->
        <div class="space-y-3">
          <h3 class="text-sm font-medium text-text-primary border-b border-border pb-2">
            {{ t('agentCapabilities') }}
          </h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
            <label
              v-for="cap in capabilityKeys"
              :key="cap.key"
              class="flex items-center gap-2 text-sm text-text-primary"
            >
              <input
                v-model="form.capabilities[cap.key]"
                type="checkbox"
                class="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary"
              />
              {{ t(cap.label) }}
            </label>
          </div>
        </div>

        <!-- Modes -->
        <div class="space-y-3">
          <h3 class="text-sm font-medium text-text-primary border-b border-border pb-2">
            {{ t('agentModes') }}
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-text-primary mb-1">
                {{ t('agentInputModes') }}
              </label>
              <input
                v-model="form.inputModes"
                type="text"
                class="input"
                placeholder="text, application/json"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-text-primary mb-1">
                {{ t('agentOutputModes') }}
              </label>
              <input
                v-model="form.outputModes"
                type="text"
                class="input"
                placeholder="text, application/json"
              />
            </div>
          </div>
        </div>

        <!-- Skills -->
        <div class="space-y-3">
          <div class="flex items-center justify-between border-b border-border pb-2">
            <h3 class="text-sm font-medium text-text-primary">{{ t('agentSkills') }}</h3>
            <button @click="addSkill" class="btn btn-secondary btn-sm">
              <Plus class="w-3.5 h-3.5" />
              {{ t('agentAddSkill') }}
            </button>
          </div>

          <div v-if="form.skills.length === 0" class="text-xs text-text-tertiary">
            {{ t('agentNoSkills') }}
          </div>
          <div
            v-for="(skill, index) in form.skills"
            :key="index"
            class="grid grid-cols-1 md:grid-cols-12 gap-2 items-start"
          >
            <input
              v-model="skill.name"
              type="text"
              class="input md:col-span-4"
              :placeholder="t('agentSkillName')"
            />
            <input
              v-model="skill.description"
              type="text"
              class="input md:col-span-6"
              :placeholder="t('agentSkillDescription')"
            />
            <input
              v-model.number="skill.proficiency"
              type="number"
              min="0"
              max="100"
              class="input md:col-span-1"
              :title="t('agentSkillProficiency')"
            />
            <button
              @click="removeSkill(index)"
              class="btn btn-ghost btn-sm text-danger md:col-span-1"
              :title="t('agentRemoveSkill')"
            >
              <Trash2 class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <!-- Provider & Extras -->
        <div class="space-y-3">
          <h3 class="text-sm font-medium text-text-primary border-b border-border pb-2">
            {{ t('agentProvider') }}
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-text-primary mb-1">
                {{ t('agentProviderOrg') }}
              </label>
              <input v-model="form.providerOrganization" type="text" class="input" />
            </div>
            <div>
              <label class="block text-xs font-medium text-text-primary mb-1">
                {{ t('agentProviderUrl') }}
              </label>
              <input
                v-model="form.providerUrl"
                type="text"
                class="input"
                placeholder="https://..."
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-text-primary mb-1">
                {{ t('agentDocumentationUrl') }}
              </label>
              <input
                v-model="form.documentationUrl"
                type="text"
                class="input"
                placeholder="https://..."
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-text-primary mb-1">
                {{ t('agentIconUrl') }}
              </label>
              <input v-model="form.iconUrl" type="text" class="input" placeholder="https://..." />
            </div>
            <div class="md:col-span-2">
              <label class="block text-xs font-medium text-text-primary mb-1">
                {{ t('agentTags') }}
              </label>
              <input v-model="form.tags" type="text" class="input" placeholder="tag1, tag2" />
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-end gap-3 pt-3 border-t border-border">
          <button @click="goBack" class="btn btn-secondary">
            {{ t('cancel') }}
          </button>
          <button @click="handleSubmit" class="btn btn-primary" :disabled="saving">
            <Loader2 v-if="saving" class="w-3.5 h-3.5 animate-spin" />
            {{ isEdit ? t('save') : t('create') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeft, Loader2, Plus, Trash2 } from '@lucide/vue'
import { useI18n } from '@/i18n'
import batataApi from '@/api/batata'
import { toast } from '@/utils/error'
import { logger } from '@/utils/logger'
import type { Namespace, AgentPayload, AgentCapabilities } from '@/types'

const props = defineProps<{
  namespace: Namespace
}>()

const router = useRouter()
const route = useRoute()
const { t } = useI18n()

// State
const loading = ref(false)
const saving = ref(false)

const capabilityKeys: Array<{
  key: 'streaming' | 'multiTurn' | 'toolUse' | 'fileAttachments' | 'images' | 'audio' | 'video'
  label:
    | 'agentCapStreaming'
    | 'agentCapMultiTurn'
    | 'agentCapToolUse'
    | 'agentCapFileAttachments'
    | 'agentCapImages'
    | 'agentCapAudio'
    | 'agentCapVideo'
}> = [
  { key: 'streaming', label: 'agentCapStreaming' },
  { key: 'multiTurn', label: 'agentCapMultiTurn' },
  { key: 'toolUse', label: 'agentCapToolUse' },
  { key: 'fileAttachments', label: 'agentCapFileAttachments' },
  { key: 'images', label: 'agentCapImages' },
  { key: 'audio', label: 'agentCapAudio' },
  { key: 'video', label: 'agentCapVideo' },
]

const form = reactive({
  name: '',
  displayName: '',
  version: '',
  url: '',
  protocolVersion: '1.0',
  preferredTransport: '',
  description: '',
  enabled: true,
  capabilities: {
    streaming: false,
    multiTurn: false,
    toolUse: false,
    fileAttachments: false,
    images: false,
    audio: false,
    video: false,
  } as Required<
    Pick<
      AgentCapabilities,
      'streaming' | 'multiTurn' | 'toolUse' | 'fileAttachments' | 'images' | 'audio' | 'video'
    >
  >,
  inputModes: '',
  outputModes: '',
  skills: [] as Array<{ name: string; description: string; proficiency: number }>,
  providerOrganization: '',
  providerUrl: '',
  documentationUrl: '',
  iconUrl: '',
  tags: '',
})

// Computed
const isEdit = computed(() => !!route.query.name)

const splitList = (value: string) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

// Methods
const fetchAgent = async () => {
  const namespace = route.query.namespace as string
  const name = route.query.name as string
  if (!namespace || !name) return

  loading.value = true
  try {
    const response = await batataApi.getAgentDetail(namespace, name)
    const agent = response.data.data
    if (!agent) return

    Object.assign(form, {
      name: agent.name || '',
      displayName: agent.displayName || '',
      version: agent.version || '',
      url: agent.url || '',
      protocolVersion: agent.protocolVersion || '1.0',
      preferredTransport: agent.preferredTransport || '',
      description: agent.description || '',
      enabled: agent.enabled ?? true,
      inputModes: agent.defaultInputModes?.join(', ') || '',
      outputModes: agent.defaultOutputModes?.join(', ') || '',
      skills: (agent.skills || []).map((s) => ({
        name: s.name || '',
        description: s.description || '',
        proficiency: s.proficiency ?? 0,
      })),
      providerOrganization: agent.provider?.organization || '',
      providerUrl: agent.provider?.url || '',
      documentationUrl: agent.documentationUrl || '',
      iconUrl: agent.iconUrl || '',
      tags: agent.tags?.join(', ') || '',
    })

    if (agent.capabilities) {
      Object.assign(form.capabilities, {
        streaming: !!agent.capabilities.streaming,
        multiTurn: !!agent.capabilities.multiTurn,
        toolUse: !!agent.capabilities.toolUse,
        fileAttachments: !!agent.capabilities.fileAttachments,
        images: !!agent.capabilities.images,
        audio: !!agent.capabilities.audio,
        video: !!agent.capabilities.video,
      })
    }
  } catch (error) {
    logger.error('Failed to fetch agent:', error)
  } finally {
    loading.value = false
  }
}

const addSkill = () => {
  form.skills.push({ name: '', description: '', proficiency: 0 })
}

const removeSkill = (index: number) => {
  form.skills.splice(index, 1)
}

const goBack = () => {
  router.push('/agents')
}

const buildPayload = (): AgentPayload => ({
  card: {
    name: form.name,
    displayName: form.displayName || undefined,
    description: form.description || undefined,
    version: form.version || undefined,
    url: form.url || undefined,
    protocolVersion: form.protocolVersion || undefined,
    preferredTransport: form.preferredTransport || undefined,
    capabilities: { ...form.capabilities },
    skills: form.skills
      .filter((s) => s.name)
      .map((s) => ({
        name: s.name,
        description: s.description || undefined,
        proficiency: s.proficiency ?? undefined,
      })),
    defaultInputModes: splitList(form.inputModes),
    defaultOutputModes: splitList(form.outputModes),
    provider:
      form.providerOrganization || form.providerUrl
        ? {
            organization: form.providerOrganization || undefined,
            url: form.providerUrl || undefined,
          }
        : undefined,
    documentationUrl: form.documentationUrl || undefined,
    iconUrl: form.iconUrl || undefined,
    tags: splitList(form.tags),
  },
  namespace: props.namespace?.namespace || 'public',
})

const handleSubmit = async () => {
  if (!form.name || !form.url) {
    toast.warning(t('requiredFieldsMissing'))
    return
  }

  saving.value = true
  try {
    const payload = buildPayload()

    if (isEdit.value) {
      const namespace = (route.query.namespace as string) || props.namespace?.namespace || 'public'
      const name = route.query.name as string
      await batataApi.updateAgent(namespace, name, payload)
    } else {
      await batataApi.createAgent(payload)
    }

    router.push('/agents')
  } catch (error) {
    logger.error('Failed to save agent:', error)
    toast.apiError(error)
  } finally {
    saving.value = false
  }
}

// Lifecycle
onMounted(() => {
  fetchAgent()
})
</script>
