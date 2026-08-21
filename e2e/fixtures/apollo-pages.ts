import { expect, type Page } from '@playwright/test'

/** Switch the UI to Apollo provider via the header toggle. */
export async function switchToApollo(page: Page): Promise<void> {
  const apolloBtn = page.locator('header').getByRole('button', { name: 'APOLLO' })
  if (await apolloBtn.isVisible()) {
    await apolloBtn.click()
    await expect(page).toHaveURL(/\/apollo/, { timeout: 10_000 })
  } else {
    // Already on apollo or switcher not visible – navigate directly
    await page.goto('/apollo/apps')
  }
}

/** Switch the UI back to Batata provider. */
export async function switchToBatata(page: Page): Promise<void> {
  const batataBtn = page.locator('header').getByRole('button', { name: 'BATATA' })
  if (await batataBtn.isVisible()) {
    await batataBtn.click()
    await expect(page).toHaveURL(/\/$|\/dashboard/, { timeout: 10_000 })
  }
}
