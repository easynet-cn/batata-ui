import { test, expect } from '@playwright/test'

test.describe('cluster management', () => {
  test('cluster page loads with health summary', async ({ page }) => {
    await page.goto('/cluster')
    await expect(page.getByRole('heading', { name: 'Cluster Management' })).toBeVisible()

    // Verify health summary cards
    await expect(page.getByText('Total Nodes')).toBeVisible()
    await expect(page.getByText('UP')).toBeVisible()
    await expect(page.getByText('DOWN')).toBeVisible()
    await expect(page.getByText('SUSPICIOUS')).toBeVisible()
    await expect(page.getByText('Leader')).toBeVisible()
  })

  test('cluster page shows node table with correct headers', async ({ page }) => {
    await page.goto('/cluster')
    await expect(page.getByRole('heading', { name: 'Cluster Management' })).toBeVisible()

    // Verify table headers
    await expect(page.getByText('Node Address')).toBeVisible()
    await expect(page.getByText('State')).toBeVisible()
    await expect(page.getByText('Abilities')).toBeVisible()
    await expect(page.getByText('Extend Info')).toBeVisible()
  })

  test('cluster page has refresh and refresh-self buttons', async ({ page }) => {
    await page.goto('/cluster')
    await expect(page.getByRole('heading', { name: 'Cluster Management' })).toBeVisible()

    await expect(page.getByRole('button', { name: 'Refresh Self' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Refresh' })).toBeVisible()
  })

  test('cluster page search filters by IP', async ({ page }) => {
    await page.goto('/cluster')
    await expect(page.getByRole('heading', { name: 'Cluster Management' })).toBeVisible()

    // Search for a non-existent IP
    await page.getByPlaceholder('Search by IP').fill('0.0.0.0')
    await page.getByRole('button', { name: 'Search' }).click()

    // Should show no data
    await expect(page.getByText('No data found')).toBeVisible({ timeout: 10_000 })
  })

  test('cluster nodes show leader badge', async ({ page }) => {
    await page.goto('/cluster')
    await expect(page.getByRole('heading', { name: 'Cluster Management' })).toBeVisible()

    // In standalone mode, the single node should be the leader
    const leaderBadge = page.locator('tbody tr').filter({ hasText: 'Leader' })
    const rowCount = await page.locator('tbody tr').count()
    if (rowCount > 0) {
      // At least one node should show leader badge in standalone mode
      await expect(leaderBadge.first()).toBeVisible()
    }
  })
})
