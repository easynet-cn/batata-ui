import { test, expect } from '../fixtures'

test.describe('prompts', () => {
  test('prompts list page loads', async ({ page }) => {
    await page.goto('/prompts')

    await expect(page.getByRole('heading', { name: 'Prompts' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Create Prompt' })).toBeVisible()
    await expect(page.getByPlaceholder('Search by prompt key...')).toBeVisible()
  })

  test('prompt detail page loads', async ({ page }) => {
    await page.goto('/prompt/detail?promptKey=e2e-prompt')

    await expect(page).toHaveURL(/\/prompt\/detail/)
    await expect(page.getByText('Basic Info')).toBeVisible()
  })
})
