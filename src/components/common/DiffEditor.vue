<template>
  <div
    ref="editorContainer"
    class="diff-editor-wrapper rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
    :style="{ minHeight }"
  ></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, shallowRef } from 'vue'
import { EditorView } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { MergeView } from '@codemirror/merge'
import { basicSetup } from 'codemirror'
import { json } from '@codemirror/lang-json'
import { xml } from '@codemirror/lang-xml'
import { html } from '@codemirror/lang-html'
import { yaml } from '@codemirror/lang-yaml'
import { oneDark } from '@codemirror/theme-one-dark'
import { useTheme } from '@/composables/useTheme'
import type { ConfigType } from '@/types'
import type { Extension } from '@codemirror/state'

const props = withDefaults(
  defineProps<{
    original?: string
    modified?: string
    language?: ConfigType
    minHeight?: string
  }>(),
  {
    original: '',
    modified: '',
    language: 'text',
    minHeight: '300px',
  },
)

const { isDark } = useTheme()

const editorContainer = ref<HTMLElement>()
const mergeView = shallowRef<MergeView>()

function getLanguageExtension(lang: ConfigType): Extension {
  switch (lang) {
    case 'json':
      return json()
    case 'xml':
      return xml()
    case 'html':
      return html()
    case 'yaml':
      return yaml()
    default:
      return []
  }
}

function getThemeExtension(dark: boolean): Extension {
  return dark ? oneDark : []
}

function getBaseExtensions(): Extension[] {
  return [
    basicSetup,
    getLanguageExtension(props.language),
    getThemeExtension(isDark.value),
    EditorState.readOnly.of(true),
    EditorView.theme({
      '&': { fontSize: '14px' },
      '.cm-scroller': {
        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
      },
      '.cm-content': { minHeight: props.minHeight },
    }),
  ]
}

function createMergeView() {
  if (!editorContainer.value) return

  mergeView.value?.destroy()

  mergeView.value = new MergeView({
    a: {
      doc: props.original,
      extensions: getBaseExtensions(),
    },
    b: {
      doc: props.modified,
      extensions: getBaseExtensions(),
    },
    parent: editorContainer.value,
    highlightChanges: true,
    gutter: true,
  })
}

onMounted(() => {
  createMergeView()
})

onBeforeUnmount(() => {
  mergeView.value?.destroy()
})

// Recreate when content or theme changes
watch([() => props.original, () => props.modified, () => props.language, isDark], () => {
  createMergeView()
})
</script>

<style scoped>
.diff-editor-wrapper :deep(.cm-editor) {
  border-radius: 0;
}

.diff-editor-wrapper :deep(.cm-mergeView) {
  border-radius: 0.75rem;
  overflow: hidden;
}

.diff-editor-wrapper :deep(.cm-mergeViewEditor) {
  flex: 1;
  min-width: 0;
}

.diff-editor-wrapper :deep(.cm-changedLine) {
  background-color: rgba(59, 130, 246, 0.08);
}

.diff-editor-wrapper :deep(.cm-changedText) {
  background-color: rgba(59, 130, 246, 0.2);
}

.diff-editor-wrapper :deep(.cm-insertedLine) {
  background-color: rgba(34, 197, 94, 0.08);
}

.diff-editor-wrapper :deep(.cm-deletedLine) {
  background-color: rgba(239, 68, 68, 0.08);
}
</style>
