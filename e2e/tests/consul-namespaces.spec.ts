import { test, expect } from '../fixtures'
import { switchToConsul } from '../fixtures/consul-pages'

test.describe('consul namespaces', () => {
  test('namespaces list page loads', async ({ page }) => {
    await switchToConsul(page)
    await page.goto('/consul/namespaces')

    await expect(page.getByRole('heading', { name: 'Namespaces' })).toBeVisible()
    // The create action is available (enterprise feature; page still renders).
    await expect(page.getByRole('button', { name: 'Create Namespace' })).toBeVisible()
  })
})
