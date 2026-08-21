import { test, expect } from '../fixtures'
import {
  createConfig,
  deleteConfig,
  createNamespace,
  deleteNamespace,
  listConfigs,
} from '../helpers/api'

const SUFFIX = Date.now().toString(36)
const DATA_ID = `e2e-config-clone-${SUFFIX}.yaml`
const GROUP = 'DEFAULT_GROUP'
const CONTENT = 'clone: true\n'
const NS_ID = `e2e-clone-ns-${SUFFIX}`
const NS_NAME = `E2E Clone ${SUFFIX}`

test.describe('config clone', () => {
  test('clone a config into another namespace', async ({ page, api, cleanup }) => {
    // ---- Setup: a source config in public and a target namespace ----
    cleanup.push(async () => {
      await deleteConfig(api, DATA_ID, GROUP, 'public')
    })
    expect(await createConfig(api, { dataId: DATA_ID, groupName: GROUP, content: CONTENT })).toBe(
      true,
    )

    cleanup.push(async () => {
      await deleteNamespace(api, NS_ID)
    })
    cleanup.push(async () => {
      await deleteConfig(api, DATA_ID, GROUP, NS_ID)
    })
    expect(await createNamespace(api, { namespaceId: NS_ID, namespaceName: NS_NAME })).toBe(true)

    // ---- Open the clone modal from the config list ----
    await page.goto('/configs')
    await page.getByPlaceholder('Data ID').fill(DATA_ID)
    await page.getByRole('button', { name: 'Search' }).click()
    const row = page.locator('tbody tr').filter({ hasText: DATA_ID })
    await expect(row).toHaveCount(1)

    await row.getByTitle('Clone').click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // ---- Pick the target namespace and confirm the clone ----
    await dialog.locator('select').first().selectOption({ label: NS_NAME })
    await dialog.getByRole('button', { name: 'Clone' }).click()
    await expect(dialog).toBeHidden()

    // ---- The clone exists in the target namespace (verified via API) ----
    const list = await listConfigs(api, { dataId: DATA_ID, namespaceId: NS_ID })
    expect(list.pageItems.some((c) => c.dataId === DATA_ID)).toBe(true)
  })
})
