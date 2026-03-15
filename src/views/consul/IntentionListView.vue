<template>
  <div class="space-y-3">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-base font-semibold text-text-primary">{{ t('intentions') }}</h1>
        <p class="text-xs text-text-secondary mt-0.5">{{ t('intentionsDesc') }}</p>
      </div>
      <div class="flex items-center gap-2">
        <button @click="loadIntentions" class="btn btn-secondary btn-sm">
          <RefreshCw class="w-3.5 h-3.5" />
          {{ t('refresh') }}
        </button>
        <button @click="openCreateModal" class="btn btn-primary btn-sm">
          <Plus class="w-3.5 h-3.5" />
          {{ t('createIntention') }}
        </button>
      </div>
    </div>

    <!-- Intention List -->
    <div class="card">
      <div class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>{{ t('sourceService') }}</th>
              <th>{{ t('destinationService') }}</th>
              <th>{{ t('action') }}</th>
              <th>{{ t('precedence') }}</th>
              <th>{{ t('description') }}</th>
              <th class="w-24">{{ t('actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="store.loading">
              <td colspan="6" class="text-center py-6">
                <Loader2 class="w-5 h-5 animate-spin mx-auto text-primary" />
              </td>
            </tr>
            <tr v-else-if="store.intentions.length === 0">
              <td colspan="6" class="text-center py-6 text-text-secondary">
                {{ t('noIntentions') }}
              </td>
            </tr>
            <tr v-for="intention in store.intentions" :key="intention.ID">
              <td>
                <div class="flex items-center gap-1.5">
                  <ArrowRightFromLine class="w-3.5 h-3.5 text-text-tertiary" />
                  <span class="font-medium text-text-primary">{{ intention.SourceName }}</span>
                </div>
              </td>
              <td>
                <div class="flex items-center gap-1.5">
                  <ArrowRightToLine class="w-3.5 h-3.5 text-text-tertiary" />
                  <span class="font-medium text-text-primary">{{ intention.DestinationName }}</span>
                </div>
              </td>
              <td>
                <span
                  :class="
                    intention.Action === 'allow' ? 'badge badge-success' : 'badge badge-danger'
                  "
                >
                  {{ intention.Action === 'allow' ? t('allow') : t('deny') }}
                </span>
              </td>
              <td>
                <span class="text-text-secondary">{{ intention.Precedence }}</span>
              </td>
              <td>
                <span class="text-text-secondary">{{ intention.Description || '-' }}</span>
              </td>
              <td>
                <div class="flex items-center gap-1">
                  <button
                    @click="handleEdit(intention)"
                    class="btn btn-ghost btn-sm text-text-secondary"
                    :title="t('edit')"
                  >
                    <Pencil class="w-3.5 h-3.5" />
                  </button>
                  <button
                    @click="handleDelete(intention)"
                    class="btn btn-ghost btn-sm text-danger"
                    :title="t('delete')"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create/Edit Intention Modal -->
    <FormModal
      v-model="showCreateModal"
      :title="isEditing ? t('editIntention') : t('createIntention')"
      :submit-text="isEditing ? t('updateIntention') : t('create')"
      :loading="saving"
      @submit="submitCreate"
    >
      <div class="space-y-3">
        <div>
          <label class="block text-xs font-medium text-text-primary mb-1">
            {{ t('sourceService') }} <span class="text-danger">*</span>
          </label>
          <input
            v-model="createForm.SourceName"
            type="text"
            class="input"
            placeholder="web"
            :disabled="isEditing"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-text-primary mb-1">
            {{ t('destinationService') }} <span class="text-danger">*</span>
          </label>
          <input
            v-model="createForm.DestinationName"
            type="text"
            class="input"
            placeholder="api"
            :disabled="isEditing"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-text-primary mb-1">
            {{ t('action') }} <span class="text-danger">*</span>
          </label>
          <select v-model="createForm.Action" class="input">
            <option value="allow">{{ t('allow') }}</option>
            <option value="deny">{{ t('deny') }}</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-text-primary mb-1">
            {{ t('description') }}
          </label>
          <input
            v-model="createForm.Description"
            type="text"
            class="input"
            :placeholder="t('descriptionPlaceholder')"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-text-primary mb-1">
            {{ t('l7Permissions') }}
          </label>
          <div class="space-y-2 border border-border rounded-xl p-3">
            <div
              v-for="(perm, idx) in l7Permissions"
              :key="idx"
              class="p-2 border border-border rounded-lg space-y-2"
            >
              <div class="flex items-center justify-between">
                <select v-model="perm.Action" class="input w-28">
                  <option value="allow">{{ t('allow') }}</option>
                  <option value="deny">{{ t('deny') }}</option>
                </select>
                <button
                  @click="l7Permissions.splice(idx, 1)"
                  class="btn btn-ghost btn-sm text-danger"
                >
                  <Trash2 class="w-3 h-3" />
                </button>
              </div>
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block text-[10px] text-text-tertiary mb-0.5">{{
                    t('httpPathMatch')
                  }}</label>
                  <select v-model="perm.HTTP.PathType" class="input text-xs">
                    <option value="">-</option>
                    <option value="PathExact">Exact</option>
                    <option value="PathPrefix">Prefix</option>
                    <option value="PathRegex">Regex</option>
                  </select>
                </div>
                <div>
                  <label class="block text-[10px] text-text-tertiary mb-0.5">{{
                    t('httpPath')
                  }}</label>
                  <input
                    v-model="perm.HTTP.PathValue"
                    type="text"
                    class="input text-xs"
                    placeholder="/"
                  />
                </div>
              </div>
              <div>
                <label class="block text-[10px] text-text-tertiary mb-0.5">{{
                  t('httpMethods')
                }}</label>
                <div class="flex flex-wrap gap-1">
                  <label
                    v-for="method in ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']"
                    :key="method"
                    class="flex items-center gap-1 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      :value="method"
                      v-model="perm.HTTP.Methods"
                      class="w-3 h-3 rounded"
                    />
                    <span class="text-[10px] text-text-primary">{{ method }}</span>
                  </label>
                </div>
              </div>
              <div>
                <label class="block text-[10px] text-text-tertiary mb-0.5">{{
                  t('httpHeaders')
                }}</label>
                <div class="space-y-1.5">
                  <div
                    v-for="(hdr, hIdx) in perm.HTTP.Header"
                    :key="hIdx"
                    class="flex items-center gap-1.5"
                  >
                    <input
                      v-model="hdr.Name"
                      type="text"
                      class="input text-xs flex-1"
                      :placeholder="t('headerName')"
                    />
                    <select v-model="hdr.MatchType" class="input text-xs w-24">
                      <option value="Exact">{{ t('headerMatchExact') }}</option>
                      <option value="Prefix">{{ t('headerMatchPrefix') }}</option>
                      <option value="Suffix">{{ t('headerMatchSuffix') }}</option>
                      <option value="Contains">{{ t('headerMatchContains') }}</option>
                      <option value="Regex">{{ t('headerMatchRegex') }}</option>
                      <option value="Present">{{ t('headerMatchPresent') }}</option>
                    </select>
                    <input
                      v-if="hdr.MatchType !== 'Present'"
                      v-model="hdr.Value"
                      type="text"
                      class="input text-xs flex-1"
                      :placeholder="t('headerValue')"
                    />
                    <label class="flex items-center gap-0.5 shrink-0 cursor-pointer">
                      <input type="checkbox" v-model="hdr.Invert" class="w-3 h-3 rounded" />
                      <span class="text-[10px] text-text-tertiary">{{ t('headerInvert') }}</span>
                    </label>
                    <button
                      @click="perm.HTTP.Header.splice(hIdx, 1)"
                      class="btn btn-ghost btn-sm text-danger shrink-0"
                    >
                      <Trash2 class="w-3 h-3" />
                    </button>
                  </div>
                  <button
                    @click="
                      perm.HTTP.Header.push({
                        Name: '',
                        MatchType: 'Exact',
                        Value: '',
                        Invert: false,
                      })
                    "
                    class="btn btn-ghost btn-sm text-primary"
                  >
                    <Plus class="w-3 h-3" />
                    {{ t('addHeader') }}
                  </button>
                </div>
              </div>
            </div>
            <button
              @click="
                l7Permissions.push({
                  Action: 'allow',
                  HTTP: { PathType: '', PathValue: '', Methods: [], Header: [] },
                })
              "
              class="btn btn-ghost btn-sm text-primary"
            >
              <Plus class="w-3 h-3" />
              {{ t('addPermission') }}
            </button>
          </div>
        </div>
      </div>
    </FormModal>

    <!-- Delete Confirm Modal -->
    <ConfirmModal
      v-model="showDeleteModal"
      :title="t('confirmDelete')"
      :confirm-text="t('delete')"
      danger
      @confirm="confirmDelete"
    >
      <div>
        <p class="text-text-secondary">{{ t('confirmDeleteIntention') }}</p>
        <p class="text-xs text-text-tertiary mt-2">
          <span class="font-medium text-text-primary">
            {{ intentionToDelete?.SourceName }}
          </span>
          &rarr;
          <span class="font-medium text-text-primary">
            {{ intentionToDelete?.DestinationName }}
          </span>
          - {{ t('deleteIntentionWarning') }}
        </p>
      </div>
    </ConfirmModal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import {
  Plus,
  RefreshCw,
  Trash2,
  Pencil,
  Loader2,
  ArrowRightFromLine,
  ArrowRightToLine,
} from 'lucide-vue-next'
import { useI18n } from '@/i18n'
import { useConsulStore } from '@/stores/consul'
import consulApi from '@/api/consul'
import { toast } from '@/utils/error'
import { logger } from '@/utils/logger'
import FormModal from '@/components/common/FormModal.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import type { ConsulIntention } from '@/types/consul'

const { t } = useI18n()
const store = useConsulStore()

// State
const saving = ref(false)
const showCreateModal = ref(false)
const showDeleteModal = ref(false)
const isEditing = ref(false)
const editingIntention = ref<ConsulIntention | null>(null)
const intentionToDelete = ref<ConsulIntention | null>(null)

const createForm = reactive({
  SourceName: '',
  DestinationName: '',
  Action: 'allow' as 'allow' | 'deny',
  Description: '',
})

interface L7HeaderMatch {
  Name: string
  MatchType: 'Exact' | 'Prefix' | 'Suffix' | 'Contains' | 'Regex' | 'Present'
  Value: string
  Invert: boolean
}

interface L7Permission {
  Action: 'allow' | 'deny'
  HTTP: {
    PathType: string
    PathValue: string
    Methods: string[]
    Header: L7HeaderMatch[]
  }
}
const l7Permissions = ref<L7Permission[]>([])

// Actions
async function loadIntentions() {
  try {
    await store.fetchIntentions()
  } catch (error) {
    logger.error('Failed to fetch intentions:', error)
    toast.apiError(error)
  }
}

function openCreateModal() {
  isEditing.value = false
  editingIntention.value = null
  createForm.SourceName = ''
  createForm.DestinationName = ''
  createForm.Action = 'allow'
  createForm.Description = ''
  l7Permissions.value = []
  showCreateModal.value = true
}

async function handleEdit(intention: ConsulIntention) {
  isEditing.value = true
  try {
    const response = await consulApi.getIntention(intention.ID)
    const full = response.data
    editingIntention.value = full
    createForm.SourceName = full.SourceName
    createForm.DestinationName = full.DestinationName
    createForm.Action = full.Action
    createForm.Description = full.Description || ''
    // Load L7 permissions if present
    const perms = (full as unknown as Record<string, unknown>).Permissions as
      | Array<Record<string, unknown>>
      | undefined
    if (perms && perms.length > 0) {
      l7Permissions.value = perms.map((p) => {
        const http = (p.HTTP || {}) as Record<string, unknown>
        const rawHeaders = (http.Header || []) as Array<Record<string, unknown>>
        const headers: L7HeaderMatch[] = rawHeaders.map((h) => {
          let matchType: L7HeaderMatch['MatchType'] = 'Exact'
          let value = ''
          if (h.Exact) {
            matchType = 'Exact'
            value = h.Exact as string
          } else if (h.Prefix) {
            matchType = 'Prefix'
            value = h.Prefix as string
          } else if (h.Suffix) {
            matchType = 'Suffix'
            value = h.Suffix as string
          } else if (h.Contains) {
            matchType = 'Contains'
            value = h.Contains as string
          } else if (h.Regex) {
            matchType = 'Regex'
            value = h.Regex as string
          } else if (h.Present) {
            matchType = 'Present'
          }
          return {
            Name: (h.Name || '') as string,
            MatchType: matchType,
            Value: value,
            Invert: !!h.Invert,
          }
        })
        return {
          Action: (p.Action as string) === 'deny' ? ('deny' as const) : ('allow' as const),
          HTTP: {
            PathType: (http.PathExact
              ? 'PathExact'
              : http.PathPrefix
                ? 'PathPrefix'
                : http.PathRegex
                  ? 'PathRegex'
                  : '') as string,
            PathValue: (http.PathExact || http.PathPrefix || http.PathRegex || '') as string,
            Methods: (http.Methods || []) as string[],
            Header: headers,
          },
        }
      })
    } else {
      l7Permissions.value = []
    }
    showCreateModal.value = true
  } catch (error) {
    logger.error('Failed to fetch intention details:', error)
    toast.apiError(error)
  }
}

async function submitCreate() {
  if (!createForm.SourceName || !createForm.DestinationName) {
    toast.warning(t('requiredFieldsMissing'))
    return
  }

  saving.value = true
  try {
    // Build L7 permissions
    const permissions = l7Permissions.value
      .filter((p) => p.HTTP.PathType || p.HTTP.Methods.length > 0 || p.HTTP.Header.length > 0)
      .map((p) => {
        const http: Record<string, unknown> = {}
        if (p.HTTP.PathType === 'PathExact') http.PathExact = p.HTTP.PathValue
        else if (p.HTTP.PathType === 'PathPrefix') http.PathPrefix = p.HTTP.PathValue
        else if (p.HTTP.PathType === 'PathRegex') http.PathRegex = p.HTTP.PathValue
        if (p.HTTP.Methods.length > 0) http.Methods = p.HTTP.Methods
        const validHeaders = p.HTTP.Header.filter((h) => h.Name.trim())
        if (validHeaders.length > 0) {
          http.Header = validHeaders.map((h) => {
            const entry: Record<string, unknown> = { Name: h.Name.trim() }
            if (h.MatchType === 'Present') {
              entry.Present = true
            } else {
              entry[h.MatchType] = h.Value
            }
            if (h.Invert) entry.Invert = true
            return entry
          })
        }
        return { Action: p.Action, HTTP: http }
      })

    const intentionData: Record<string, unknown> = {
      SourceName: createForm.SourceName,
      DestinationName: createForm.DestinationName,
      Action: permissions.length > 0 ? undefined : createForm.Action,
      Description: createForm.Description || undefined,
    }
    if (permissions.length > 0) {
      intentionData.Permissions = permissions
    }

    if (isEditing.value && editingIntention.value) {
      await consulApi.updateIntention(
        editingIntention.value.ID,
        intentionData as Partial<ConsulIntention>,
      )
    } else {
      await consulApi.createIntention(intentionData as Partial<ConsulIntention>)
    }
    showCreateModal.value = false
    toast.success(t('success'))
    await loadIntentions()
  } catch (error) {
    logger.error('Failed to save intention:', error)
    toast.apiError(error)
  } finally {
    saving.value = false
  }
}

function handleDelete(intention: ConsulIntention) {
  intentionToDelete.value = intention
  showDeleteModal.value = true
}

async function confirmDelete() {
  if (!intentionToDelete.value) return
  try {
    await consulApi.deleteIntention(intentionToDelete.value.ID)
    showDeleteModal.value = false
    toast.success(t('success'))
    await loadIntentions()
  } catch (error) {
    logger.error('Failed to delete intention:', error)
    toast.apiError(error)
  }
}

// Lifecycle
onMounted(() => {
  loadIntentions()
})
</script>
