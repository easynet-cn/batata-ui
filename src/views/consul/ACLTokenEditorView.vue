<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold text-gray-900 dark:text-gray-100">
          {{ isEditMode ? t('editToken') : t('createToken') }}
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {{ isEditMode ? t('editTokenDesc') : t('createTokenDesc') }}
        </p>
      </div>
      <RouterLink
        to="/consul/acl/tokens"
        class="flex items-center gap-2 px-5 py-2 text-sm font-bold text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <ArrowLeft :size="16" />
        {{ t('backToTokenList') }}
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

        <!-- Local/Global Toggle -->
        <div v-if="!isEditMode">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" v-model="form.Local" class="rounded" />
            <span class="text-sm text-gray-700 dark:text-gray-300">{{ t('tokenLocalDesc') }}</span>
          </label>
        </div>

        <!-- Expiration TTL -->
        <div>
          <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
            {{ t('expirationTtl') }}
          </label>
          <input
            v-model="form.ExpirationTTL"
            type="text"
            class="w-full max-w-xs px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
            placeholder="e.g., 24h, 30m"
          />
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {{ t('expirationTtlHint') }}
          </p>
        </div>

        <!-- Policies -->
        <div>
          <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
            {{ t('policies') }}
          </label>
          <div
            class="space-y-1.5 max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-xl p-3"
          >
            <label
              v-for="policy in availablePolicies"
              :key="policy.ID"
              class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
            >
              <input
                type="checkbox"
                :value="policy.ID"
                v-model="selectedPolicyIds"
                class="rounded"
              />
              {{ policy.Name }}
            </label>
            <p v-if="availablePolicies.length === 0" class="text-xs text-gray-400">
              {{ t('noPolicies') }}
            </p>
          </div>
        </div>

        <!-- Roles -->
        <div>
          <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
            {{ t('roles') }}
          </label>
          <div
            class="space-y-1.5 max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-xl p-3"
          >
            <label
              v-for="role in availableRoles"
              :key="role.ID"
              class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
            >
              <input type="checkbox" :value="role.ID" v-model="selectedRoleIds" class="rounded" />
              {{ role.Name }}
            </label>
            <p v-if="availableRoles.length === 0" class="text-xs text-gray-400">
              {{ t('noRoles') }}
            </p>
          </div>
        </div>

        <!-- Service Identities -->
        <div>
          <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
            {{ t('serviceIdentities') }}
          </label>
          <div class="space-y-2 border border-gray-200 dark:border-gray-700 rounded-xl p-3">
            <div v-for="(si, idx) in serviceIdentities" :key="idx" class="flex items-center gap-2">
              <input
                v-model="si.ServiceName"
                type="text"
                class="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                :placeholder="t('serviceIdentityName')"
              />
              <input
                v-model="si.Datacenter"
                type="text"
                class="w-40 px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                :placeholder="t('datacenter')"
              />
              <button
                type="button"
                @click="serviceIdentities.splice(idx, 1)"
                class="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
              >
                <Trash2 :size="16" />
              </button>
            </div>
            <button
              type="button"
              @click="serviceIdentities.push({ ServiceName: '', Datacenter: '' })"
              class="flex items-center gap-1 text-sm font-medium text-fuchsia-600 hover:text-fuchsia-700 transition-colors"
            >
              <Plus :size="14" />
              {{ t('addServiceIdentity') }}
            </button>
          </div>
        </div>

        <!-- Node Identities -->
        <div>
          <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
            {{ t('nodeIdentities') }}
          </label>
          <div class="space-y-2 border border-gray-200 dark:border-gray-700 rounded-xl p-3">
            <div v-for="(ni, idx) in nodeIdentities" :key="idx" class="flex items-center gap-2">
              <input
                v-model="ni.NodeName"
                type="text"
                class="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                :placeholder="t('nodeIdentityName')"
              />
              <input
                v-model="ni.Datacenter"
                type="text"
                class="w-40 px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                :placeholder="t('nodeIdentityDc')"
              />
              <button
                type="button"
                @click="nodeIdentities.splice(idx, 1)"
                class="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
              >
                <Trash2 :size="16" />
              </button>
            </div>
            <button
              type="button"
              @click="nodeIdentities.push({ NodeName: '', Datacenter: '' })"
              class="flex items-center gap-1 text-sm font-medium text-fuchsia-600 hover:text-fuchsia-700 transition-colors"
            >
              <Plus :size="14" />
              {{ t('addNodeIdentity') }}
            </button>
          </div>
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
            to="/consul/acl/tokens"
            class="px-5 py-2 text-sm font-bold text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            {{ t('cancel') }}
          </RouterLink>
          <button
            type="submit"
            :disabled="saving"
            class="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-fuchsia-600 rounded-xl hover:bg-fuchsia-700 transition-colors disabled:opacity-50"
          >
            <Save :size="16" />
            {{ saving ? t('loading') : isEditMode ? t('updateToken') : t('createToken') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Save, RefreshCw, Plus, Trash2 } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import { useConsulStore } from '@/stores/consul'
import consulApi from '@/api/consul'
import { logger } from '@/utils/logger'
import type { ConsulACLToken } from '@/types/consul'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const store = useConsulStore()

const isEditMode = computed(() => !!route.params.id)
const tokenId = computed(() => route.params.id as string)

const loadingDetail = ref(false)
const saving = ref(false)
const errorMsg = ref('')

const form = ref({
  Description: '',
  Local: false,
  ExpirationTTL: '',
})

const selectedPolicyIds = ref<string[]>([])
const selectedRoleIds = ref<string[]>([])
const availablePolicies = ref<Array<{ ID: string; Name: string }>>([])
const availableRoles = ref<Array<{ ID: string; Name: string }>>([])
const serviceIdentities = ref<Array<{ ServiceName: string; Datacenter: string }>>([])
const nodeIdentities = ref<Array<{ NodeName: string; Datacenter: string }>>([])

async function loadAvailableOptions() {
  try {
    await Promise.all([store.fetchACLPolicies(), store.fetchACLRoles()])
    availablePolicies.value = store.aclPolicies.map((p) => ({ ID: p.ID, Name: p.Name }))
    availableRoles.value = store.aclRoles.map((r) => ({ ID: r.ID, Name: r.Name }))
  } catch (error) {
    logger.error('Failed to load policies/roles:', error)
  }
}

async function loadTokenData() {
  if (!isEditMode.value || !tokenId.value) return
  loadingDetail.value = true
  try {
    const response = await consulApi.getACLToken(tokenId.value)
    const token = response.data
    form.value.Description = token.Description || ''
    form.value.Local = token.Local
    selectedPolicyIds.value = (token.Policies || []).map((p) => p.ID)
    selectedRoleIds.value = (token.Roles || []).map((r) => r.ID)
    serviceIdentities.value = (token.ServiceIdentities || []).map((si) => ({
      ServiceName: si.ServiceName,
      Datacenter: si.Datacenters?.[0] || '',
    }))
    nodeIdentities.value = (token.NodeIdentities || []).map((ni) => ({
      NodeName: ni.NodeName,
      Datacenter: ni.Datacenter,
    }))
  } catch (err) {
    logger.error('Failed to load token:', err)
    errorMsg.value = t('loadError')
  } finally {
    loadingDetail.value = false
  }
}

async function handleSave() {
  saving.value = true
  errorMsg.value = ''
  try {
    const policies = selectedPolicyIds.value.map((id) => {
      const found = availablePolicies.value.find((p) => p.ID === id)
      return { ID: id, Name: found?.Name || '' }
    })
    const roles = selectedRoleIds.value.map((id) => {
      const found = availableRoles.value.find((r) => r.ID === id)
      return { ID: id, Name: found?.Name || '' }
    })

    const si = serviceIdentities.value
      .filter((s) => s.ServiceName.trim())
      .map((s) => ({
        ServiceName: s.ServiceName.trim(),
        Datacenters: s.Datacenter.trim() ? [s.Datacenter.trim()] : undefined,
      }))
    const ni = nodeIdentities.value
      .filter((n) => n.NodeName.trim())
      .map((n) => ({ NodeName: n.NodeName.trim(), Datacenter: n.Datacenter.trim() }))

    const tokenData: Partial<ConsulACLToken> & { ExpirationTTL?: string } = {
      Description: form.value.Description,
      Policies: policies,
      Roles: roles,
      ServiceIdentities: si.length > 0 ? si : undefined,
      NodeIdentities: ni.length > 0 ? ni : undefined,
    }

    if (form.value.ExpirationTTL.trim()) {
      tokenData.ExpirationTTL = form.value.ExpirationTTL.trim()
    }

    if (isEditMode.value && tokenId.value) {
      await consulApi.updateACLToken(tokenId.value, tokenData)
    } else {
      await consulApi.createACLToken({ ...tokenData, Local: form.value.Local })
    }
    router.push('/consul/acl/tokens')
  } catch (err) {
    logger.error('Failed to save token:', err)
    errorMsg.value = t('saveError')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await loadAvailableOptions()
  if (isEditMode.value) {
    await loadTokenData()
  }
})
</script>
