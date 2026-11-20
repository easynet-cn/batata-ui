import { test, expect, type Page } from '@playwright/test'
import { switchToConsul } from '../fixtures/consul-pages'

/**
 * Upstream Consul exposes a plural list route and singular CRUD routes for ACL
 * binding rules (agent/http_register.go):
 *
 *   GET    /v1/acl/binding-rules      (list, supports ?authmethod=)
 *   PUT    /v1/acl/binding-rule       (create)
 *   PUT    /v1/acl/binding-rule/{id}  (update)
 *   DELETE /v1/acl/binding-rule/{id}  (delete)
 *
 * The UI previously used plural paths for create/update/delete, which the
 * gateway forwards to routes that do not exist upstream. This spec asserts the
 * concrete request paths emitted by the auth-method detail page.
 */
const AUTH_METHOD_NAME = 'e2e-auth-method'
const RULE_ID = 'e2e-rule-id'

const AUTH_METHOD = {
  Name: AUTH_METHOD_NAME,
  Type: 'kubernetes',
  DisplayName: 'E2E Auth Method',
  Description: '',
  TokenLocality: '',
  MaxTokenTTL: '',
  Config: {},
}

const RULE = {
  ID: RULE_ID,
  Description: 'E2E binding rule',
  AuthMethod: AUTH_METHOD_NAME,
  Selector: '',
  BindType: 'service',
  BindName: 'web',
  CreateIndex: 1,
  ModifyIndex: 1,
}

interface ObservedRequest {
  method: string
  path: string
}

async function observeBindingRuleRequests(page: Page, observed: ObservedRequest[]) {
  await page.route('**/consul-api/v1/acl/**', async (route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname
    observed.push({ method: request.method(), path })

    const isCreate = path === '/consul-api/v1/acl/binding-rule'
    const isDetail = path === `/consul-api/v1/acl/binding-rule/${RULE_ID}`
    const isList = path === '/consul-api/v1/acl/binding-rules'

    if (
      request.method() === 'GET' &&
      path === `/consul-api/v1/acl/auth-method/${AUTH_METHOD_NAME}`
    ) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(AUTH_METHOD),
      })
    }
    if (request.method() === 'GET' && isList) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([RULE]),
      })
    }
    if (
      (request.method() === 'PUT' && (isCreate || isDetail)) ||
      (request.method() === 'DELETE' && isDetail)
    ) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(RULE),
      })
    }
    return route.continue()
  })
}

test.describe('consul ACL binding rules', () => {
  test('create, update and delete use the singular upstream routes', async ({ page }) => {
    const observed: ObservedRequest[] = []
    await observeBindingRuleRequests(page, observed)

    await switchToConsul(page)
    await page.goto(`/consul/acl/auth-method/${AUTH_METHOD_NAME}`)
    await expect(page.getByRole('heading', { name: AUTH_METHOD_NAME })).toBeVisible()

    // Create: PUT /acl/binding-rule
    await page.getByRole('button', { name: 'Create Binding Rule' }).click()
    const createDialog = page.getByRole('dialog')
    await createDialog.getByPlaceholder('my-service').fill('e2e-web')
    await createDialog.getByRole('button', { name: 'Create' }).click()
    await expect
      .poll(() => observed.filter((r) => r.method === 'PUT').map((r) => r.path))
      .toContain('/consul-api/v1/acl/binding-rule')

    // Update: PUT /acl/binding-rule/{id}
    await page.getByTitle('Edit').click()
    const editDialog = page.getByRole('dialog')
    await editDialog.getByPlaceholder('my-service').fill('e2e-web-updated')
    await editDialog.getByRole('button', { name: 'Save' }).click()
    await expect
      .poll(() => observed.filter((r) => r.method === 'PUT').map((r) => r.path))
      .toContain(`/consul-api/v1/acl/binding-rule/${RULE_ID}`)

    // Delete: DELETE /acl/binding-rule/{id}
    await page.getByTitle('Delete').click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click()
    await expect
      .poll(() => observed.filter((r) => r.method === 'DELETE').map((r) => r.path))
      .toContain(`/consul-api/v1/acl/binding-rule/${RULE_ID}`)

    // The plural list route is only ever used for reads.
    const writes = observed.filter((r) => r.method === 'PUT' || r.method === 'DELETE')
    expect(writes.every((r) => !r.path.includes('/acl/binding-rules'))).toBe(true)
  })
})
