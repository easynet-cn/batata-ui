import { request as pwRequest } from '@playwright/test'
import type { APIRequestContext } from '@playwright/test'

export type { APIRequestContext }

export const APOLLO_BASE = `${process.env.E2E_BASE_URL || 'http://localhost:8081'}/apollo-api/openapi/v1`

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
  const res = await ctx.post('/apps', {
    data: {
      appId,
      name,
      ownerName: 'e2e',
      ownerEmail: 'e2e@batata.local',
      orgId: 'default',
      orgName: 'default',
    },
  })
  return res.ok()
}

export async function deleteApp(ctx: APIRequestContext, appId: string): Promise<boolean> {
  const res = await ctx.delete(`/apps/${encodeURIComponent(appId)}`)
  return res.ok()
}

export async function listApps(ctx: APIRequestContext): Promise<Array<{ appId: string }>> {
  const res = await ctx.get('/apps')
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
  const res = await ctx.post(
    `/envs/${encodeURIComponent(env)}/apps/${encodeURIComponent(appId)}/clusters/${encodeURIComponent(cluster)}/namespaces`,
    { data: { name, comment: 'e2e' } },
  )
  return res.ok()
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
    `/envs/${encodeURIComponent(env)}/apps/${encodeURIComponent(appId)}/clusters/${encodeURIComponent(cluster)}/namespaces/${encodeURIComponent(namespace)}/items`,
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
    `/envs/${encodeURIComponent(env)}/apps/${encodeURIComponent(appId)}/clusters/${encodeURIComponent(cluster)}/namespaces/${encodeURIComponent(namespace)}/items/${encodeURIComponent(key)}`,
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
  const res = await ctx.post(`/apps/${encodeURIComponent(appId)}/appnamespaces`, {
    data: { name, format: 'properties', isPublic: false, comment: 'e2e' },
  })
  return res.ok()
}

export async function deleteAppNamespace(
  ctx: APIRequestContext,
  appId: string,
  name: string,
): Promise<boolean> {
  const res = await ctx.delete(
    `/apps/${encodeURIComponent(appId)}/appnamespaces/${encodeURIComponent(name)}`,
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
    `/envs/${encodeURIComponent(env)}/apps/${encodeURIComponent(appId)}/clusters/${encodeURIComponent(cluster)}/namespaces/${encodeURIComponent(namespace)}/branches`,
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
    `/envs/${encodeURIComponent(env)}/apps/${encodeURIComponent(appId)}/clusters/${encodeURIComponent(cluster)}/namespaces/${encodeURIComponent(namespace)}/branches/${encodeURIComponent(branchName)}`,
  )
  return res.ok()
}

// ---------------------------------------------------------------------------
// Consumers / Import / Export / Search helpers
// ---------------------------------------------------------------------------

export async function listConsumers(ctx: APIRequestContext): Promise<unknown[]> {
  const res = await ctx.get('/consumers')
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
    `/configs/${encodeURIComponent(appId)}/${encodeURIComponent(cluster)}/${encodeURIComponent(namespace)}/export`,
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
  const res = await ctx.post('/configs/import', {
    data: {
      appId,
      clusterName: cluster,
      namespaceName: namespace,
      format: 'properties',
      conflictAction: 'OVERWRITE',
      configs,
    },
  })
  return res.ok()
}
