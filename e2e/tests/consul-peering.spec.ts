import { test, expect } from '../fixtures'
import { switchToConsul } from '../fixtures/consul-pages'

test.describe('consul peerings', () => {
  test('peerings list page loads', async ({ page }) => {
    await switchToConsul(page)
    await page.goto('/consul/peerings')

    await expect(page.getByRole('heading', { name: 'Peerings' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Generate Token' })).toBeVisible()
  })

  test('generate peering token dialog opens', async ({ page }) => {
    await switchToConsul(page)
    await page.goto('/consul/peerings')

    await page.getByRole('button', { name: 'Generate Token' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByPlaceholder('my-peer')).toBeVisible()
  })

  /**
   * Upstream Consul registers POST /v1/peering/token (agent/http_register.go)
   * and its UI bundle posts to that same route. The former /peering/token/
   * generate suffix has no upstream equivalent and is rejected by the gateway.
   */
  test('generating a token posts to the upstream /peering/token route', async ({ page }) => {
    const consulRequests: { method: string; path: string }[] = []

    await page.route('**/consul-api/**', async (route) => {
      const request = route.request()
      const path = new URL(request.url()).pathname
      consulRequests.push({ method: request.method(), path })

      if (request.method() === 'POST' && path === '/consul-api/v1/peering/token') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ PeeringToken: 'e2e-peering-token' }),
        })
      }
      return route.continue()
    })

    await switchToConsul(page)
    await page.goto('/consul/peerings')

    await page.getByRole('button', { name: 'Generate Token' }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByPlaceholder('my-peer').fill('e2e-peer')
    await dialog.getByRole('button', { name: 'Generate Token' }).click()

    await expect
      .poll(() => consulRequests.filter((r) => r.method === 'POST').map((r) => r.path))
      .toContain('/consul-api/v1/peering/token')
    expect(consulRequests.some((r) => r.path.endsWith('/peering/token/generate'))).toBe(false)
    await expect(dialog.locator('textarea')).toHaveValue('e2e-peering-token')
  })
})
