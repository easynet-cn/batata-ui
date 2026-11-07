import { request as pwRequest } from '@playwright/test'
import type { APIRequestContext } from '@playwright/test'

export type { APIRequestContext }

// Trailing slash is required: Playwright resolves a request path that starts
// with `/` against the ORIGIN, discarding the whole baseURL path. Every helper
// therefore uses a relative path (no leading slash) so URLs land under
// `/apollo-api/openapi/v1/`. Keep both halves in sync.
export const APOLLO_BASE = `${process.env.E2E_BASE_URL || 'http://localhost:8081'}/apollo-api/openapi/v1/`

/**
 * Create an Apollo API request context.
 * The batata-plugin-apollo OpenAPI server does not enforce an Authorization
 * header, so no token is required by default.
 */
export async function apolloApiRequest(): Promise<APIRequestContext> {
  return pwRequest.newContext({
    baseURL: APOLLO_BASE,
    extraHTTPHeaders: { 'Content-Type': 'application/json' },
  })
}

// ---------------------------------------------------------------------------
// App helpers
// ---------------------------------------------------------------------------

export async function createApp(
  ctx: APIRequestContext,
  appId: string,
  name = appId,
): Promise<boolean> {
  // Upstream `OpenCreateAppDTO` wraps the app in an `app` field (plus optional
  // `admins` / `assignAppRoleToSelf`). A flat body deserializes with
  // "missing field `app`" -> 400.
  const res = await ctx.post('apps', {
    data: {
      app: {
        appId,
        name,
        ownerName: 'e2e',
        ownerEmail: 'e2e@batata.local',
        orgId: 'default',
        orgName: 'default',
      },
    },
  })
  return res.ok()
}

export async function deleteApp(ctx: APIRequestContext, appId: string): Promise<boolean> {
  const res = await ctx.delete(`apps/${encodeURIComponent(appId)}`)
  return res.ok()
}

export async function listApps(ctx: APIRequestContext): Promise<Array<{ appId: string }>> {
  const res = await ctx.get('apps')
  if (!res.ok()) return []
  return (await res.json()) as Array<{ appId: string }>
}

// ---------------------------------------------------------------------------
// Namespace helpers
// ---------------------------------------------------------------------------

export async function createNamespace(
  ctx: APIRequestContext,
  appId: string,
  env: string,
  cluster: string,
  name: string,
): Promise<boolean> {
  // `OpenAppNamespaceDTO` requires appId + dataChangeCreatedBy in the body,
  // even though appId/env/cluster are already present in the path.
  const res = await ctx.post(
    `envs/${encodeURIComponent(env)}/apps/${encodeURIComponent(appId)}/clusters/${encodeURIComponent(cluster)}/namespaces`,
    { data: { appId, name, dataChangeCreatedBy: 'e2e', comment: 'e2e' } },
  )
  if (res.ok()) return true
  // `createApp` already provisions the default `application` namespace, so
  // re-creating it is a 400 "already exists". Setup only needs it to exist.
  if (res.status() === 400) {
    const body = await res.text().catch(() => '')
    if (body.includes('already exists')) return true
  }
  return false
}

// ---------------------------------------------------------------------------
// Item helpers
// ---------------------------------------------------------------------------

export async function createItem(
  ctx: APIRequestContext,
  appId: string,
  env: string,
  cluster: string,
  namespace: string,
  key: string,
  value: string,
): Promise<boolean> {
  const res = await ctx.post(
    `envs/${encodeURIComponent(env)}/apps/${encodeURIComponent(appId)}/clusters/${encodeURIComponent(cluster)}/namespaces/${encodeURIComponent(namespace)}/items`,
    { data: { key, value, comment: 'e2e', type: 0 } },
  )
  return res.ok()
}

export async function deleteItem(
  ctx: APIRequestContext,
  appId: string,
  env: string,
  cluster: string,
  namespace: string,
  key: string,
): Promise<boolean> {
  const res = await ctx.delete(
    `envs/${encodeURIComponent(env)}/apps/${encodeURIComponent(appId)}/clusters/${encodeURIComponent(cluster)}/namespaces/${encodeURIComponent(namespace)}/items/${encodeURIComponent(key)}`,
  )
  return res.ok()
}

// ---------------------------------------------------------------------------
// App Namespace helpers
// ---------------------------------------------------------------------------

export async function createAppNamespace(
  ctx: APIRequestContext,
  appId: string,
  name: string,
): Promise<boolean> {
  // `OpenAppNamespaceDTO` requires appId + dataChangeCreatedBy in the body.
  const res = await ctx.post(`apps/${encodeURIComponent(appId)}/appnamespaces`, {
    data: {
      appId,
      name,
      format: 'properties',
      isPublic: false,
      comment: 'e2e',
      dataChangeCreatedBy: 'e2e',
    },
  })
  return res.ok()
}

export async function deleteAppNamespace(
  ctx: APIRequestContext,
  appId: string,
  name: string,
): Promise<boolean> {
  const res = await ctx.delete(
    `apps/${encodeURIComponent(appId)}/appnamespaces/${encodeURIComponent(name)}`,
  )
  return res.ok()
}

// ---------------------------------------------------------------------------
// Gray / Branch helpers
// ---------------------------------------------------------------------------

export async function createBranch(
  ctx: APIRequestContext,
  appId: string,
  env: string,
  cluster: string,
  namespace: string,
  branchName = 'gray',
): Promise<boolean> {
  const res = await ctx.post(
    `envs/${encodeURIComponent(env)}/apps/${encodeURIComponent(appId)}/clusters/${encodeURIComponent(cluster)}/namespaces/${encodeURIComponent(namespace)}/branches`,
    { data: { branchName, operator: 'admin' } },
  )
  return res.ok()
}

export async function deleteBranch(
  ctx: APIRequestContext,
  appId: string,
  env: string,
  cluster: string,
  namespace: string,
  branchName = 'gray',
): Promise<boolean> {
  const res = await ctx.delete(
    `envs/${encodeURIComponent(env)}/apps/${encodeURIComponent(appId)}/clusters/${encodeURIComponent(cluster)}/namespaces/${encodeURIComponent(namespace)}/branches/${encodeURIComponent(branchName)}`,
  )
  return res.ok()
}

// ---------------------------------------------------------------------------
// Consumers / Import / Export / Search helpers
// ---------------------------------------------------------------------------

export async function listConsumers(ctx: APIRequestContext): Promise<unknown[]> {
  const res = await ctx.get('consumers')
  if (!res.ok()) return []
  return (await res.json()) as unknown[]
}

export async function exportConfigs(
  ctx: APIRequestContext,
  appId: string,
  cluster: string,
  namespace: string,
): Promise<string> {
  const res = await ctx.get(
    `configs/${encodeURIComponent(appId)}/${encodeURIComponent(cluster)}/${encodeURIComponent(namespace)}/export`,
  )
  if (!res.ok()) return ''
  return (await res.text()) as string
}

export async function importConfigs(
  ctx: APIRequestContext,
  appId: string,
  cluster: string,
  namespace: string,
  configs: string,
): Promise<boolean> {
  // `ConfigImportDTO` takes a structured `items` array, not a properties text
  // blob. Parse the familiar `key=value` lines the specs pass in.
  const items = configs
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      const separator = line.indexOf('=')
      return {
        key: (separator < 0 ? line : line.slice(0, separator)).trim(),
        value: separator < 0 ? '' : line.slice(separator + 1).trim(),
      }
    })
  const res = await ctx.post('configs/import', {
    data: { appId, clusterName: cluster, namespaceName: namespace, items },
  })
  return res.ok()
}
