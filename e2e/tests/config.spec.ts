import { test, expect, type Page } from '@playwright/test'

const SUFFIX = Date.now().toString(36)
const DATA_ID = `e2e-config-${SUFFIX}.yaml`
const GROUP = 'DEFAULT_GROUP'
const CONTENT_V1 = 'app.name: e2e-test\napp.env: test\n'
const CONTENT_V2 = 'app.name: e2e-test\napp.env: updated\n'

async function setEditorContent(page: Page, content: string): Promise<void> {
  const editor = page.locator('.cm-content').first()
  await editor.click()
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A')
  await page.keyboard.type(content, { delay: 5 })
}

async function editorText(page: Page): Promise<string> {
  const text = await page.locator('.cm-content').first().textContent()
  return (text ?? '').replace(/\s+/g, '')
}

async function createConfig(page: Page): Promise<void> {
  await page.goto('/config/new')
  await page.getByPlaceholder('com.example.config').fill(DATA_ID)
  await page.getByPlaceholder('DEFAULT_GROUP').fill(GROUP)
  await setEditorContent(page, CONTENT_V1)
  await page.getByRole('button', { name: 'Publish' }).click()
  await expect(page).toHaveURL(/\/configs/, { timeout: 15_000 })
}

async function searchRow(page: Page): Promise<ReturnType<Page['locator']>> {
  await page.getByPlaceholder('Data ID').fill(DATA_ID)
  await page.getByRole('button', { name: 'Search' }).click()
  const row = page.locator('tbody tr').filter({ hasText: DATA_ID })
  await expect(row).toHaveCount(1)
  return row
}

test.describe('config management', () => {
  test('create, view, edit and delete a config', async ({ page }) => {
    // ---- Create ----
    await createConfig(page)
    let row = await searchRow(page)
    await expect(row).toContainText(GROUP)

    // ---- View detail ----
    await row.getByTitle('View').click()
    await expect(page).toHaveURL(/\/config\/detail/)
    await expect(page.getByText(DATA_ID).first()).toBeVisible()

    // ---- Edit ----
    await page.goto('/configs')
    row = await searchRow(page)
    await row.getByTitle('Edit').click()
    await expect(page).toHaveURL(/\/config\/edit/)
    expect(await editorText(page)).toBe(CONTENT_V1.replace(/\s+/g, ''))
    await setEditorContent(page, CONTENT_V2)
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page).toHaveURL(/\/configs/, { timeout: 15_000 })

    row = await searchRow(page)
    await expect(row).toHaveCount(1)

    // ---- Delete ----
    await row.getByTitle('Delete').click()
    const confirm = page.getByRole('alertdialog')
    await expect(confirm).toBeVisible()
    await confirm.getByRole('button', { name: 'Delete' }).click()
    await expect(confirm).toBeHidden()

    await expect(page.locator('tbody tr').filter({ hasText: DATA_ID })).toHaveCount(0)
  })
})
