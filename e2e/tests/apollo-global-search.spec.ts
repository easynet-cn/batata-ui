import { test, expect, uniqueName } from '../fixtures'
import { switchToApollo } from '../fixtures/apollo-pages'
import { createApp, deleteApp, createNamespace, createItem } from '../helpers/apollo-api'

// A9 — ApolloGlobalSearchView (cross-namespace key/value search)
// UI-driven search over data scaffolded through the OpenAPI face.
test.describe('apollo global search', () => {
  test('search by key returns matching items', async ({ page, apolloApi, cleanup }) => {
    const appId = `e2e-gs-${uniqueName('app')}`
    expect(await createApp(apolloApi, appId)).toBeTruthy()
    cleanup.push(() => deleteApp(apolloApi, appId).then(() => undefined))
    expect(await createNamespace(apolloApi, appId, 'DEV', 'default', 'application')).toBeTruthy()
    const key = `e2e-timeout-${uniqueName('k')}`
    expect(
      await createItem(apolloApi, appId, 'DEV', 'default', 'application', key, '3000'),
    ).toBeTruthy()

    await switchToApollo(page)
    await page.goto('/apollo/global-search')
    await expect(page.getByRole('heading', { name: /Global Search/i })).toBeVisible()

    await page.getByPlaceholder('timeout').fill(key)
    await page.getByRole('button', { name: /Global Search/i }).click()
    await expect(page.locator('table tbody tr', { hasText: key })).toHaveCount(1)
  })

  test('no-match search shows empty state', async ({ page }) => {
    await switchToApollo(page)
    await page.goto('/apollo/global-search')
    await page.getByPlaceholder('timeout').fill('zzz-no-such-key-zzz')
    await page.getByRole('button', { name: /Global Search/i }).click()
    await expect(page.getByText('No data found')).toBeVisible()
  })

  test('search button is a no-op without key or value', async ({ page }) => {
    await switchToApollo(page)
    await page.goto('/apollo/global-search')
    await page.getByRole('button', { name: /Global Search/i }).click()
    // runSearch() returns early when both fields are empty: no results, no empty banner.
    await expect(page.getByText('No data found')).toBeHidden()
    await expect(page.locator('table tbody tr')).toHaveCount(0)
  })
})
