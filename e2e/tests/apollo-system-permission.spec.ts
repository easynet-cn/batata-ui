import { test, expect, uniqueName } from '../fixtures'
import { switchToApollo } from '../fixtures/apollo-pages'

// A7 — ApolloSystemPermissionView (super-admin create-app permission grant/revoke)
// UI-driven. Requires admin login (storageState).
test.describe('apollo system permission', () => {
  test('grants and revokes a create-app permission user', async ({ page }) => {
    await switchToApollo(page)
    await page.goto('/apollo/system-permission')
    await expect(page.getByRole('heading', { name: /System Permission/i })).toBeVisible()

    // Without super-admin permission the view only shows the no-root notice.
    const noRoot = page.getByText('You do not have super admin permission')
    if ((await noRoot.count()) > 0) {
      await expect(noRoot).toBeVisible()
      return
    }

    const userId = `e2e-perm-${uniqueName('p')}`
    await page.getByPlaceholder('Username').fill(userId)
    await page.getByRole('button', { name: /Grant/i }).click()
    await expect(page.locator('ul li', { hasText: userId })).toHaveCount(1)

    await page
      .locator('ul li', { hasText: userId })
      .getByRole('button', { name: /Revoke/i })
      .click()
    await expect(page.locator('ul li', { hasText: userId })).toHaveCount(0)
  })
})
