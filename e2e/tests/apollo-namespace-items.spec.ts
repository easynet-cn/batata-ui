import { test, expect, uniqueName, confirmAlert } from '../fixtures'
import {
  createApp,
  deleteApp,
  createNamespace,
  createItem,
  deleteItem,
  listItems,
} from '../helpers/apollo-api'
import type { Page } from '@playwright/test'

const ENV = 'DEV'
const CLUSTER = 'default'
const NS = 'application'

async function setEditorContent(page: Page, content: string): Promise<void> {
  const editor = page.locator('.cm-content').first()
  await editor.click()
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A')
  await page.keyboard.type(content, { delay: 3 })
}

async function openTextMode(page: Page, appId: string, namespace: string): Promise<void> {
  await page.goto(
    `/apollo/namespace?appId=${encodeURIComponent(appId)}&env=${ENV}&cluster=${CLUSTER}&namespace=${encodeURIComponent(namespace)}`,
  )
  await page.getByRole('button', { name: 'Text Mode' }).first().click()
  await expect(page.locator('.cm-content').first()).toBeVisible()
}

test.describe('apollo namespace items', () => {
  test('create an item via UI and delete it', async ({ page, apolloApi, cleanup }) => {
    const appId = `e2e-ns-${uniqueName('app')}`
    const key = `e2e.key.${uniqueName('k')}`
    const value = 'e2e-value'

    expect(await createApp(apolloApi, appId)).toBeTruthy()
    cleanup.push(() => deleteApp(apolloApi, appId).then(() => undefined))
    expect(await createNamespace(apolloApi, appId, ENV, CLUSTER, NS)).toBeTruthy()

    // Navigate directly to the namespace items view
    await page.goto(
      `/apollo/namespace?appId=${encodeURIComponent(appId)}&env=${ENV}&cluster=${CLUSTER}&namespace=${NS}`,
    )
    await expect(page.getByText(NS).first()).toBeVisible()

    // Create item via UI
    await page.getByRole('button', { name: 'Add Item' }).first().click()
    await page.getByPlaceholder('key.name', { exact: true }).fill(key)
    // The page also has a 'Search key/value' input, so match the textarea exactly.
    await page.getByPlaceholder('value', { exact: true }).fill(value)
    // ApolloAppDetailView's item modal uses :submit-text="t('save')".
    await page.getByRole('dialog').getByRole('button', { name: /save/i }).click()
    cleanup.push(() => deleteItem(apolloApi, appId, ENV, CLUSTER, NS, key).then(() => undefined))

    const row = page.locator('table tbody tr', { hasText: key })
    await expect(row).toHaveCount(1)
    await expect(row).toContainText(value)

    // Delete item via UI
    await row.getByTitle('Delete').click()
    await confirmAlert(page)
    await expect(page.locator('table tbody tr', { hasText: key })).toHaveCount(0)
  })

  test('create an item via API and see it in the UI list', async ({ page, apolloApi, cleanup }) => {
    const appId = `e2e-ns-api-${uniqueName('app')}`
    const key = `e2e.api.key.${uniqueName('k')}`
    const value = 'api-value'

    expect(await createApp(apolloApi, appId)).toBeTruthy()
    cleanup.push(() => deleteApp(apolloApi, appId).then(() => undefined))
    expect(await createNamespace(apolloApi, appId, ENV, CLUSTER, NS)).toBeTruthy()
    expect(await createItem(apolloApi, appId, ENV, CLUSTER, NS, key, value)).toBeTruthy()
    cleanup.push(() => deleteItem(apolloApi, appId, ENV, CLUSTER, NS, key).then(() => undefined))

    await page.goto(
      `/apollo/namespace?appId=${encodeURIComponent(appId)}&env=${ENV}&cluster=${CLUSTER}&namespace=${NS}`,
    )
    const row = page.locator('table tbody tr', { hasText: key })
    await expect(row).toHaveCount(1)
    await expect(row).toContainText(value)
  })

  test('text mode serializes json namespaces as a single content item', async ({
    page,
    apolloApi,
    cleanup,
  }) => {
    const appId = `e2e-ns-json-${uniqueName('app')}`
    const jsonNs = 'application.json'
    const jsonValue = '{"server":{"port":8080},"debug":true}'

    expect(await createApp(apolloApi, appId)).toBeTruthy()
    cleanup.push(() => deleteApp(apolloApi, appId).then(() => undefined))
    expect(await createNamespace(apolloApi, appId, ENV, CLUSTER, jsonNs, 'json')).toBeTruthy()
    expect(
      await createItem(apolloApi, appId, ENV, CLUSTER, jsonNs, 'content', jsonValue),
    ).toBeTruthy()

    await openTextMode(page, appId, jsonNs)
    // The editor shows the raw file content, not "content=<value>".
    await expect(page.locator('.cm-content').first()).toContainText('"server"')
    await expect(page.locator('.cm-content').first()).not.toContainText('content=')
    // format label reflects the namespace format.
    await expect(page.getByText('Format: json')).toBeVisible()

    const edited = '{"server":{"port":9090},"debug":false}'
    await setEditorContent(page, edited)
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.locator('.cm-content')).toHaveCount(0)

    const items = await listItems(apolloApi, appId, ENV, CLUSTER, jsonNs)
    expect(items).toHaveLength(1)
    expect(items[0].key).toBe('content')
    expect(items[0].value.replace(/\s/g, '')).toBe(edited.replace(/\s/g, ''))
  })

  test('text mode rejects invalid json and keeps the original content', async ({
    page,
    apolloApi,
    cleanup,
  }) => {
    const appId = `e2e-ns-jsonbad-${uniqueName('app')}`
    const jsonNs = 'application.json'
    const jsonValue = '{"ok":true}'

    expect(await createApp(apolloApi, appId)).toBeTruthy()
    cleanup.push(() => deleteApp(apolloApi, appId).then(() => undefined))
    expect(await createNamespace(apolloApi, appId, ENV, CLUSTER, jsonNs, 'json')).toBeTruthy()
    expect(
      await createItem(apolloApi, appId, ENV, CLUSTER, jsonNs, 'content', jsonValue),
    ).toBeTruthy()

    await openTextMode(page, appId, jsonNs)
    await setEditorContent(page, '{broken json')
    await page.getByRole('button', { name: 'Save' }).click()
    // Syntax error is shown and text mode stays open; nothing is persisted.
    await expect(page.getByText('Invalid configuration syntax')).toBeVisible()
    await expect(page.locator('.cm-content').first()).toBeVisible()

    const items = await listItems(apolloApi, appId, ENV, CLUSTER, jsonNs)
    expect(items).toHaveLength(1)
    expect(items[0].value).toBe(jsonValue)
  })

  test('text mode still parses properties namespaces as key=value lines', async ({
    page,
    apolloApi,
    cleanup,
  }) => {
    const appId = `e2e-ns-props-${uniqueName('app')}`

    expect(await createApp(apolloApi, appId)).toBeTruthy()
    cleanup.push(() => deleteApp(apolloApi, appId).then(() => undefined))
    expect(await createNamespace(apolloApi, appId, ENV, CLUSTER, NS)).toBeTruthy()
    expect(await createItem(apolloApi, appId, ENV, CLUSTER, NS, 'first.key', 'one')).toBeTruthy()
    expect(await createItem(apolloApi, appId, ENV, CLUSTER, NS, 'second.key', 'two')).toBeTruthy()

    await openTextMode(page, appId, NS)
    await expect(page.locator('.cm-content').first()).toContainText('first.key=one')

    await setEditorContent(page, 'first.key=changed\nadded.key=three')
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.locator('.cm-content')).toHaveCount(0)

    const items = await listItems(apolloApi, appId, ENV, CLUSTER, NS)
    const byKey = new Map(items.map((i) => [i.key, i.value]))
    expect(byKey.get('first.key')).toBe('changed')
    expect(byKey.get('added.key')).toBe('three')
    expect(byKey.has('second.key')).toBe(false)
  })
})
