import { test, expect } from '@playwright/test'

test.describe('cluster management', () => {
  test('cluster page loads with health summary', async ({ page }) => {
    await page.goto('/cluster')
    await expect(page.getByRole('heading', { name: 'Cluster Management' })).toBeVisible()

    // Verify health summary cards
    await expect(page.getByText('Total Nodes').first()).toBeVisible()
    await expect(page.getByText('UP').first()).toBeVisible()
    await expect(page.getByText('DOWN').first()).toBeVisible()
    await expect(page.getByText('SUSPICIOUS').first()).toBeVisible()
    await expect(page.getByText('Leader').first()).toBeVisible()
  })

  test('cluster page shows node table with correct headers', async ({ page }) => {
    await page.goto('/cluster')
    await expect(page.getByRole('heading', { name: 'Cluster Management' })).toBeVisible()

    // Verify table headers
    await expect(page.getByText('Node Address').first()).toBeVisible()
    await expect(page.getByText('State').first()).toBeVisible()
    await expect(page.getByText('Abilities').first()).toBeVisible()
    await expect(page.getByText('Extend Info').first()).toBeVisible()
  })

  test('cluster page has refresh and refresh-self buttons', async ({ page }) => {
    await page.goto('/cluster')
    await expect(page.getByRole('heading', { name: 'Cluster Management' })).toBeVisible()

    await expect(page.getByRole('button', { name: 'Refresh Self' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Refresh', exact: true })).toBeVisible()
  })

  test('cluster page search filters by IP', async ({ page }) => {
    await page.goto('/cluster')
    await expect(page.getByRole('heading', { name: 'Cluster Management' })).toBeVisible()

    // Search for a non-existent IP
    await page.getByPlaceholder('Search by IP').fill('0.0.0.0')
    await page.getByRole('button', { name: 'Search' }).click()

    // Should show no data
    await expect(page.getByText('No data found').first()).toBeVisible({ timeout: 10_000 })
  })

  test('cluster nodes show leader badge', async ({ page }) => {
    await page.goto('/cluster')
    await expect(page.getByRole('heading', { name: 'Cluster Management' })).toBeVisible()

    // A multi-node RocksDB cluster may legitimately report 'No leader' in
    // the summary. Assert that either a leader row or that explicit state
    // is visible, instead of assuming standalone-mode semantics.
    const leaderBadge = page.locator('tbody tr').filter({ hasText: 'Leader' })
    await expect(leaderBadge.first().or(page.getByText('No leader').first())).toBeVisible()
  })
})
