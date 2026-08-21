import { test, expect, createService, deleteService } from '../fixtures'
import { registerInstance, deregisterInstance } from '../helpers/api'

const SUFFIX = Date.now().toString(36)
const SERVICE = `e2e-inst-${SUFFIX}`
const GROUP = 'DEFAULT_GROUP'
const IP = '10.0.0.1'
const PORT = 8080

test.describe('service instance management', () => {
  test('register, edit weight, toggle status and deregister an instance', async ({
    page,
    api,
    cleanup,
  }) => {
    // ---- Setup: a service with one registered instance ----
    cleanup.push(() => deleteService(api, SERVICE).then(() => undefined))
    expect(await createService(api, { serviceName: SERVICE })).toBeTruthy()
    cleanup.push(() =>
      deregisterInstance(api, { serviceName: SERVICE, ip: IP, port: PORT }).then(() => undefined),
    )
    expect(
      await registerInstance(api, {
        serviceName: SERVICE,
        ip: IP,
        port: PORT,
        weight: 1,
        enabled: true,
      }),
    ).toBeTruthy()

    // ---- Instance is listed in the service detail page ----
    await page.goto(`/service/detail?serviceName=${SERVICE}&groupName=${GROUP}&namespaceId=`)
    await expect(page.getByRole('heading', { name: 'Service Detail' })).toBeVisible()
    let row = page.locator('tbody tr').filter({ hasText: IP })
    await expect(row).toHaveCount(1)

    // ---- Edit weight via the instance modal ----
    await row.getByTitle('Edit').click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await dialog.locator('input[type="number"]').fill('5')
    await dialog.getByRole('button', { name: 'Save' }).click()
    await expect(dialog).toBeHidden()

    row = page.locator('tbody tr').filter({ hasText: IP })
    await expect(row).toContainText('5')

    // ---- Toggle the instance offline (power button) ----
    // Initially enabled -> the power button is titled "Offline"; after toggle it becomes "Online".
    await expect(row.getByTitle('Offline')).toHaveCount(1)
    await row.getByTitle('Offline').click()
    await expect(row.getByTitle('Online')).toHaveCount(1)

    // ---- Deregister the instance ----
    await row.getByTitle('Deregister Instance').click()
    const confirm = page.getByRole('alertdialog')
    await expect(confirm).toBeVisible()
    await confirm.getByRole('button', { name: 'Deregister' }).click()
    await expect(confirm).toBeHidden()

    await expect(page.locator('tbody tr').filter({ hasText: IP })).toHaveCount(0)
  })
})
