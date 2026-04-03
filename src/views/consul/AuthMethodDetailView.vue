<template>
  <div class="space-y-4">
    <!-- Back Button -->
    <div>
      <RouterLink
        :to="{ name: 'consul-auth-methods' }"
        class="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft class="w-4 h-4" />
        {{ t('backToAuthMethods') }}
      </RouterLink>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <Loader2 class="w-6 h-6 animate-spin text-primary" />
    </div>

    <template v-else-if="authMethod">
      <!-- Page Header -->
      <div>
        <h1 class="text-base font-semibold text-text-primary">{{ authMethod.Name }}</h1>
        <p class="text-xs text-text-secondary mt-0.5">{{ t('authMethodDetail') }}</p>
      </div>

      <!-- Info Card -->
      <div class="card p-5 space-y-4">
        <h2 class="text-sm font-bold text-text-primary">{{ t('basicInfo') }}</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p class="text-xs text-text-tertiary mb-0.5">{{ t('name') }}</p>
            <p class="text-sm font-medium text-text-primary">{{ authMethod.Name }}</p>
          </div>
          <div>
            <p class="text-xs text-text-tertiary mb-0.5">{{ t('authMethodType') }}</p>
            <span class="badge badge-info">{{ authMethod.Type }}</span>
          </div>
          <div>
            <p class="text-xs text-text-tertiary mb-0.5">{{ t('authMethodDisplayName') }}</p>
            <p class="text-sm text-text-primary">{{ authMethod.DisplayName || '-' }}</p>
          </div>
          <div>
            <p class="text-xs text-text-tertiary mb-0.5">{{ t('tokenLocality') }}</p>
            <p class="text-sm text-text-primary">{{ authMethod.TokenLocality || '-' }}</p>
          </div>
          <div>
            <p class="text-xs text-text-tertiary mb-0.5">{{ t('maxTokenTTL') }}</p>
            <p class="text-sm text-text-primary">{{ authMethod.MaxTokenTTL || '-' }}</p>
          </div>
          <div>
            <p class="text-xs text-text-tertiary mb-0.5">{{ t('description') }}</p>
            <p class="text-sm text-text-primary">{{ authMethod.Description || '-' }}</p>
          </div>
        </div>

        <!-- Config JSON -->
        <div v-if="authMethod.Config && Object.keys(authMethod.Config).length > 0">
          <p class="text-xs text-text-tertiary mb-1.5">{{ t('configuration') }}</p>
          <pre
            class="text-xs font-mono bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-border overflow-x-auto"
            >{{ JSON.stringify(authMethod.Config, null, 2) }}</pre
          >
        </div>
      </div>

      <!-- Binding Rules -->
      <div class="card">
        <div class="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 class="text-sm font-bold text-text-primary">
            {{ t('bindingRules') }}
            <span class="text-text-tertiary font-normal">({{ bindingRules.length }})</span>
          </h2>
          <button @click="openCreateRuleModal" class="btn btn-primary btn-sm">
            <Plus class="w-3.5 h-3.5" />
            {{ t('createBindingRule') }}
          </button>
        </div>
        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>{{ t('bindingRuleId') }}</th>
                <th>{{ t('description') }}</th>
                <th>{{ t('selector') }}</th>
                <th>{{ t('bindType') }}</th>
                <th>{{ t('bindName') }}</th>
                <th class="w-24">{{ t('actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="bindingRules.length === 0">
                <td colspan="6" class="text-center py-6 text-text-secondary">
                  {{ t('noBindingRules') }}
                </td>
              </tr>
              <tr v-for="rule in bindingRules" :key="rule.ID">
                <td>
                  <span class="font-mono text-xs" :title="rule.ID">
                    {{ rule.ID.length > 8 ? rule.ID.substring(0, 8) + '...' : rule.ID }}
                  </span>
                </td>
                <td>
                  <span class="text-text-secondary">{{ rule.Description || '-' }}</span>
                </td>
                <td>
                  <span class="text-text-secondary font-mono text-xs">{{
                    rule.Selector || '-'
                  }}</span>
                </td>
                <td>
                  <span class="badge badge-primary">{{ rule.BindType }}</span>
                </td>
                <td>
                  <span class="text-text-primary font-medium">{{ rule.BindName }}</span>
                </td>
                <td>
                  <div class="flex items-center gap-1">
                    <button
                      @click="handleEditRule(rule)"
                      class="btn btn-ghost btn-sm text-text-secondary"
                      :title="t('edit')"
                    >
                      <Pencil class="w-3.5 h-3.5" />
                    </button>
                    <button
                      @click="handleDeleteRule(rule)"
                      class="btn btn-ghost btn-sm text-danger"
                      :title="t('delete')"
                    >
                      <Trash2 class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- Create/Edit Binding Rule Modal -->
    <FormModal
      v-model="showRuleModal"
      :title="isEditingRule ? t('editBindingRule') : t('createBindingRule')"
      :submit-text="isEditingRule ? t('save') : t('create')"
      :loading="savingRule"
      @submit="submitRule"
    >
      <div class="space-y-3">
        <div>
          <label class="block text-xs font-medium text-text-primary mb-1">
            {{ t('description') }}
          </label>
          <input
            v-model="ruleForm.Description"
            type="text"
            class="input"
            :placeholder="t('descriptionPlaceholder')"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-text-primary mb-1">
            {{ t('selector') }}
          </label>
          <input
            v-model="ruleForm.Selector"
            type="text"
            class="input font-mono text-xs"
            placeholder="serviceaccount.namespace==default"
          />
          <p class="text-[10px] text-text-tertiary mt-1">{{ t('selectorHint') }}</p>
        </div>
        <div>
          <label class="block text-xs font-medium text-text-primary mb-1">
            {{ t('bindType') }} <span class="text-danger">*</span>
          </label>
          <select v-model="ruleForm.BindType" class="input">
            <option value="service">service</option>
            <option value="role">role</option>
            <option value="policy">policy</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-text-primary mb-1">
            {{ t('bindName') }} <span class="text-danger">*</span>
          </label>
          <input v-model="ruleForm.BindName" type="text" class="input" placeholder="my-service" />
          <p class="text-[10px] text-text-tertiary mt-1">{{ t('bindNameHint') }}</p>
        </div>
      </div>
    </FormModal>

    <!-- Delete Binding Rule Confirm Modal -->
    <ConfirmModal
      v-model="showDeleteRuleModal"
      :title="t('confirmDelete')"
      :message="t('confirmDeleteBindingRule')"
      :confirm-text="t('delete')"
      danger
      @confirm="confirmDeleteRule"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { ArrowLeft, Loader2, Plus, Pencil, Trash2 } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import consulApi from '@/api/consul'
import { toast } from '@/utils/error'
import { logger } from '@/utils/logger'
import FormModal from '@/components/common/FormModal.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import type { ConsulACLAuthMethod, ConsulACLBindingRule } from '@/types/consul'

const { t } = useI18n()
const route = useRoute()

const loading = ref(true)
const authMethod = ref<ConsulACLAuthMethod | null>(null)
const bindingRules = ref<ConsulACLBindingRule[]>([])

// Binding Rule CRUD state
const showRuleModal = ref(false)
const isEditingRule = ref(false)
const editingRuleId = ref('')
const savingRule = ref(false)
const showDeleteRuleModal = ref(false)
const ruleToDelete = ref<ConsulACLBindingRule | null>(null)

const ruleForm = reactive({
  Description: '',
  Selector: '',
  BindType: 'service' as string,
  BindName: '',
})

async function loadData() {
  const name = route.params.name as string
  loading.value = true
  try {
    const [methodRes, rulesRes] = await Promise.all([
      consulApi.getACLAuthMethod(name),
      consulApi.listBindingRules(name),
    ])
    authMethod.value = methodRes.data
    bindingRules.value = rulesRes.data || []
  } catch (error) {
    logger.error('Failed to fetch auth method detail:', error)
    toast.apiError(error)
  } finally {
    loading.value = false
  }
}

async function loadBindingRules() {
  if (!authMethod.value) return
  try {
    const res = await consulApi.listBindingRules(authMethod.value.Name)
    bindingRules.value = res.data || []
  } catch (error) {
    logger.error('Failed to reload binding rules:', error)
    toast.apiError(error)
  }
}

function openCreateRuleModal() {
  isEditingRule.value = false
  editingRuleId.value = ''
  ruleForm.Description = ''
  ruleForm.Selector = ''
  ruleForm.BindType = 'service'
  ruleForm.BindName = ''
  showRuleModal.value = true
}

function handleEditRule(rule: ConsulACLBindingRule) {
  isEditingRule.value = true
  editingRuleId.value = rule.ID
  ruleForm.Description = rule.Description || ''
  ruleForm.Selector = rule.Selector || ''
  ruleForm.BindType = rule.BindType
  ruleForm.BindName = rule.BindName
  showRuleModal.value = true
}

async function submitRule() {
  if (!ruleForm.BindName || !ruleForm.BindType) {
    toast.warning(t('requiredFieldsMissing'))
    return
  }

  savingRule.value = true
  try {
    if (isEditingRule.value && editingRuleId.value) {
      await consulApi.updateBindingRule(editingRuleId.value, {
        Description: ruleForm.Description,
        Selector: ruleForm.Selector,
        BindType: ruleForm.BindType,
        BindName: ruleForm.BindName,
      })
    } else {
      await consulApi.createBindingRule({
        AuthMethod: authMethod.value!.Name,
        Description: ruleForm.Description,
        Selector: ruleForm.Selector,
        BindType: ruleForm.BindType,
        BindName: ruleForm.BindName,
      })
    }
    showRuleModal.value = false
    toast.success(t('success'))
    await loadBindingRules()
  } catch (error) {
    logger.error('Failed to save binding rule:', error)
    toast.apiError(error)
  } finally {
    savingRule.value = false
  }
}

function handleDeleteRule(rule: ConsulACLBindingRule) {
  ruleToDelete.value = rule
  showDeleteRuleModal.value = true
}

async function confirmDeleteRule() {
  if (!ruleToDelete.value) return
  try {
    await consulApi.deleteBindingRule(ruleToDelete.value.ID)
    showDeleteRuleModal.value = false
    toast.success(t('success'))
    await loadBindingRules()
  } catch (error) {
    logger.error('Failed to delete binding rule:', error)
    toast.apiError(error)
  }
}

onMounted(() => {
  loadData()
})
</script>
