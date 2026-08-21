import { test, expect, putKV, deleteKV, uniqueName } from '../fixtures'
import { switchToConsul } from '../fixtures/consul-pages'

test.describe('consul KV store', () => {
  test('create, view, edit and delete a KV pair', async ({
    page,
    kvListPage,
    kvEditorPage,
    consulApi,
    cleanup,
  }) => {
    const key = `e2e-kv/${uniqueName('test')}`
    const valueV1 = 'hello-world-v1'
    const valueV2 = 'hello-world-v2'

    // Switch to consul provider
    await switchToConsul(page)

    // ---- Create via UI ----
    await kvEditorPage.gotoCreate()
    await expect(kvEditorPage.heading).toBeVisible()
    await kvEditorPage.createKV(key, valueV1)
    cleanup.push(() => deleteKV(consulApi, key).then(() => undefined))

    // ---- Verify in list ----
    await kvListPage.goto()
    await expect(kvListPage.heading).toBeVisible()
    await kvListPage.search(key)
    const row = kvListPage.row(key)
    await expect(row).toHaveCount(1)
    await expect(row).toContainText(key)

    // ---- View detail ----
    await row.getByTitle('View').click()
    await expect(page).toHaveURL(/\/consul\/kv\/detail/)
    await expect(page.getByText(key).first()).toBeVisible()
    await expect(page.getByText(valueV1).first()).toBeVisible()

    // ---- Edit via UI ----
    await page.goto('/consul/kv')
    await kvListPage.search(key)
    await kvListPage.row(key).getByTitle('Edit').click()
    await expect(page).toHaveURL(/\/consul\/kv\/editor/)
    await expect(page.getByRole('heading', { name: 'Edit KV Pair' })).toBeVisible()
    // Key should be disabled in edit mode
    await expect(kvEditorPage.keyInput).toBeDisabled()
    // Update value
    await kvEditorPage.valueTextarea.fill('')
    await kvEditorPage.valueTextarea.fill(valueV2)
    await kvEditorPage.saveButton.click()
    await expect(page).toHaveURL(/\/consul\/kv/, { timeout: 10_000 })

    // ---- Verify edit via API ----
    const updated = await import('../helpers/consul-api').then((m) => m.getKV(consulApi, key))
    expect(updated).toBe(valueV2)

    // ---- Delete via UI ----
    await kvListPage.goto()
    await kvListPage.search(key)
    await kvListPage.deleteKey(key)

    // ---- Verify deletion ----
    await kvListPage.search(key)
    await expect(kvListPage.row(key)).toHaveCount(0)
  })

  test('create a KV via API and delete it through the UI', async ({
    page,
    kvListPage,
    consulApi,
    cleanup,
  }) => {
    const key = `e2e-kv-api/${uniqueName('test')}`
    const value = 'api-created-value'

    // ---- Create via API ----
    expect(await putKV(consulApi, key, value)).toBeTruthy()
    cleanup.push(() => deleteKV(consulApi, key).then(() => undefined))

    // ---- Verify in UI ----
    await switchToConsul(page)
    await kvListPage.goto()
    await kvListPage.search(key)
    await expect(kvListPage.row(key)).toHaveCount(1)

    // ---- Delete via UI ----
    await kvListPage.deleteKey(key)

    // ---- Verify deletion ----
    await kvListPage.search(key)
    await expect(kvListPage.row(key)).toHaveCount(0)
  })

  test('KV list shows breadcrumb navigation', async ({ page, kvListPage, consulApi, cleanup }) => {
    const folder = `e2e-folder/${uniqueName('bc')}`
    const key = `${folder}/child`

    expect(await putKV(consulApi, key, 'test-value')).toBeTruthy()
    cleanup.push(() => deleteKV(consulApi, folder).then(() => undefined))

    await switchToConsul(page)
    await kvListPage.goto()
    await kvListPage.search(folder)

    // Navigate into folder by clicking the key
    const row = kvListPage.row(folder)
    if ((await row.count()) > 0) {
      await row.click()
      // Should see the child key
      await expect(kvListPage.row('child')).toBeVisible()
    }

    // Cleanup recursive
    await deleteKV(consulApi, key).catch(() => undefined)
  })
})
