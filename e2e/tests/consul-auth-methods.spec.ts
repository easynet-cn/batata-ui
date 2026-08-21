import { test, expect } from '../fixtures'
import { switchToConsul } from '../fixtures/consul-pages'

test.describe('consul auth methods', () => {
  test('auth methods list page loads with correct headers', async ({ page }) => {
    await switchToConsul(page)
    await page.goto('/consul/acl/auth-methods')

    await expect(page.getByRole('heading', { name: 'Auth Methods' })).toBeVisible()
    await expect(page.getByText('Name')).toBeVisible()
    await expect(page.getByText('Type')).toBeVisible()
    await expect(page.getByText('Display Name')).toBeVisible()
    await expect(page.getByText('Token Locality')).toBeVisible()
    await expect(page.getByText('Max Token TTL')).toBeVisible()
    await expect(page.getByText('Description')).toBeVisible()
  })
})
