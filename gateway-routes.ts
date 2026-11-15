/**
 * Single source of truth for the same-origin gateway prefixes.
 *
 * Development (`vite dev`, 5173) and production preview (`vite preview`,
 * 4173) both use this table, so the two servers can never drift. In the
 * packaged production build the console server (8081) implements the same
 * prefixes natively, which is why all browser-facing API URLs stay relative.
 */

export const GATEWAY_PREFIXES = {
  console: '/v3',
  consul: '/consul-api',
  apollo: '/apollo-api',
} as const

export type GatewayEnv = Record<string, string>

const DEFAULTS = {
  console: 'http://localhost:8081',
  consul: 'http://localhost:8500',
  apollo: 'http://localhost:8080',
} as const

/**
 * Build the Vite proxy table. Only the plugin targets are configurable; the
 * path rewrites mirror `batata` console-gateway's prefix stripping exactly.
 */
export function createGatewayProxy(env: GatewayEnv) {
  const consoleTarget = env.VITE_API_PROXY_TARGET || DEFAULTS.console
  const consulTarget = env.VITE_CONSUL_PROXY_TARGET || DEFAULTS.consul
  const apolloTarget = env.VITE_APOLLO_PROXY_TARGET || DEFAULTS.apollo

  return {
    [GATEWAY_PREFIXES.console]: {
      target: consoleTarget,
      changeOrigin: true,
    },
    [GATEWAY_PREFIXES.consul]: {
      target: consulTarget,
      changeOrigin: true,
      rewrite: (path: string) => path.replace(/^\/consul-api/, ''),
    },
    [GATEWAY_PREFIXES.apollo]: {
      target: apolloTarget,
      changeOrigin: true,
      rewrite: (path: string) => path.replace(/^\/apollo-api/, ''),
    },
  }
}
