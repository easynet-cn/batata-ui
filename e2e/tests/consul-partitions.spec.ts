import { test, expect } from '../fixtures'
import { switchToConsul } from '../fixtures/consul-pages'

test.describe('consul partitions', () => {
  test('partitions list page loads', async ({ page }) => {
    await switchToConsul(page)
    await page.goto('/consul/partitions')

    await expect(page.getByRole('heading', { name: 'Partitions' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Create Partition' })).toBeVisible()
  })
})
