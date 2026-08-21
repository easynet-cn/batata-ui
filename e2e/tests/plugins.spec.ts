import { test, expect } from '@playwright/test'

test.describe('plugin management', () => {
  test('plugin page loads with stats cards', async ({ page }) => {
    await page.goto('/plugins')
    await expect(page.getByRole('heading', { name: 'Plugins' })).toBeVisible()

    // Verify stats cards
    await expect(page.getByText('Total Plugins')).toBeVisible()
    await expect(page.getByText('Enabled')).toBeVisible()
    await expect(page.getByText('Disabled')).toBeVisible()
  })

  test('plugin page shows table with correct headers', async ({ page }) => {
    await page.goto('/plugins')
    await expect(page.getByRole('heading', { name: 'Plugins' })).toBeVisible()

    // Verify table headers
    await expect(page.getByText('Plugin Name')).toBeVisible()
    await expect(page.getByText('Plugin Type')).toBeVisible()
    await expect(page.getByText('Version')).toBeVisible()
    await expect(page.getByText('Status')).toBeVisible()
    await expect(page.getByText('Description')).toBeVisible()
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
    await expect(page.getByText('No data found')).toBeVisible({ timeout: 10_000 })
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
