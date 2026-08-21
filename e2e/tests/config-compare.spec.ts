import { test, expect } from '../fixtures'
import { createConfig, updateConfig, deleteConfig } from '../helpers/api'

const SUFFIX = Date.now().toString(36)
const DATA_ID = `e2e-config-compare-${SUFFIX}.yaml`
const GROUP = 'DEFAULT_GROUP'
const CONTENT_V1 = 'app.name: compare\napp.version: 1\n'
const CONTENT_V2 = 'app.name: compare\napp.version: 2\n'

test.describe('config history compare', () => {
  test('compare opens a diff view between versions', async ({ page, api, cleanup }) => {
    cleanup.push(async () => {
      await deleteConfig(api, DATA_ID, GROUP, 'public')
    })
    expect(
      await createConfig(api, { dataId: DATA_ID, groupName: GROUP, content: CONTENT_V1 }),
    ).toBe(true)
    expect(
      await updateConfig(api, { dataId: DATA_ID, groupName: GROUP, content: CONTENT_V2 }),
    ).toBe(true)

    // Open the history page in linked mode.
    await page.goto('/configs')
    await page.getByPlaceholder('Data ID').fill(DATA_ID)
    await page.getByRole('button', { name: 'Search' }).click()
    const row = page.locator('tbody tr').filter({ hasText: DATA_ID })
    await expect(row).toHaveCount(1)
    await row.getByTitle('History').click()
    await expect(page).toHaveURL(/\/config\/history/)

    // Open the compare modal for a history entry.
    await page.locator('tbody tr').filter({ hasText: 'Update' }).getByTitle('Compare').click()
    const modal = page.locator('.modal-backdrop')
    await expect(modal).toBeVisible()
    await expect(page.getByText('Compare Version')).toBeVisible()
    await expect(modal.getByRole('button', { name: 'Close' })).toBeVisible()
  })
})
