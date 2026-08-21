import { test, expect } from '@playwright/test'
import { apiRequest, ADMIN_USER } from '../helpers/api'

const SUFFIX = Date.now().toString(36)
const DATA_ID = `e2e-audit-${SUFFIX}.json`
const GROUP = 'DEFAULT_GROUP'
const CONTENT = '{"audit":true}\n'

test.describe('audit log', () => {
  test('config publish appears in the audit log', async ({ page }) => {
    // Publish a config via the console API so an audit/history record is created.
    const api = await apiRequest()
    const res = await api.post('/v3/console/cs/config', {
      form: { dataId: DATA_ID, groupName: GROUP, content: CONTENT, type: 'json' },
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    expect(res.ok()).toBeTruthy()
    await api.dispose()

    await page.goto('/audit')
    await expect(page.getByRole('heading', { name: 'Audit Log' })).toBeVisible()

    const row = page.locator('tbody tr').filter({ hasText: DATA_ID }).first()
    await expect(row).toBeVisible()
    await expect(row).toContainText(ADMIN_USER)
    await expect(row).toContainText(GROUP)
  })
})
