import { test, expect } from '../fixtures'
import { switchToConsul } from '../fixtures/consul-pages'

test.describe('consul config entries', () => {
  test('config entries list page loads with correct headers', async ({ page }) => {
    await switchToConsul(page)
    await page.goto('/consul/config-entries')

    await expect(page.getByRole('heading', { name: 'Config Entries' })).toBeVisible()
    await expect(page.getByText('Name')).toBeVisible()
    await expect(page.getByText('Namespace')).toBeVisible()
    await expect(page.getByText('Create Index')).toBeVisible()
    await expect(page.getByText('Modify Index')).toBeVisible()
    await expect(page.getByText('Actions')).toBeVisible()
  })

  test('kind filter tabs are present', async ({ page }) => {
    await switchToConsul(page)
    await page.goto('/consul/config-entries')

    // The kind filter renders a row of kind chips (e.g. proxy-defaults / services).
    const tabs = page
      .locator('button')
      .filter({ hasText: /proxy-defaults|service-defaults|services/i })
    await expect(tabs.first()).toBeVisible()
  })
})
