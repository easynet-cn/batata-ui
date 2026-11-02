import { test, expect } from '../fixtures'
import { switchToApollo } from '../fixtures/apollo-pages'

// A10 — ApolloAuditView (audit log; read-only)
// UI-driven. Requires admin login (storageState).
test.describe('apollo audit', () => {
  test('renders audit log with expected columns', async ({ page }) => {
    await switchToApollo(page)
    await page.goto('/apollo/audit')
    await expect(page.getByRole('heading', { name: /Audit/i })).toBeVisible()
    await expect(page.getByText('Entity')).toBeVisible()
    await expect(page.getByText('Operation')).toBeVisible()
    await expect(page.getByText('Operator')).toBeVisible()
    await expect(page.getByText('Time')).toBeVisible()
  })

  test('shows entries or empty state', async ({ page }) => {
    await switchToApollo(page)
    await page.goto('/apollo/audit')
    const rows = page.locator('table tbody tr')
    if ((await rows.count()) === 0) {
      await expect(page.getByText('No data found')).toBeVisible()
    } else {
      await expect(rows.first()).toBeVisible()
    }
  })
})
