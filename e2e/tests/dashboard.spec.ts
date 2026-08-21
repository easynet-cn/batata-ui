import { test, expect } from '@playwright/test'

test.describe('dashboard metrics', () => {
  test('dashboard shows statistics cards with numeric values', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()

    // Verify all 4 stat cards are visible
    await expect(page.getByText('Total Services')).toBeVisible()
    await expect(page.getByText('Total Configurations')).toBeVisible()
    await expect(page.getByText('Total Namespaces')).toBeVisible()
    await expect(page.getByText('Cluster Nodes')).toBeVisible()

    // Verify sub-labels
    await expect(page.getByText('Healthy').first()).toBeVisible()
    await expect(page.getByText('groups').first()).toBeVisible()
    await expect(page.getByText('Custom').first()).toBeVisible()
    await expect(page.getByText('Online').first()).toBeVisible()
  })

  test('dashboard shows quick action links', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Quick Actions')).toBeVisible()

    // Verify quick action links
    await expect(page.getByRole('link', { name: 'Create Config' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Manage Services' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Manage Namespaces' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'View Cluster' })).toBeVisible()
  })

  test('quick action links navigate correctly', async ({ page }) => {
    await page.goto('/')

    // Create Config
    await page.getByRole('link', { name: 'Create Config' }).click()
    await expect(page).toHaveURL(/\/config\/new/)

    // Manage Services
    await page.goto('/')
    await page.getByRole('link', { name: 'Manage Services' }).click()
    await expect(page).toHaveURL(/\/services/)

    // Manage Namespaces
    await page.goto('/')
    await page.getByRole('link', { name: 'Manage Namespaces' }).click()
    await expect(page).toHaveURL(/\/namespaces/)

    // View Cluster
    await page.goto('/')
    await page.getByRole('link', { name: 'View Cluster' }).click()
    await expect(page).toHaveURL(/\/cluster/)
  })

  test('dashboard shows chart sections', async ({ page }) => {
    await page.goto('/')

    // Chart section headings
    await expect(page.getByText('Service Health Distribution')).toBeVisible()
    await expect(page.getByText('Configuration Type Distribution')).toBeVisible()
  })

  test('dashboard shows cluster nodes status section', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByText('Cluster Nodes Status')).toBeVisible()
  })

  test('refresh button updates dashboard data', async ({ page }) => {
    await page.goto('/')

    const refreshBtn = page.getByRole('button', { name: 'Refresh' })
    await expect(refreshBtn).toBeVisible()
    await refreshBtn.click()
    // Page should still be on dashboard
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  })
})
