import { test, expect } from '@playwright/test'

test.describe('ui smoke', () => {
  test('dashboard loads for an authenticated user', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
    await expect(page.locator('#main-content')).toBeVisible()
    await expect(page.locator('header').getByText('batata')).toBeVisible()
  })

  test('language switch toggles the header locale indicator', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()

    const langButton = page.locator('header button', { hasText: 'EN' }).first()
    await langButton.click()
    await page.getByRole('button', { name: '中文' }).click()

    await expect(page.locator('header').getByText('ZH')).toBeVisible()
  })

  test('theme toggle switches to dark mode', async ({ page }) => {
    await page.goto('/')
    await page.getByTitle('Toggle Theme').click()
    await expect(page.locator('html')).toHaveClass(/dark/)
  })
})
