import { test, expect } from '../fixtures'
import { createConfig, updateConfig, deleteConfig, listConfigHistory } from '../helpers/api'

const SUFFIX = Date.now().toString(36)
const DATA_ID = `e2e-history-detail-${SUFFIX}.yaml`
const GROUP = 'DEFAULT_GROUP'
const CONTENT_V1 = 'app.name: hist\napp.version: 1\n'
const CONTENT_V2 = 'app.name: hist\napp.version: 2\n'

test.describe('config history detail', () => {
  test('history detail shows metadata and navigates to rollback', async ({
    page,
    api,
    cleanup,
  }) => {
    // ---- Setup: two versions so an Update history entry exists ----
    cleanup.push(async () => {
      await deleteConfig(api, DATA_ID, GROUP, 'public')
    })
    expect(
      await createConfig(api, { dataId: DATA_ID, groupName: GROUP, content: CONTENT_V1 }),
    ).toBe(true)
    expect(
      await updateConfig(api, { dataId: DATA_ID, groupName: GROUP, content: CONTENT_V2 }),
    ).toBe(true)

    const history = await listConfigHistory(api, {
      dataId: DATA_ID,
      groupName: GROUP,
      namespaceId: 'public',
    })
    const target = [...history].sort((a, b) => a.id - b.id).find((h) => h.opType === 'U')
    expect(target).toBeDefined()

    // ---- Open the history detail page ----
    await page.goto(`/config/history/detail?nid=${target!.id}&dataId=${DATA_ID}&groupName=${GROUP}`)
    await expect(page).toHaveURL(/\/config\/history\/detail/)

    // ---- Header + dataId render ----
    await expect(page.getByText('History Detail')).toBeVisible()
    // The breadcrumb also contains the dataId (`<id> / DEFAULT_GROUP`), so a
    // substring match resolves to two elements. Match the exact heading text.
    await expect(page.getByText(DATA_ID, { exact: true })).toBeVisible()

    // ---- Operation type label and value ----
    // "Update" is rendered twice: once as the header badge and once as the
    // operation-type field value. Assert the field value specifically.
    await expect(page.getByText('Operation Type')).toBeVisible()
    await expect(page.getByText('Update', { exact: true }).first()).toBeVisible()

    // ---- Metadata fields render (group, namespace, op type, source user, source ip, md5) ----
    await expect(page.getByText('Source User')).toBeVisible()
    await expect(page.getByText('Source IP')).toBeVisible()
    await expect(page.getByText('MD5')).toBeVisible()

    // ---- Rollback navigates to the rollback page carrying the history nid ----
    await page.getByRole('button', { name: 'Rollback Configuration' }).click()
    await expect(page).toHaveURL(/\/config\/rollback/)
    await expect(page).toHaveURL(new RegExp(`nid=${target!.id}`))
  })
})
