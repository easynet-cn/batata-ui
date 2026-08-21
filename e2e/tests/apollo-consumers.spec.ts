import { test, expect } from '../fixtures'
import { switchToApollo } from '../fixtures/apollo-pages'

test.describe('apollo consumers (open platform)', () => {
  test('open the consumers page and render without error', async ({ page }) => {
    await switchToApollo(page)
    await page.goto('/apollo/consumers')
    await expect(page).toHaveURL(/\/apollo\/consumers/)
    // Either the table or the empty state should be present
    await expect(page.locator('.card').first()).toBeVisible()
  })
})
