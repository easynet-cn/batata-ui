import { test, expect, type Page } from '@playwright/test'

/**
 * Signing out of Consul/Apollo clears the tokens but deliberately keeps
 * `batata_provider`, so the standalone /login page renders that provider's
 * form. Regression coverage for the case where the page had no way back to
 * Batata (and where clicking a provider entry only changed localStorage).
 *
 * The server-state response is stubbed so the Consul ACL / plugin-enabled
 * branches are deterministic regardless of how the backend is configured.
 */
const SERVER_STATE = {
  consul_enabled: 'true',
  apollo_enabled: 'true',
  consul_acl_enabled: 'true',
  console_ui_enabled: 'true',
  auth_admin_request: 'false',
}

test.use({ storageState: { cookies: [], origins: [] } })

async function seedProvider(
  page: Page,
  provider: 'batata' | 'consul' | 'apollo',
  stateOverride: Record<string, string> = {},
) {
  await page.addInitScript((p) => {
    localStorage.setItem('batata_lang', 'en')
    localStorage.setItem('batata_provider', p)
    localStorage.removeItem('batata-token')
    localStorage.removeItem('consul-token')
    localStorage.removeItem('apollo-token')
  }, provider)

  await page.route('**/v3/console/server/state', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ...SERVER_STATE, ...stateOverride }),
    }),
  )
  await page.route('**/consul-api/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  )
  await page.route('**/apollo-api/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  )
}

test.describe('login page provider switch', () => {
  test('signing out of Apollo still allows switching back to Batata', async ({ page }) => {
    await seedProvider(page, 'apollo')
    await page.goto('/login')

    await expect(page.getByRole('heading', { name: 'Apollo Access' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'BATATA' })).toBeVisible()

    await page.getByRole('button', { name: 'BATATA' }).click()

    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible()
    await expect(page.locator('input[type="text"]')).toBeVisible()
    expect(await page.evaluate(() => localStorage.getItem('batata_provider'))).toBe('batata')
  })

  test('signing out of Consul (ACL on) still allows switching back to Batata', async ({ page }) => {
    await seedProvider(page, 'consul')
    await page.goto('/login')

    // With ACL enabled a cold start must land on the token form, not the
    // dashboard (the old guard bypassed auth before ACL state was loaded).
    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByRole('heading', { name: 'Consul Access' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'BATATA' })).toBeVisible()

    await page.getByRole('button', { name: 'BATATA' }).click()

    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible()
    expect(await page.evaluate(() => localStorage.getItem('batata_provider'))).toBe('batata')
  })

  test('switching provider re-renders the login form without a reload', async ({ page }) => {
    await seedProvider(page, 'batata')
    await page.goto('/login')
    // A page reload would discard this marker; a reactive update keeps it.
    await page.evaluate(() => {
      ;(window as unknown as { __spaMarker?: string }).__spaMarker = 'kept'
    })

    await page.getByRole('button', { name: 'CONSUL' }).click()
    await expect(page.getByRole('heading', { name: 'Consul Access' })).toBeVisible()

    await page.getByRole('button', { name: 'APOLLO' }).click()
    await expect(page.getByRole('heading', { name: 'Apollo Access' })).toBeVisible()

    await page.getByRole('button', { name: 'BATATA' }).click()
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible()

    expect(
      await page.evaluate(() => (window as unknown as { __spaMarker?: string }).__spaMarker),
    ).toBe('kept')
    expect(await page.evaluate(() => localStorage.getItem('batata_provider'))).toBe('batata')
  })

  test('disabled provider entries are hidden and an unsupported provider falls back', async ({
    page,
  }) => {
    await seedProvider(page, 'apollo', {
      consul_enabled: 'false',
      apollo_enabled: 'false',
    })
    await page.goto('/login')

    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'BATATA' })).toHaveCount(0)
    expect(await page.evaluate(() => localStorage.getItem('batata_provider'))).toBe('batata')
  })

  test('Consul with ACL disabled still skips the login page once state is known', async ({
    page,
  }) => {
    await seedProvider(page, 'consul', { consul_acl_enabled: 'false' })
    await page.goto('/login')

    // Failing closed at bootstrap adds one login-page round trip; the page
    // then reads the state and enters the dashboard anonymously.
    await expect(page).toHaveURL(/\/consul\/dashboard/, { timeout: 15_000 })
  })
})
