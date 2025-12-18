/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 是否启用 Mock 数据 */
  readonly VITE_USE_MOCK: string
  /** API 基础地址 */
  readonly VITE_API_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
