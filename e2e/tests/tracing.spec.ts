import { test, expect } from '../fixtures'

test.describe('tracing', () => {
  test('tracing page loads with search controls', async ({ page }) => {
    await page.goto('/tracing')

    await expect(page.getByRole('heading', { name: 'Tracing' })).toBeVisible()
    await expect(page.getByText('Service Name').first()).toBeVisible()
    await expect(page.getByText('Operation Name').first()).toBeVisible()
    await expect(page.getByText('Trace ID').first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Search' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Refresh' })).toBeVisible()
  })
})
