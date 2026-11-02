import { test, expect, uniqueName } from '../fixtures'
import { switchToApollo } from '../fixtures/apollo-pages'

// A5 — ApolloUserTokensView (user token lifecycle)
// UI-driven. Requires admin login (storageState).
test.describe('apollo user tokens', () => {
  test('create a token shows its value and lists it', async ({ page }) => {
    await switchToApollo(page)
    await page.goto('/apollo/user-tokens')
    await expect(page.getByRole('heading', { name: /User Tokens/i })).toBeVisible()

    const tokenName = `e2e-token-${uniqueName('t')}`
    const before = await page.locator('table tbody tr').count()

    await page.getByRole('button', { name: /^Add$/i }).click()
    const dialog = page.locator('.fixed.inset-0')
    await dialog.locator('input[type="text"]').nth(0).fill(tokenName)
    await dialog.locator('input[type="text"]').nth(1).fill('2026-12-31')
    await dialog.getByRole('button', { name: /create/i }).click()

    // The issued token value is surfaced to the user exactly once.
    await expect(page.getByText(/Token Value/i)).toBeVisible()
    await expect(page.locator('table tbody tr', { hasText: tokenName })).toHaveCount(1)
    await expect(page.locator('table tbody tr')).toHaveCount(before + 1)
  })

  test('rotate a token re-issues its value', async ({ page }) => {
    await switchToApollo(page)
    await page.goto('/apollo/user-tokens')
    const tokenName = `e2e-rot-${uniqueName('t')}`

    await page.getByRole('button', { name: /^Add$/i }).click()
    const dialog = page.locator('.fixed.inset-0')
    await dialog.locator('input[type="text"]').nth(0).fill(tokenName)
    await dialog.getByRole('button', { name: /create/i }).click()
    await expect(page.getByText(/Token Value/i)).toBeVisible()

    const row = page.locator('table tbody tr', { hasText: tokenName })
    await row.getByRole('button', { name: /rotate/i }).click()
    // rotate re-issues a token value banner.
    await expect(page.getByText(/Token Value/i)).toBeVisible()

    page.on('dialog', (d) => d.accept())
    await row.getByRole('button', { name: /delete/i }).click()
    await expect(page.locator('table tbody tr', { hasText: tokenName })).toHaveCount(0)
  })

  test('delete a token removes it (confirm dialog)', async ({ page }) => {
    await switchToApollo(page)
    await page.goto('/apollo/user-tokens')
    const tokenName = `e2e-del-${uniqueName('t')}`
    const before = await page.locator('table tbody tr').count()

    await page.getByRole('button', { name: /^Add$/i }).click()
    const dialog = page.locator('.fixed.inset-0')
    await dialog.locator('input[type="text"]').nth(0).fill(tokenName)
    await dialog.getByRole('button', { name: /create/i }).click()
    await expect(page.locator('table tbody tr', { hasText: tokenName })).toHaveCount(1)

    const row = page.locator('table tbody tr', { hasText: tokenName })
    page.on('dialog', (d) => d.accept())
    await row.getByRole('button', { name: /delete/i }).click()
    await expect(page.locator('table tbody tr', { hasText: tokenName })).toHaveCount(0)
    await expect(page.locator('table tbody tr')).toHaveCount(before)
  })
})
