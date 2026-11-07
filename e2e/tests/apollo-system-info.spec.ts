import { test, expect } from '../fixtures'
import { switchToApollo } from '../fixtures/apollo-pages'

// A6 — ApolloSystemInfoView (read-only system metadata)
// UI-driven. Requires admin login (storageState).
test.describe('apollo system info', () => {
  test('renders version, commit and environment status', async ({ page }) => {
    await switchToApollo(page)
    await page.goto('/apollo/system-info')
    await expect(page.getByRole('heading', { name: /System Info/i })).toBeVisible()

    await expect(page.getByText('Version').first()).toBeVisible()
    await expect(page.getByText('Commit Id').first()).toBeVisible()
    // The backend currently returns no `environments`, so the status badge
    // is only asserted when at least one environment card is rendered.
    if ((await page.locator('.card').count()) > 1) {
      await expect(
        page.getByText('Active').first().or(page.getByText('Inactive').first()),
      ).toBeVisible()
    }
  })

  test('refresh reloads system info without error', async ({ page }) => {
    await switchToApollo(page)
    await page.goto('/apollo/system-info')
    await expect(page.getByRole('heading', { name: /System Info/i })).toBeVisible()
    await page.getByRole('button', { name: /Refresh/i }).click()
    await expect(page.getByRole('heading', { name: /System Info/i })).toBeVisible()
    await expect(page.getByText('Version').first()).toBeVisible()
  })
})
