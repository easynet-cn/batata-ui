import { test, expect, createMcpServer, deleteMcpServer, uniqueName } from '../fixtures'

test.describe('mcp server management', () => {
  test('create an MCP server via the UI editor', async ({
    mcpListPage,
    mcpEditorPage,
    api,
    cleanup,
  }) => {
    const name = uniqueName('e2e-mcp')

    // ---- Create via UI (HTTP server) ----
    await mcpListPage.goto()
    await expect(mcpListPage.heading).toBeVisible()
    await mcpListPage.openEditor()
    await expect(mcpEditorPage.nameInput).toBeVisible()
    await mcpEditorPage.createHttpServer(name)
    await expect(mcpListPage.page).toHaveURL(/\/mcp$/, { timeout: 15_000 })
    cleanup.push(() => deleteMcpServer(api, name).then(() => undefined))
  })

  test('list shows a server created via API and the editor loads it', async ({
    mcpListPage,
    mcpEditorPage,
    api,
    cleanup,
  }) => {
    const name = uniqueName('e2e-mcp-api')

    // Create in the "public" namespace so it shows up in the UI list.
    expect(await createMcpServer(api, { name, type: 'off', namespace: 'public' })).toBeTruthy()
    cleanup.push(() => deleteMcpServer(api, name).then(() => undefined))

    await mcpListPage.goto()
    await mcpListPage.search(name)
    const row = mcpListPage.row(name)
    await expect(row).toHaveCount(1)

    // ---- Open the editor for this server and confirm it is populated ----
    await mcpListPage.page.goto(`/mcp/edit?namespace=public&name=${encodeURIComponent(name)}`)
    await expect(mcpEditorPage.nameInput).toHaveValue(name)
  })
})
