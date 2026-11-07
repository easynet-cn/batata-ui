import { test, expect } from '../fixtures'
import {
  createConfig,
  updateConfig,
  deleteConfig,
  listConfigs,
  createNamespace,
  deleteNamespace,
} from '../helpers/api'

const SUFFIX = Date.now().toString(36)
const DATA_ID = `e2e-config-detail-${SUFFIX}.yaml`
const GROUP = 'DEFAULT_GROUP'
const NS_ID = `e2e-detail-ns-${SUFFIX}`
const NS_NAME = `E2E Detail ${SUFFIX}`
const CONTENT_V1 = 'app.name: detail\napp.version: 1\n'
const CONTENT_V2 = 'app.name: detail\napp.version: 2\n'

test.describe('config detail', () => {
  test('detail page shows info and supports version compare, cross compare, and clone', async ({
    page,
    api,
    cleanup,
  }) => {
    // ---- Setup: two versions of a config + a target namespace ----
    cleanup.push(async () => {
      await deleteConfig(api, DATA_ID, GROUP, 'public')
    })
    expect(
      await createConfig(api, { dataId: DATA_ID, groupName: GROUP, content: CONTENT_V1 }),
    ).toBe(true)
    expect(
      await updateConfig(api, { dataId: DATA_ID, groupName: GROUP, content: CONTENT_V2 }),
    ).toBe(true)

    cleanup.push(async () => {
      await deleteNamespace(api, NS_ID)
    })
    cleanup.push(async () => {
      await deleteConfig(api, DATA_ID, GROUP, NS_ID)
    })
    expect(await createNamespace(api, { namespaceId: NS_ID, namespaceName: NS_NAME })).toBe(true)

    // ---- Open the detail page for the published config ----
    await page.goto(`/config/detail?dataId=${DATA_ID}&groupName=${GROUP}&namespaceId=public`)
    await expect(page).toHaveURL(/\/config\/detail/)

    // ---- Basic info + content render ----
    await expect(page.getByText('Config Detail')).toBeVisible()
    await expect(page.getByText(DATA_ID).first()).toBeVisible()
    await expect(page.getByText('Config Content')).toBeVisible()

    // ---- Version compare: opens a diff modal (previous version vs current) ----
    await page.getByRole('button', { name: 'Version Compare' }).click()
    const versionModal = page.locator('.modal-backdrop')
    await expect(versionModal).toBeVisible()
    await expect(versionModal.getByRole('button', { name: 'Close' })).toBeVisible()
    await versionModal.getByRole('button', { name: 'Close' }).click()
    await expect(versionModal).toBeHidden()

    // ---- Cross-config compare: form modal -> result diff modal ----
    await page.getByRole('button', { name: 'Config Compare' }).click()
    const formDialog = page.getByRole('dialog')
    await expect(formDialog).toBeVisible()
    await expect(formDialog.getByText('Config Compare')).toBeVisible()
    await formDialog.getByPlaceholder('Target Data ID').fill(DATA_ID)
    await formDialog.getByRole('button', { name: 'Compare' }).click()
    const crossModal = page.locator('.modal-backdrop')
    await expect(crossModal).toBeVisible()
    await crossModal.getByRole('button', { name: 'Close' }).click()
    await expect(crossModal).toBeHidden()

    // ---- Clone from detail into the target namespace ----
    await page.getByRole('button', { name: 'Clone' }).click()
    const cloneDialog = page.getByRole('dialog')
    await expect(cloneDialog).toBeVisible()
    await expect(cloneDialog.getByText('Clone Configuration')).toBeVisible()
    await cloneDialog.locator('select').first().selectOption({ label: NS_NAME })
    await cloneDialog.getByRole('button', { name: 'Clone' }).click()
    await expect(cloneDialog).toBeHidden()

    // ---- The clone exists in the target namespace (verified via API) ----
    const list = await listConfigs(api, { dataId: DATA_ID, namespaceId: NS_ID })
    expect(list.pageItems.some((c) => c.dataId === DATA_ID)).toBe(true)
  })
})
