import { ref } from 'vue'

export interface ConfirmOptions {
  title: string
  message?: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
  confirmDisabled?: boolean
}

export interface ConfirmState extends Required<Omit<ConfirmOptions, 'message'>> {
  open: boolean
  message: string
}

// Module-level singleton state so a single <ConfirmModalHost /> mounted at the app
// root can serve every `confirm()` call from anywhere in the component tree.
const confirmState = ref<ConfirmState>({
  open: false,
  title: '',
  message: '',
  confirmText: '',
  cancelText: '',
  danger: false,
  confirmDisabled: false,
})

let resolver: ((value: boolean) => void) | null = null

export function useConfirm() {
  const confirm = (options: ConfirmOptions): Promise<boolean> => {
    // Ignore overlapping requests; only one confirmation dialog at a time.
    if (confirmState.value.open) {
      return Promise.resolve(false)
    }
    confirmState.value = {
      open: true,
      title: options.title,
      message: options.message ?? '',
      confirmText: options.confirmText ?? '',
      cancelText: options.cancelText ?? '',
      danger: options.danger ?? false,
      confirmDisabled: options.confirmDisabled ?? false,
    }
    return new Promise<boolean>((resolve) => {
      resolver = resolve
    })
  }

  const resolveConfirm = (value: boolean): void => {
    const r = resolver
    resolver = null
    confirmState.value.open = false
    r?.(value)
  }

  return { confirmState, confirm, resolveConfirm }
}
