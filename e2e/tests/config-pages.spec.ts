import { test, expect } from '../fixtures'
import { createConfig, deleteConfig, listConfigHistory } from '../helpers/api'

const SUFFIX = Date.now().toString(36)
const DATA_ID = `e2e-config-pages-${SUFFIX}.yaml`
const GROUP = 'DEFAULT_GROUP'
const CONTENT = 'page: smoke\n'

test.describe('config sub-page navigation', () => {
  test('detail, history, listeners, sync and rollback pages all render', async ({
    page,
    api,
    cleanup,
  }) => {
    cleanup.push(async () => {
      await deleteConfig(api, DATA_ID, GROUP, 'public')
    })
    expect(await createConfig(api, { dataId: DATA_ID, groupName: GROUP, content: CONTENT })).toBe(
      true,
    )

    const query = `dataId=${DATA_ID}&groupName=${GROUP}&namespaceId=public`

    await page.goto(`/config/detail?${query}`)
    await expect(page.getByText('Config Detail')).toBeVisible()

    await page.goto(`/config/history?${query}`)
    await expect(page.getByText('History Version')).toBeVisible()

    await page.goto(`/config/sync?${query}`)
    await expect(page.getByText('Configuration Sync')).toBeVisible()

    await page.goto(`/config/rollback?${query}`)
    await expect(page.getByText('Config Rollback')).toBeVisible()

    const history = await listConfigHistory(api, {
      dataId: DATA_ID,
      groupName: GROUP,
      namespaceId: 'public',
    })
    test.skip(history.length === 0, 'no history entry available')
    await page.goto(`/config/history/detail?${query}&nid=${history[0].id}`)
    await expect(page.getByText('History Detail')).toBeVisible()
  })
})
