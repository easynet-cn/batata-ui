import { test, expect, uniqueName } from '../fixtures'
import { switchToConsul } from '../fixtures/consul-pages'
import {
  createIntention,
  deleteIntention,
  getIntention,
  listIntentions,
} from '../helpers/consul-api'

test.describe('consul intentions', () => {
  test('create, list and delete an intention', async ({
    page,
    intentionListPage,
    consulApi,
    cleanup,
  }) => {
    const source = uniqueName('e2e-src')
    const dest = uniqueName('e2e-dst')

    await switchToConsul(page)
    await intentionListPage.goto()
    await expect(intentionListPage.heading).toBeVisible()

    // ---- Create via UI ----
    await intentionListPage.createIntention(source, dest, 'deny')
    cleanup.push(async () => {
      const intentions = await import('../helpers/consul-api').then((m) =>
        m.listIntentions(consulApi),
      )
      const found = intentions.find((i) => i.SourceName === source && i.DestinationName === dest)
      if (found) await deleteIntention(consulApi, found.ID)
    })

    // ---- Verify in list ----
    await intentionListPage.search(source)
    await expect(intentionListPage.row(source, dest)).toHaveCount(1)
    await expect(intentionListPage.row(source, dest)).toContainText('Deny')

    // ---- Delete via UI ----
    await intentionListPage.deleteIntention(source, dest)

    // ---- Verify deletion ----
    await intentionListPage.search(source)
    await expect(intentionListPage.row(source, dest)).toHaveCount(0)
  })

  test('create an intention via API and delete it through the UI', async ({
    page,
    intentionListPage,
    consulApi,
    cleanup,
  }) => {
    const source = uniqueName('e2e-src-api')
    const dest = uniqueName('e2e-dst-api')

    const intentionId = await createIntention(consulApi, {
      SourceName: source,
      DestinationName: dest,
      Action: 'allow',
      Description: 'E2E API intention',
    })
    expect(intentionId).toBeTruthy()
    cleanup.push(() => deleteIntention(consulApi, intentionId!).then(() => undefined))

    await switchToConsul(page)
    await intentionListPage.goto()
    await intentionListPage.search(source)
    await expect(intentionListPage.row(source, dest)).toHaveCount(1)
    await expect(intentionListPage.row(source, dest)).toContainText('Allow')

    await intentionListPage.deleteIntention(source, dest)
    await intentionListPage.search(source)
    await expect(intentionListPage.row(source, dest)).toHaveCount(0)
  })

  test('action filter filters intentions by allow/deny', async ({
    page,
    intentionListPage,
    consulApi,
    cleanup,
  }) => {
    const source1 = uniqueName('e2e-allow-src')
    const dest1 = uniqueName('e2e-allow-dst')
    const source2 = uniqueName('e2e-deny-src')
    const dest2 = uniqueName('e2e-deny-dst')

    const id1 = await createIntention(consulApi, {
      SourceName: source1,
      DestinationName: dest1,
      Action: 'allow',
    })
    const id2 = await createIntention(consulApi, {
      SourceName: source2,
      DestinationName: dest2,
      Action: 'deny',
    })
    cleanup.push(() => deleteIntention(consulApi, id1!).then(() => undefined))
    cleanup.push(() => deleteIntention(consulApi, id2!).then(() => undefined))

    await switchToConsul(page)
    await intentionListPage.goto()

    // Filter by "Allow"
    await page.locator('select').first().selectOption('allow')
    await page.waitForTimeout(500)

    // Filter by "Deny"
    await page.locator('select').first().selectOption('deny')
    await page.waitForTimeout(500)

    // Reset filter
    await page.locator('select').first().selectOption('')
  })

  test('edit an intention through the UI wizard and change its action', async ({
    page,
    intentionListPage,
    consulApi,
    cleanup,
  }) => {
    const source = uniqueName('e2e-edit-src')
    const dest = uniqueName('e2e-edit-dst')

    const id = await createIntention(consulApi, {
      SourceName: source,
      DestinationName: dest,
      Action: 'allow',
    })
    expect(id).toBeTruthy()
    cleanup.push(() => deleteIntention(consulApi, id!).then(() => undefined))

    await switchToConsul(page)
    await intentionListPage.goto()
    await intentionListPage.search(source)
    await expect(intentionListPage.row(source, dest)).toHaveCount(1)
    await expect(intentionListPage.row(source, dest)).toContainText('Allow')

    // Open the edit wizard via the pencil button.
    await intentionListPage.row(source, dest).getByTitle('Edit').click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    // Source/destination are locked in edit mode; only the action is changed.
    await dialog.locator('select').selectOption('deny')
    await dialog.getByRole('button', { name: /update/i }).click()
    await expect(dialog).toBeHidden()

    // The list should reflect the updated action.
    await intentionListPage.search(source)
    await expect(intentionListPage.row(source, dest)).toContainText('Deny')
  })

  test('create an intention with an L7 permission sub-form', async ({
    page,
    intentionListPage,
    consulApi,
    cleanup,
  }) => {
    const source = uniqueName('e2e-l7-src')
    const dest = uniqueName('e2e-l7-dst')

    await switchToConsul(page)
    await intentionListPage.goto()

    // Open the create wizard and attach an L7 (HTTP path) permission.
    await intentionListPage.createButton.click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await dialog.getByPlaceholder('web').fill(source)
    await dialog.getByPlaceholder('api').fill(dest)
    await dialog.getByRole('button', { name: /Add Permission/i }).click()

    // Fill the first L7 permission: PathExact matcher on /api.
    // In the create dialog the <select> order is: nth(0)=intention Action,
    // nth(1)=permission Action, nth(2)=permission HTTP PathType.
    await dialog.locator('select').nth(2).selectOption('PathExact')
    await dialog.getByPlaceholder('/').fill('/api')
    await dialog.getByRole('button', { name: /create/i }).click()
    await expect(dialog).toBeHidden()

    // The intention (with the L7 permission) should appear in the list.
    await intentionListPage.search(source)
    await expect(intentionListPage.row(source, dest)).toHaveCount(1)

    // Verify the L7 permission persisted server-side.
    const intentions = await listIntentions(consulApi)
    const found = intentions.find((i) => i.SourceName === source && i.DestinationName === dest)
    expect(found).toBeTruthy()
    cleanup.push(() => deleteIntention(consulApi, found!.ID).then(() => undefined))

    const detail = await getIntention(consulApi, found!.ID)
    expect(detail).toBeTruthy()
    expect((detail!.Permissions || []).length).toBeGreaterThan(0)
    expect(detail!.Permissions?.[0]?.HTTP?.PathExact).toBe('/api')
  })
})
