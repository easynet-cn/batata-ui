import { test, expect, uniqueName } from '../fixtures'
import { switchToConsul } from '../fixtures/consul-pages'
import { createSession, destroySession } from '../helpers/consul-api'

test.describe('consul sessions', () => {
  test('sessions list page loads with correct headers', async ({ page, sessionListPage }) => {
    await switchToConsul(page)
    await sessionListPage.goto()
    await expect(sessionListPage.heading).toBeVisible()

    // Verify table headers
    await expect(page.getByText('Session ID')).toBeVisible()
    await expect(page.getByText('Name')).toBeVisible()
    await expect(page.getByText('Node')).toBeVisible()
    await expect(page.getByText('TTL')).toBeVisible()
    await expect(page.getByText('Behavior')).toBeVisible()
  })

  test('create a session via API and destroy it through the UI', async ({
    page,
    sessionListPage,
    consulApi,
    cleanup,
  }) => {
    const sessionName = uniqueName('e2e-session')

    const sessionId = await createSession(consulApi, { Name: sessionName, Behavior: 'Release' })
    if (!sessionId) {
      // Sessions may not be supported without a running agent
      test.skip(true, 'Session creation requires a running Consul agent')
    }
    expect(sessionId).toBeTruthy()
    cleanup.push(() => destroySession(consulApi, sessionId!).then(() => undefined))

    await switchToConsul(page)
    await sessionListPage.goto()
    await sessionListPage.search(sessionName)
    await expect(sessionListPage.row(sessionName)).toHaveCount(1)

    // Destroy via UI
    await sessionListPage.destroySession(sessionName)
    await sessionListPage.search(sessionName)
    await expect(sessionListPage.row(sessionName)).toHaveCount(0)
  })
})
