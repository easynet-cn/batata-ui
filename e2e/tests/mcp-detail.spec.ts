import { test, expect, createMcpServer, deleteMcpServer, uniqueName } from '../fixtures'

test.describe('mcp server detail', () => {
  test('detail page loads and shows the server name', async ({ page, api, cleanup }) => {
    const name = uniqueName('e2e-mcp-detail')

    expect(await createMcpServer(api, { name, type: 'off', namespace: 'public' })).toBeTruthy()
    cleanup.push(() => deleteMcpServer(api, name).then(() => undefined))

    await page.goto(`/mcp/detail?namespace=public&name=${encodeURIComponent(name)}`)
    await expect(page.getByRole('heading', { name })).toBeVisible()
    await expect(page.getByText('Server Name')).toBeVisible()
  })
})
