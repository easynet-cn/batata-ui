import { test, expect } from '../fixtures'

test.describe('copilot settings', () => {
  test('copilot settings page loads with provider configuration', async ({ page }) => {
    await page.goto('/copilot-settings')

    await expect(page.getByRole('heading', { name: 'Copilot Settings' })).toBeVisible()
    await expect(page.getByText('API Key')).toBeVisible()
    await expect(page.getByPlaceholder('sk-...')).toBeVisible()
    await expect(page.getByText('Model')).toBeVisible()
    await expect(
      page.getByPlaceholder('https://dashscope.aliyuncs.com/compatible-mode/v1'),
    ).toBeVisible()
  })
})
