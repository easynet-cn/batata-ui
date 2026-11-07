import { test, expect, uniqueName, confirmAlert } from '../fixtures'
import { switchToApollo } from '../fixtures/apollo-pages'

// A5 — ApolloUserTokensView (user token lifecycle)
// UI-driven. Requires admin login (storageState).
test.describe('apollo user tokens', () => {
  test('create a token shows its value and lists it', async ({ page }) => {
    await switchToApollo(page)
    await page.goto('/apollo/user-tokens')
    await expect(page.getByRole('heading', { name: /User Tokens/i })).toBeVisible()

    const tokenName = `e2e-token-${uniqueName('t')}`
    // The empty state is a `<tr>` too; only count rows with action buttons.
    const dataRows = page.locator('table tbody tr:has(button)')
    const before = await dataRows.count()

    await page.getByRole('button', { name: /^Add$/i }).click()
    const dialog = page.getByRole('dialog')
    await dialog.locator('input:not([type])').nth(0).fill(tokenName)
    await dialog.locator('input:not([type])').nth(1).fill('2026-12-31')
    await dialog.getByRole('button', { name: /create/i }).click()

    // The issued token value is surfaced to the user exactly once.
    await expect(page.getByText(/Token Value/i)).toBeVisible()
    await expect(page.locator('table tbody tr', { hasText: tokenName })).toHaveCount(1)
    await expect(dataRows).toHaveCount(before + 1)
  })

  test('rotate a token re-issues its value', async ({ page }) => {
    await switchToApollo(page)
    await page.goto('/apollo/user-tokens')
    const tokenName = `e2e-rot-${uniqueName('t')}`

    await page.getByRole('button', { name: /^Add$/i }).click()
    const dialog = page.getByRole('dialog')
    await dialog.locator('input:not([type])').nth(0).fill(tokenName)
    await dialog.getByRole('button', { name: /create/i }).click()
    await expect(page.getByText(/Token Value/i)).toBeVisible()

    const row = page.locator('table tbody tr', { hasText: tokenName })
    await row.getByRole('button', { name: /rotate/i }).click()
    // rotate re-issues a token value banner.
    await expect(page.getByText(/Token Value/i)).toBeVisible()

    await row.getByRole('button', { name: /delete/i }).click()
    await confirmAlert(page)
    await expect(page.locator('table tbody tr', { hasText: tokenName })).toHaveCount(0)
  })

  test('delete a token removes it (confirm dialog)', async ({ page }) => {
    await switchToApollo(page)
    await page.goto('/apollo/user-tokens')
    const tokenName = `e2e-del-${uniqueName('t')}`
    const dataRows = page.locator('table tbody tr:has(button)')
    const before = await dataRows.count()

    await page.getByRole('button', { name: /^Add$/i }).click()
    const dialog = page.getByRole('dialog')
    await dialog.locator('input:not([type])').nth(0).fill(tokenName)
    await dialog.getByRole('button', { name: /create/i }).click()
    await expect(page.locator('table tbody tr', { hasText: tokenName })).toHaveCount(1)

    const row = page.locator('table tbody tr', { hasText: tokenName })
    await row.getByRole('button', { name: /delete/i }).click()
    await confirmAlert(page)
    await expect(page.locator('table tbody tr', { hasText: tokenName })).toHaveCount(0)
    await expect(dataRows).toHaveCount(before)
  })
})
