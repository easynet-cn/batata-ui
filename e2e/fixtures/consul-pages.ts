import { expect, type Locator, type Page } from '@playwright/test'

/**
 * Page-object helpers for Consul UI E2E tests.
 * Each class wraps a route and exposes stable locators + reusable flows.
 */

/** Switch the UI to Consul provider via the header toggle. */
export async function switchToConsul(page: Page): Promise<void> {
  // The provider switcher buttons are "BATATA" and "CONSUL" in the header
  const consulBtn = page.locator('header').getByRole('button', { name: 'CONSUL' })
  if (await consulBtn.isVisible()) {
    await consulBtn.click()
    // Wait for URL to change to a consul route
    await expect(page).toHaveURL(/\/consul/, { timeout: 10_000 })
  } else {
    // Already on consul or switcher not visible – navigate directly
    await page.goto('/consul/dashboard')
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

// ---------------------------------------------------------------------------
// KV Store pages
// ---------------------------------------------------------------------------

export class KVListPage {
  constructor(readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/consul/kv')
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { name: 'KV Store' })
  }

  get searchInput(): Locator {
    return this.page.getByPlaceholder('Search by key prefix...')
  }

  get searchButton(): Locator {
    return this.page.getByRole('button', { name: 'Search' })
  }

  get createButton(): Locator {
    return this.page.getByRole('link', { name: 'Create KV' })
  }

  row(key: string): Locator {
    return this.page.locator('tbody tr').filter({ hasText: key })
  }

  async search(keyPrefix: string): Promise<void> {
    await this.searchInput.fill(keyPrefix)
    await this.searchButton.click()
  }

  async deleteKey(key: string): Promise<void> {
    await this.row(key).getByTitle('Delete').click()
    // KV list uses a custom delete modal (not ConfirmModal)
    const modal = this.page.locator('.fixed.inset-0')
    await expect(modal).toBeVisible()
    await modal.getByRole('button', { name: 'Delete' }).click()
    await expect(modal).toBeHidden()
  }
}

export class KVEditorPage {
  constructor(readonly page: Page) {}

  async gotoCreate(): Promise<void> {
    await this.page.goto('/consul/kv/editor')
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { name: 'Create KV' })
  }

  get keyInput(): Locator {
    return this.page.getByPlaceholder('e.g., config/app/database')
  }

  get valueTextarea(): Locator {
    return this.page.getByPlaceholder('Enter value...')
  }

  get flagsInput(): Locator {
    return this.page.getByPlaceholder('0')
  }

  get saveButton(): Locator {
    return this.page.getByRole('button', { name: 'Save' })
  }

  async createKV(key: string, value: string, flags = 0): Promise<void> {
    await this.keyInput.fill(key)
    await this.valueTextarea.fill(value)
    if (flags > 0) {
      await this.flagsInput.fill(String(flags))
    }
    await this.saveButton.click()
    await expect(this.page).toHaveURL(/\/consul\/kv/, { timeout: 10_000 })
  }
}

// ---------------------------------------------------------------------------
// Catalog pages
// ---------------------------------------------------------------------------

export class CatalogServiceListPage {
  constructor(readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/consul/catalog/services')
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { name: 'Catalog Services' })
  }

  get searchInput(): Locator {
    return this.page.getByPlaceholder('Search services...')
  }

  get refreshButton(): Locator {
    return this.page.getByRole('button', { name: 'Refresh' })
  }

  get totalFooter(): Locator {
    return this.page.locator('footer, .text-sm').filter({ hasText: 'Total' })
  }

  row(serviceName: string): Locator {
    return this.page.locator('tbody tr').filter({ hasText: serviceName })
  }

  async search(serviceName: string): Promise<void> {
    await this.searchInput.fill(serviceName)
    await this.searchInput.press('Enter')
  }
}

export class CatalogNodeListPage {
  constructor(readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/consul/catalog/nodes')
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { name: 'Catalog Nodes' })
  }

  get searchInput(): Locator {
    return this.page.getByPlaceholder('Search nodes...')
  }

  get refreshButton(): Locator {
    return this.page.getByRole('button', { name: 'Refresh' })
  }

  row(nodeName: string): Locator {
    return this.page.locator('tbody tr').filter({ hasText: nodeName })
  }

  async search(nodeName: string): Promise<void> {
    await this.searchInput.fill(nodeName)
    await this.searchInput.press('Enter')
  }
}

// ---------------------------------------------------------------------------
// ACL pages
// ---------------------------------------------------------------------------

export class ACLTokenListPage {
  constructor(readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/consul/acl/tokens')
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { name: 'ACL Tokens' })
  }

  get searchInput(): Locator {
    return this.page.getByPlaceholder('Search tokens...')
  }

  get createButton(): Locator {
    return this.page.getByRole('link', { name: 'Create Token' })
  }

  get refreshButton(): Locator {
    return this.page.getByRole('button', { name: 'Refresh' })
  }

  row(description: string): Locator {
    return this.page.locator('tbody tr').filter({ hasText: description })
  }

  async search(text: string): Promise<void> {
    await this.searchInput.fill(text)
    await this.searchInput.press('Enter')
  }

  async deleteToken(description: string): Promise<void> {
    await this.row(description).getByTitle('Delete').click()
    const confirm = this.page.getByRole('alertdialog')
    await expect(confirm).toBeVisible()
    await confirm.getByRole('button', { name: 'Delete' }).click()
    await expect(confirm).toBeHidden()
  }
}

export class ACLTokenEditorPage {
  constructor(readonly page: Page) {}

  async gotoCreate(): Promise<void> {
    await this.page.goto('/consul/acl/token/new')
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { name: 'Create Token' })
  }

  get descriptionInput(): Locator {
    return this.page.getByPlaceholder('Enter description')
  }

  get submitButton(): Locator {
    return this.page.getByRole('button', { name: 'Create Token' })
  }

  async createToken(description: string): Promise<void> {
    await this.descriptionInput.fill(description)
    await this.submitButton.click()
    await expect(this.page).toHaveURL(/\/consul\/acl\/tokens/, { timeout: 10_000 })
  }
}

export class ACLPolicyListPage {
  constructor(readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/consul/acl/policies')
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { name: 'ACL Policies' })
  }

  get searchInput(): Locator {
    return this.page.getByPlaceholder('Search policies...')
  }

  get createButton(): Locator {
    return this.page.getByRole('link', { name: 'Create Policy' })
  }

  get refreshButton(): Locator {
    return this.page.getByRole('button', { name: 'Refresh' })
  }

  row(name: string): Locator {
    return this.page.locator('tbody tr').filter({ hasText: name })
  }

  async search(name: string): Promise<void> {
    await this.searchInput.fill(name)
    await this.searchInput.press('Enter')
  }

  async deletePolicy(name: string): Promise<void> {
    await this.row(name).getByTitle('Delete').click()
    const confirm = this.page.getByRole('alertdialog')
    await expect(confirm).toBeVisible()
    await confirm.getByRole('button', { name: 'Delete' }).click()
    await expect(confirm).toBeHidden()
  }
}

export class ACLPolicyEditorPage {
  constructor(readonly page: Page) {}

  async gotoCreate(): Promise<void> {
    await this.page.goto('/consul/acl/policy/new')
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { name: 'Create Policy' })
  }

  get nameInput(): Locator {
    return this.page.getByPlaceholder('my-policy')
  }

  get descriptionInput(): Locator {
    return this.page.getByPlaceholder('Enter description')
  }

  get submitButton(): Locator {
    return this.page.getByRole('button', { name: 'Create Policy' })
  }

  async createPolicy(name: string, description: string, rules = ''): Promise<void> {
    await this.nameInput.fill(name)
    await this.descriptionInput.fill(description)
    if (rules) {
      // The rules field is a CodeEditor (CodeMirror)
      const editor = this.page.locator('.cm-content').first()
      await editor.click()
      await this.page.keyboard.type(rules, { delay: 5 })
    }
    await this.submitButton.click()
    await expect(this.page).toHaveURL(/\/consul\/acl\/policies/, { timeout: 10_000 })
  }
}

export class ACLRoleListPage {
  constructor(readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/consul/acl/roles')
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { name: 'ACL Roles' })
  }

  get searchInput(): Locator {
    return this.page.getByPlaceholder('Search roles...')
  }

  get createButton(): Locator {
    return this.page.getByRole('link', { name: 'Create Role' })
  }

  get refreshButton(): Locator {
    return this.page.getByRole('button', { name: 'Refresh' })
  }

  row(name: string): Locator {
    return this.page.locator('tbody tr').filter({ hasText: name })
  }

  async search(name: string): Promise<void> {
    await this.searchInput.fill(name)
    await this.searchInput.press('Enter')
  }

  async deleteRole(name: string): Promise<void> {
    await this.row(name).getByTitle('Delete').click()
    const confirm = this.page.getByRole('alertdialog')
    await expect(confirm).toBeVisible()
    await confirm.getByRole('button', { name: 'Delete' }).click()
    await expect(confirm).toBeHidden()
  }
}

// ---------------------------------------------------------------------------
// Intention list page
// ---------------------------------------------------------------------------

export class IntentionListPage {
  constructor(readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/consul/intentions')
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { name: 'Intentions' })
  }

  get searchInput(): Locator {
    return this.page.getByPlaceholder('Search by source or destination...')
  }

  get createButton(): Locator {
    return this.page.getByRole('button', { name: 'Create Intention' })
  }

  get refreshButton(): Locator {
    return this.page.getByRole('button', { name: 'Refresh' })
  }

  row(source: string, dest: string): Locator {
    return this.page.locator('tbody tr').filter({ hasText: source }).filter({ hasText: dest })
  }

  async search(text: string): Promise<void> {
    await this.searchInput.fill(text)
    await this.searchInput.press('Enter')
  }

  async createIntention(
    source: string,
    dest: string,
    action: 'allow' | 'deny' = 'deny',
  ): Promise<void> {
    await this.createButton.click()
    const dialog = this.page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await dialog.getByPlaceholder('web').fill(source)
    await dialog.getByPlaceholder('api').fill(dest)
    await dialog.locator('select').selectOption(action)
    await dialog.getByRole('button', { name: 'Create' }).click()
    await expect(dialog).toBeHidden()
  }

  async deleteIntention(source: string, dest: string): Promise<void> {
    await this.row(source, dest).getByTitle('Delete').click()
    const confirm = this.page.getByRole('alertdialog')
    await expect(confirm).toBeVisible()
    await confirm.getByRole('button', { name: 'Delete' }).click()
    await expect(confirm).toBeHidden()
  }
}

// ---------------------------------------------------------------------------
// Consul Dashboard page
// ---------------------------------------------------------------------------

export class ConsulDashboardPage {
  constructor(readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/consul/dashboard')
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { name: 'Consul Dashboard' })
  }

  get refreshButton(): Locator {
    return this.page.getByRole('button', { name: 'Refresh' })
  }

  statCard(label: string): Locator {
    return this.page
      .locator('[class*="card"], [class*="rounded"]')
      .filter({ hasText: label })
      .first()
  }

  quickAction(label: string): Locator {
    return this.page.getByRole('link', { name: label })
  }
}

// ---------------------------------------------------------------------------
// Session list page
// ---------------------------------------------------------------------------

export class SessionListPage {
  constructor(readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/consul/sessions')
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { name: 'Sessions' })
  }

  get searchInput(): Locator {
    return this.page.getByPlaceholder('Search sessions...')
  }

  get createButton(): Locator {
    return this.page.getByRole('button', { name: 'Create Session' })
  }

  row(name: string): Locator {
    return this.page.locator('tbody tr').filter({ hasText: name })
  }

  async search(text: string): Promise<void> {
    await this.searchInput.fill(text)
    await this.searchInput.press('Enter')
  }

  async createSession(name: string, node: string): Promise<void> {
    await this.createButton.click()
    const dialog = this.page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await dialog.getByPlaceholder('my-session').fill(name)
    await dialog.getByPlaceholder('node-name').fill(node)
    await dialog.getByRole('button', { name: 'Create' }).click()
    await expect(dialog).toBeHidden()
  }

  async destroySession(name: string): Promise<void> {
    await this.row(name).getByTitle('Destroy').click()
    const confirm = this.page.getByRole('alertdialog')
    await expect(confirm).toBeVisible()
    await confirm.getByRole('button', { name: 'Destroy' }).click()
    await expect(confirm).toBeHidden()
  }
}
