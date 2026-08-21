import { test, expect } from '../fixtures'
import { createConfig, deleteConfig } from '../helpers/api'

const SUFFIX = Date.now().toString(36)
// The UI treats any config whose dataId contains "-beta" as a gray/beta release.
const DATA_ID = `e2e-beta-${SUFFIX}-beta.yaml`
const GROUP = 'DEFAULT_GROUP'
const CONTENT = 'beta: true\n'

test.describe('config gray/beta release', () => {
  test('beta config shows a badge and can be promoted to stable', async ({
    page,
    api,
    cleanup,
  }) => {
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

    // Beta config is flagged with a "Beta" badge and a "Promote to Stable" action.
    await expect(row).toContainText('Beta')
    await expect(row.getByTitle('Promote to Stable')).toHaveCount(1)

    // Promote to stable via the confirm dialog.
    await row.getByTitle('Promote to Stable').click()
    const confirm = page.getByRole('alertdialog')
    await expect(confirm).toBeVisible()
    await confirm.getByRole('button', { name: 'Promote' }).click()
    await expect(confirm).toBeHidden()
  })
})
