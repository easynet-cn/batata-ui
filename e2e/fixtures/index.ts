import { test as base, expect } from '@playwright/test'
import {
  ServiceListPage,
  UserListPage,
  RoleListPage,
  PermissionListPage,
  McpListPage,
  McpEditorPage,
} from './pages'
import {
  KVListPage,
  KVEditorPage,
  CatalogServiceListPage,
  CatalogNodeListPage,
  ACLTokenListPage,
  ACLTokenEditorPage,
  ACLPolicyListPage,
  ACLPolicyEditorPage,
  ACLRoleListPage,
  IntentionListPage,
  ConsulDashboardPage,
  SessionListPage,
} from './consul-pages'
import {
  apiRequest,
  type APIRequestContext,
  createService,
  deleteService,
  createUser,
  deleteUser,
  createRole,
  deleteRole,
  createPermission,
  deletePermission,
  createMcpServer,
  deleteMcpServer,
} from '../helpers/api'
import {
  consulApiRequest,
  putKV,
  deleteKV,
  createAclPolicy,
  deleteAclPolicy,
  createAclRole,
  deleteAclRole,
  createAclToken,
  deleteAclToken,
  createIntention,
  deleteIntention,
  createSession,
  destroySession,
} from '../helpers/consul-api'

export interface RegisteredResource {
  cleanup: () => Promise<void>
}

/**
 * Shared fixtures exposing page objects and an API client for test data
 * setup/cleanup. Mirrors the consul-ui e2e fixtures pattern.
 */
export const test = base.extend<{
  servicePage: ServiceListPage
  userPage: UserListPage
  rolePage: RoleListPage
  permissionPage: PermissionListPage
  mcpListPage: McpListPage
  mcpEditorPage: McpEditorPage
  kvListPage: KVListPage
  kvEditorPage: KVEditorPage
  catalogServiceListPage: CatalogServiceListPage
  catalogNodeListPage: CatalogNodeListPage
  aclTokenListPage: ACLTokenListPage
  aclTokenEditorPage: ACLTokenEditorPage
  aclPolicyListPage: ACLPolicyListPage
  aclPolicyEditorPage: ACLPolicyEditorPage
  aclRoleListPage: ACLRoleListPage
  intentionListPage: IntentionListPage
  consulDashboardPage: ConsulDashboardPage
  sessionListPage: SessionListPage
  api: APIRequestContext
  consulApi: APIRequestContext
  cleanup: Array<() => Promise<void>>
}>({
  servicePage: async ({ page }, use) => {
    await use(new ServiceListPage(page))
  },
  userPage: async ({ page }, use) => {
    await use(new UserListPage(page))
  },
  rolePage: async ({ page }, use) => {
    await use(new RoleListPage(page))
  },
  permissionPage: async ({ page }, use) => {
    await use(new PermissionListPage(page))
  },
  mcpListPage: async ({ page }, use) => {
    await use(new McpListPage(page))
  },
  mcpEditorPage: async ({ page }, use) => {
    await use(new McpEditorPage(page))
  },
  kvListPage: async ({ page }, use) => {
    await use(new KVListPage(page))
  },
  kvEditorPage: async ({ page }, use) => {
    await use(new KVEditorPage(page))
  },
  catalogServiceListPage: async ({ page }, use) => {
    await use(new CatalogServiceListPage(page))
  },
  catalogNodeListPage: async ({ page }, use) => {
    await use(new CatalogNodeListPage(page))
  },
  aclTokenListPage: async ({ page }, use) => {
    await use(new ACLTokenListPage(page))
  },
  aclTokenEditorPage: async ({ page }, use) => {
    await use(new ACLTokenEditorPage(page))
  },
  aclPolicyListPage: async ({ page }, use) => {
    await use(new ACLPolicyListPage(page))
  },
  aclPolicyEditorPage: async ({ page }, use) => {
    await use(new ACLPolicyEditorPage(page))
  },
  aclRoleListPage: async ({ page }, use) => {
    await use(new ACLRoleListPage(page))
  },
  intentionListPage: async ({ page }, use) => {
    await use(new IntentionListPage(page))
  },
  consulDashboardPage: async ({ page }, use) => {
    await use(new ConsulDashboardPage(page))
  },
  sessionListPage: async ({ page }, use) => {
    await use(new SessionListPage(page))
  },
  api: async ({}, use) => {
    const ctx = await apiRequest()
    await use(ctx)
    await ctx.dispose()
  },
  consulApi: async ({}, use) => {
    const ctx = await consulApiRequest()
    await use(ctx)
    await ctx.dispose()
  },
  cleanup: async ({}, use) => {
    const tasks: Array<() => Promise<void>> = []
    await use(tasks)
    for (const task of tasks.reverse()) {
      await task().catch(() => undefined)
    }
  },
})

export {
  expect,
  createService,
  deleteService,
  createUser,
  deleteUser,
  createRole,
  deleteRole,
  createPermission,
  deletePermission,
  createMcpServer,
  deleteMcpServer,
  putKV,
  deleteKV,
  createAclPolicy,
  deleteAclPolicy,
  createAclRole,
  deleteAclRole,
  createAclToken,
  deleteAclToken,
  createIntention,
  deleteIntention,
  createSession,
  destroySession,
}

export function uniqueName(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}
