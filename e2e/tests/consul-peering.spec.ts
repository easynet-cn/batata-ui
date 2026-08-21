import { test, expect } from '../fixtures'
import { switchToConsul } from '../fixtures/consul-pages'

test.describe('consul peerings', () => {
  test('peerings list page loads', async ({ page }) => {
    await switchToConsul(page)
    await page.goto('/consul/peerings')

    await expect(page.getByRole('heading', { name: 'Peerings' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Generate Token' })).toBeVisible()
  })

  test('generate peering token dialog opens', async ({ page }) => {
    await switchToConsul(page)
    await page.goto('/consul/peerings')

    await page.getByRole('button', { name: 'Generate Token' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByPlaceholder('my-peer')).toBeVisible()
  })
})
