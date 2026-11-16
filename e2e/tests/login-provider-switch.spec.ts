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

  test('signing out of anonymous Consul stays on /login and can re-enter', async ({ page }) => {
    await seedProvider(page, 'consul', { consul_acl_enabled: 'false' })
    await page.goto('/login')
    await expect(page).toHaveURL(/\/consul\/dashboard/, { timeout: 15_000 })

    // Open the header user menu and sign out.
    await page
      .locator('header button')
      .filter({ hasText: /anonymous/i })
      .first()
      .click()
    await page.getByRole('button', { name: 'Sign Out' }).click()

    // The explicit sign-out must survive: /login must not bounce back to the
    // Consul dashboard just because ACL is disabled.
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })
    await expect(page.getByText('You have signed out of Consul')).toBeVisible()
    expect(await page.evaluate(() => localStorage.getItem('batata_signed_out_providers'))).toBe(
      'consul',
    )

    // A reload keeps the sign-out (the marker is persisted).
    await page.reload()
    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByText('You have signed out of Consul')).toBeVisible()

    // Re-entering anonymously clears the marker and returns to the dashboard.
    await page.getByRole('button', { name: 'Continue without logging in' }).click()
    await expect(page).toHaveURL(/\/consul\/dashboard/, { timeout: 10_000 })
    expect(
      await page.evaluate(() => localStorage.getItem('batata_signed_out_providers')),
    ).toBeNull()
  })

  test('signing out of Consul keeps the batata session for direct re-entry', async ({ page }) => {
    // Seed a live batata session plus a Consul token session.
    await page.addInitScript(() => {
      localStorage.setItem('batata_lang', 'en')
      localStorage.setItem('batata_provider', 'consul')
      localStorage.setItem('batata-token', 'batata-secret-token')
      localStorage.setItem('batata-username', 'admin')
      localStorage.setItem('batata_user', JSON.stringify({ name: 'admin', globalAdmin: true }))
      localStorage.setItem('consul-token', 'consul-secret-token')
      localStorage.setItem('consul_user', 'my-consul-token')
      localStorage.removeItem('apollo-token')
      localStorage.removeItem('batata_signed_out_providers')
    })
    await page.route('**/v3/console/server/state', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(SERVER_STATE),
      }),
    )
    await page.route('**/consul-api/**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    )
    await page.route('**/apollo-api/**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    )

    await page.goto('/consul/dashboard')
    await expect(page).toHaveURL(/\/consul\/dashboard/)

    // Sign out of Consul only.
    await page
      .locator('header button')
      .filter({ hasText: /my-consul-token/i })
      .first()
      .click()
    await page.getByRole('button', { name: 'Sign Out' }).click()
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })

    // Batata credentials must be untouched.
    expect(await page.evaluate(() => localStorage.getItem('batata-token'))).toBe(
      'batata-secret-token',
    )
    expect(await page.evaluate(() => localStorage.getItem('consul-token'))).toBeNull()

    // Switching to Batata enters directly — no username/password prompt.
    await page.getByRole('button', { name: 'BATATA' }).click()
    await expect(page).toHaveURL(/\/$/, { timeout: 10_000 })
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toHaveCount(0)
  })

  test('header shows the readable token name, never the raw token tail', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('batata_lang', 'en')
      localStorage.setItem('batata_provider', 'consul')
      localStorage.setItem('consul-token', 'abcdefgh-secret-token-12345678')
      localStorage.setItem('consul_user', 'prod-consul-admin')
    })
    await page.route('**/v3/console/server/state', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(SERVER_STATE),
      }),
    )
    await page.route('**/consul-api/**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    )

    await page.goto('/consul/dashboard')
    await expect(page).toHaveURL(/\/consul\/dashboard/)
    const header = page.locator('header')
    await expect(header.getByText('prod-consul-admin')).toBeVisible()
    // The old UI rendered '...' + the last 8 chars of the SecretID as identity.
    await expect(header.getByText(/12345678/)).toHaveCount(0)
  })
})
