import { test, expect } from '../fixtures'
import type { Page } from '@playwright/test'
import {
  createUser,
  deleteUser,
  createRole,
  deleteRole,
  createPermission,
  deletePermission,
  createConfig,
  deleteConfig,
  loginAs,
} from '../helpers/api'

const SUFFIX = Date.now().toString(36)
const USERNAME = `e2e-rbac-${SUFFIX}`
const PASSWORD = 'E2e@123456'
const ROLE = `${USERNAME}-role`
const DATA_ID = `e2e-rbac-config-${SUFFIX}.yaml`
const GROUP = 'DEFAULT_GROUP'
const CONTENT = 'rbac: protected\n'

async function seedNonAdmin(page: Page, token: string): Promise<void> {
  await page.addInitScript(
    (args: { token: string; username: string }) => {
      localStorage.setItem('batata_provider', 'batata')
      localStorage.setItem('batata-token', args.token)
      localStorage.setItem('batata-username', args.username)
      localStorage.setItem(
        'batata_user',
        JSON.stringify({ name: args.username, globalAdmin: false }),
      )
    },
    { token, username: USERNAME },
  )
}

test.describe('rbac permission enforcement', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('non-admin is blocked from admin routes and needs permission to read configs', async ({
    page,
    api,
    cleanup,
  }) => {
    // ---- Admin setup: a non-admin user and a protected config in public ----
    cleanup.push(async () => {
      await deleteUser(api, USERNAME)
    })
    expect(await createUser(api, USERNAME, PASSWORD)).toBe(true)
    cleanup.push(async () => {
      await deleteConfig(api, DATA_ID, GROUP, 'public')
    })
    expect(await createConfig(api, { dataId: DATA_ID, groupName: GROUP, content: CONTENT })).toBe(
      true,
    )

    const { accessToken } = await loginAs(api, USERNAME, PASSWORD)
    await seedNonAdmin(page, accessToken)

    // ---- Admin-only routes are blocked client-side (redirected to dashboard) ----
    await page.goto('/users')
    await expect(page).toHaveURL(/\/$/)
    await page.goto('/roles')
    await expect(page).toHaveURL(/\/$/)
    await page.goto('/permissions')
    await expect(page).toHaveURL(/\/$/)

    // ---- Without a permission the user cannot list the protected config ----
    await page.goto('/configs')
    await page.getByPlaceholder('Data ID').fill(DATA_ID)
    await page.getByRole('button', { name: 'Search' }).click()
    await expect(page.locator('tbody tr').filter({ hasText: DATA_ID })).toHaveCount(0)

    // ---- Grant a read/write permission on public configs ----
    cleanup.push(async () => {
      await deleteRole(api, ROLE, USERNAME)
    })
    cleanup.push(async () => {
      await deletePermission(api, ROLE, 'public:*:config/*', 'rw')
    })
    expect(await createRole(api, ROLE, USERNAME)).toBe(true)
    expect(await createPermission(api, ROLE, 'public:*:config/*', 'rw')).toBe(true)

    // ---- The same user can now read the protected config ----
    await page.reload()
    await page.getByPlaceholder('Data ID').fill(DATA_ID)
    await page.getByRole('button', { name: 'Search' }).click()
    await expect(page.locator('tbody tr').filter({ hasText: DATA_ID })).toHaveCount(1)
  })
})
