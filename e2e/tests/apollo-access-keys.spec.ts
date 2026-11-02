import { test, expect, uniqueName } from '../fixtures'
import { switchToApollo } from '../fixtures/apollo-pages'
import { createApp, deleteApp } from '../helpers/apollo-api'

// A4 — ApolloAccessKeysView (access key management, scoped by appId)
// Scaffold an app, then drive the key lifecycle through the UI.
test.describe('apollo access keys', () => {
  test('create, toggle and delete an access key', async ({ page, apolloApi, cleanup }) => {
    const appId = `e2e-ak-${uniqueName('app')}`
    expect(await createApp(apolloApi, appId)).toBeTruthy()
    cleanup.push(() => deleteApp(apolloApi, appId).then(() => undefined))

    await switchToApollo(page)
    await page.goto(`/apollo/access-keys?appId=${appId}`)
    await expect(page.getByRole('heading', { name: /Access Keys/i })).toBeVisible()

    // Creating a key is immediate (no modal).
    const before = await page.locator('table tbody tr').count()
    await page.getByRole('button', { name: /Create/i }).click()
    await expect(page.locator('table tbody tr')).toHaveCount(before + 1)

    const row = page.locator('table tbody tr').last()
    // Toggle enable/disable (first icon button) then delete (second, danger).
    await row.locator('button').nth(0).click()
    await expect(row.getByText(/Enabled|Disabled/i)).toBeVisible()

    page.on('dialog', (d) => d.accept())
    await row.locator('button').nth(1).click()
    await expect(page.locator('table tbody tr')).toHaveCount(before)
  })

  test('empty state when no appId is provided', async ({ page }) => {
    await switchToApollo(page)
    await page.goto('/apollo/access-keys')
    await expect(page.getByText(/Open from an App/i)).toBeVisible()
  })
})
