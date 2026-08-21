import { test, expect, createService, deleteService, uniqueName } from '../fixtures'

test.describe('service detail page', () => {
  test('service detail shows basic info and clusters', async ({ page, api, cleanup }) => {
    const serviceName = uniqueName('e2e-detail-svc')

    // Create a service via API
    expect(await createService(api, { serviceName })).toBeTruthy()
    cleanup.push(() => deleteService(api, serviceName).then(() => undefined))

    // Navigate to service detail
    await page.goto(
      `/service/detail?serviceName=${serviceName}&groupName=DEFAULT_GROUP&namespaceId=`,
    )
    await expect(page.getByRole('heading', { name: 'Service Detail' })).toBeVisible()
    await expect(page.getByText(serviceName).first()).toBeVisible()

    // Verify Basic Info section
    await expect(page.getByText('Basic Info')).toBeVisible()
    await expect(page.getByText('Service Name')).toBeVisible()
    await expect(page.getByText('Group Name')).toBeVisible()
    await expect(page.getByText('Cluster Count')).toBeVisible()
    await expect(page.getByText('Instance Count')).toBeVisible()
    await expect(page.getByText('Protect Threshold')).toBeVisible()

    // Verify Clusters section
    await expect(page.getByText('Clusters')).toBeVisible()

    // Verify Edit Service button
    await expect(page.getByRole('button', { name: 'Edit Service' })).toBeVisible()

    // Verify Subscribers link
    await expect(page.getByRole('link', { name: 'Subscribers' })).toBeVisible()
  })

  test('subscribers link navigates to subscriber list', async ({ page, api, cleanup }) => {
    const serviceName = uniqueName('e2e-sub-svc')

    expect(await createService(api, { serviceName })).toBeTruthy()
    cleanup.push(() => deleteService(api, serviceName).then(() => undefined))

    await page.goto(
      `/service/detail?serviceName=${serviceName}&groupName=DEFAULT_GROUP&namespaceId=`,
    )
    await page.getByRole('link', { name: 'Subscribers' }).click()
    await expect(page).toHaveURL(/\/subscribers/)
    await expect(page.getByRole('heading', { name: 'Subscribers' })).toBeVisible()
  })

  test('edit service modal updates protect threshold', async ({ page, api, cleanup }) => {
    const serviceName = uniqueName('e2e-edit-svc')

    expect(await createService(api, { serviceName })).toBeTruthy()
    cleanup.push(() => deleteService(api, serviceName).then(() => undefined))

    await page.goto(
      `/service/detail?serviceName=${serviceName}&groupName=DEFAULT_GROUP&namespaceId=`,
    )

    // Open edit modal
    await page.getByRole('button', { name: 'Edit Service' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    // Update protect threshold
    await dialog.locator('input[type="number"]').fill('0.7')
    await dialog.getByRole('button', { name: 'Save' }).click()
    await expect(dialog).toBeHidden()

    // Verify updated value
    await expect(page.getByText('0.7')).toBeVisible()
  })

  test('subscriber list page loads with search', async ({ page }) => {
    await page.goto('/subscribers')
    await expect(page.getByRole('heading', { name: 'Subscribers' })).toBeVisible()

    // Verify search inputs
    await expect(page.getByPlaceholder('Service Name')).toBeVisible()
    await expect(page.getByPlaceholder('Group Name')).toBeVisible()

    // Verify search button
    await expect(page.getByRole('button', { name: 'Search' })).toBeVisible()
  })
})
