import { test, expect } from '../fixtures'
import { createConfig, deleteConfig } from '../helpers/api'

const SUFFIX = Date.now().toString(36)
const DATA_ID = `e2e-export-${SUFFIX}.yaml`
const GROUP = 'DEFAULT_GROUP'
const CONTENT = 'export: true\n'

test.describe('config export', () => {
  test('export selected configs as a zip download', async ({ page, api, cleanup }) => {
    cleanup.push(async () => {
      await deleteConfig(api, DATA_ID, GROUP, 'public')
    })
    expect(await createConfig(api, { dataId: DATA_ID, groupName: GROUP, content: CONTENT })).toBe(
      true,
    )

    await page.goto('/configs')
    await page.getByPlaceholder('Data ID').fill(DATA_ID)
    await page.getByRole('button', { name: 'Search' }).click()
    const row = page.locator('tbody tr').filter({ hasText: DATA_ID })
    await expect(row).toHaveCount(1)

    // Select the row, then trigger the export download.
    await row.locator('input[type="checkbox"]').check()

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Export' }).click(),
    ])

    await expect(download.suggestedFilename()).toMatch(/\.zip$/)
  })
})
