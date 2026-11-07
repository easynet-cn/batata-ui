import { test, expect, uniqueName, confirmAlert } from '../fixtures'
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

    // Creating a key is immediate (no modal). The empty state is also a
    // `<tr>` inside tbody, so count only rows that carry the action buttons.
    const dataRows = page.locator('table tbody tr:has(button)')
    const before = await dataRows.count()
    await page.getByRole('button', { name: /Create/i }).click()
    await expect(dataRows).toHaveCount(before + 1)

    const row = dataRows.last()
    // Toggle enable/disable (first icon button) then delete (second, danger).
    await row.locator('button').nth(0).click()
    await expect(row.getByText(/Enabled|Disabled/i)).toBeVisible()

    await row.locator('button').nth(1).click()
    await confirmAlert(page)
    await expect(dataRows).toHaveCount(before)
  })

  test('empty state when no appId is provided', async ({ page }) => {
    await switchToApollo(page)
    await page.goto('/apollo/access-keys')
    await expect(page.getByText(/Open from an App/i)).toBeVisible()
  })
})
