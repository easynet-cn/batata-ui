import { test, expect, uniqueName, confirmAlert } from '../fixtures'
import { switchToApollo } from '../fixtures/apollo-pages'

// A2 — ApolloUserManagementView (admin user CRUD)
// UI-driven. Requires admin login (storageState).
test.describe('apollo users', () => {
  test('create, enable/disable and delete a user', async ({ page }) => {
    await switchToApollo(page)
    await page.goto('/apollo/users')
    await expect(page.getByRole('heading', { name: /User Management/i })).toBeVisible()

    const userId = `e2e-user-${uniqueName('u')}`
    await page.getByRole('button', { name: /Create User/i }).click()

    const dialog = page.getByRole('dialog')
    await dialog.locator('input:not([type])').nth(0).fill(userId) // userId
    await dialog.locator('input:not([type])').nth(1).fill('E2E User') // name
    await dialog.locator('input:not([type])').nth(2).fill('e2e@batata.local') // email
    await dialog.locator('input[type="password"]').nth(0).fill('E2Epass123!')
    await dialog.locator('input[type="password"]').nth(1).fill('E2Epass123!')
    await dialog.getByRole('button', { name: /create/i }).click()

    const row = page.locator('table tbody tr', { hasText: userId })
    await expect(row).toHaveCount(1)

    // Toggle enabled state (button text flips between Enable / Disable).
    const toggle = row.getByRole('button', { name: /Enable|Disable/i })
    await expect(toggle).toBeVisible()

    await row.getByRole('button', { name: /delete/i }).click()
    await confirmAlert(page)
    await expect(page.locator('table tbody tr', { hasText: userId })).toHaveCount(0)
  })

  test('failure: duplicate user id is rejected', async ({ page }) => {
    await switchToApollo(page)
    await page.goto('/apollo/users')

    const userId = `e2e-dup-${uniqueName('u')}`
    const openAndFill = async () => {
      await page.getByRole('button', { name: /Create User/i }).click()
      const dialog = page.getByRole('dialog')
      await dialog.locator('input:not([type])').nth(0).fill(userId)
      await dialog.locator('input:not([type])').nth(1).fill('E2E User')
      await dialog.locator('input:not([type])').nth(2).fill('e2e@batata.local')
      await dialog.locator('input[type="password"]').nth(0).fill('E2Epass123!')
      await dialog.locator('input[type="password"]').nth(1).fill('E2Epass123!')
      await dialog.getByRole('button', { name: /create/i }).click()
      return dialog
    }

    await openAndFill()
    await expect(page.locator('table tbody tr', { hasText: userId })).toHaveCount(1)

    // Second creation with the same id should be rejected; dialog stays open.
    const dialog2 = await openAndFill()
    await expect(dialog2).toBeVisible()
    await expect(page.getByText(/User already exists/i)).toBeVisible()

    // The modal overlays the table, so dismiss it before the cleanup click.
    await dialog2.getByRole('button', { name: /cancel/i }).click()
    await expect(dialog2).toBeHidden()

    // Cleanup the first user.
    const row = page.locator('table tbody tr', { hasText: userId })
    await row.getByRole('button', { name: /delete/i }).click()
    await confirmAlert(page)
  })

  test('failure: mismatched confirm-password keeps the dialog open', async ({ page }) => {
    await switchToApollo(page)
    await page.goto('/apollo/users')

    const userId = `e2e-pw-${uniqueName('u')}`
    await page.getByRole('button', { name: /Create User/i }).click()
    const dialog = page.getByRole('dialog')
    await dialog.locator('input:not([type])').nth(0).fill(userId)
    await dialog.locator('input:not([type])').nth(1).fill('E2E User')
    await dialog.locator('input:not([type])').nth(2).fill('e2e@batata.local')
    await dialog.locator('input[type="password"]').nth(0).fill('E2Epass123!')
    await dialog.locator('input[type="password"]').nth(1).fill('DifferentPass456!')
    await dialog.getByRole('button', { name: /create/i }).click()

    // Mismatch guard: dialog stays open and no row is created.
    await expect(dialog).toBeVisible()
    await expect(page.locator('table tbody tr', { hasText: userId })).toHaveCount(0)

    // Clean up the dialog for the next run.
    await dialog
      .getByRole('button', { name: /cancel/i })
      .click()
      .catch(() => undefined)
  })
})
