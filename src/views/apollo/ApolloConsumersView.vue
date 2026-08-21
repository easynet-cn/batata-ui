<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from '@/i18n'
import { KeyRound, ChevronRight } from '@lucide/vue'
import apolloApi from '@/api/apollo'
import type { ApolloConsumerDTO } from '@/types/apollo'

const { t } = useI18n()

const consumers = ref<ApolloConsumerDTO[]>([])
const loading = ref(false)
const selected = ref<ApolloConsumerDTO | null>(null)

async function load() {
  loading.value = true
  try {
    consumers.value = await apolloApi.listConsumers()
  } finally {
    loading.value = false
  }
}

async function openConsumer(appId?: string) {
  if (!appId) return
  selected.value = await apolloApi.getConsumer(appId)
}

onMounted(load)
</script>

<template>
  <div class="p-6">
    <div class="flex items-center gap-2 mb-6">
      <KeyRound class="w-5 h-5 text-emerald-600" />
      <h1 class="text-lg font-semibold text-text-primary">{{ t('apolloConsumers') }}</h1>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="card overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-bg-secondary text-text-secondary">
            <tr>
              <th class="text-left px-4 py-2">{{ t('apolloAppId') }}</th>
              <th class="text-left px-4 py-2">{{ t('apolloConsumerName') }}</th>
              <th class="text-right px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="3" class="text-center py-8 text-text-secondary">{{ t('loading') }}</td>
            </tr>
            <tr v-else-if="consumers.length === 0">
              <td colspan="3" class="text-center py-8 text-text-secondary">{{ t('noData') }}</td>
            </tr>
            <tr
              v-for="c in consumers"
              :key="c.appId"
              class="border-t border-border hover:bg-bg-secondary cursor-pointer"
              @click="openConsumer(c.appId)"
            >
              <td class="px-4 py-2 font-mono text-text-primary">{{ c.appId }}</td>
              <td class="px-4 py-2 text-text-primary">{{ c.name }}</td>
              <td class="px-4 py-2 text-right">
                <ChevronRight class="w-4 h-4 inline text-text-tertiary" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="selected" class="card p-4 space-y-3">
        <h3 class="font-semibold text-text-primary">{{ selected.name }}</h3>
        <div class="grid grid-cols-2 gap-2 text-sm">
          <div class="text-text-tertiary">{{ t('apolloAppId') }}</div>
          <div class="text-text-primary font-mono">{{ selected.appId }}</div>
          <div class="text-text-tertiary">{{ t('apolloConsumerOwner') }}</div>
          <div class="text-text-primary">{{ selected.ownerName }}</div>
          <div class="text-text-tertiary">{{ t('apolloConsumerDepartment') }}</div>
          <div class="text-text-primary">{{ selected.departmentName }}</div>
          <div class="text-text-tertiary">{{ t('apolloAllowCreateApp') }}</div>
          <div class="text-text-primary">
            {{ selected.allowCreateApplication ? t('apolloEnabled') : t('apolloDisabled') }}
          </div>
          <div class="text-text-tertiary">{{ t('apolloAllowManageUsers') }}</div>
          <div class="text-text-primary">
            {{ selected.allowManageUsers ? t('apolloEnabled') : t('apolloDisabled') }}
          </div>
          <div class="text-text-tertiary">{{ t('apolloRateLimit') }}</div>
          <div class="text-text-primary">
            {{ selected.rateLimitEnabled ? selected.rateLimit : t('apolloDisabled') }}
          </div>
        </div>
        <div>
          <p class="text-xs text-text-tertiary mb-1">{{ t('apolloTokens') }}</p>
          <div class="space-y-1">
            <div
              v-for="(tok, i) in selected.tokens || []"
              :key="i"
              class="text-xs font-mono bg-bg-secondary rounded p-2 text-text-primary"
            >
              {{ tok.token }}
            </div>
            <div
              v-if="!selected.tokens || selected.tokens.length === 0"
              class="text-xs text-text-tertiary"
            >
              {{ t('noData') }}
            </div>
          </div>
        </div>
      </div>
      <div v-else class="card p-8 text-center text-text-tertiary">{{ t('apolloConsumers') }}</div>
    </div>
  </div>
</template>
