<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from '@/i18n'
import { Shield, ChevronLeft, ChevronRight } from '@lucide/vue'
import apolloApi from '@/api/apollo'
import type { ApolloAuditDTO } from '@/types/apollo'

const { t } = useI18n()

const audits = ref<ApolloAuditDTO[]>([])
const page = ref(0)
const total = ref(0)
const loading = ref(false)

async function load() {
  loading.value = true
  try {
    const res = await apolloApi.listAudit(page.value, 20)
    audits.value = res.content
    total.value = res.total
  } finally {
    loading.value = false
  }
}

function prevPage() {
  page.value--
  load()
}

function nextPage() {
  page.value++
  load()
}

onMounted(load)
</script>

<template>
  <div class="p-6">
    <div class="flex items-center gap-2 mb-6">
      <Shield class="w-5 h-5 text-emerald-600" />
      <h1 class="text-lg font-semibold text-text-primary">{{ t('apolloAudit') }}</h1>
    </div>

    <div class="card overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-bg-secondary text-text-secondary">
          <tr>
            <th class="text-left px-4 py-2">{{ t('apolloEntityName') }}</th>
            <th class="text-left px-4 py-2">{{ t('apolloOpName') }}</th>
            <th class="text-left px-4 py-2">{{ t('apolloOpBy') }}</th>
            <th class="text-left px-4 py-2">{{ t('apolloOpTime') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="4" class="text-center py-8 text-text-secondary">{{ t('loading') }}</td>
          </tr>
          <tr v-else-if="audits.length === 0">
            <td colspan="4" class="text-center py-8 text-text-secondary">{{ t('noData') }}</td>
          </tr>
          <tr v-for="a in audits" :key="a.id" class="border-t border-border">
            <td class="px-4 py-2 text-text-primary">
              {{ a.entityName }}<span class="text-text-tertiary">#{{ a.entityId }}</span>
            </td>
            <td class="px-4 py-2 text-text-secondary">{{ a.opName }}</td>
            <td class="px-4 py-2 text-text-secondary">{{ a.opBy }}</td>
            <td class="px-4 py-2 text-text-tertiary">{{ a.opTime }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="flex items-center justify-center gap-3 mt-4" v-if="total > 20">
      <button class="btn btn-ghost btn-sm" :disabled="page === 0" @click="prevPage">
        <ChevronLeft class="w-4 h-4" />
      </button>
      <span class="text-xs text-text-secondary">{{ page + 1 }} / {{ Math.ceil(total / 20) }}</span>
      <button class="btn btn-ghost btn-sm" :disabled="(page + 1) * 20 >= total" @click="nextPage">
        <ChevronRight class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>
