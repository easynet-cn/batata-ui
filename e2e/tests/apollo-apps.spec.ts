import { test, expect, uniqueName } from '../fixtures'
import { switchToApollo } from '../fixtures/apollo-pages'
import { createApp, deleteApp, listApps } from '../helpers/apollo-api'

test.describe('apollo apps', () => {
  test('create an app via UI and see it in the list', async ({ page, apolloApi, cleanup }) => {
    const appId = `e2e-apollo-${uniqueName('app')}`

    await switchToApollo(page)
    await expect(page).toHaveURL(/\/apollo\/apps/)

    // Create via UI
    await page.getByRole('button', { name: /Create App/i }).click()
    await page.getByPlaceholder('app-id').fill(appId)
    await page.getByPlaceholder('My App').fill(appId)
    await page
      .locator('.fixed.inset-0')
      .getByRole('button', { name: /create/i })
      .click()
    cleanup.push(() => deleteApp(apolloApi, appId).then(() => undefined))

    // Verify via API
    const apps = await listApps(apolloApi)
    expect(apps.some((a) => a.appId === appId)).toBeTruthy()

    // Verify in UI list
    await page.getByPlaceholder(/app name/i).fill(appId)
    const row = page.locator('table tbody tr', { hasText: appId })
    await expect(row).toHaveCount(1)
  })

  test('create an app via API and delete it through the UI', async ({
    page,
    apolloApi,
    cleanup,
  }) => {
    const appId = `e2e-apollo-api-${uniqueName('app')}`

    expect(await createApp(apolloApi, appId)).toBeTruthy()
    cleanup.push(() => deleteApp(apolloApi, appId).then(() => undefined))

    page.on('dialog', (d) => d.accept())

    await switchToApollo(page)
    await page.getByPlaceholder(/app name/i).fill(appId)
    const row = page.locator('table tbody tr', { hasText: appId })
    await expect(row).toHaveCount(1)

    // Delete via UI
    await row.getByTitle('Delete').click()
    await page.getByPlaceholder(/app name/i).fill('')
    await expect(page.locator('table tbody tr', { hasText: appId })).toHaveCount(0)
  })
})
