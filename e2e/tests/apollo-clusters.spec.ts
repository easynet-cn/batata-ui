import { test, expect, uniqueName, confirmAlert } from '../fixtures'
import { switchToApollo } from '../fixtures/apollo-pages'
import { createApp, deleteApp } from '../helpers/apollo-api'

// A3 — ApolloClustersView (cluster management, scoped by appId)
// Requires an app to exist; scaffold via the OpenAPI helper, then drive the UI.
test.describe('apollo clusters', () => {
  test('create and delete a cluster for an app', async ({ page, apolloApi, cleanup }) => {
    const appId = `e2e-cluster-${uniqueName('app')}`
    expect(await createApp(apolloApi, appId)).toBeTruthy()
    cleanup.push(() => deleteApp(apolloApi, appId).then(() => undefined))

    await switchToApollo(page)
    await page.goto(`/apollo/clusters?appId=${appId}`)
    await expect(page.getByRole('heading', { name: /Clusters/i })).toBeVisible()

    const clusterName = `e2e-cl-${uniqueName('c')}`
    await page.getByRole('button', { name: /Create Cluster/i }).click()
    const dialog = page.getByRole('dialog')
    await dialog.locator('input').nth(0).fill(clusterName) // name
    await dialog.locator('input').nth(1).fill('e2e cluster') // comment
    await dialog.getByRole('button', { name: /create/i }).click()

    await expect(page.getByText(clusterName).first()).toBeVisible()

    // Every cluster chip on every env card owns a Delete button; the unscoped
    // locator matches hundreds of them (strict-mode violation).
    await page
      .locator('div.group', { hasText: clusterName })
      .first()
      .locator('button[title="Delete"]')
      .click()
    await confirmAlert(page)
    await expect(page.getByText(clusterName)).toHaveCount(0)
  })

  test('empty state when no appId is provided', async ({ page }) => {
    await switchToApollo(page)
    await page.goto('/apollo/clusters')
    await expect(page.getByText(/Open from an App/i)).toBeVisible()
  })
})
