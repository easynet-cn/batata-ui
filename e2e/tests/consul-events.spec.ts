import { test, expect } from '../fixtures'
import { switchToConsul } from '../fixtures/consul-pages'

test.describe('consul events', () => {
  test('events list page loads', async ({ page }) => {
    await switchToConsul(page)
    await page.goto('/consul/events')

    await expect(page.getByRole('heading', { name: 'Events' })).toBeVisible()
    // The fire-event action is available.
    await expect(page.getByRole('button', { name: 'Fire Event' })).toBeVisible()
  })

  test('fire event dialog opens and can be cancelled', async ({ page }) => {
    await switchToConsul(page)
    await page.goto('/consul/events')

    await page.getByRole('button', { name: 'Fire Event' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByPlaceholder('my-event')).toBeVisible()
    await dialog.getByRole('button', { name: 'Cancel' }).click()
    await expect(dialog).toBeHidden()
  })
})
