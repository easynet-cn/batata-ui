import {
  test,
  expect,
  createRole,
  deleteRole,
  createUser,
  deleteUser,
  uniqueName,
} from '../fixtures'

test.describe('role management', () => {
  test('bind a role to a user and delete the binding', async ({ rolePage, api, cleanup }) => {
    const username = uniqueName('e2e-role-user')
    const role = 'ROLE_E2E'

    expect(await createUser(api, username, 'RolePass1!')).toBeTruthy()
    cleanup.push(() => deleteUser(api, username).then(() => undefined))

    // ---- Bind role via UI ----
    await rolePage.goto()
    await expect(rolePage.heading).toBeVisible()
    await rolePage.bindRole(role, username)
    cleanup.push(() => deleteRole(api, role, username).then(() => undefined))

    // ---- Search ----
    await rolePage.searchRoleInput.fill(role)
    await rolePage.searchButton.click()
    const row = rolePage.row(role, username)
    await expect(row).toHaveCount(1)

    // ---- Delete binding ----
    await rolePage.deleteRole(role, username)
    await rolePage.searchRoleInput.fill(role)
    await rolePage.searchButton.click()
    await expect(rolePage.row(role, username)).toHaveCount(0)
  })

  test('cannot delete the ROLE_ADMIN binding', async ({ rolePage, api, cleanup }) => {
    const username = uniqueName('e2e-admin-user')
    const role = 'ROLE_ADMIN'

    expect(await createUser(api, username, 'AdminPass1!')).toBeTruthy()
    cleanup.push(() => deleteUser(api, username).then(() => undefined))
    expect(await createRole(api, role, username)).toBeTruthy()
    cleanup.push(() => deleteRole(api, role, username).then(() => undefined))

    await rolePage.goto()
    await rolePage.searchUsernameInput.fill(username)
    await rolePage.searchButton.click()
    const row = rolePage.row(role, username)
    await expect(row).toHaveCount(1)
    await expect(row.getByTitle('Delete', { exact: true })).toHaveCount(0)
  })
})
