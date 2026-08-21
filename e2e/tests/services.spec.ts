import { test, expect, createService, deleteService, uniqueName } from '../fixtures'

test.describe('service management', () => {
  test('create, search, edit and delete a service', async ({ servicePage, api, cleanup }) => {
    const serviceName = uniqueName('e2e-svc')

    // ---- Create via UI ----
    await servicePage.goto()
    await expect(servicePage.heading).toBeVisible()
    await servicePage.createService(serviceName)
    cleanup.push(() => deleteService(api, serviceName).then(() => undefined))

    // ---- Search ----
    await servicePage.search(serviceName)
    const row = servicePage.row(serviceName)
    await expect(row).toHaveCount(1)
    await expect(row).toContainText('DEFAULT_GROUP')

    // ---- Edit protect threshold ----
    await servicePage.editService(serviceName, '0.5')
    await servicePage.search(serviceName)
    await expect(servicePage.row(serviceName)).toContainText('0.5')

    // ---- Delete ----
    await servicePage.deleteService(serviceName)
    await servicePage.search(serviceName)
    await expect(servicePage.row(serviceName)).toHaveCount(0)
  })

  test('create a service via API and delete it through the UI', async ({
    servicePage,
    api,
    cleanup,
  }) => {
    const serviceName = uniqueName('e2e-svc-api')

    expect(await createService(api, { serviceName })).toBeTruthy()
    cleanup.push(() => deleteService(api, serviceName).then(() => undefined))

    await servicePage.goto()
    await servicePage.search(serviceName)
    await expect(servicePage.row(serviceName)).toHaveCount(1)

    await servicePage.deleteService(serviceName)
    await servicePage.search(serviceName)
    await expect(servicePage.row(serviceName)).toHaveCount(0)
  })
})
