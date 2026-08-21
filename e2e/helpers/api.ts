import { request as pwRequest } from '@playwright/test'
import type { APIRequestContext } from '@playwright/test'

export type { APIRequestContext }

export const ADMIN_USER = 'nacos'
export const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || 'nacos'
export const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:8081'
export const AUTH_BASE = `${BASE_URL}/v3/auth`

export const STORAGE_KEYS = {
  token: 'batata-token',
  username: 'batata-username',
  user: 'batata_user',
  provider: 'batata_provider',
  lang: 'batata_lang',
  namespace: 'batata_current_ns',
} as const

export interface LoginResult {
  accessToken: string
  tokenTtl?: number
  globalAdmin?: boolean
  username?: string
}

export async function waitForServer(ctx: APIRequestContext, timeoutMs = 90_000): Promise<void> {
  const deadline = Date.now() + timeoutMs
  let lastError: unknown
  while (Date.now() < deadline) {
    try {
      const res = await ctx.get(`${BASE_URL}/v3/console/health/liveness`, { timeout: 5_000 })
      if (res.ok()) return
      lastError = new Error(`health check returned ${res.status()}`)
    } catch (e) {
      lastError = e
    }
    await new Promise((r) => setTimeout(r, 2_000))
  }
  throw new Error(
    `batata-server not ready at ${BASE_URL} within ${timeoutMs}ms: ${String(lastError)}`,
  )
}

/**
 * Idempotent admin bootstrap. Fails silently when the admin user already exists.
 */
export async function ensureAdminInitialized(ctx: APIRequestContext): Promise<void> {
  const res = await ctx.post(`${AUTH_BASE}/user/admin`, {
    form: { username: ADMIN_USER, password: ADMIN_PASSWORD },
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  if (res.status() === 409 || res.status() === 200) return
  const body = await res.text()
  throw new Error(`admin init failed (${res.status()}): ${body}`)
}

export async function login(ctx: APIRequestContext): Promise<LoginResult> {
  const res = await ctx.post(`${AUTH_BASE}/user/login`, {
    form: { username: ADMIN_USER, password: ADMIN_PASSWORD },
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  if (!res.ok()) {
    const body = await res.text()
    throw new Error(`login failed (${res.status()}): ${body}`)
  }
  return (await res.json()) as LoginResult
}

export async function loginWith(ctx: APIRequestContext, password: string): Promise<LoginResult> {
  const res = await ctx.post(`${AUTH_BASE}/user/login`, {
    form: { username: ADMIN_USER, password },
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  return (await res.json()) as LoginResult
}

export async function loginAs(
  ctx: APIRequestContext,
  username: string,
  password: string,
): Promise<LoginResult> {
  const res = await ctx.post(`${AUTH_BASE}/user/login`, {
    form: { username, password },
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  if (!res.ok()) {
    const body = await res.text()
    throw new Error(`login as ${username} failed (${res.status()}): ${body}`)
  }
  return (await res.json()) as LoginResult
}

export async function apiRequest(): Promise<APIRequestContext> {
  const temp = await pwRequest.newContext({ baseURL: BASE_URL })
  const token = await login(temp)
  await temp.dispose()
  return pwRequest.newContext({
    baseURL: BASE_URL,
    extraHTTPHeaders: { accessToken: token.accessToken, username: ADMIN_USER },
  })
}

// ---------------------------------------------------------------------------
// CRUD helpers for test data setup/cleanup
// ---------------------------------------------------------------------------

export interface ServiceParams {
  serviceName: string
  groupName?: string
  namespaceId?: string
  protectThreshold?: number
  metadata?: string
}

export async function createService(
  ctx: APIRequestContext,
  params: ServiceParams,
): Promise<boolean> {
  const res = await ctx.post('/v3/console/ns/service', {
    data: {
      serviceName: params.serviceName,
      groupName: params.groupName || 'DEFAULT_GROUP',
      namespaceId: params.namespaceId || '',
      protectThreshold: params.protectThreshold ?? 0,
      metadata: params.metadata || '',
    },
  })
  return res.ok()
}

export async function deleteService(
  ctx: APIRequestContext,
  serviceName: string,
  groupName = 'DEFAULT_GROUP',
  namespaceId = '',
): Promise<boolean> {
  const res = await ctx.delete('/v3/console/ns/service', {
    params: { serviceName, groupName, namespaceId },
  })
  return res.ok()
}

export async function createUser(
  ctx: APIRequestContext,
  username: string,
  password: string,
): Promise<boolean> {
  const res = await ctx.post('/v3/auth/user', {
    form: { username, password },
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  return res.ok()
}

export async function deleteUser(ctx: APIRequestContext, username: string): Promise<boolean> {
  const res = await ctx.delete('/v3/auth/user', { params: { username } })
  return res.ok()
}

export async function createRole(
  ctx: APIRequestContext,
  role: string,
  username: string,
): Promise<boolean> {
  const res = await ctx.post('/v3/auth/role', {
    form: { role, username },
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  return res.ok()
}

export async function deleteRole(
  ctx: APIRequestContext,
  role: string,
  username: string,
): Promise<boolean> {
  const res = await ctx.delete('/v3/auth/role', { params: { role, username } })
  return res.ok()
}

export async function createPermission(
  ctx: APIRequestContext,
  role: string,
  resource = '*:*:*',
  action = 'r',
): Promise<boolean> {
  const res = await ctx.post('/v3/auth/permission', {
    form: { role, resource, action },
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  return res.ok()
}

export async function deletePermission(
  ctx: APIRequestContext,
  role: string,
  resource = '*:*:*',
  action = 'r',
): Promise<boolean> {
  const res = await ctx.delete('/v3/auth/permission', { params: { role, resource, action } })
  return res.ok()
}

export interface McpServerPayload {
  name: string
  type?: string
  namespace?: string
  description?: string
  enabled?: boolean
  url?: string
  command?: string
  autoDiscoverTools?: boolean
}

export async function createMcpServer(
  ctx: APIRequestContext,
  payload: McpServerPayload,
): Promise<boolean> {
  const res = await ctx.post('/v3/console/ai/mcp', {
    data: {
      name: payload.name,
      namespace: payload.namespace || 'default',
      type: payload.type || 'off',
      description: payload.description || '',
      enabled: payload.enabled ?? true,
      autoDiscoverTools: payload.autoDiscoverTools ?? true,
      ...(payload.url ? { url: payload.url } : {}),
      ...(payload.command ? { command: payload.command } : {}),
    },
  })
  return res.ok()
}

export async function deleteMcpServer(
  ctx: APIRequestContext,
  name: string,
  namespace = 'default',
): Promise<boolean> {
  const res = await ctx.delete('/v3/console/ai/mcp', {
    params: { namespaceId: namespace, mcpName: name },
  })
  return res.ok()
}

export async function listMcpServers(
  ctx: APIRequestContext,
  search?: string,
): Promise<Array<{ name: string }>> {
  const res = await ctx.get('/v3/console/ai/mcp/list', {
    params: {
      pageNo: 1,
      pageSize: 100,
      namespaceId: '',
      ...(search ? { mcpName: search, search: 'blur' } : {}),
    },
  })
  if (!res.ok()) return []
  const data = (await res.json()) as { data?: { pageItems?: Array<{ name: string }> } }
  return data.data?.pageItems || []
}

// ---------------------------------------------------------------------------
// Config CRUD helpers
// ---------------------------------------------------------------------------

export interface ConfigPayload {
  dataId: string
  groupName?: string
  content: string
  type?: string
  namespaceId?: string
  appName?: string
  desc?: string
  configTags?: string
}

export async function createConfig(
  ctx: APIRequestContext,
  payload: ConfigPayload,
): Promise<boolean> {
  const res = await ctx.post('/v3/console/cs/config', {
    form: {
      dataId: payload.dataId,
      groupName: payload.groupName || 'DEFAULT_GROUP',
      content: payload.content,
      ...(payload.type ? { type: payload.type } : {}),
      ...(payload.namespaceId ? { namespaceId: payload.namespaceId } : {}),
      ...(payload.appName ? { appName: payload.appName } : {}),
      ...(payload.desc ? { desc: payload.desc } : {}),
      ...(payload.configTags ? { configTags: payload.configTags } : {}),
    },
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  return res.ok()
}

export async function updateConfig(
  ctx: APIRequestContext,
  payload: ConfigPayload,
): Promise<boolean> {
  const res = await ctx.post('/v3/console/cs/config', {
    form: {
      dataId: payload.dataId,
      groupName: payload.groupName || 'DEFAULT_GROUP',
      content: payload.content,
      ...(payload.type ? { type: payload.type } : {}),
      ...(payload.namespaceId ? { namespaceId: payload.namespaceId } : {}),
      ...(payload.appName ? { appName: payload.appName } : {}),
      ...(payload.desc ? { desc: payload.desc } : {}),
      ...(payload.configTags ? { configTags: payload.configTags } : {}),
    },
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  return res.ok()
}

export async function deleteConfig(
  ctx: APIRequestContext,
  dataId: string,
  groupName = 'DEFAULT_GROUP',
  namespaceId = 'public',
): Promise<boolean> {
  const res = await ctx.delete('/v3/console/cs/config', {
    params: { dataId, groupName, namespaceId },
  })
  return res.ok()
}

export async function getConfigDetail(
  ctx: APIRequestContext,
  dataId: string,
  groupName = 'DEFAULT_GROUP',
  namespaceId = 'public',
): Promise<{ code: number; data: { content?: string } | null }> {
  const res = await ctx.get('/v3/console/cs/config', {
    params: { dataId, groupName, namespaceId },
  })
  return (await res.json()) as { code: number; data: { content?: string } | null }
}

export async function listConfigs(
  ctx: APIRequestContext,
  params: { dataId?: string; groupName?: string; namespaceId?: string } = {},
): Promise<{ totalCount: number; pageItems: Array<{ dataId: string }> }> {
  const res = await ctx.get('/v3/console/cs/config/list', {
    params: {
      pageNo: 1,
      pageSize: 20,
      namespaceId: 'public',
      ...params,
    },
  })
  const body = (await res.json()) as {
    data: { totalCount: number; pageItems: Array<{ dataId: string }> }
  }
  return body.data || { totalCount: 0, pageItems: [] }
}

export async function listConfigHistory(
  ctx: APIRequestContext,
  params: { dataId: string; groupName?: string; namespaceId?: string },
): Promise<Array<{ id: number; opType: string; content?: string }>> {
  const res = await ctx.get('/v3/console/cs/history/list', {
    params: {
      pageNo: 1,
      pageSize: 20,
      groupName: 'DEFAULT_GROUP',
      namespaceId: 'public',
      ...params,
    },
  })
  const body = (await res.json()) as { data: { pageItems?: Array<{ id: number; opType: string }> } }
  return body.data?.pageItems || []
}

export async function rollbackConfig(
  ctx: APIRequestContext,
  nid: number,
  dataId: string,
  groupName = 'DEFAULT_GROUP',
  namespaceId = 'public',
): Promise<boolean> {
  const res = await ctx.post('/v3/console/cs/history/rollback', {
    params: { nid, dataId, groupName, namespaceId },
  })
  return res.ok()
}

// ---------------------------------------------------------------------------
// Namespace CRUD helpers
// ---------------------------------------------------------------------------

export async function createNamespace(
  ctx: APIRequestContext,
  data: { namespaceId?: string; namespaceName: string; namespaceDesc?: string },
): Promise<boolean> {
  const res = await ctx.post('/v3/console/core/namespace', {
    form: {
      ...(data.namespaceId ? { customNamespaceId: data.namespaceId } : {}),
      namespaceName: data.namespaceName,
      ...(data.namespaceDesc ? { namespaceDesc: data.namespaceDesc } : {}),
    },
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  return res.ok()
}

export async function deleteNamespace(
  ctx: APIRequestContext,
  namespaceId: string,
): Promise<boolean> {
  const res = await ctx.delete('/v3/console/core/namespace', { params: { namespaceId } })
  return res.ok()
}

export async function listNamespaces(
  ctx: APIRequestContext,
): Promise<Array<{ namespace: string; namespaceShowName: string }>> {
  const res = await ctx.get('/v3/console/core/namespace/list')
  const body = (await res.json()) as {
    data: Array<{ namespace: string; namespaceShowName: string }>
  }
  return body.data || []
}

// ---------------------------------------------------------------------------
// Service instance helpers
// ---------------------------------------------------------------------------

export interface InstanceParams {
  serviceName: string
  groupName?: string
  namespaceId?: string
  ip: string
  port: number
  weight?: number
  enabled?: boolean
  clusterName?: string
  ephemeral?: boolean
  metadata?: Record<string, string>
}

// The console upserts instances via PUT /ns/instance (JSON), which both
// registers a new instance and updates an existing one.
export async function registerInstance(
  ctx: APIRequestContext,
  params: InstanceParams,
): Promise<boolean> {
  const res = await ctx.put('/v3/console/ns/instance', {
    data: {
      serviceName: params.serviceName,
      groupName: params.groupName || 'DEFAULT_GROUP',
      namespaceId: params.namespaceId ?? '',
      ip: params.ip,
      port: params.port,
      weight: params.weight ?? 1,
      enabled: params.enabled ?? true,
      clusterName: params.clusterName || 'DEFAULT',
      ephemeral: params.ephemeral ?? false,
      ...(params.metadata ? { metadata: params.metadata } : {}),
    },
  })
  return res.ok()
}

export async function deregisterInstance(
  ctx: APIRequestContext,
  params: InstanceParams,
): Promise<boolean> {
  const res = await ctx.delete('/v3/console/ns/instance', {
    params: {
      serviceName: params.serviceName,
      groupName: params.groupName || 'DEFAULT_GROUP',
      namespaceId: params.namespaceId ?? '',
      ip: params.ip,
      port: params.port,
      clusterName: params.clusterName || 'DEFAULT',
    },
  })
  return res.ok()
}
