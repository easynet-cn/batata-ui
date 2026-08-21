import { request as pwRequest } from '@playwright/test'
import type { APIRequestContext } from '@playwright/test'

export type { APIRequestContext }

export const CONSUL_BASE = `${process.env.E2E_BASE_URL || 'http://localhost:8081'}/consul-api/v1`

/**
 * Create a Consul API request context.
 * When ACL is disabled, no token is needed.
 * When ACL is enabled, pass the token via X-Consul-Token header.
 */
export async function consulApiRequest(token?: string): Promise<APIRequestContext> {
  return pwRequest.newContext({
    baseURL: CONSUL_BASE,
    extraHTTPHeaders: {
      ...(token ? { 'X-Consul-Token': token } : {}),
      'Content-Type': 'application/json',
    },
  })
}

// ---------------------------------------------------------------------------
// KV Store helpers
// ---------------------------------------------------------------------------

export async function putKV(
  ctx: APIRequestContext,
  key: string,
  value: string,
  flags = 0,
): Promise<boolean> {
  const res = await ctx.put(`/kv/${encodeURIComponent(key)}`, {
    params: flags ? { flags } : undefined,
    data: value,
    headers: { 'Content-Type': 'text/plain' },
  })
  return res.ok()
}

export async function deleteKV(ctx: APIRequestContext, key: string): Promise<boolean> {
  const res = await ctx.delete(`/kv/${encodeURIComponent(key)}`)
  return res.ok()
}

export async function getKV(ctx: APIRequestContext, key: string): Promise<string | null> {
  const res = await ctx.get(`/kv/${encodeURIComponent(key)}`, { params: { raw: '' } })
  if (!res.ok()) return null
  return res.text()
}

export async function listKV(ctx: APIRequestContext, prefix = ''): Promise<string[]> {
  const res = await ctx.get('/kv/', { params: { keys: '', ...(prefix ? { prefix } : {}) } })
  if (!res.ok()) return []
  return (await res.json()) as string[]
}

// ---------------------------------------------------------------------------
// ACL helpers
// ---------------------------------------------------------------------------

export async function listAclPolicies(
  ctx: APIRequestContext,
): Promise<Array<{ ID: string; Name: string }>> {
  const res = await ctx.get('/acl/policies')
  if (!res.ok()) return []
  const data = (await res.json()) as { policies?: Array<{ ID: string; Name: string }> }
  return data.policies || []
}

export async function createAclPolicy(
  ctx: APIRequestContext,
  payload: { Name: string; Description?: string; Rules?: string; Datacenters?: string[] },
): Promise<string | null> {
  const res = await ctx.put('/acl/policy', { data: payload })
  if (!res.ok()) return null
  const data = (await res.json()) as { ID?: string }
  return data.ID ?? null
}

export async function deleteAclPolicy(ctx: APIRequestContext, id: string): Promise<boolean> {
  const res = await ctx.delete(`/acl/policy/${id}`)
  return res.ok()
}

export async function listAclRoles(
  ctx: APIRequestContext,
): Promise<Array<{ ID: string; Name: string }>> {
  const res = await ctx.get('/acl/roles')
  if (!res.ok()) return []
  const data = (await res.json()) as { roles?: Array<{ ID: string; Name: string }> }
  return data.roles || []
}

export async function createAclRole(
  ctx: APIRequestContext,
  payload: { Name: string; Description?: string },
): Promise<string | null> {
  const res = await ctx.put('/acl/role', { data: payload })
  if (!res.ok()) return null
  const data = (await res.json()) as { ID?: string }
  return data.ID ?? null
}

export async function deleteAclRole(ctx: APIRequestContext, id: string): Promise<boolean> {
  const res = await ctx.delete(`/acl/role/${id}`)
  return res.ok()
}

export async function listAclTokens(
  ctx: APIRequestContext,
): Promise<Array<{ AccessorID: string }>> {
  const res = await ctx.get('/acl/tokens')
  if (!res.ok()) return []
  const data = (await res.json()) as { tokens?: Array<{ AccessorID: string }> }
  return data.tokens || []
}

export async function createAclToken(
  ctx: APIRequestContext,
  payload: { Description: string; Policies?: Array<{ ID: string }>; Roles?: Array<{ ID: string }> },
): Promise<{ AccessorID: string; SecretID: string } | null> {
  const res = await ctx.put('/acl/token', { data: payload })
  if (!res.ok()) return null
  return (await res.json()) as { AccessorID: string; SecretID: string }
}

export async function deleteAclToken(ctx: APIRequestContext, accessorId: string): Promise<boolean> {
  const res = await ctx.delete(`/acl/token/${accessorId}`)
  return res.ok()
}

// ---------------------------------------------------------------------------
// Intentions helpers
// ---------------------------------------------------------------------------

export async function listIntentions(
  ctx: APIRequestContext,
): Promise<Array<{ ID: string; SourceName: string; DestinationName: string }>> {
  const res = await ctx.get('/connect/intentions')
  if (!res.ok()) return []
  const data = (await res.json()) as {
    intentions?: Array<{ ID: string; SourceName: string; DestinationName: string }>
  }
  return data.intentions || []
}

export async function createIntention(
  ctx: APIRequestContext,
  payload: {
    SourceName: string
    DestinationName: string
    Action: 'allow' | 'deny'
    Description?: string
  },
): Promise<string | null> {
  const res = await ctx.post('/connect/intentions', { data: payload })
  if (!res.ok()) return null
  const data = (await res.json()) as { ID?: string }
  return data.ID ?? null
}

export async function deleteIntention(ctx: APIRequestContext, id: string): Promise<boolean> {
  const res = await ctx.delete(`/connect/intentions/${id}`)
  return res.ok()
}

// ---------------------------------------------------------------------------
// Session helpers
// ---------------------------------------------------------------------------

export async function listSessions(ctx: APIRequestContext): Promise<Array<{ ID: string }>> {
  const res = await ctx.get('/session/list')
  if (!res.ok()) return []
  const data = (await res.json()) as Array<{ ID: string }>
  return Array.isArray(data) ? data : []
}

export async function createSession(
  ctx: APIRequestContext,
  payload: { Name?: string; Node?: string; TTL?: string; Behavior?: 'Release' | 'Delete' },
): Promise<string | null> {
  const res = await ctx.put('/session/create', { data: payload })
  if (!res.ok()) return null
  const data = (await res.json()) as { ID?: string }
  return data.ID ?? null
}

export async function destroySession(ctx: APIRequestContext, id: string): Promise<boolean> {
  const res = await ctx.put(`/session/destroy/${id}`)
  return res.ok()
}

// ---------------------------------------------------------------------------
// Catalog helpers
// ---------------------------------------------------------------------------

export async function listCatalogServices(
  ctx: APIRequestContext,
): Promise<Record<string, unknown>> {
  const res = await ctx.get('/catalog/services')
  if (!res.ok()) return {}
  return (await res.json()) as Record<string, unknown>
}

export async function listCatalogNodes(
  ctx: APIRequestContext,
): Promise<Array<{ Node: string; Address: string }>> {
  const res = await ctx.get('/catalog/nodes')
  if (!res.ok()) return []
  return (await res.json()) as Array<{ Node: string; Address: string }>
}

export async function getConsulLeader(ctx: APIRequestContext): Promise<string | null> {
  const res = await ctx.get('/status/leader')
  if (!res.ok()) return null
  return res.text()
}
