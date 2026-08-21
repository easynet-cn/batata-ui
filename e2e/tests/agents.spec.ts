import { test, expect } from '../fixtures'

test.describe('agents', () => {
  test('agents list page loads', async ({ page }) => {
    await page.goto('/agents')

    await expect(page.getByRole('heading', { name: 'Agents' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Create Agent' })).toBeVisible()
    await expect(page.getByPlaceholder('Search agents...')).toBeVisible()
  })

  test('agent detail page loads', async ({ page }) => {
    await page.goto('/agent/detail?agentName=e2e-agent')

    await expect(page).toHaveURL(/\/agent\/detail/)
    await expect(page.getByText('Basic Info')).toBeVisible()
  })
})
