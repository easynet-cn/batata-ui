import { test, expect } from '../fixtures'
import { createNamespace, deleteNamespace, createConfig, deleteConfig } from '../helpers/api'

const SUFFIX = Date.now().toString(36)
const NS_ID = `e2e-ns-iso-${SUFFIX}`
const NS_NAME = `E2E Isolation ${SUFFIX}`
const DATA_ID = `e2e-config-iso-${SUFFIX}.yaml`
const GROUP = 'DEFAULT_GROUP'
const CONTENT = 'isolated: true\n'

test.describe('namespace switching and config isolation', () => {
  test('config created in a namespace is only visible within that namespace', async ({
    page,
    api,
    cleanup,
  }) => {
    // ---- Create the namespace, then a config inside it (admin context) ----
    cleanup.push(async () => {
      await deleteNamespace(api, NS_ID)
    })
    expect(await createNamespace(api, { namespaceId: NS_ID, namespaceName: NS_NAME })).toBe(true)
    cleanup.push(async () => {
      await deleteConfig(api, DATA_ID, GROUP, NS_ID)
    })
    expect(
      await createConfig(api, {
        dataId: DATA_ID,
        groupName: GROUP,
        content: CONTENT,
        namespaceId: NS_ID,
      }),
    ).toBe(true)

    // Namespace must be loaded by the layout before we can switch to it.
    await page.goto('/configs')

    // ---- Switch active namespace via the header selector ----
    await page.getByRole('button', { name: /namespace:/i }).click()
    await page.getByRole('button', { name: NS_NAME }).click()

    // ---- The config is listed within its own namespace ----
    await page.getByPlaceholder('Data ID').fill(DATA_ID)
    await page.getByRole('button', { name: 'Search' }).click()
    await expect(page.locator('tbody tr').filter({ hasText: DATA_ID })).toHaveCount(1)

    // ---- Switching back to the public namespace hides it ----
    await page.getByRole('button', { name: /namespace:/i }).click()
    await page.getByRole('button', { name: 'public' }).click()

    await page.getByPlaceholder('Data ID').fill(DATA_ID)
    await page.getByRole('button', { name: 'Search' }).click()
    await expect(page.locator('tbody tr').filter({ hasText: DATA_ID })).toHaveCount(0)
  })
})
