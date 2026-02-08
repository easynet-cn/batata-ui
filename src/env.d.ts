/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Batata/Nacos API base URL */
  readonly VITE_API_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
