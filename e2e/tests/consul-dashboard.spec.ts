import { test, expect } from '../fixtures'
import { switchToConsul } from '../fixtures/consul-pages'

test.describe('consul dashboard', () => {
  test('dashboard loads with statistics and quick actions', async ({
    page,
    consulDashboardPage,
  }) => {
    await switchToConsul(page)
    await consulDashboardPage.goto()
    await expect(consulDashboardPage.heading).toBeVisible()

    // Verify statistics cards
    await expect(page.getByText('Total Services')).toBeVisible()
    await expect(page.getByText('Total Nodes')).toBeVisible()
    await expect(page.getByText('Health Checks')).toBeVisible()
    await expect(page.getByText('Datacenters')).toBeVisible()

    // Verify quick actions section
    await expect(page.getByText('Quick Actions')).toBeVisible()
    await expect(page.getByRole('link', { name: 'View KV Store' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'View Services' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'View Nodes' })).toBeVisible()

    // Verify refresh button
    await expect(consulDashboardPage.refreshButton).toBeVisible()
  })

  test('quick action links navigate to correct pages', async ({ page, consulDashboardPage }) => {
    await switchToConsul(page)
    await consulDashboardPage.goto()

    // Click "View KV Store"
    await page.getByRole('link', { name: 'View KV Store' }).click()
    await expect(page).toHaveURL(/\/consul\/kv/)

    // Go back to dashboard
    await consulDashboardPage.goto()

    // Click "View Services"
    await page.getByRole('link', { name: 'View Services' }).click()
    await expect(page).toHaveURL(/\/consul\/catalog\/services/)

    // Go back to dashboard
    await consulDashboardPage.goto()

    // Click "View Nodes"
    await page.getByRole('link', { name: 'View Nodes' }).click()
    await expect(page).toHaveURL(/\/consul\/catalog\/nodes/)
  })

  test('cluster members section is visible', async ({ page, consulDashboardPage }) => {
    await switchToConsul(page)
    await consulDashboardPage.goto()

    // Cluster Members section should be visible
    await expect(page.getByText('Cluster Members')).toBeVisible()

    // Table headers
    await expect(page.getByText('Address').first()).toBeVisible()
    await expect(page.getByText('Status').first()).toBeVisible()
    await expect(page.getByText('Role').first()).toBeVisible()
  })
})
