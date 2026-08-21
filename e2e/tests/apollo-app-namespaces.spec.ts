import { test, expect, uniqueName } from '../fixtures'
import { createApp, deleteApp, createAppNamespace, deleteAppNamespace } from '../helpers/apollo-api'

test.describe('apollo app namespaces', () => {
  test('create an app namespace via API and see it in the list', async ({
    page,
    apolloApi,
    cleanup,
  }) => {
    const appId = `e2e-appns-${uniqueName('app')}`
    const ns = `e2e-ns-${uniqueName('ns')}`

    expect(await createApp(apolloApi, appId)).toBeTruthy()
    cleanup.push(() => deleteApp(apolloApi, appId).then(() => undefined))
    expect(await createAppNamespace(apolloApi, appId, ns)).toBeTruthy()
    cleanup.push(() => deleteAppNamespace(apolloApi, appId, ns).then(() => undefined))

    await page.goto(`/apollo/app-namespaces?appId=${encodeURIComponent(appId)}`)
    await expect(page.getByText(ns).first()).toBeVisible()
  })
})
