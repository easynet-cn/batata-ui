import type { APIRequestContext } from '@playwright/test'
import { test, expect } from '../fixtures'

/**
 * Production-shaped integration tests for the console same-origin gateway.
 *
 * These run against the packaged console port (E2E_BASE_URL defaults to 8081),
 * never the Vite dev server. The dev proxy used to hide that `/consul-api` and
 * `/apollo-api` were unresolved in production: GET fell through to the SPA
 * fallback and answered an API request with index.html (200).
 *
 * Both plugins are disabled by default. Tests that need them enabled must
 * start batata-server with explicit CLI overrides, e.g.
 *   --batata.plugin.consul.enabled=true --batata.plugin.apollo.enabled=true
 * or the equivalent BATATA_PLUGIN_* environment variables. No config file is
 * changed. The assertions below derive their expectation from
 * `/v3/console/server/state`, so the same spec is valid in both shapes:
 *  - plugin enabled  -> real upstream response, never 404 and never HTML
 *  - plugin disabled -> fail-closed 404, and no provider entry in the UI
 */

type ServerState = Record<string, string | null>

async function readServerState(request: APIRequestContext): Promise<ServerState> {
  const response = await request.get('/v3/console/server/state')
  expect(response.status()).toBe(200)
  return (await response.json()) as ServerState
}

const routes = [
  { flag: 'consul_enabled', path: '/consul-api/v1/status/leader' },
  { flag: 'apollo_enabled', path: '/apollo-api/openapi/v1/apps' },
] as const

test.describe('console same-origin gateway', () => {
  test('server state always advertises both plugin flags', async ({ request }) => {
    const state = await readServerState(request)
    for (const flag of ['consul_enabled', 'apollo_enabled']) {
      expect(state[flag] === 'true' || state[flag] === 'false').toBe(true)
    }
  })

  for (const route of routes) {
    test(`${route.path} is served iff ${route.flag} is true`, async ({ request }) => {
      const state = await readServerState(request)
      const enabled = state[route.flag] === 'true'

      const response = await request.get(route.path)
      const contentType = response.headers()['content-type'] ?? ''
      const body = await response.text()

      // An API request must never be answered with the SPA shell in either shape.
      expect(contentType).not.toContain('text/html')
      expect(body.toLowerCase()).not.toContain('<!doctype html')

      if (enabled) {
        expect(response.status()).not.toBe(404)
        expect([200, 400, 401, 403, 500, 502, 503]).toContain(response.status())
      } else {
        expect(response.status()).toBe(404)
      }
    })
  }

  test('provider entries follow server state', async ({ page, request }) => {
    const state = await readServerState(request)
    const stateResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/v3/console/server/state') && response.status() === 200,
    )
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await stateResponse

    const consul = page.getByRole('button', { name: 'CONSUL', exact: true })
    const apollo = page.getByRole('button', { name: 'APOLLO', exact: true })

    if (state.consul_enabled === 'true') {
      await expect(consul).toBeVisible()
    } else {
      await expect(consul).toHaveCount(0)
    }
    if (state.apollo_enabled === 'true') {
      await expect(apollo).toBeVisible()
    } else {
      await expect(apollo).toHaveCount(0)
    }
  })
})
