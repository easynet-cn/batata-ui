import { test, expect } from '../fixtures'
import { switchToConsul } from '../fixtures/consul-pages'

test.describe('consul operator', () => {
  test('operator page loads with raft configuration and usage', async ({ page }) => {
    await switchToConsul(page)
    await page.goto('/consul/operator')

    await expect(page.getByRole('heading', { name: 'Operator' })).toBeVisible()

    // Raft configuration table headers.
    await expect(page.getByText('Node').first()).toBeVisible()
    await expect(page.getByText('ID').first()).toBeVisible()
    await expect(page.getByText('Address').first()).toBeVisible()
    await expect(page.getByText('Leader').first()).toBeVisible()
    await expect(page.getByText('Voter').first()).toBeVisible()
    await expect(page.getByText('Protocol').first()).toBeVisible()
    await expect(page.getByText('Last Index').first()).toBeVisible()

    // Cluster usage section.
    await expect(page.getByText('Cluster Usage').first()).toBeVisible()
  })
})
