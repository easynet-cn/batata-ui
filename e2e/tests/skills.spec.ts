import { test, expect } from '../fixtures'

test.describe('skills', () => {
  test('skills list page loads', async ({ page }) => {
    await page.goto('/skills')

    await expect(page.getByRole('heading', { name: 'Skills' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Create Skill' }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Upload Skill' })).toBeVisible()
  })

  test('skill detail page loads', async ({ page }) => {
    await page.goto('/skill/detail?skillName=e2e-skill')

    await expect(page).toHaveURL(/\/skill\/detail/)
    await expect(page.getByRole('heading', { name: 'e2e-skill', level: 1 })).toBeVisible()
  })
})
