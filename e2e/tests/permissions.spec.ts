import { test, expect, createPermission, deletePermission, uniqueName } from '../fixtures'

test.describe('permission management', () => {
  test('add a permission to a role and delete it', async ({ permissionPage, api, cleanup }) => {
    const role = uniqueName('e2e-role')

    // ---- Add permission via UI ----
    await permissionPage.goto()
    await expect(permissionPage.heading).toBeVisible()
    await permissionPage.addPermission(role)
    cleanup.push(() => deletePermission(api, role).then(() => undefined))

    // ---- Search ----
    await permissionPage.page.getByPlaceholder('Search by role name').fill(role)
    await permissionPage.page.getByRole('button', { name: 'Search' }).click()
    const row = permissionPage.row(role)
    await expect(row).toHaveCount(1)
    await expect(row).toContainText('*:*:*')
    await expect(row).toContainText('Read Only')

    // ---- Delete ----
    await permissionPage.deletePermission(role)
    await permissionPage.page.getByPlaceholder('Search by role name').fill(role)
    await permissionPage.page.getByRole('button', { name: 'Search' }).click()
    await expect(permissionPage.row(role)).toHaveCount(0)
  })

  test('add a permission via API and delete it through the UI', async ({
    permissionPage,
    api,
    cleanup,
  }) => {
    const role = uniqueName('e2e-role-api')

    expect(await createPermission(api, role)).toBeTruthy()
    cleanup.push(() => deletePermission(api, role).then(() => undefined))

    await permissionPage.goto()
    await permissionPage.page.getByPlaceholder('Search by role name').fill(role)
    await permissionPage.page.getByRole('button', { name: 'Search' }).click()
    await expect(permissionPage.row(role)).toHaveCount(1)

    await permissionPage.deletePermission(role)
    await permissionPage.page.getByPlaceholder('Search by role name').fill(role)
    await permissionPage.page.getByRole('button', { name: 'Search' }).click()
    await expect(permissionPage.row(role)).toHaveCount(0)
  })
})
