<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from '@/i18n'
import { UserPlus, Trash2 } from '@lucide/vue'
import apolloApi from '@/api/apollo'
import type { ApolloRoleUserDTO } from '@/api/apollo'

const props = defineProps<{
  appId: string
  env?: string
  cluster?: string
  namespace?: string
  roles: { roleType: string; label: string }[]
}>()

const { t } = useI18n()
const loading = ref(false)
const error = ref('')
const members = ref<Record<string, ApolloRoleUserDTO[]>>({})
const newUserId = ref<Record<string, string>>({})

async function load(roleType: string) {
  const list = await apolloApi.listRoleUsers(props.appId, roleType, {
    env: props.env,
    cluster: props.cluster,
    namespace: props.namespace,
  })
  members.value[roleType] = list || []
}

async function assign(roleType: string) {
  const userId = (newUserId.value[roleType] || '').trim()
  if (!userId) return
  error.value = ''
  try {
    await apolloApi.assignRole(props.appId, roleType, userId, {
      env: props.env,
      cluster: props.cluster,
      namespace: props.namespace,
    })
    newUserId.value[roleType] = ''
    await load(roleType)
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } }; message?: string }
    error.value = err?.response?.data?.message || err?.message || t('apolloPermissionAssignFailed')
  }
}

async function revoke(roleType: string, userId: string) {
  error.value = ''
  try {
    await apolloApi.revokeRole(props.appId, roleType, userId, {
      env: props.env,
      cluster: props.cluster,
      namespace: props.namespace,
    })
    await load(roleType)
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } }; message?: string }
    error.value = err?.response?.data?.message || err?.message || t('apolloPermissionRevokeFailed')
  }
}

onMounted(async () => {
  loading.value = true
  try {
    for (const r of props.roles) await load(r.roleType)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div v-if="loading" class="card p-8 text-center text-text-secondary">{{ t('loading') }}</div>
  <div v-else class="space-y-4">
    <div v-if="error" class="text-danger text-sm">{{ error }}</div>
    <div v-for="r in roles" :key="r.roleType" class="card p-4">
      <div class="font-medium text-text-primary mb-2">{{ r.label }}</div>
      <div class="space-y-1 mb-2 max-h-48 overflow-auto">
        <div
          v-for="m in members[r.roleType] || []"
          :key="m.userId"
          class="flex items-center justify-between text-sm bg-bg-secondary rounded px-2 py-1"
        >
          <span class="font-mono text-text-primary">{{ m.userId }}</span>
          <button
            class="btn btn-ghost btn-xs text-danger"
            :title="t('delete')"
            @click="revoke(r.roleType, m.userId)"
          >
            <Trash2 class="w-3.5 h-3.5" />
          </button>
        </div>
        <div v-if="(members[r.roleType] || []).length === 0" class="text-xs text-text-tertiary">
          {{ t('noData') }}
        </div>
      </div>
      <div class="flex gap-2">
        <input
          v-model="newUserId[r.roleType]"
          class="input input-sm flex-1"
          :placeholder="t('apolloAddUserPlaceholder')"
          @keyup.enter="assign(r.roleType)"
        />
        <button class="btn btn-primary btn-sm" @click="assign(r.roleType)">
          <UserPlus class="w-4 h-4" />{{ t('add') }}
        </button>
      </div>
    </div>
  </div>
</template>
