<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from '@/i18n'
import { Network, Plus, Trash2 } from '@lucide/vue'
import apolloApi from '@/api/apollo'
import { useConfirm } from '@/composables/useConfirm'
import type { ApolloEnvCluster } from '@/types/apollo'
import ApolloRoleAssign from '@/views/apollo/ApolloRoleAssign.vue'
import FormModal from '@/components/common/FormModal.vue'

const { t } = useI18n()
const { confirm } = useConfirm()
const route = useRoute()
const appId = ref<string>((route.query.appId as string) || '')

const envClusters = ref<ApolloEnvCluster[]>([])
const loading = ref(false)
const showCreate = ref(false)
function openCreate() {
  showCreate.value = true
}
const saving = ref(false)
const form = ref({ env: 'DEV', name: '', comment: '' })
const showClusterRole = ref<{ env: string; cluster: string } | null>(null)

async function load() {
  if (!appId.value) return
  loading.value = true
  try {
    envClusters.value = await apolloApi.getEnvClusters(appId.value)
    if (envClusters.value.length > 0) form.value.env = envClusters.value[0].env
  } finally {
    loading.value = false
  }
}

async function createCluster() {
  if (!form.value.name) return
  saving.value = true
  try {
    await apolloApi.createCluster(form.value.env, appId.value, {
      name: form.value.name,
      comment: form.value.comment,
    })
    showCreate.value = false
    form.value = { env: form.value.env, name: '', comment: '' }
    await load()
  } finally {
    saving.value = false
  }
}

async function deleteClusterEnv(envName: string, clusterName: string) {
  if (
    !(await confirm({
      title: t('confirmDelete'),
      message: `Delete cluster ${clusterName}?`,
      danger: true,
    }))
  )
    return
  await apolloApi.deleteCluster(envName, appId.value, clusterName)
  await load()
}

onMounted(load)
</script>

<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-2">
        <Network class="w-5 h-5 text-emerald-600" />
        <h1 class="text-lg font-semibold text-text-primary">{{ t('apolloClusters') }}</h1>
        <span v-if="appId" class="text-xs text-text-secondary font-mono">{{ appId }}</span>
      </div>
      <button v-if="appId" class="btn btn-primary btn-sm" @click="openCreate()">
        <Plus class="w-4 h-4" /> {{ t('apolloCreateCluster') }}
      </button>
    </div>

    <div v-if="!appId" class="card p-8 text-center text-text-tertiary">
      Open from an App to manage its clusters.
    </div>
    <div v-else class="space-y-4">
      <div v-for="ec in envClusters" :key="ec.env" class="card p-4">
        <p class="text-sm font-semibold text-text-primary mb-2">{{ ec.env }}</p>
        <div class="flex flex-wrap gap-2 items-center">
          <div v-for="c in ec.clusters" :key="c" class="group relative inline-flex items-center">
            <button
              class="badge badge-info cursor-pointer pr-6"
              :title="t('apolloClusterPermission')"
              @click="showClusterRole = { env: ec.env, cluster: c }"
            >
              {{ c }}
            </button>
            <button
              class="btn btn-ghost btn-xs text-danger absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100"
              :title="t('delete')"
              @click.stop="deleteClusterEnv(ec.env, c)"
            >
              <Trash2 class="w-3 h-3" />
            </button>
          </div>
          <span v-if="ec.clusters.length === 0" class="text-xs text-text-tertiary">—</span>
        </div>
      </div>
    </div>

    <FormModal
      v-model="showCreate"
      :title="t('apolloCreateCluster')"
      :submit-text="t('create')"
      :loading="saving"
      @submit="createCluster"
    >
      <div class="space-y-3">
        <div>
          <label class="block text-xs mb-1">{{ t('apolloEnvs') }}</label>
          <select v-model="form.env" class="input">
            <option v-for="ec in envClusters" :key="ec.env" :value="ec.env">{{ ec.env }}</option>
          </select>
        </div>
        <div>
          <label class="block text-xs mb-1">{{ t('apolloClusterName') }} *</label>
          <input v-model="form.name" class="input" />
        </div>
        <div>
          <label class="block text-xs mb-1">{{ t('apolloComment') }}</label>
          <input v-model="form.comment" class="input" />
        </div>
      </div>
    </FormModal>

    <!-- Cluster namespace permission modal -->
    <FormModal
      :model-value="!!showClusterRole"
      @update:model-value="
        (v) => {
          if (!v) showClusterRole = null
        }
      "
      :title="`${t('apolloClusterPermission')} · ${showClusterRole?.cluster}`"
      size="2xl"
      hide-footer
    >
      <ApolloRoleAssign
        :app-id="appId"
        :env="showClusterRole?.env"
        :cluster="showClusterRole?.cluster"
        :roles="[
          { roleType: 'ModifyNamespacesInCluster', label: t('apolloModifyClusterPermission') },
          { roleType: 'ReleaseNamespacesInCluster', label: t('apolloReleaseClusterPermission') },
        ]"
      />
    </FormModal>
  </div>
</template>
