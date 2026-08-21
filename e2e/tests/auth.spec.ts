import { test, expect } from '@playwright/test'
import { ADMIN_PASSWORD, ADMIN_USER } from '../helpers/api'

test.use({ storageState: { cookies: [], origins: [] } })

test.describe('authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('batata_lang', 'en')
      localStorage.setItem('batata_provider', 'batata')
    })
  })

  test('unauthenticated visits are redirected to the login page', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible()
  })

  test('wrong password shows an error and stays on the login page', async ({ page }) => {
    await page.goto('/login')
    await page.locator('input[type="text"]').fill(ADMIN_USER)
    await page.locator('input[type="password"]').fill('definitely-wrong-password')
    await page.getByRole('button', { name: 'Sign In' }).click()
    await expect(page.locator('div.text-red-500')).toBeVisible()
    await expect(page).toHaveURL(/\/login/)
  })

  test('valid credentials log the user into the dashboard', async ({ page }) => {
    await page.goto('/login')
    await page.locator('input[type="text"]').fill(ADMIN_USER)
    await page.locator('input[type="password"]').fill(ADMIN_PASSWORD)
    await page.getByRole('button', { name: 'Sign In' }).click()
    await expect(page).toHaveURL('/', { timeout: 15_000 })
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  })

  test('sign out clears the session and redirects to the login page', async ({ page }) => {
    await page.goto('/login')
    await page.locator('input[type="text"]').fill(ADMIN_USER)
    await page.locator('input[type="password"]').fill(ADMIN_PASSWORD)
    await page.getByRole('button', { name: 'Sign In' }).click()
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()

    await page.locator('header').getByRole('button').filter({ hasText: ADMIN_USER }).click()
    await page.getByRole('button', { name: 'Sign Out' }).click()
    await expect(page).toHaveURL(/\/login/)
  })
})
