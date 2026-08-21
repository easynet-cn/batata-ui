import { test, expect, createUser, deleteUser, uniqueName } from '../fixtures'

test.describe('user management', () => {
  test('create a user, reset password and delete it', async ({ userPage, api, cleanup }) => {
    const username = uniqueName('e2e-user')

    // ---- Create via UI ----
    await userPage.goto()
    await expect(userPage.heading).toBeVisible()
    await userPage.createUser(username, 'InitialPass1!')
    cleanup.push(() => deleteUser(api, username).then(() => undefined))

    // ---- Search ----
    await userPage.search(username)
    const row = userPage.row(username)
    await expect(row).toHaveCount(1)
    await expect(row).toContainText('Enabled')

    // ---- Reset password ----
    await userPage.resetPassword(username, 'NewPass2!')

    // ---- Delete ----
    await userPage.deleteUser(username)
    await userPage.search(username)
    await expect(userPage.row(username)).toHaveCount(0)
  })

  test('cannot delete the built-in admin user', async ({ userPage }) => {
    await userPage.goto()
    await userPage.search('nacos')
    const row = userPage.row('nacos')
    await expect(row).toHaveCount(1)

    // The server rejects deleting the built-in admin, so the row must remain.
    await row.getByTitle('Delete', { exact: true }).click()
    const confirm = userPage.page.getByRole('alertdialog')
    await expect(confirm).toBeVisible()
    await confirm.getByRole('button', { name: 'Delete' }).click()
    await expect(userPage.row('nacos')).toHaveCount(1)
  })

  test('create a user via API and delete it through the UI', async ({ userPage, api, cleanup }) => {
    const username = uniqueName('e2e-user-api')

    expect(await createUser(api, username, 'ApiPass1!')).toBeTruthy()
    cleanup.push(() => deleteUser(api, username).then(() => undefined))

    await userPage.goto()
    await userPage.search(username)
    await expect(userPage.row(username)).toHaveCount(1)

    await userPage.deleteUser(username)
    await userPage.search(username)
    await expect(userPage.row(username)).toHaveCount(0)
  })
})
