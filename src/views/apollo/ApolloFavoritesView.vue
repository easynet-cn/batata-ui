<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from '@/i18n'
import { Star } from '@lucide/vue'
import apolloApi from '@/api/apollo'
import type { ApolloFavoriteDTO } from '@/types/apollo'

const { t } = useI18n()
const router = useRouter()
const favorites = ref<ApolloFavoriteDTO[]>([])
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    favorites.value = await apolloApi.listFavorites()
  } finally {
    loading.value = false
  }
}

function open(fav: ApolloFavoriteDTO) {
  if (fav.namespaceName) {
    router.push({
      path: '/apollo/namespace',
      query: {
        appId: fav.appId,
        env: fav.env,
        cluster: fav.clusterName,
        namespace: fav.namespaceName,
      },
    })
  } else if (fav.appId) {
    router.push({ path: '/apollo/app', query: { appId: fav.appId } })
  }
}

onMounted(load)
</script>

<template>
  <div class="p-6">
    <div class="flex items-center gap-2 mb-6">
      <Star class="w-5 h-5 text-emerald-600" />
      <h1 class="text-lg font-semibold text-text-primary">{{ t('apolloFavorites') }}</h1>
    </div>

    <div v-if="loading" class="card p-8 text-center text-text-secondary">{{ t('loading') }}</div>
    <div v-else-if="favorites.length === 0" class="card p-8 text-center text-text-secondary">
      {{ t('noData') }}
    </div>
    <div v-else class="card overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-bg-secondary text-text-secondary">
          <tr>
            <th class="text-left px-4 py-2">{{ t('apolloAppId') }}</th>
            <th class="text-left px-4 py-2">{{ t('apolloAppName') }}</th>
            <th class="text-left px-4 py-2">{{ t('apolloEnvs') }}</th>
            <th class="text-left px-4 py-2">{{ t('apolloClusterName') }}</th>
            <th class="text-left px-4 py-2">{{ t('apolloNamespaceName') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(f, i) in favorites"
            :key="i"
            class="border-t border-border hover:bg-bg-secondary cursor-pointer"
            @click="open(f)"
          >
            <td class="px-4 py-2 font-mono text-text-primary">{{ f.appId }}</td>
            <td class="px-4 py-2 text-text-primary">{{ f.appName }}</td>
            <td class="px-4 py-2 text-text-secondary">{{ f.env }}</td>
            <td class="px-4 py-2 text-text-secondary">{{ f.clusterName }}</td>
            <td class="px-4 py-2 text-text-secondary">{{ f.namespaceName }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
