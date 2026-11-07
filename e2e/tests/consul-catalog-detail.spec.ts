import { test, expect } from '../fixtures'
import { switchToConsul } from '../fixtures/consul-pages'
import { listCatalogNodes } from '../helpers/consul-api'

test.describe('consul catalog detail', () => {
  test('service detail page loads for the built-in consul service', async ({ page }) => {
    await switchToConsul(page)
    await page.goto('/consul/catalog/service/consul')

    await expect(page.getByRole('heading', { name: /Service Detail/ })).toBeVisible()
    await expect(page.getByText('consul').first()).toBeVisible()
  })

  test('node detail page loads for a real catalog node', async ({ page, consulApi }) => {
    await switchToConsul(page)
    const nodes = await listCatalogNodes(consulApi)
    test.skip(nodes.length === 0, 'no catalog nodes available')
    const node = nodes[0].Node

    await page.goto(`/consul/catalog/node/${encodeURIComponent(node)}`)
    await expect(page.getByRole('heading', { name: /Node Detail/ })).toBeVisible()
    await expect(page.getByText(node).first()).toBeVisible()
  })

  test('service instance detail page loads', async ({ page, consulApi }) => {
    await switchToConsul(page)
    // A leading '/' would resolve against the origin and drop the /v1 path of CONSUL_BASE.
    const res = await consulApi.get('catalog/service/consul')
    const nodes = (await res.json()) as Array<{ Node: string; ServiceID: string }>
    test.skip(!nodes.length, 'no service instances available')

    const { Node, ServiceID } = nodes[0]
    await page.goto(
      `/consul/catalog/service/consul/instance?node=${encodeURIComponent(Node)}&serviceId=${encodeURIComponent(ServiceID)}`,
    )
    await expect(page.getByRole('heading', { name: /Instance Detail/ })).toBeVisible()
  })
})
