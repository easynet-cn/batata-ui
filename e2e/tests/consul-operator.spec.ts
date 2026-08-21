import { test, expect } from '../fixtures'
import { switchToConsul } from '../fixtures/consul-pages'

test.describe('consul operator', () => {
  test('operator page loads with raft configuration and usage', async ({ page }) => {
    await switchToConsul(page)
    await page.goto('/consul/operator')

    await expect(page.getByRole('heading', { name: 'Operator' })).toBeVisible()

    // Raft configuration table headers.
    await expect(page.getByText('Node')).toBeVisible()
    await expect(page.getByText('ID')).toBeVisible()
    await expect(page.getByText('Address')).toBeVisible()
    await expect(page.getByText('Leader')).toBeVisible()
    await expect(page.getByText('Voter')).toBeVisible()
    await expect(page.getByText('Protocol')).toBeVisible()
    await expect(page.getByText('Last Index')).toBeVisible()

    // Cluster usage section.
    await expect(page.getByText('Cluster Usage')).toBeVisible()
  })
})
