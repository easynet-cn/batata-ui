import { test, expect, uniqueName } from '../fixtures'
import { switchToApollo } from '../fixtures/apollo-pages'

// A1 — ApolloServerConfigView (PortalDB / ConfigDB admin config)
// UI-driven, mirrors apollo-apps.spec.ts. Requires admin login (storageState).
test.describe('apollo server config', () => {
  test('portaldb: create and delete a config entry', async ({ page }) => {
    await switchToApollo(page)
    await page.goto('/apollo/server-config')
    await expect(page.getByRole('heading', { name: /Server Config/i })).toBeVisible()

    const key = `e2e-cfg-${uniqueName('k')}`
    await page.getByRole('button', { name: /Add/i }).click()

    const dialog = page.locator('.fixed.inset-0')
    await dialog.locator('input').nth(0).fill(key) // key
    await dialog.locator('input').nth(1).fill('e2e-value') // value
    await dialog.locator('input').nth(2).fill('e2e comment') // comment
    await dialog.getByRole('button', { name: /create/i }).click()

    const row = page.locator('table tbody tr', { hasText: key })
    await expect(row).toHaveCount(1)

    page.on('dialog', (d) => d.accept())
    await row.getByRole('button', { name: /delete/i }).click()
    await expect(page.locator('table tbody tr', { hasText: key })).toHaveCount(0)
  })

  test('configdb: switch to the env-scoped tab', async ({ page }) => {
    await switchToApollo(page)
    await page.goto('/apollo/server-config')

    await page.getByRole('button', { name: /ConfigDB/i }).click()
    // The env selector only renders on the ConfigDB tab.
    await expect(page.locator('select')).toBeVisible()
  })

  test('failure: empty key is rejected and the dialog stays open', async ({ page }) => {
    await switchToApollo(page)
    await page.goto('/apollo/server-config')

    await page.getByRole('button', { name: /Add/i }).click()
    const dialog = page.locator('.fixed.inset-0')
    // Submit without filling the required key/value.
    await dialog.getByRole('button', { name: /create/i }).click()
    // Backend rejects the empty entry; the modal must remain open (error shown).
    await expect(dialog).toBeVisible()
  })
})
