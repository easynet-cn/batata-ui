<template>
  <div
    ref="editorContainer"
    class="code-editor-wrapper rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
    :style="{ minHeight }"
  ></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, shallowRef } from 'vue'
import { EditorView, keymap, placeholder as cmPlaceholder, type ViewUpdate } from '@codemirror/view'
import { EditorState, Compartment } from '@codemirror/state'
import { basicSetup } from 'codemirror'
import { json } from '@codemirror/lang-json'
import { xml } from '@codemirror/lang-xml'
import { html } from '@codemirror/lang-html'
import { yaml } from '@codemirror/lang-yaml'
import { oneDark } from '@codemirror/theme-one-dark'
import { defaultKeymap } from '@codemirror/commands'
import { useTheme } from '@/composables/useTheme'
import type { ConfigType } from '@/types'
import type { Extension } from '@codemirror/state'

const props = withDefaults(
  defineProps<{
    modelValue?: string
    language?: ConfigType
    readonly?: boolean
    minHeight?: string
    placeholder?: string
  }>(),
  {
    modelValue: '',
    language: 'text',
    readonly: false,
    minHeight: '400px',
    placeholder: '',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const { isDark } = useTheme()

const editorContainer = ref<HTMLElement>()
const view = shallowRef<EditorView>()
const languageCompartment = new Compartment()
const themeCompartment = new Compartment()
const readonlyCompartment = new Compartment()

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

// Suppress the Mod-Enter keybinding from basicSetup so it doesn't conflict
const suppressedKeymap = keymap.of(defaultKeymap)

onMounted(() => {
  if (!editorContainer.value) return

  const extensions: Extension[] = [
    basicSetup,
    suppressedKeymap,
    languageCompartment.of(getLanguageExtension(props.language)),
    themeCompartment.of(getThemeExtension(isDark.value)),
    readonlyCompartment.of(EditorState.readOnly.of(props.readonly)),
    EditorView.updateListener.of((update: ViewUpdate) => {
      if (update.docChanged) {
        const value = update.state.doc.toString()
        emit('update:modelValue', value)
      }
    }),
    EditorView.theme({
      '&': {
        fontSize: '14px',
      },
      '.cm-scroller': {
        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
      },
      '.cm-content': {
        minHeight: props.minHeight,
      },
      '&.cm-focused': {
        outline: '2px solid #3b82f6',
        outlineOffset: '-1px',
        borderRadius: '0.75rem',
      },
    }),
  ]

  if (props.placeholder) {
    extensions.push(cmPlaceholder(props.placeholder))
  }

  const state = EditorState.create({
    doc: props.modelValue,
    extensions,
  })

  view.value = new EditorView({
    state,
    parent: editorContainer.value,
  })
})

onBeforeUnmount(() => {
  view.value?.destroy()
})

// Sync modelValue changes from parent
watch(
  () => props.modelValue,
  (newValue) => {
    if (!view.value) return
    const currentValue = view.value.state.doc.toString()
    if (newValue !== currentValue) {
      view.value.dispatch({
        changes: {
          from: 0,
          to: view.value.state.doc.length,
          insert: newValue,
        },
      })
    }
  },
)

// Sync language changes
watch(
  () => props.language,
  (newLang) => {
    if (!view.value) return
    view.value.dispatch({
      effects: languageCompartment.reconfigure(getLanguageExtension(newLang)),
    })
  },
)

// Sync theme changes
watch(isDark, (dark) => {
  if (!view.value) return
  view.value.dispatch({
    effects: themeCompartment.reconfigure(getThemeExtension(dark)),
  })
})

// Sync readonly changes
watch(
  () => props.readonly,
  (newReadonly) => {
    if (!view.value) return
    view.value.dispatch({
      effects: readonlyCompartment.reconfigure(EditorState.readOnly.of(newReadonly)),
    })
  },
)
</script>

<style scoped>
.code-editor-wrapper :deep(.cm-editor) {
  border-radius: 0.75rem;
}
</style>
