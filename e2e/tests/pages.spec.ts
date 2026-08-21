import { test, expect } from '@playwright/test'

const PAGES: Array<{ path: string; heading: string }> = [
  { path: '/cluster', heading: 'Cluster Management' },
  { path: '/settings', heading: 'Settings' },
  { path: '/plugins', heading: 'Plugins' },
  { path: '/datacenters', heading: 'Multi-Datacenter' },
  { path: '/tracing', heading: 'Tracing' },
  { path: '/skills', heading: 'Skills' },
  { path: '/prompts', heading: 'Prompts' },
  { path: '/agents', heading: 'Agents' },
  { path: '/agentspecs', heading: 'Agent Specs' },
]

for (const { path, heading } of PAGES) {
  test(`page ${path} renders with heading "${heading}"`, async ({ page }) => {
    await page.goto(path)
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible()
  })
}
