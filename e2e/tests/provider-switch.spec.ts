import { test, expect } from '@playwright/test'

test.describe('provider switching', () => {
  test('switch from batata to consul and back', async ({ page }) => {
    // Start on batata dashboard
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()

    // Switch to consul via header toggle
    const consulBtn = page.locator('header').getByRole('button', { name: 'CONSUL' })
    await expect(consulBtn).toBeVisible()
    await consulBtn.click()

    // Should navigate to consul dashboard
    await expect(page).toHaveURL(/\/consul/, { timeout: 10_000 })
    await expect(page.getByRole('heading', { name: 'Consul Dashboard' })).toBeVisible()

    // Switch back to batata
    const batataBtn = page.locator('header').getByRole('button', { name: 'BATATA' })
    await expect(batataBtn).toBeVisible()
    await batataBtn.click()

    // Should navigate back to batata dashboard
    await expect(page).toHaveURL(/\/$/, { timeout: 10_000 })
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  })

  test('direct navigation to consul URL auto-switches provider', async ({ page }) => {
    // Start on batata
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()

    // Navigate directly to a consul URL
    await page.goto('/consul/kv')
    await expect(page).toHaveURL(/\/consul\/kv/)
    await expect(page.getByRole('heading', { name: 'KV Store' })).toBeVisible()
  })

  test('batata sidebar shows batata navigation items', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()

    // Check for batata-specific nav items
    const nav = page.locator('nav[aria-label="Main navigation"]')
    await expect(nav.getByText('Configuration')).toBeVisible()
    await expect(nav.getByText('Services')).toBeVisible()
    await expect(nav.getByText('Namespace')).toBeVisible()
  })

  test('consul sidebar shows consul navigation items', async ({ page }) => {
    await page.goto('/consul/dashboard')
    await expect(page.getByRole('heading', { name: 'Consul Dashboard' })).toBeVisible()

    // Check for consul-specific nav items
    const nav = page.locator('nav[aria-label="Main navigation"]')
    await expect(nav.getByText('KV Store')).toBeVisible()
    await expect(nav.getByText('Intentions')).toBeVisible()
    await expect(nav.getByText('ACL Tokens')).toBeVisible()
  })
})
