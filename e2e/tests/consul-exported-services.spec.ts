import { test, expect } from '../fixtures'
import { switchToConsul } from '../fixtures/consul-pages'

test.describe('consul exported services', () => {
  test('exported services page loads with consumers and peers sections', async ({ page }) => {
    await switchToConsul(page)
    await page.goto('/consul/exported-services')

    await expect(page.getByRole('heading', { name: 'Exported Services' })).toBeVisible()
    await expect(page.getByText('Consumers')).toBeVisible()
    await expect(page.getByText('Peers')).toBeVisible()
  })
})
