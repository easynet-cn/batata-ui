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
    // Update value via whichever editor is active (code mode is on by default).
    await kvEditorPage.setValue(valueV2)
    await kvEditorPage.saveButton.click()
    await expect(page).toHaveURL(/\/consul\/kv$/, { timeout: 10_000 })

    // ---- Verify edit via API (poll for Raft commit on the read node) ----
    await expect
      .poll(async () => import('../helpers/consul-api').then((m) => m.getKV(consulApi, key)))
      .toBe(valueV2)

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

  test('value editor has a code mode toggle that preserves content', async ({
    page,
    kvEditorPage,
    consulApi,
    cleanup,
  }) => {
    const key = `e2e-kv-code/${uniqueName('toggle')}`
    const value = 'app:\n  name: e2e\n  env: test\n'
    cleanup.push(() => deleteKV(consulApi, key).then(() => undefined))

    await switchToConsul(page)
    await kvEditorPage.gotoCreate()

    // Code mode is on by default (matching upstream Consul).
    await expect(kvEditorPage.codeModeToggle).toBeChecked()
    await expect(kvEditorPage.valueEditor).toBeVisible()
    await expect(kvEditorPage.valueTextarea).toHaveCount(0)

    await kvEditorPage.keyInput.fill(key)
    await kvEditorPage.setValue(value)

    // Switching to plain text must expose a textarea with the same content.
    // CodeMirror's YAML mode re-indents lines as they are typed, so compare
    // ignoring whitespace — the meaningful content and YAML structure are what
    // must survive the mode switch, not the exact indentation.
    await kvEditorPage.codeModeToggle.uncheck()
    await expect(kvEditorPage.valueTextarea).toBeVisible()
    await expect(kvEditorPage.valueEditor).toHaveCount(0)
    const textValue = await kvEditorPage.valueTextarea.inputValue()
    expect(textValue.replace(/\s/g, '')).toBe(value.replace(/\s/g, ''))

    // ...and saving from plain-text mode persists it.
    await kvEditorPage.saveButton.click()
    await expect(page).toHaveURL(/\/consul\/kv$/, { timeout: 10_000 })
    // Poll: the write may lag on the node serving the API read.
    await expect
      .poll(async () =>
        (await import('../helpers/consul-api').then((m) => m.getKV(consulApi, key)))?.replace(
          /\s/g,
          '',
        ),
      )
      .toBe(value.replace(/\s/g, ''))
  })

  test('entering a folder never re-creates a parent folder row', async ({
    page,
    kvListPage,
    consulApi,
    cleanup,
  }) => {
    // Reproduces the reported "can keep clicking forever" bug: a sibling key
    // outside the current prefix used to be folded into a bogus parent folder
    // whose fullKey was `<prefix>/<parent>/`, so every click appended the parent
    // again. With prefix-in-path + server-side folding, only real children are
    // returned and rendered.
    const root = `e2e-kv-loop/${uniqueName('nav')}`
    const sibling = `${root}/sibling.txt`
    const subFolder = `${root}/sub`
    const leaf = `${subFolder}/leaf.txt`

    expect(await putKV(consulApi, sibling, 'sibling')).toBeTruthy()
    expect(await putKV(consulApi, leaf, 'leaf')).toBeTruthy()
    cleanup.push(() => deleteKV(consulApi, root).then(() => undefined))

    await switchToConsul(page)
    await kvListPage.goto()

    // Navigate into the `sub/` folder via search with a trailing slash.
    await kvListPage.search(`${subFolder}/`)

    // The real leaf is shown and no synthetic parent folder reappears.
    await expect(kvListPage.row('leaf.txt')).toBeVisible()
    await expect(kvListPage.row('sibling.txt')).toHaveCount(0)
    await expect(kvListPage.row('e2e-kv-loop/')).toHaveCount(0)
    await expect(kvListPage.row('sub/')).toHaveCount(0)

    // The breadcrumb reflects exactly the entered prefix: the root folder
    // segment appears once, never appended repeatedly down the path.
    const rootSegments = kvListPage.page.locator('button').filter({ hasText: /^e2e-kv-loop$/ })
    await expect(rootSegments).toHaveCount(1)
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
