import { test, expect, uniqueName } from '../fixtures'
import {
  createApp,
  deleteApp,
  createNamespace,
  createItem,
  deleteItem,
  exportConfigs,
  importConfigs,
} from '../helpers/apollo-api'

const ENV = 'DEV'
const CLUSTER = 'default'
const NS = 'application'

test.describe('apollo import / export', () => {
  test('export includes the created item, then import updates it', async ({
    apolloApi,
    cleanup,
  }) => {
    const appId = `e2e-imex-${uniqueName('app')}`
    const key = `e2e.imex.key.${uniqueName('k')}`

    expect(await createApp(apolloApi, appId)).toBeTruthy()
    cleanup.push(() => deleteApp(apolloApi, appId).then(() => undefined))
    expect(await createNamespace(apolloApi, appId, ENV, CLUSTER, NS)).toBeTruthy()
    expect(await createItem(apolloApi, appId, ENV, CLUSTER, NS, key, 'v1')).toBeTruthy()
    cleanup.push(() => deleteItem(apolloApi, appId, ENV, CLUSTER, NS, key).then(() => undefined))

    const exported = await exportConfigs(apolloApi, appId, CLUSTER, NS)
    expect(exported).toContain(key)

    const ok = await importConfigs(apolloApi, appId, CLUSTER, NS, `${key}=v2\n`)
    expect(ok).toBeTruthy()
  })
})
