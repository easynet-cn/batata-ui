<template>
  <div
    ref="wrapperRef"
    class="code-editor-wrapper rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden relative"
    :aria-label="t('codeEditor')"
    :class="{ 'fixed inset-0 z-50 rounded-none border-0': isFullscreen }"
    :style="isFullscreen ? {} : { minHeight }"
  >
    <div
      ref="editorContainer"
      class="h-full"
      role="textbox"
      :aria-multiline="true"
      :aria-readonly="readonly"
    ></div>
    <button
      @click="toggleFullscreen"
      class="absolute top-2 right-2 z-10 p-1 rounded-md bg-gray-100 dark:bg-gray-800 text-text-secondary hover:text-text-primary opacity-60 hover:opacity-100 transition-opacity"
      :title="isFullscreen ? t('exitFullscreen') : t('fullscreen')"
    >
      <Minimize2 v-if="isFullscreen" class="w-3.5 h-3.5" />
      <Maximize2 v-else class="w-3.5 h-3.5" />
    </button>
  </div>
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
import { StreamLanguage, type StringStream } from '@codemirror/language'
import { oneDark } from '@codemirror/theme-one-dark'
import { defaultKeymap } from '@codemirror/commands'
import { Maximize2, Minimize2 } from 'lucide-vue-next'
import { useTheme } from '@/composables/useTheme'
import { useI18n } from '@/i18n'
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
const { t } = useI18n()

const wrapperRef = ref<HTMLElement>()
const editorContainer = ref<HTMLElement>()
const view = shallowRef<EditorView>()
const languageCompartment = new Compartment()
const themeCompartment = new Compartment()
const readonlyCompartment = new Compartment()

// Fullscreen state
const isFullscreen = ref(false)

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'F11') {
    e.preventDefault()
    toggleFullscreen()
  } else if (e.key === 'Escape' && isFullscreen.value) {
    isFullscreen.value = false
  }
}

// Simple HCL tokenizer for syntax highlighting
const hclLanguage = StreamLanguage.define({
  token(stream: StringStream) {
    if (stream.match(/\/\/.*/)) return 'comment'
    if (stream.match(/\/\*/)) {
      while (!stream.match(/\*\//)) {
        if (!stream.next()) break
      }
      return 'comment'
    }
    if (stream.match(/#.*/)) return 'comment'
    if (stream.match(/"(?:[^"\\]|\\.)*"/)) return 'string'
    if (stream.match(/<<-?\w+/)) return 'string'
    if (stream.match(/\b(true|false|null)\b/)) return 'atom'
    if (stream.match(/\b\d+(\.\d+)?\b/)) return 'number'
    if (
      stream.match(
        /\b(resource|data|variable|output|locals|module|provider|terraform|backend|service|service_prefix|node|node_prefix|agent|agent_prefix|key|key_prefix|session|session_prefix|event|event_prefix|query|query_prefix|keyring|operator|acl|mesh|peering)\b/,
      )
    )
      return 'keyword'
    if (stream.match(/\b(policy|read|write|deny|list|intentions)\b/)) return 'def'
    if (stream.match(/[{}()\[\]]/)) return 'bracket'
    if (stream.match(/[=]/)) return 'operator'
    if (stream.match(/\w+/)) return 'variableName'
    stream.next()
    return null
  },
  startState() {
    return {}
  },
})

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
    case 'hcl':
      return hclLanguage
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

  document.addEventListener('keydown', handleKeydown)

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
  document.removeEventListener('keydown', handleKeydown)
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
