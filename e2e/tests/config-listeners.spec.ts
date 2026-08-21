import { test, expect } from '@playwright/test'

test.describe('config listeners query', () => {
  test('listening query page loads with two query modes', async ({ page }) => {
    await page.goto('/config/listeners')
    await expect(page.getByRole('heading', { name: 'Listening Query' })).toBeVisible()

    // Verify query mode tabs
    await expect(page.getByText('Query by Config')).toBeVisible()
    await expect(page.getByText('Query by IP')).toBeVisible()
  })

  test('query by config mode shows search inputs', async ({ page }) => {
    await page.goto('/config/listeners')
    await expect(page.getByRole('heading', { name: 'Listening Query' })).toBeVisible()

    // Default mode should be "Query by Config"
    // Verify Data ID and Group inputs
    await expect(page.getByPlaceholder('Data ID')).toBeVisible()
    await expect(page.getByPlaceholder('Group')).toBeVisible()

    // Verify search button
    await expect(page.getByRole('button', { name: 'Search' })).toBeVisible()
  })

  test('query by IP mode shows IP input', async ({ page }) => {
    await page.goto('/config/listeners')
    await expect(page.getByRole('heading', { name: 'Listening Query' })).toBeVisible()

    // Switch to IP mode
    await page.getByText('Query by IP').click()

    // Verify IP input
    await expect(page.getByPlaceholder('Enter client IP address')).toBeVisible()
  })

  test('query by config with non-existent config shows no data', async ({ page }) => {
    await page.goto('/config/listeners')
    await expect(page.getByRole('heading', { name: 'Listening Query' })).toBeVisible()

    // Search for a non-existent config
    await page.getByPlaceholder('Data ID').fill('non-existent-config-e2e-test')
    await page.getByPlaceholder('Group').fill('DEFAULT_GROUP')
    await page.getByRole('button', { name: 'Search' }).click()

    // Should show "No data found" or empty state
    await expect(page.getByText('No data found')).toBeVisible({ timeout: 15_000 })
  })
})
