<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from '@/i18n'
import apolloApi from '@/api/apollo'
import { useConfirm } from '@/composables/useConfirm'
import type { ApolloServerConfigDTO } from '@/api/apollo'
import FormModal from '@/components/common/FormModal.vue'

const { t } = useI18n()
const { confirm } = useConfirm()
const activeTab = ref<'portal' | 'configdb'>('portal')
const env = ref('DEV')
const loading = ref(false)
const configs = ref<ApolloServerConfigDTO[]>([])
const error = ref('')
const showCreate = ref(false)
function openCreate() {
  showCreate.value = true
}
const form = ref({ key: '', value: '', comment: '', cluster: '' })

async function load() {
  loading.value = true
  error.value = ''
  try {
    configs.value =
      activeTab.value === 'portal'
        ? await apolloApi.listPortalConfigs()
        : await apolloApi.listConfigDBConfigs(env.value)
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } }; message?: string }
    error.value = err?.response?.data?.message || err?.message || t('error')
  } finally {
    loading.value = false
  }
}

function switchTab(tab: 'portal' | 'configdb') {
  activeTab.value = tab
  load()
}

const tabBtnClass = (tab: 'portal' | 'configdb') =>
  activeTab.value === tab ? 'btn-primary' : 'btn-ghost'

async function create() {
  error.value = ''
  try {
    if (activeTab.value === 'portal') await apolloApi.createPortalConfig(form.value)
    else await apolloApi.createConfigDBConfig(env.value, form.value)
    showCreate.value = false
    form.value = { key: '', value: '', comment: '', cluster: '' }
    await load()
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } }; message?: string }
    error.value = err?.response?.data?.message || err?.message || t('error')
  }
}

async function remove(c: ApolloServerConfigDTO) {
  if (
    !(await confirm({ title: t('confirmDelete'), message: t('confirmDeleteConfig'), danger: true }))
  )
    return
  error.value = ''
  try {
    if (activeTab.value === 'portal') await apolloApi.deletePortalConfig(c.key)
    else await apolloApi.deleteConfigDBConfig(env.value, c.key, c.cluster)
    await load()
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } }; message?: string }
    error.value = err?.response?.data?.message || err?.message || t('error')
  }
}
onMounted(load)
</script>

<template>
  <div class="p-4">
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-xl font-bold">{{ t('apolloServerConfig') }}</h1>
      <button class="btn btn-primary btn-sm" @click="openCreate()">{{ t('add') }}</button>
    </div>
    <div class="flex gap-2 mb-3">
      <button :class="['btn btn-sm', tabBtnClass('portal')]" @click="switchTab('portal')">
        PortalDB
      </button>
      <button :class="['btn btn-sm', tabBtnClass('configdb')]" @click="switchTab('configdb')">
        ConfigDB
      </button>
      <select v-if="activeTab === 'configdb'" v-model="env" class="input input-sm" @change="load">
        <option v-for="e in ['DEV', 'FAT', 'UAT', 'PRO']" :key="e" :value="e">{{ e }}</option>
      </select>
    </div>
    <div v-if="error" class="text-danger text-sm mb-2">{{ error }}</div>
    <div v-if="loading" class="card p-8 text-center text-text-secondary">{{ t('loading') }}</div>
    <div v-else class="card overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-bg-secondary text-text-secondary">
          <tr>
            <th class="text-left px-3 py-2">{{ t('key') }}</th>
            <th class="text-left px-3 py-2">{{ t('value') }}</th>
            <th class="text-left px-3 py-2">{{ t('comment') }}</th>
            <th class="text-right px-3 py-2">{{ t('actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in configs" :key="c.key + (c.cluster || '')" class="border-t border-border">
            <td class="px-3 py-2 font-mono">{{ c.key }}</td>
            <td class="px-3 py-2">{{ c.value }}</td>
            <td class="px-3 py-2">{{ c.comment }}</td>
            <td class="px-3 py-2 text-right">
              <button class="btn btn-ghost btn-xs text-danger" @click="remove(c)">
                {{ t('delete') }}
              </button>
            </td>
          </tr>
          <tr v-if="configs.length === 0">
            <td colspan="4" class="text-center py-6 text-text-tertiary">{{ t('noData') }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <FormModal
      v-model="showCreate"
      :title="t('apolloServerConfig')"
      :submit-text="t('create')"
      @submit="create"
    >
      <div class="space-y-3">
        <div>
          <label class="block text-xs mb-1">{{ t('key') }} *</label
          ><input v-model="form.key" class="input" />
        </div>
        <div>
          <label class="block text-xs mb-1">{{ t('value') }} *</label
          ><input v-model="form.value" class="input" />
        </div>
        <div>
          <label class="block text-xs mb-1">{{ t('comment') }}</label
          ><input v-model="form.comment" class="input" />
        </div>
        <div v-if="activeTab === 'configdb'">
          <label class="block text-xs mb-1">cluster</label
          ><input v-model="form.cluster" class="input" />
        </div>
      </div>
    </FormModal>
  </div>
</template>
