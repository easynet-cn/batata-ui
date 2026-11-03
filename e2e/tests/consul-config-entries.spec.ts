import { test, expect, uniqueName } from '../fixtures'
import { switchToConsul } from '../fixtures/consul-pages'

test.describe('consul config entries', () => {
  test('config entries list page loads with correct headers', async ({ page }) => {
    await switchToConsul(page)
    await page.goto('/consul/config-entries')

    await expect(page.getByRole('heading', { name: 'Config Entries' })).toBeVisible()
    await expect(page.getByText('Name')).toBeVisible()
    await expect(page.getByText('Namespace')).toBeVisible()
    await expect(page.getByText('Create Index')).toBeVisible()
    await expect(page.getByText('Modify Index')).toBeVisible()
    await expect(page.getByText('Actions')).toBeVisible()
  })

  test('kind filter tabs are present', async ({ page }) => {
    await switchToConsul(page)
    await page.goto('/consul/config-entries')

    // The kind filter renders a row of kind chips (e.g. proxy-defaults / services).
    const tabs = page
      .locator('button')
      .filter({ hasText: /proxy-defaults|service-defaults|services/i })
    await expect(tabs.first()).toBeVisible()
  })

  test('create, edit and delete a config entry via the list modal', async ({ page }) => {
    await switchToConsul(page)
    await page.goto('/consul/config-entries')
    await expect(page.getByRole('heading', { name: 'Config Entries' })).toBeVisible()

    const name = `e2e-ce-${uniqueName('t')}`
    const bodyV1 = '{"Protocol":"tcp"}'
    const bodyV2 = '{"Protocol":"udp"}'

    // ---- Create ----
    await page.getByRole('button', { name: 'Create Config Entry' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await dialog.locator('select').selectOption('service-defaults')
    await dialog.getByPlaceholder('Name').fill(name)
    await dialog.locator('textarea').fill(bodyV1)
    await dialog.getByRole('button', { name: 'Create' }).click()
    await expect(dialog).toBeHidden()

    let row = page.locator('tbody tr').filter({ hasText: name })
    await expect(row).toHaveCount(1)

    // ---- Edit the body ----
    await row.getByTitle('Edit').click()
    const editDialog = page.getByRole('dialog')
    await expect(editDialog).toBeVisible()
    await editDialog.locator('textarea').fill(bodyV2)
    await editDialog.getByRole('button', { name: 'Save' }).click()
    await expect(editDialog).toBeHidden()

    row = page.locator('tbody tr').filter({ hasText: name })
    await expect(row).toHaveCount(1)

    // ---- Delete ----
    await row.getByTitle('Delete').click()
    const confirm = page.getByRole('alertdialog')
    await expect(confirm).toBeVisible()
    await confirm.getByRole('button', { name: 'Delete' }).click()
    await expect(confirm).toBeHidden()
    await expect(page.locator('tbody tr').filter({ hasText: name })).toHaveCount(0)
  })
})
