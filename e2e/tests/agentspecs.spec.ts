import { test, expect } from '../fixtures'

test.describe('agent specs', () => {
  test('agent specs list page loads', async ({ page }) => {
    await page.goto('/agentspecs')

    await expect(page.getByRole('heading', { name: 'Agent Specs' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Create AgentSpec' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Upload AgentSpec' })).toBeVisible()
  })

  test('agent spec detail page loads', async ({ page }) => {
    await page.goto('/agentspec/detail?agentSpecName=e2e-agentspec')

    await expect(page).toHaveURL(/\/agentspec\/detail/)
    await expect(page.getByText('Basic Info')).toBeVisible()
  })
})
