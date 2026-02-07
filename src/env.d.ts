/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Enable mock data */
  readonly VITE_USE_MOCK: string
  /** Batata/Nacos API base URL */
  readonly VITE_API_BASE_URL: string
  /** Consul API base URL */
  readonly VITE_CONSUL_API_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
