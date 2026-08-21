import { test, expect, uniqueName } from '../fixtures'
import {
  createApp,
  deleteApp,
  createNamespace,
  createItem,
  deleteItem,
} from '../helpers/apollo-api'

const ENV = 'DEV'
const CLUSTER = 'default'
const NS = 'application'

test.describe('apollo namespace items', () => {
  test('create an item via UI and delete it', async ({ page, apolloApi, cleanup }) => {
    const appId = `e2e-ns-${uniqueName('app')}`
    const key = `e2e.key.${uniqueName('k')}`
    const value = 'e2e-value'

    expect(await createApp(apolloApi, appId)).toBeTruthy()
    cleanup.push(() => deleteApp(apolloApi, appId).then(() => undefined))
    expect(await createNamespace(apolloApi, appId, ENV, CLUSTER, NS)).toBeTruthy()

    // Navigate directly to the namespace items view
    await page.goto(
      `/apollo/namespace?appId=${encodeURIComponent(appId)}&env=${ENV}&cluster=${CLUSTER}&namespace=${NS}`,
    )
    await expect(page.getByText(NS).first()).toBeVisible()

    // Create item via UI
    await page.getByRole('button', { name: /Create Item/i }).click()
    await page.getByPlaceholder('key.name').fill(key)
    await page.getByPlaceholder('value').fill(value)
    await page
      .locator('.fixed.inset-0')
      .getByRole('button', { name: /create/i })
      .click()
    cleanup.push(() => deleteItem(apolloApi, appId, ENV, CLUSTER, NS, key).then(() => undefined))

    const row = page.locator('table tbody tr', { hasText: key })
    await expect(row).toHaveCount(1)
    await expect(row).toContainText(value)

    // Delete item via UI
    page.on('dialog', (d) => d.accept())
    await row.getByTitle('Delete').click()
    await expect(page.locator('table tbody tr', { hasText: key })).toHaveCount(0)
  })

  test('create an item via API and see it in the UI list', async ({ page, apolloApi, cleanup }) => {
    const appId = `e2e-ns-api-${uniqueName('app')}`
    const key = `e2e.api.key.${uniqueName('k')}`
    const value = 'api-value'

    expect(await createApp(apolloApi, appId)).toBeTruthy()
    cleanup.push(() => deleteApp(apolloApi, appId).then(() => undefined))
    expect(await createNamespace(apolloApi, appId, ENV, CLUSTER, NS)).toBeTruthy()
    expect(await createItem(apolloApi, appId, ENV, CLUSTER, NS, key, value)).toBeTruthy()
    cleanup.push(() => deleteItem(apolloApi, appId, ENV, CLUSTER, NS, key).then(() => undefined))

    await page.goto(
      `/apollo/namespace?appId=${encodeURIComponent(appId)}&env=${ENV}&cluster=${CLUSTER}&namespace=${NS}`,
    )
    const row = page.locator('table tbody tr', { hasText: key })
    await expect(row).toHaveCount(1)
    await expect(row).toContainText(value)
  })
})
