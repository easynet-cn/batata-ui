<template>
  <div class="flex items-center gap-3 flex-wrap">
    <!-- Enable toggle -->
    <label class="flex items-center gap-1.5 cursor-pointer">
      <input
        type="checkbox"
        class="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary"
        :checked="enabled"
        :disabled="enableDisabled"
        @change="(e) => onEnabledChange((e.target as HTMLInputElement).checked)"
      />
      <span class="text-xs text-text-primary">
        {{ enabled ? enabledLabel : disabledLabel }}
      </span>
    </label>

    <!-- Scope toggle -->
    <div class="flex items-center gap-1">
      <button
        class="btn btn-ghost btn-sm"
        :class="scopeBtnClass('PUBLIC')"
        :disabled="scopeDisabled"
        @click="onScopeChange('PUBLIC')"
      >
        {{ publicLabel }}
      </button>
      <span class="text-text-tertiary">/</span>
      <button
        class="btn btn-ghost btn-sm"
        :class="scopeBtnClass('PRIVATE')"
        :disabled="scopeDisabled"
        @click="onScopeChange('PRIVATE')"
      >
        {{ privateLabel }}
      </button>
    </div>

    <!-- Visibility authorization entry -->
    <button
      v-if="visibilityLabel"
      class="btn btn-ghost btn-sm"
      :title="visibilityTooltip"
      @click="onVisibilityClick?.()"
    >
      <Eye class="w-3.5 h-3.5" />
      {{ visibilityLabel }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { Eye } from '@lucide/vue'

const props = defineProps<{
  enabled: boolean
  scope?: string
  enabledLabel: string
  disabledLabel: string
  publicLabel: string
  privateLabel: string
  enableDisabled?: boolean
  scopeDisabled?: boolean
  visibilityLabel?: string
  visibilityTooltip?: string
}>()

const emit = defineEmits<{
  'update:enabled': [value: boolean]
  'update:scope': [value: string]
  'visibility-click': []
}>()

const onEnabledChange = (value: boolean) => emit('update:enabled', value)
const onScopeChange = (value: string) => emit('update:scope', value)
const onVisibilityClick = () => emit('visibility-click')

const scopeBtnClass = (target: string) =>
  props.scope === target ? 'text-primary' : 'text-text-secondary'
</script>
