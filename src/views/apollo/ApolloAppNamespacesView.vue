<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from '@/i18n'
import { Layers, Plus, Trash2, Link2 } from '@lucide/vue'
import apolloApi from '@/api/apollo'
import type { ApolloAppNamespaceDTO, ApolloMissingNamespaceDTO } from '@/types/apollo'

const { t } = useI18n()
const route = useRoute()
const appId = ref<string>(String(route.query.appId || ''))
const env = ref<string>('DEV')
const cluster = ref<string>('default')

const appNamespaces = ref<ApolloAppNamespaceDTO[]>([])
const envClusters = ref<{ env: string; clusters: string[] }[]>([])
const loading = ref(false)

const missingNamespaces = ref<ApolloMissingNamespaceDTO[]>([])
const loadingMissing = ref(false)
const selectedMissing = ref<string[]>([])

const showCreate = ref(false)
const form = ref({ name: '', format: 'properties', isPublic: false, comment: '' })

async function load() {
  if (!appId.value) return
  loading.value = true
  try {
    appNamespaces.value = await apolloApi.listAppNamespaces(appId.value)
    envClusters.value = await apolloApi.getEnvClusters(appId.value)
    if (envClusters.value.length > 0) {
      env.value = envClusters.value[0].env
      cluster.value = envClusters.value[0].clusters[0] || 'default'
    }
    await loadMissing()
  } finally {
    loading.value = false
  }
}

async function loadMissing() {
  if (!appId.value) return
  loadingMissing.value = true
  try {
    missingNamespaces.value = await apolloApi.findMissingNamespaces(
      env.value,
      appId.value,
      cluster.value,
    )
    selectedMissing.value = []
  } finally {
    loadingMissing.value = false
  }
}

async function associateMissing() {
  if (selectedMissing.value.length === 0) return
  await apolloApi.createMissingNamespaces(
    env.value,
    appId.value,
    cluster.value,
    selectedMissing.value.map((n) => ({ namespaceName: n })),
  )
  selectedMissing.value = []
  await loadMissing()
}

async function createNs() {
  if (!form.value.name) return
  await apolloApi.createAppNamespace(appId.value, {
    name: form.value.name,
    format: form.value.format,
    isPublic: form.value.isPublic,
    comment: form.value.comment,
  })
  showCreate.value = false
  form.value = { name: '', format: 'properties', isPublic: false, comment: '' }
  await load()
}

async function remove(ns: ApolloAppNamespaceDTO) {
  if (!confirm(`Delete app namespace ${ns.name}?`)) return
  await apolloApi.deleteAppNamespace(appId.value, ns.name)
  await load()
}

async function associate(ns: ApolloAppNamespaceDTO) {
  await apolloApi.createNamespace(env.value, appId.value, cluster.value, {
    name: ns.name,
    format: ns.format,
    isPublic: ns.isPublic,
    comment: ns.comment,
  })
}

const formatOptions = ['properties', 'xml', 'json', 'yml', 'yaml', 'txt']
onMounted(load)
</script>

<template>
  <div class="p-6">
    <div class="flex items-center gap-2 mb-6">
      <Layers class="w-5 h-5 text-emerald-600" />
      <h1 class="text-lg font-semibold text-text-primary">{{ t('apolloAppNamespaces') }}</h1>
      <span v-if="appId" class="text-xs text-text-secondary font-mono">{{ appId }}</span>
      <button v-if="appId" class="btn btn-primary btn-sm ml-auto" @click="showCreate = true">
        <Plus class="w-4 h-4" /> {{ t('apolloCreateAppNamespace') }}
      </button>
    </div>

    <div v-if="!appId" class="card p-8 text-center text-text-tertiary">
      Open from an App to manage its namespaces.
    </div>
    <div v-else>
      <div class="flex gap-2 mb-4" v-if="envClusters.length">
        <select v-model="env" class="input w-auto" @change="loadMissing">
          <option v-for="ec in envClusters" :key="ec.env" :value="ec.env">{{ ec.env }}</option>
        </select>
        <select v-model="cluster" class="input w-auto" @change="loadMissing">
          <option
            v-for="c in envClusters.find((e) => e.env === env)?.clusters || []"
            :key="c"
            :value="c"
          >
            {{ c }}
          </option>
        </select>
      </div>
      <div class="card overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-bg-secondary text-text-secondary">
            <tr>
              <th class="text-left px-4 py-2">{{ t('apolloNamespaceName') }}</th>
              <th class="text-left px-4 py-2">{{ t('apolloFormat') }}</th>
              <th class="text-left px-4 py-2">{{ t('apolloIsPublic') }}</th>
              <th class="text-left px-4 py-2">{{ t('apolloComment') }}</th>
              <th class="text-right px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="5" class="text-center py-8 text-text-secondary">{{ t('loading') }}</td>
            </tr>
            <tr v-else-if="appNamespaces.length === 0">
              <td colspan="5" class="text-center py-8 text-text-secondary">{{ t('noData') }}</td>
            </tr>
            <tr v-for="ns in appNamespaces" :key="ns.name" class="border-t border-border">
              <td class="px-4 py-2 text-text-primary">{{ ns.name }}</td>
              <td class="px-4 py-2 text-text-secondary">{{ ns.format }}</td>
              <td class="px-4 py-2 text-text-secondary">
                {{ ns.isPublic ? t('apolloIsPublic') : t('apolloPrivate') }}
              </td>
              <td class="px-4 py-2 text-text-secondary">{{ ns.comment }}</td>
              <td class="px-4 py-2 text-right whitespace-nowrap">
                <button
                  v-if="ns.isPublic"
                  class="btn btn-ghost btn-sm"
                  :title="t('apolloAssociate')"
                  @click="associate(ns)"
                >
                  <Link2 class="w-4 h-4" />
                </button>
                <button class="btn btn-ghost btn-sm text-danger" title="Delete" @click="remove(ns)">
                  <Trash2 class="w-4 h-4" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Associate missing namespaces (already exist in other envs/clusters) -->
      <div class="mt-6">
        <div class="flex items-center justify-between mb-2">
          <h2 class="text-sm font-semibold text-text-primary">{{ t('apolloAssociateMissing') }}</h2>
          <button
            class="btn btn-primary btn-sm"
            :disabled="selectedMissing.length === 0"
            @click="associateMissing"
          >
            <Link2 class="w-4 h-4" />{{ t('apolloAssociateSelected') }} ({{
              selectedMissing.length
            }})
          </button>
        </div>
        <div v-if="loadingMissing" class="card p-8 text-center text-text-secondary">
          {{ t('loading') }}
        </div>
        <div
          v-else-if="missingNamespaces.length === 0"
          class="card p-8 text-center text-text-tertiary"
        >
          {{ t('noData') }}
        </div>
        <div v-else class="card overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-bg-secondary text-text-secondary">
              <tr>
                <th class="w-8 px-2 py-2">
                  <input
                    type="checkbox"
                    :checked="
                      selectedMissing.length === missingNamespaces.length &&
                      missingNamespaces.length > 0
                    "
                    @change="
                      selectedMissing =
                        selectedMissing.length === missingNamespaces.length
                          ? []
                          : missingNamespaces.map((n) => n.namespaceName)
                    "
                  />
                </th>
                <th class="text-left px-4 py-2">{{ t('apolloMissingNamespaces') }}</th>
                <th class="text-left px-4 py-2">{{ t('apolloEnvs') }}</th>
                <th class="text-left px-4 py-2">{{ t('apolloClusterName') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="m in missingNamespaces"
                :key="(m.namespaceName || '') + '|' + (m.env || '') + '|' + (m.clusterName || '')"
                class="border-t border-border"
              >
                <td class="px-2 py-1 w-8">
                  <input type="checkbox" :value="m.namespaceName" v-model="selectedMissing" />
                </td>
                <td class="px-4 py-2 font-mono text-text-primary">{{ m.namespaceName }}</td>
                <td class="px-4 py-2 text-text-secondary">{{ m.env }}</td>
                <td class="px-4 py-2 text-text-secondary">{{ m.clusterName }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div
      v-if="showCreate"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="showCreate = false"
    >
      <div class="bg-bg rounded-xl shadow-lg w-full max-w-md p-6">
        <h3 class="text-base font-semibold mb-4">{{ t('apolloCreateAppNamespace') }}</h3>
        <div class="space-y-3">
          <div>
            <label class="block text-xs mb-1">{{ t('apolloNamespaceName') }} *</label
            ><input v-model="form.name" class="input" />
          </div>
          <div>
            <label class="block text-xs mb-1">{{ t('apolloFormat') }}</label
            ><select v-model="form.format" class="input">
              <option v-for="f in formatOptions" :key="f" :value="f">{{ f }}</option>
            </select>
          </div>
          <div class="flex items-center gap-2">
            <input type="checkbox" v-model="form.isPublic" :id="`pubns-${appId}`" /><label
              :for="`pubns-${appId}`"
              class="text-xs"
              >{{ t('apolloIsPublic') }}</label
            >
          </div>
          <div>
            <label class="block text-xs mb-1">{{ t('apolloComment') }}</label
            ><input v-model="form.comment" class="input" />
          </div>
        </div>
        <div class="flex justify-end gap-2 mt-6">
          <button class="btn btn-ghost btn-sm" @click="showCreate = false">
            {{ t('cancel') }}
          </button>
          <button class="btn btn-primary btn-sm" @click="createNs">{{ t('create') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>
