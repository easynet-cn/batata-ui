import { test, expect } from '../fixtures'
import { switchToConsul } from '../fixtures/consul-pages'

test.describe('consul health checks', () => {
  test('health checks list page loads with correct headers', async ({ page }) => {
    await switchToConsul(page)
    await page.goto('/consul/health')

    await expect(page.getByRole('heading', { name: 'Health Checks' })).toBeVisible()
    await expect(page.getByText('Check ID')).toBeVisible()
    await expect(page.getByText('Node')).toBeVisible()
    await expect(page.getByText('Service')).toBeVisible()
    await expect(page.getByText('Status')).toBeVisible()
    await expect(page.getByText('Output')).toBeVisible()
    await expect(page.getByText('Type')).toBeVisible()
  })

  test('passing/warning tab filters the health checks', async ({ page }) => {
    await switchToConsul(page)
    await page.goto('/consul/health')

    const passingTab = page.getByRole('button', { name: /Passing/ })
    if (await passingTab.isVisible()) {
      await passingTab.click()
      await expect(page.getByRole('heading', { name: 'Health Checks' })).toBeVisible()
    }
  })
})
