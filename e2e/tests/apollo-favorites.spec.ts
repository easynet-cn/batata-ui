import { test, expect } from '../fixtures'
import { switchToApollo } from '../fixtures/apollo-pages'

// A8 — ApolloFavoritesView (read-only favorites list)
// UI-driven. Requires admin login (storageState).
test.describe('apollo favorites', () => {
  test('renders favorites list with expected columns', async ({ page }) => {
    await switchToApollo(page)
    await page.goto('/apollo/favorites')
    await expect(page.getByRole('heading', { name: /Favorites/i })).toBeVisible()
    // The view renders a card-style empty state instead of a table when
    // there are no favorites, so the column headers are conditional.
    if ((await page.locator('table').count()) === 0) {
      await expect(page.getByText('No data found')).toBeVisible()
    } else {
      await expect(page.getByText('App ID').first()).toBeVisible()
      await expect(page.getByText('App Name').first()).toBeVisible()
      await expect(page.getByText('Environments').first()).toBeVisible()
      await expect(page.getByText('Cluster').first()).toBeVisible()
      await expect(page.getByText('Namespace').first()).toBeVisible()
    }
  })

  test('shows empty state or navigates on row click', async ({ page }) => {
    await switchToApollo(page)
    await page.goto('/apollo/favorites')
    const rows = page.locator('table tbody tr')
    if ((await rows.count()) === 0) {
      await expect(page.getByText('No data found')).toBeVisible()
    } else {
      await rows.first().click()
      await expect(page).not.toHaveURL(/favorites/)
    }
  })
})
