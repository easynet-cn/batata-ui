import { test, expect, createService, deleteService } from '../fixtures'
import { registerInstance, deregisterInstance } from '../helpers/api'

const SUFFIX = Date.now().toString(36)
const SERVICE = `e2e-cluster-${SUFFIX}`
const IP = '10.0.0.2'
const PORT = 8088

test.describe('service cluster health check', () => {
  test('edit a cluster health-check type via the detail page', async ({ page, api, cleanup }) => {
    // ---- Setup: a service with one instance (which creates the DEFAULT cluster) ----
    cleanup.push(() => deleteService(api, SERVICE).then(() => undefined))
    expect(await createService(api, { serviceName: SERVICE })).toBeTruthy()
    cleanup.push(() =>
      deregisterInstance(api, { serviceName: SERVICE, ip: IP, port: PORT }).then(() => undefined),
    )
    expect(await registerInstance(api, { serviceName: SERVICE, ip: IP, port: PORT })).toBeTruthy()

    await page.goto(`/service/detail?serviceName=${SERVICE}&groupName=DEFAULT_GROUP&namespaceId=`)
    await expect(page.getByRole('heading', { name: 'Service Detail' })).toBeVisible()

    // The DEFAULT cluster card with its edit (pencil) button.
    const clusterCard = page
      .locator('div.border.border-border.rounded-lg')
      .filter({ hasText: 'DEFAULT' })
    await expect(clusterCard).toBeVisible()
    // The cluster edit button lives in the card header (rounded-t-lg), distinct from
    // the per-instance action buttons rendered inside the same card.
    await clusterCard.locator('div.rounded-t-lg').getByRole('button').click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // Switch the health-check type to HTTP and set a path + port.
    await dialog.locator('select').selectOption('HTTP')
    await dialog.getByPlaceholder('/health').fill('/health')
    await dialog.locator('input[type="number"]').fill('8088')
    await dialog.getByRole('button', { name: 'Save' }).click()
    await expect(dialog).toBeHidden()

    // The cluster badge now reflects the HTTP health-check type.
    await expect(clusterCard.getByText('HTTP')).toBeVisible()
  })
})
