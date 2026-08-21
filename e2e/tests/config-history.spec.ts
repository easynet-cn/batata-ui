import { test, expect } from '../fixtures'
import {
  createConfig,
  updateConfig,
  deleteConfig,
  getConfigDetail,
  listConfigHistory,
} from '../helpers/api'

const SUFFIX = Date.now().toString(36)
const DATA_ID = `e2e-config-history-${SUFFIX}.yaml`
const GROUP = 'DEFAULT_GROUP'
const CONTENT_V1 = 'app.name: history-test\napp.version: 1\n'
const CONTENT_V2 = 'app.name: history-test\napp.version: 2\n'
const CONTENT_V3 = 'app.name: history-test\napp.version: 3\n'

test.describe('config history and rollback', () => {
  test('history lists every published version and rollback restores an earlier version', async ({
    page,
    api,
    cleanup,
  }) => {
    // ---- Setup: publish three versions of the same config via API ----
    cleanup.push(async () => {
      await deleteConfig(api, DATA_ID, GROUP, 'public')
    })
    expect(
      await createConfig(api, { dataId: DATA_ID, groupName: GROUP, content: CONTENT_V1 }),
    ).toBe(true)
    expect(
      await updateConfig(api, { dataId: DATA_ID, groupName: GROUP, content: CONTENT_V2 }),
    ).toBe(true)
    expect(
      await updateConfig(api, { dataId: DATA_ID, groupName: GROUP, content: CONTENT_V3 }),
    ).toBe(true)

    // ---- Open the history page in linked mode from the config list ----
    await page.goto('/configs')
    await page.getByPlaceholder('Data ID').fill(DATA_ID)
    await page.getByRole('button', { name: 'Search' }).click()
    const row = page.locator('tbody tr').filter({ hasText: DATA_ID })
    await expect(row).toHaveCount(1)

    await row.getByTitle('History').click()
    await expect(page).toHaveURL(/\/config\/history/)
    await expect(page.getByText('History Version')).toBeVisible()

    // ---- All three published versions are listed (1 Create + 2 Update) ----
    await expect(page.locator('tbody tr').filter({ hasText: 'Create' })).toHaveCount(1)
    await expect(page.locator('tbody tr').filter({ hasText: 'Update' })).toHaveCount(2)

    // ---- Pick the first Update entry (v2) by its history id and roll it back ----
    const history = await listConfigHistory(api, {
      dataId: DATA_ID,
      groupName: GROUP,
      namespaceId: 'public',
    })
    const target = [...history].sort((a, b) => a.id - b.id).find((h) => h.opType === 'U')
    expect(target).toBeDefined()

    await page
      .locator('tbody tr', { hasText: String(target!.id) })
      .getByTitle('Rollback')
      .click()
    const dialog = page.getByRole('alertdialog')
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText(CONTENT_V2.trim())
    await dialog.getByRole('button', { name: 'Rollback' }).click()
    await expect(dialog).toBeHidden()

    // ---- Content is restored to v2 (verified through the API) ----
    await expect
      .poll(async () => (await getConfigDetail(api, DATA_ID, GROUP, 'public')).data?.content)
      .toBe(CONTENT_V2)

    // ---- Rollback itself produces a new history entry ----
    const after = await listConfigHistory(api, {
      dataId: DATA_ID,
      groupName: GROUP,
      namespaceId: 'public',
    })
    expect(after.length).toBeGreaterThanOrEqual(4)
  })
})
