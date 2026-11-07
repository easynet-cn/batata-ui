import { test, expect } from '@playwright/test'

test.describe('plugin management', () => {
  test('plugin page loads with stats cards', async ({ page }) => {
    await page.goto('/plugins')
    await expect(page.getByRole('heading', { name: 'Plugins' })).toBeVisible()

    // Verify stats cards
    await expect(page.getByText('Total Plugins').first()).toBeVisible()
    await expect(page.getByText('Enabled').first()).toBeVisible()
    await expect(page.getByText('Disabled').first()).toBeVisible()
  })

  test('plugin page shows table with correct headers', async ({ page }) => {
    await page.goto('/plugins')
    await expect(page.getByRole('heading', { name: 'Plugins' })).toBeVisible()

    // Verify table headers
    // Scope to columnheaders: 'Status'/'Enabled' also appear as hidden
    // <option> elements in the filter selects.
    for (const header of ['Plugin Name', 'Plugin Type', 'Version', 'Status', 'Description']) {
      await expect(page.getByRole('columnheader', { name: header })).toBeVisible()
    }
  })

  test('plugin page has search and filter controls', async ({ page }) => {
    await page.goto('/plugins')
    await expect(page.getByRole('heading', { name: 'Plugins' })).toBeVisible()

    // Search input
    await expect(page.getByPlaceholder('Search by plugin name')).toBeVisible()

    // Type filter
    await expect(page.locator('select').first()).toBeVisible()

    // Status filter
    await expect(page.locator('select').nth(1)).toBeVisible()

    // Search button
    await expect(page.getByRole('button', { name: 'Search' })).toBeVisible()
  })

  test('plugin search filters list', async ({ page }) => {
    await page.goto('/plugins')

    // Search for non-existent plugin
    await page.getByPlaceholder('Search by plugin name').fill('non-existent-plugin-e2e')
    await page.getByRole('button', { name: 'Search' }).click()

    // Should show no data
    await expect(page.getByText('No data found').first()).toBeVisible({ timeout: 10_000 })
  })

  test('refresh button works', async ({ page }) => {
    await page.goto('/plugins')
    await expect(page.getByRole('heading', { name: 'Plugins' })).toBeVisible()

    const refreshBtn = page.getByRole('button', { name: 'Refresh' })
    await expect(refreshBtn).toBeVisible()
    await refreshBtn.click()
    await expect(page.getByRole('heading', { name: 'Plugins' })).toBeVisible()
  })
})
