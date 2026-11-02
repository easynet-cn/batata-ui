import { test, expect, uniqueName } from '../fixtures'
import { switchToApollo } from '../fixtures/apollo-pages'
import { createApp, deleteApp } from '../helpers/apollo-api'

// A11 — ApolloRoleAssign (embedded in the cluster permission modal)
// Drives the role-member assignment lifecycle through the UI.
test.describe('apollo cluster role assignment', () => {
  test('assign and revoke a user on a cluster permission role', async ({
    page,
    apolloApi,
    cleanup,
  }) => {
    const appId = `e2e-ra-${uniqueName('app')}`
    expect(await createApp(apolloApi, appId)).toBeTruthy()
    cleanup.push(() => deleteApp(apolloApi, appId).then(() => undefined))

    const clusterName = `cls-${uniqueName('c')}`
    await switchToApollo(page)
    await page.goto(`/apollo/clusters?appId=${appId}`)
    await expect(page.getByRole('heading', { name: /Clusters/i })).toBeVisible()

    // Create a cluster via the UI.
    await page.getByRole('button', { name: /Create Cluster/i }).click()
    const dialog = page.locator('.fixed.inset-0')
    await dialog.locator('input').nth(0).fill(clusterName)
    await dialog.getByRole('button', { name: /create/i }).click()
    await expect(page.locator('.badge', { hasText: clusterName })).toBeVisible()

    // Open the cluster permission modal (embeds ApolloRoleAssign).
    await page.locator('.badge', { hasText: clusterName }).click()
    await expect(page.getByText('Cluster Permission')).toBeVisible()

    const modifyCard = page.locator('.card', { hasText: 'Cluster Modify Permission' })
    const userId = `e2e-role-${uniqueName('u')}`
    await modifyCard.locator('input').fill(userId)
    await modifyCard.getByRole('button', { name: /^Add$/i }).click()
    await expect(modifyCard.getByText(userId)).toBeVisible()

    // Revoke it.
    await modifyCard.locator('button[title="Delete"]').click()
    await expect(modifyCard.getByText(userId)).toHaveCount(0)
  })
})
