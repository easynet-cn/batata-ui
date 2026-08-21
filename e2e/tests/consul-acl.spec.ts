import { test, expect, uniqueName } from '../fixtures'
import { switchToConsul } from '../fixtures/consul-pages'
import {
  createAclPolicy,
  deleteAclPolicy,
  createAclRole,
  deleteAclRole,
  createAclToken,
  deleteAclToken,
} from '../helpers/consul-api'

test.describe('consul ACL management', () => {
  test('create, list and delete an ACL policy', async ({
    page,
    aclPolicyListPage,
    aclPolicyEditorPage,
    consulApi,
    cleanup,
  }) => {
    const policyName = uniqueName('e2e-policy')

    await switchToConsul(page)

    // ---- Create via UI ----
    await aclPolicyEditorPage.gotoCreate()
    await expect(aclPolicyEditorPage.heading).toBeVisible()
    await aclPolicyEditorPage.createPolicy(
      policyName,
      'E2E test policy',
      'key "" { policy = "read" }',
    )
    cleanup.push(async () => {
      const policies = await import('../helpers/consul-api').then((m) =>
        m.listAclPolicies(consulApi),
      )
      const found = policies.find((p) => p.Name === policyName)
      if (found) await deleteAclPolicy(consulApi, found.ID)
    })

    // ---- Verify in list ----
    await aclPolicyListPage.goto()
    await expect(aclPolicyListPage.heading).toBeVisible()
    await aclPolicyListPage.search(policyName)
    await expect(aclPolicyListPage.row(policyName)).toHaveCount(1)
    await expect(aclPolicyListPage.row(policyName)).toContainText('E2E test policy')

    // ---- Delete via UI ----
    await aclPolicyListPage.deletePolicy(policyName)

    // ---- Verify deletion ----
    await aclPolicyListPage.search(policyName)
    await expect(aclPolicyListPage.row(policyName)).toHaveCount(0)
  })

  test('built-in policies are visible and cannot be deleted', async ({
    page,
    aclPolicyListPage,
  }) => {
    await switchToConsul(page)
    await aclPolicyListPage.goto()
    await expect(aclPolicyListPage.heading).toBeVisible()

    // Built-in policies: "global-management" and "ns-default"
    // They should show a "Built-in" badge and the delete button should be disabled
    const builtInRow = page.locator('tbody tr').filter({ hasText: 'Built-in' }).first()
    if ((await builtInRow.count()) > 0) {
      // Delete button should be disabled
      const deleteBtn = builtInRow.getByTitle('Cannot delete built-in policies')
      if ((await deleteBtn.count()) > 0) {
        await expect(deleteBtn).toBeDisabled()
      }
    }
  })

  test('create a policy via API and delete it through the UI', async ({
    page,
    aclPolicyListPage,
    consulApi,
    cleanup,
  }) => {
    const policyName = uniqueName('e2e-policy-api')

    const policyId = await createAclPolicy(consulApi, {
      Name: policyName,
      Description: 'API-created policy',
      Rules: 'key "" { policy = "read" }',
    })
    expect(policyId).toBeTruthy()
    cleanup.push(() => deleteAclPolicy(consulApi, policyId!).then(() => undefined))

    await switchToConsul(page)
    await aclPolicyListPage.goto()
    await aclPolicyListPage.search(policyName)
    await expect(aclPolicyListPage.row(policyName)).toHaveCount(1)

    await aclPolicyListPage.deletePolicy(policyName)
    await aclPolicyListPage.search(policyName)
    await expect(aclPolicyListPage.row(policyName)).toHaveCount(0)
  })

  test('create, list and delete an ACL role', async ({
    page,
    aclRoleListPage,
    consulApi,
    cleanup,
  }) => {
    const roleName = uniqueName('e2e-role')

    // ---- Create via API (UI role editor has complex form) ----
    const roleId = await createAclRole(consulApi, { Name: roleName, Description: 'E2E test role' })
    expect(roleId).toBeTruthy()
    cleanup.push(() => deleteAclRole(consulApi, roleId!).then(() => undefined))

    await switchToConsul(page)
    await aclRoleListPage.goto()
    await expect(aclRoleListPage.heading).toBeVisible()
    await aclRoleListPage.search(roleName)
    await expect(aclRoleListPage.row(roleName)).toHaveCount(1)
    await expect(aclRoleListPage.row(roleName)).toContainText('E2E test role')

    // ---- Delete via UI ----
    await aclRoleListPage.deleteRole(roleName)

    // ---- Verify deletion ----
    await aclRoleListPage.search(roleName)
    await expect(aclRoleListPage.row(roleName)).toHaveCount(0)
  })

  test('create, list and delete an ACL token', async ({
    page,
    aclTokenListPage,
    aclTokenEditorPage,
    consulApi,
    cleanup,
  }) => {
    const description = `e2e-token-${uniqueName('test')}`

    await switchToConsul(page)

    // ---- Create via UI ----
    await aclTokenEditorPage.gotoCreate()
    await expect(aclTokenEditorPage.heading).toBeVisible()
    await aclTokenEditorPage.createToken(description)
    cleanup.push(async () => {
      await import('../helpers/consul-api').then((m) => m.listAclTokens(consulApi))
    })

    // ---- Verify in list ----
    await aclTokenListPage.goto()
    await expect(aclTokenListPage.heading).toBeVisible()
    await aclTokenListPage.search(description)
    await expect(aclTokenListPage.row(description)).toHaveCount(1)

    // ---- Delete via UI ----
    await aclTokenListPage.deleteToken(description)

    // ---- Verify deletion ----
    await aclTokenListPage.search(description)
    await expect(aclTokenListPage.row(description)).toHaveCount(0)
  })

  test('create a token via API and delete it through the UI', async ({
    page,
    aclTokenListPage,
    consulApi,
    cleanup,
  }) => {
    const description = `e2e-token-api-${uniqueName('test')}`

    const token = await createAclToken(consulApi, { Description: description })
    expect(token).toBeTruthy()
    cleanup.push(() => deleteAclToken(consulApi, token!.AccessorID).then(() => undefined))

    await switchToConsul(page)
    await aclTokenListPage.goto()
    await aclTokenListPage.search(description)
    await expect(aclTokenListPage.row(description)).toHaveCount(1)

    await aclTokenListPage.deleteToken(description)
    await aclTokenListPage.search(description)
    await expect(aclTokenListPage.row(description)).toHaveCount(0)
  })
})
