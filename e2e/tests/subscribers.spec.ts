import { test, expect } from '../fixtures'

const SERVICE = `e2e-subscriber-${Date.now().toString(36)}`

test.describe('service subscribers', () => {
  test('subscribers page renders the service name, columns, and empty state', async ({ page }) => {
    // ---- Open subscribers scoped to a service ----
    await page.goto(`/subscribers?serviceName=${SERVICE}`)
    await expect(page).toHaveURL(/\/subscribers/)

    // ---- Header echoes the service name from the query ----
    await expect(page.getByText(SERVICE)).toBeVisible()

    // ---- Table columns render ----
    await expect(page.getByText('Client Address')).toBeVisible()
    await expect(page.getByText('Client Version')).toBeVisible()
    await expect(page.getByText('App Name')).toBeVisible()

    // ---- Empty state (a fresh server has no live subscribers) ----
    await expect(page.getByText('No data found')).toBeVisible()

    // ---- Search path executes and keeps the empty state ----
    await page.getByPlaceholder('Service Name').fill(SERVICE)
    await page.getByRole('button', { name: 'Search' }).click()
    await expect(page.getByText('No data found')).toBeVisible()
  })

  test('subscribers page defaults to "All Services" without a service query', async ({ page }) => {
    await page.goto('/subscribers')
    await expect(page.getByText('All Services')).toBeVisible()
  })
})
