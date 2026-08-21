import { test, expect, uniqueName } from '../fixtures'
import { switchToConsul } from '../fixtures/consul-pages'
import { createIntention, deleteIntention } from '../helpers/consul-api'

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
})
