import { test, expect } from '../fixtures'

test.describe('settings', () => {
  test('settings page loads with appearance controls', async ({ page }) => {
    await page.goto('/settings')

    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
    await expect(page.getByText('Appearance')).toBeVisible()

    // Theme selector with light/dark/system options.
    const themeSelect = page.locator('select').first()
    await expect(themeSelect).toBeVisible()
    await expect(themeSelect.locator('option', { hasText: 'Light' })).toHaveCount(1)
    await expect(themeSelect.locator('option', { hasText: 'Dark' })).toHaveCount(1)
    await expect(themeSelect.locator('option', { hasText: 'System' })).toHaveCount(1)
  })
})
