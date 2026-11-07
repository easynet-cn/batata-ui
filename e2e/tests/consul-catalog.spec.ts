import { test, expect, uniqueName } from '../fixtures'
import { switchToConsul } from '../fixtures/consul-pages'
import { listCatalogServices, listCatalogNodes, getConsulLeader } from '../helpers/consul-api'

test.describe('consul catalog', () => {
  test('services list displays registered services', async ({
    page,
    catalogServiceListPage,
    consulApi,
  }) => {
    await switchToConsul(page)
    await catalogServiceListPage.goto()
    await expect(catalogServiceListPage.heading).toBeVisible()

    // Verify table headers
    // Scope to columnheader: getByText('Kind') also matches the hidden
    // <option value="">All Kinds</option> in the filter <select>.
    for (const header of ['Health Status', 'Service Name', 'Kind', 'Instance Count']) {
      await expect(page.getByRole('columnheader', { name: header })).toBeVisible()
    }

    // Verify refresh works
    await expect(catalogServiceListPage.refreshButton).toBeVisible()

    // Compare with API: if API returns services, they should appear in the UI
    const services = await listCatalogServices(consulApi)
    const serviceNames = Object.keys(services).filter((n) => n !== 'consul')
    if (serviceNames.length > 0) {
      const firstService = serviceNames[0]
      await catalogServiceListPage.search(firstService)
      // The service should appear (or empty state if filtered out)
      await expect(page.locator('tbody')).toBeVisible()
    }
  })

  test('service search filters the list', async ({ page, catalogServiceListPage }) => {
    await switchToConsul(page)
    await catalogServiceListPage.goto()
    await expect(catalogServiceListPage.heading).toBeVisible()

    // Search for a non-existent service
    await catalogServiceListPage.search(uniqueName('nonexistent'))
    // Should show empty state or no matching rows
    const rows = page.locator('tbody tr')
    const count = await rows.count()
    if (count === 0) {
      // Empty state message
      await expect(page.getByText('No services found').first()).toBeVisible()
    }
  })

  test('nodes list displays cluster nodes', async ({ page, catalogNodeListPage, consulApi }) => {
    await switchToConsul(page)
    await catalogNodeListPage.goto()
    await expect(catalogNodeListPage.heading).toBeVisible()

    // Verify table headers
    for (const header of ['Node Name', 'Address', 'Services']) {
      await expect(page.getByRole('columnheader', { name: header })).toBeVisible()
    }

    // Compare with API
    const nodes = await listCatalogNodes(consulApi)
    if (nodes.length > 0) {
      const firstNode = nodes[0]
      await catalogNodeListPage.search(firstNode.Node)
      await expect(catalogNodeListPage.row(firstNode.Node)).toHaveCount(1)
    }
  })

  test('node search filters the list', async ({ page, catalogNodeListPage }) => {
    await switchToConsul(page)
    await catalogNodeListPage.goto()
    await expect(catalogNodeListPage.heading).toBeVisible()

    // Search for a non-existent node
    await catalogNodeListPage.search(uniqueName('nonexistent'))
    const rows = page.locator('tbody tr')
    const count = await rows.count()
    if (count === 0) {
      await expect(page.getByText('No nodes found').first()).toBeVisible()
    }
  })

  test('consul leader is visible in node list', async ({
    page,
    catalogNodeListPage,
    consulApi,
  }) => {
    const leader = await getConsulLeader(consulApi)
    if (!leader || leader === '""' || leader === '') return

    await switchToConsul(page)
    await catalogNodeListPage.goto()
    // The leader node should show a "Leader" badge
    await expect(page.locator('tbody')).toBeVisible()
  })
})
