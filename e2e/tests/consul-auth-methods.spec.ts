import { test, expect } from '../fixtures'
import { switchToConsul } from '../fixtures/consul-pages'

test.describe('consul auth methods', () => {
  test('auth methods list page loads with correct headers', async ({ page }) => {
    await switchToConsul(page)
    await page.goto('/consul/acl/auth-methods')

    await expect(page.getByRole('heading', { name: 'Auth Methods' })).toBeVisible()
    await expect(page.getByText('Name').first()).toBeVisible()
    await expect(page.getByText('Type').first()).toBeVisible()
    await expect(page.getByText('Display Name').first()).toBeVisible()
    await expect(page.getByText('Token Locality').first()).toBeVisible()
    await expect(page.getByText('Max Token TTL').first()).toBeVisible()
    await expect(page.getByText('Description').first()).toBeVisible()
  })
})
