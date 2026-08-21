<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from '@/i18n'
import { Download, Upload, FileCode } from '@lucide/vue'
import apolloApi from '@/api/apollo'

const { t } = useI18n()

const appId = ref('')
const env = ref('DEV')
const cluster = ref('default')
const namespace = ref('application')
const format = ref('properties')

const exportText = ref('')
const importing = ref(false)
const exporting = ref(false)

const importText = ref('')
const conflictAction = ref<'IGNORE' | 'OVERWRITE'>('IGNORE')

async function doExport() {
  if (!appId.value) return
  exporting.value = true
  try {
    exportText.value = await apolloApi.exportConfigs(appId.value, cluster.value, namespace.value)
  } finally {
    exporting.value = false
  }
}

async function doImport() {
  if (!appId.value || !importText.value) return
  importing.value = true
  try {
    await apolloApi.importConfigs({
      appId: appId.value,
      clusterName: cluster.value,
      namespaceName: namespace.value,
      format: format.value,
      conflictAction: conflictAction.value,
      configs: importText.value,
    })
  } finally {
    importing.value = false
  }
}

onMounted(() => {})
</script>

<template>
  <div class="p-6 max-w-4xl">
    <div class="flex items-center gap-2 mb-6">
      <FileCode class="w-5 h-5 text-emerald-600" />
      <h1 class="text-lg font-semibold text-text-primary">{{ t('apolloImportExport') }}</h1>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
      <div>
        <label class="block text-xs mb-1">{{ t('apolloAppId') }}</label
        ><input v-model="appId" class="input" />
      </div>
      <div>
        <label class="block text-xs mb-1">{{ t('apolloEnvs') }}</label
        ><input v-model="env" class="input" />
      </div>
      <div>
        <label class="block text-xs mb-1">{{ t('apolloClusterName') }}</label
        ><input v-model="cluster" class="input" />
      </div>
      <div>
        <label class="block text-xs mb-1">{{ t('apolloNamespaceName') }}</label
        ><input v-model="namespace" class="input" />
      </div>
      <div>
        <label class="block text-xs mb-1">{{ t('apolloFormat') }}</label
        ><input v-model="format" class="input" />
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Export -->
      <div class="card p-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-semibold text-text-primary">{{ t('apolloExport') }}</h3>
          <button class="btn btn-primary btn-sm" :disabled="exporting" @click="doExport">
            <Download class="w-4 h-4" />{{ t('apolloExport') }}
          </button>
        </div>
        <textarea
          v-model="exportText"
          rows="12"
          class="input font-mono text-xs"
          :placeholder="t('apolloExport')"
        ></textarea>
      </div>

      <!-- Import -->
      <div class="card p-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-semibold text-text-primary">{{ t('apolloImport') }}</h3>
          <button class="btn btn-primary btn-sm" :disabled="importing" @click="doImport">
            <Upload class="w-4 h-4" />{{ t('apolloImport') }}
          </button>
        </div>
        <div class="mb-2">
          <label class="block text-xs mb-1">{{ t('apolloConflictAction') }}</label>
          <select v-model="conflictAction" class="input w-auto">
            <option value="IGNORE">{{ t('apolloConflictIgnore') }}</option>
            <option value="OVERWRITE">{{ t('apolloConflictOverwrite') }}</option>
          </select>
        </div>
        <textarea
          v-model="importText"
          rows="8"
          class="input font-mono text-xs"
          :placeholder="t('apolloImport')"
        ></textarea>
      </div>
    </div>
  </div>
</template>
