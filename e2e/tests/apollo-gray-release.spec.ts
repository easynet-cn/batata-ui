import { test, expect, uniqueName } from '../fixtures'
import {
  createApp,
  deleteApp,
  createNamespace,
  createItem,
  deleteItem,
  createBranch,
  deleteBranch,
} from '../helpers/apollo-api'

const ENV = 'DEV'
const CLUSTER = 'default'
const NS = 'application'

test.describe('apollo gray release', () => {
  test('create a gray branch via API and see it in the hub', async ({
    page,
    apolloApi,
    cleanup,
  }) => {
    const appId = `e2e-gray-${uniqueName('app')}`
    const key = `e2e.gray.key.${uniqueName('k')}`

    expect(await createApp(apolloApi, appId)).toBeTruthy()
    cleanup.push(() => deleteApp(apolloApi, appId).then(() => undefined))
    expect(await createNamespace(apolloApi, appId, ENV, CLUSTER, NS)).toBeTruthy()
    expect(await createItem(apolloApi, appId, ENV, CLUSTER, NS, key, 'v1')).toBeTruthy()
    cleanup.push(() => deleteItem(apolloApi, appId, ENV, CLUSTER, NS, key).then(() => undefined))
    expect(await createBranch(apolloApi, appId, ENV, CLUSTER, NS)).toBeTruthy()
    cleanup.push(() => deleteBranch(apolloApi, appId, ENV, CLUSTER, NS).then(() => undefined))

    await page.goto(
      `/apollo/app?appId=${encodeURIComponent(appId)}&env=${ENV}&cluster=${CLUSTER}&namespace=${NS}`,
    )
    await expect(page.getByText(appId).first()).toBeVisible()

    // Switch to the gray release tab and verify the branch is present
    await page.getByRole('button', { name: /Gray Release/i }).click()
    await expect(page.getByText('gray')).toBeVisible()
    await expect(page.getByRole('button', { name: /Merge & Publish/i })).toBeVisible()
  })
})
