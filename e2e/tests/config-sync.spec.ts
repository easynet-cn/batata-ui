import { test, expect } from '../fixtures'
import { createConfig, deleteConfig } from '../helpers/api'

const SUFFIX = Date.now().toString(36)
const DATA_ID = `e2e-config-sync-${SUFFIX}.yaml`
const GROUP = 'DEFAULT_GROUP'
const CONTENT = 'sync: true\n'

test.describe('configuration sync', () => {
  test('sync page lists configs and guards sync against missing targets', async ({
    page,
    api,
    cleanup,
  }) => {
    // ---- Setup: a config in the default (public) namespace ----
    cleanup.push(async () => {
      await deleteConfig(api, DATA_ID, GROUP, 'public')
    })
    expect(await createConfig(api, { dataId: DATA_ID, groupName: GROUP, content: CONTENT })).toBe(
      true,
    )

    // ---- Open the sync page ----
    await page.goto('/config/sync')
    await expect(page).toHaveURL(/\/config\/sync/)

    // ---- Stat cards render (target environments / synced / pending / failed) ----
    await expect(page.getByText('Target Environments')).toBeVisible()
    await expect(page.getByText('Synced')).toBeVisible()
    await expect(page.getByText('Pending')).toBeVisible()
    await expect(page.getByText('Sync Failed')).toBeVisible()

    // ---- The created config appears in the config-selection table ----
    const row = page.locator('table tbody tr').filter({ hasText: DATA_ID })
    await expect(row).toHaveCount(1)

    // ---- Empty sync history renders the empty-state copy ----
    await expect(page.getByText('No sync history')).toBeVisible()

    // ---- Select the config, then open the sync modal ----
    await row.locator('input[type="checkbox"]').click()
    await page.getByRole('button', { name: 'Sync Now' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText('Sync Configurations')).toBeVisible()
    await expect(dialog.getByText('Start configuration synchronization')).toBeVisible()

    // ---- Guard: with a config selected but no target environment, Start Sync stays disabled ----
    // Mutant check: removing `|| selectedEnvs.length === 0` from the submit-disabled binding
    // would enable this button with an empty target list.
    await expect(dialog.getByRole('button', { name: 'Start Sync' })).toBeDisabled()

    // ---- Close the modal ----
    await dialog.getByRole('button', { name: 'Cancel' }).click()
    await expect(dialog).toBeHidden()
  })
})
