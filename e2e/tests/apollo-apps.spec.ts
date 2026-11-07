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
    // The create form is a real `dialog`, not a `.fixed.inset-0` overlay.
    const createDialog = page.getByRole('dialog')
    await expect(createDialog).toBeVisible()
    await createDialog.getByRole('button', { name: 'Create', exact: true }).click()
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

    await switchToApollo(page)
    await page.getByPlaceholder(/app name/i).fill(appId)
    const row = page.locator('table tbody tr', { hasText: appId })
    await expect(row).toHaveCount(1)

    // Delete via UI. The app uses a custom `alertdialog` ("Confirm Delete"),
    // not window.confirm, so a page.on('dialog') handler never sees it.
    await row.getByTitle('Delete').click()
    const confirm = page.getByRole('alertdialog')
    await expect(confirm).toBeVisible()
    await confirm.getByRole('button', { name: 'Confirm' }).click()
    await expect(confirm).toBeHidden()
    await page.getByPlaceholder(/app name/i).fill('')
    await expect(page.locator('table tbody tr', { hasText: appId })).toHaveCount(0)
  })
})
