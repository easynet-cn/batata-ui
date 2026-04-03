<template>
  <div class="card">
    <div class="p-4 border-b border-border">
      <h3 class="text-sm font-medium text-text-primary">{{ t('skillVersions') }}</h3>
    </div>
    <div v-if="versions.length === 0" class="p-6 text-center text-text-secondary">
      {{ t('noVersions') }}
    </div>
    <div v-else class="divide-y divide-border">
      <div
        v-for="ver in versions"
        :key="ver.version"
        class="p-4 hover:bg-bg-secondary transition-colors"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3 cursor-pointer" @click="$emit('select', ver.version)">
            <!-- Status dot -->
            <div
              class="w-2.5 h-2.5 rounded-full flex-shrink-0"
              :class="statusDotClass(ver.status)"
            />
            <span class="font-mono text-sm font-medium text-text-primary">
              v{{ ver.version }}
            </span>
            <span :class="statusBadgeClass(ver.status)">
              {{ statusLabel(ver.status) }}
            </span>
          </div>
          <div class="flex items-center gap-1">
            <!-- View -->
            <button
              @click.stop="$emit('view', ver.version)"
              class="btn btn-ghost btn-sm"
              :title="t('viewDetail')"
            >
              <Eye class="w-3.5 h-3.5" />
            </button>
            <!-- Download (optional) -->
            <button
              v-if="showDownload"
              @click.stop="$emit('download', ver.version)"
              class="btn btn-ghost btn-sm"
              :title="t('skillDownload')"
            >
              <Download class="w-3.5 h-3.5" />
            </button>
            <!-- Draft: Submit / Delete -->
            <template v-if="ver.status === 'draft'">
              <button
                @click.stop="$emit('submit', ver.version)"
                class="btn btn-ghost btn-sm text-blue-600"
                :title="t('skillSubmitReview')"
              >
                <Send class="w-3.5 h-3.5" />
              </button>
              <button
                @click.stop="$emit('deleteDraft')"
                class="btn btn-ghost btn-sm text-danger"
                :title="t('deleteDraft')"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </template>
            <!-- Reviewing: Publish / Force Publish -->
            <template v-if="ver.status === 'reviewing'">
              <button
                @click.stop="$emit('publish', ver.version)"
                class="btn btn-ghost btn-sm text-emerald-600"
                :title="t('skillPublish')"
              >
                <Rocket class="w-3.5 h-3.5" />
              </button>
              <button
                @click.stop="$emit('forcePublish', ver.version)"
                class="btn btn-ghost btn-sm text-orange-600"
                :title="t('forcePublish')"
              >
                <Zap class="w-3.5 h-3.5" />
              </button>
            </template>
            <!-- Online: Offline -->
            <button
              v-if="ver.status === 'online'"
              @click.stop="$emit('offline', ver.version)"
              class="btn btn-ghost btn-sm"
              :title="t('skillOfflineAction')"
            >
              <WifiOff class="w-3.5 h-3.5" />
            </button>
            <!-- Offline: Online -->
            <button
              v-if="ver.status === 'offline'"
              @click.stop="$emit('online', ver.version)"
              class="btn btn-ghost btn-sm"
              :title="t('skillOnlineAction')"
            >
              <Wifi class="w-3.5 h-3.5" />
            </button>
            <!-- Create Draft From (for online/offline, when no editing version) -->
            <button
              v-if="
                (ver.status === 'online' || ver.status === 'offline') &&
                !editingVersion &&
                !reviewingVersion
              "
              @click.stop="$emit('createDraftFrom', ver.version)"
              class="btn btn-ghost btn-sm"
              :title="t('createDraftFromVersion')"
            >
              <FilePlus class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <!-- Version meta -->
        <div class="flex items-center gap-4 mt-2 text-xs text-text-tertiary ml-5">
          <span>{{ ver.author || ver.srcUser }}</span>
          <span>{{ new Date(ver.createTime || ver.gmtModified || 0).toLocaleString() }}</span>
          <span v-if="ver.description || ver.commitMsg" class="truncate max-w-[200px]">
            {{ ver.description || ver.commitMsg }}
          </span>
        </div>
        <!-- Pipeline Status -->
        <div v-if="ver.publishPipelineInfo" class="mt-3 ml-5">
          <PipelineStatusDisplay :publish-pipeline-info="ver.publishPipelineInfo" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Eye, Download, Send, Trash2, Rocket, Zap, Wifi, WifiOff, FilePlus } from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import { useVersionStatus } from '@/composables/useVersionStatus'
import PipelineStatusDisplay from '@/components/ai/PipelineStatusDisplay.vue'

interface VersionItem {
  version: string
  status: 'draft' | 'reviewing' | 'online' | 'offline'
  author?: string
  srcUser?: string
  description?: string
  commitMsg?: string
  createTime?: number
  gmtModified?: number
  publishPipelineInfo?: string | null
  downloadCount?: number
}

defineProps<{
  versions: VersionItem[]
  editingVersion?: string | null
  reviewingVersion?: string | null
  showDownload?: boolean
}>()

defineEmits<{
  select: [version: string]
  view: [version: string]
  download: [version: string]
  submit: [version: string]
  publish: [version: string]
  forcePublish: [version: string]
  online: [version: string]
  offline: [version: string]
  deleteDraft: []
  createDraftFrom: [version: string]
}>()

const { t } = useI18n()
const { statusDotClass, statusBadgeClass, statusLabel } = useVersionStatus()
</script>
