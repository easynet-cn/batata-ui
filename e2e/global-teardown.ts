import { apiRequest, deleteMcpServer, listMcpServers } from './helpers/api'

/**
 * Global teardown: runs once after all tests.
 * Best-effort cleanup of test data that specs may have left behind.
 */
export default async function globalTeardown(): Promise<void> {
  console.log('\n[global-teardown] starting cleanup...')

  try {
    const ctx = await apiRequest()

    // Remove any leftover MCP servers created by e2e tests.
    const servers = await listMcpServers(ctx)
    for (const server of servers.filter((s) => s.name.startsWith('e2e-mcp'))) {
      await deleteMcpServer(ctx, server.name).catch(() => undefined)
    }

    await ctx.dispose()
  } catch (error) {
    console.warn('[global-teardown] cleanup failed:', String(error))
  }

  console.log('[global-teardown] cleanup complete')
}
