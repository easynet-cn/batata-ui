import { test, expect, type Page } from '@playwright/test'

const SUFFIX = Date.now().toString(36)
const NS_ID = `e2e-ns-${SUFFIX}`
const NS_NAME = `E2E Namespace ${SUFFIX}`
const NS_DESC = `Created by Playwright E2E ${NS_ID}`
const NS_NAME_UPDATED = `${NS_NAME} updated`

async function openCreateModal(page: Page): Promise<void> {
  await page.goto('/namespaces')
  await page.getByRole('button', { name: 'Create Namespace' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
}

test.describe('namespace management', () => {
  test('create, edit and delete a namespace', async ({ page }) => {
    // ---- Create ----
    await openCreateModal(page)
    const dialog = page.getByRole('dialog')
    await dialog.getByPlaceholder('Leave empty to auto-generate').fill(NS_ID)
    await dialog.getByPlaceholder('Namespace Name').fill(NS_NAME)
    await dialog.getByPlaceholder('Description').fill(NS_DESC)
    await dialog.getByRole('button', { name: 'Create' }).click()
    await expect(dialog).toBeHidden()

    let row = page.locator('tbody tr').filter({ hasText: NS_ID })
    await expect(row).toHaveCount(1)
    await expect(row).toContainText(NS_NAME)

    // ---- Edit ----
    await row.getByTitle('Edit').click()
    const editDialog = page.getByRole('dialog')
    await expect(editDialog).toBeVisible()
    await editDialog.getByPlaceholder('Namespace Name').fill(NS_NAME_UPDATED)
    await editDialog.getByRole('button', { name: 'Save' }).click()
    await expect(editDialog).toBeHidden()

    row = page.locator('tbody tr').filter({ hasText: NS_ID })
    await expect(row).toHaveCount(1)
    await expect(row).toContainText(NS_NAME_UPDATED)

    // ---- Delete ----
    await row.getByTitle('Delete').click()
    const confirm = page.getByRole('alertdialog')
    await expect(confirm).toBeVisible()
    await confirm.getByRole('button', { name: 'Delete' }).click()
    await expect(confirm).toBeHidden()

    await expect(page.locator('tbody tr').filter({ hasText: NS_ID })).toHaveCount(0)
  })
})
