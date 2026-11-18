import { test, expect, type Page } from '@playwright/test'

/**
 * Apollo Portal login regression: the UI now exchanges username/password for a
 * PAT at the public /user/login endpoint instead of asking for a raw token.
 *
 * All backend responses are stubbed so the spec runs without a live cluster or
 * admin credentials, matching the login-provider-switch spec pattern.
 */
const SERVER_STATE = {
  consul_enabled: 'true',
  apollo_enabled: 'true',
  consul_acl_enabled: 'true',
  console_ui_enabled: 'true',
  auth_admin_request: 'false',
}

test.use({ storageState: { cookies: [], origins: [] } })

async function seedApolloLoginPage(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('batata_lang', 'en')
    localStorage.setItem('batata_provider', 'apollo')
    localStorage.removeItem('apollo-token')
    localStorage.removeItem('apollo_user')
    localStorage.removeItem('batata_signed_out_providers')
  })

  await page.route('**/v3/console/server/state', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(SERVER_STATE),
    }),
  )
  // Register the catch-all first: Playwright matches the most recently
  // registered route first, so the specific login stub below must come last.
  await page.route('**/apollo-api/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  )
  await page.route('**/apollo-api/openapi/v1/user/login', (route) => {
    const body = route.request().postDataJSON()
    // Match the backend contract: only apollo/apollo is valid. Checking the
    // password too keeps the invalid-credentials case on the 401 branch.
    if (body?.username === 'apollo' && body?.password === 'apollo') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          tokenValue: 'apollo_pat_login_secret',
          userId: 'apollo',
          username: 'apollo',
          authType: 'USER_TOKEN',
        }),
      })
    }
    return route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ status: 401, message: 'Invalid username or password' }),
    })
  })
}

test.describe('Apollo Portal username/password login', () => {
  test('exchanges credentials for a PAT and stores it as the Apollo session', async ({ page }) => {
    await seedApolloLoginPage(page)
    await page.goto('/login')

    await expect(page.getByRole('heading', { name: 'Apollo Access' })).toBeVisible()
    await page.getByPlaceholder('Enter your username').fill('apollo')
    await page.getByPlaceholder('Enter your password').fill('apollo')
    await page.getByRole('button', { name: 'Sign In' }).click()

    await expect(page).toHaveURL(/\/apollo\/apps/, { timeout: 10_000 })
    expect(await page.evaluate(() => localStorage.getItem('apollo-token'))).toBe(
      'apollo_pat_login_secret',
    )
    expect(await page.evaluate(() => localStorage.getItem('apollo_user'))).toBe('apollo')
  })

  test('shows the backend error and stores no token on invalid credentials', async ({ page }) => {
    await seedApolloLoginPage(page)
    await page.goto('/login')

    await page.getByPlaceholder('Enter your username').fill('apollo')
    await page.getByPlaceholder('Enter your password').fill('wrong')
    await page.getByRole('button', { name: 'Sign In' }).click()

    // The store surfaces the failed request via axios (e.g. "Request failed
    // with status code 401"); assert the visible error generically so the
    // check is not tied to one axios wording.
    await expect(page.getByText(/401|Invalid username or password/)).toBeVisible()
    await expect(page).toHaveURL(/\/login/)
    expect(await page.evaluate(() => localStorage.getItem('apollo-token'))).toBeNull()
  })
})
