<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from '@/i18n'
import { Boxes, Plus, Search, Trash2 } from '@lucide/vue'
import apolloApi from '@/api/apollo'
import type { ApolloAppDTO } from '@/types/apollo'

const { t } = useI18n()
const router = useRouter()

const apps = ref<ApolloAppDTO[]>([])
const loading = ref(false)
const searchText = ref('')
const showCreate = ref(false)
const saving = ref(false)
const form = ref({
  appId: '',
  name: '',
  ownerName: '',
  ownerEmail: '',
  orgId: '',
  orgName: '',
})

const filteredApps = ref<ApolloAppDTO[]>([])

async function loadApps() {
  loading.value = true
  try {
    apps.value = await apolloApi.listApps()
    applyFilter()
  } finally {
    loading.value = false
  }
}

function applyFilter() {
  const q = searchText.value.trim().toLowerCase()
  filteredApps.value = q
    ? apps.value.filter(
        (a) =>
          a.appId.toLowerCase().includes(q) ||
          a.name.toLowerCase().includes(q) ||
          (a.ownerName || '').toLowerCase().includes(q),
      )
    : apps.value
}

async function openDetail(appId: string) {
  router.push({ path: '/apollo/app', query: { appId } })
}

async function createApp() {
  if (!form.value.appId || !form.value.name) return
  saving.value = true
  try {
    await apolloApi.createApp({
      appId: form.value.appId,
      name: form.value.name,
      ownerName: form.value.ownerName || form.value.appId,
      ownerEmail: form.value.ownerEmail || '',
      orgId: form.value.orgId || 'default',
      orgName: form.value.orgName || 'default',
    })
    showCreate.value = false
    form.value = { appId: '', name: '', ownerName: '', ownerEmail: '', orgId: '', orgName: '' }
    await loadApps()
  } finally {
    saving.value = false
  }
}

async function deleteApp(app: ApolloAppDTO) {
  if (!confirm(`Delete app ${app.appId}?`)) return
  await apolloApi.deleteApp(app.appId)
  await loadApps()
}

onMounted(loadApps)
</script>

<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-2">
        <Boxes class="w-5 h-5 text-emerald-600" />
        <h1 class="text-lg font-semibold text-text-primary">{{ t('apolloApps') }}</h1>
      </div>
      <button class="btn btn-primary btn-sm" @click="showCreate = true">
        <Plus class="w-4 h-4" /> {{ t('apolloCreateApp') }}
      </button>
    </div>

    <div class="flex items-center gap-2 mb-4">
      <div class="relative flex-1 max-w-sm">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
        <input
          v-model="searchText"
          class="input pl-9"
          :placeholder="t('apolloAppName')"
          @input="applyFilter"
        />
      </div>
    </div>

    <div class="card overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-bg-secondary text-text-secondary">
          <tr>
            <th class="text-left px-4 py-2">{{ t('apolloAppId') }}</th>
            <th class="text-left px-4 py-2">{{ t('apolloAppName') }}</th>
            <th class="text-left px-4 py-2">{{ t('apolloOwnerName') }}</th>
            <th class="text-left px-4 py-2">{{ t('apolloOrgName') }}</th>
            <th class="text-right px-4 py-2"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="5" class="text-center py-8 text-text-secondary">{{ t('loading') }}</td>
          </tr>
          <tr v-else-if="filteredApps.length === 0">
            <td colspan="5" class="text-center py-8 text-text-secondary">{{ t('noData') }}</td>
          </tr>
          <tr
            v-for="app in filteredApps"
            :key="app.appId"
            class="border-t border-border hover:bg-bg-secondary cursor-pointer"
            @click="openDetail(app.appId)"
          >
            <td class="px-4 py-2 font-mono text-text-primary">{{ app.appId }}</td>
            <td class="px-4 py-2 text-text-primary">{{ app.name }}</td>
            <td class="px-4 py-2 text-text-secondary">{{ app.ownerName }}</td>
            <td class="px-4 py-2 text-text-secondary">{{ app.orgName }}</td>
            <td class="px-4 py-2 text-right">
              <button
                class="btn btn-ghost btn-sm text-danger"
                title="Delete"
                @click.stop="deleteApp(app)"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create App Modal -->
    <div
      v-if="showCreate"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      @click.self="showCreate = false"
    >
      <div class="bg-bg rounded-xl shadow-lg w-full max-w-md p-6">
        <h3 class="text-base font-semibold mb-4">{{ t('apolloCreateApp') }}</h3>
        <div class="space-y-3">
          <div>
            <label class="block text-xs mb-1">{{ t('apolloAppId') }} *</label>
            <input v-model="form.appId" class="input" :placeholder="'app-id'" />
          </div>
          <div>
            <label class="block text-xs mb-1">{{ t('apolloAppName') }} *</label>
            <input v-model="form.name" class="input" :placeholder="'My App'" />
          </div>
          <div>
            <label class="block text-xs mb-1">{{ t('apolloOwnerName') }}</label>
            <input v-model="form.ownerName" class="input" />
          </div>
          <div>
            <label class="block text-xs mb-1">{{ t('apolloOwnerEmail') }}</label>
            <input v-model="form.ownerEmail" class="input" />
          </div>
        </div>
        <div class="flex justify-end gap-2 mt-6">
          <button class="btn btn-ghost btn-sm" @click="showCreate = false">
            {{ t('cancel') }}
          </button>
          <button class="btn btn-primary btn-sm" :disabled="saving" @click="createApp">
            {{ t('create') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
