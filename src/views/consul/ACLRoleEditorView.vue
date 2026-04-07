<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-bold text-gray-900 dark:text-gray-100">
          {{ isEditMode ? t('editRole') : t('createRole') }}
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {{ isEditMode ? t('editRoleDesc') : t('createRoleDesc') }}
        </p>
      </div>
      <RouterLink
        to="/consul/acl/roles"
        class="flex items-center gap-2 px-5 py-2 text-sm font-bold text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <ArrowLeft :size="16" />
        {{ t('backToRoleList') }}
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
            placeholder="my-role"
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

        <!-- Policies -->
        <div>
          <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
            {{ t('selectPolicies') }}
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
              <span>{{ policy.Name }}</span>
              <span v-if="policy.Description" class="text-gray-400 text-xs ml-1">
                ({{ policy.Description }})
              </span>
            </label>
            <p v-if="availablePolicies.length === 0" class="text-xs text-gray-400">
              {{ t('noPolicies') }}
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
            to="/consul/acl/roles"
            class="px-5 py-2 text-sm font-bold text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            {{ t('cancel') }}
          </RouterLink>
          <button
            type="submit"
            :disabled="saving || !form.Name.trim()"
            class="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-fuchsia-600 rounded-xl hover:bg-fuchsia-700 transition-colors disabled:opacity-50"
          >
            <Save :size="16" />
            {{ saving ? t('loading') : isEditMode ? t('updateRole') : t('createRole') }}
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

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const store = useConsulStore()

const isEditMode = computed(() => !!route.params.id)
const roleId = computed(() => route.params.id as string)

const loadingDetail = ref(false)
const saving = ref(false)
const errorMsg = ref('')

const form = ref({
  Name: '',
  Description: '',
})

const selectedPolicyIds = ref<string[]>([])
const availablePolicies = ref<Array<{ ID: string; Name: string; Description: string }>>([])
const serviceIdentities = ref<Array<{ ServiceName: string; Datacenter: string }>>([])
const nodeIdentities = ref<Array<{ NodeName: string; Datacenter: string }>>([])

async function loadAvailablePolicies() {
  try {
    await store.fetchACLPolicies()
    availablePolicies.value = store.aclPolicies.map((p) => ({
      ID: p.ID,
      Name: p.Name,
      Description: p.Description,
    }))
  } catch (error) {
    logger.error('Failed to load policies:', error)
  }
}

async function loadRoleData() {
  if (!isEditMode.value || !roleId.value) return
  loadingDetail.value = true
  try {
    const response = await consulApi.getACLRole(roleId.value)
    const role = response.data
    form.value.Name = role.Name
    form.value.Description = role.Description || ''
    selectedPolicyIds.value = (role.Policies || []).map((p) => p.ID)
    serviceIdentities.value = (role.ServiceIdentities || []).map((si) => ({
      ServiceName: si.ServiceName,
      Datacenter: si.Datacenters?.[0] || '',
    }))
    nodeIdentities.value = (role.NodeIdentities || []).map((ni) => ({
      NodeName: ni.NodeName,
      Datacenter: ni.Datacenter,
    }))
  } catch (err) {
    logger.error('Failed to load role:', err)
    errorMsg.value = t('loadError')
  } finally {
    loadingDetail.value = false
  }
}

async function handleSave() {
  if (!form.value.Name.trim()) {
    errorMsg.value = t('requiredFieldsMissing')
    return
  }

  saving.value = true
  errorMsg.value = ''
  try {
    const policies = selectedPolicyIds.value.map((id) => {
      const found = availablePolicies.value.find((p) => p.ID === id)
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

    const payload = {
      Name: form.value.Name,
      Description: form.value.Description,
      Policies: policies,
      ServiceIdentities: si.length > 0 ? si : undefined,
      NodeIdentities: ni.length > 0 ? ni : undefined,
    }

    if (isEditMode.value && roleId.value) {
      await consulApi.updateACLRole(roleId.value, payload)
    } else {
      await consulApi.createACLRole(payload)
    }
    router.push('/consul/acl/roles')
  } catch (err) {
    logger.error('Failed to save role:', err)
    errorMsg.value = t('saveError')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await loadAvailablePolicies()
  if (isEditMode.value) {
    await loadRoleData()
  }
})
</script>
