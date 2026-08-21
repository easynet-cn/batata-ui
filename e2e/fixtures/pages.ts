import { expect, type Locator, type Page } from '@playwright/test'

/**
 * Page-object helpers for Batata UI E2E tests.
 * Each class wraps a route and exposes stable locators + reusable flows,
 * mirroring the consul-ui e2e fixtures pattern.
 */

export interface NamespaceQuery {
  namespaceId?: string
  groupName?: string
  serviceName?: string
}

export class ServiceListPage {
  constructor(readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/services')
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { name: 'Services' })
  }

  get searchInput(): Locator {
    return this.page.getByPlaceholder('Service Name')
  }

  get searchButton(): Locator {
    return this.page.getByRole('button', { name: 'Search' })
  }

  get createButton(): Locator {
    return this.page.getByRole('button', { name: 'Create Service' })
  }

  row(serviceName: string): Locator {
    return this.page.locator('tbody tr').filter({ hasText: serviceName })
  }

  async search(serviceName: string): Promise<void> {
    await this.searchInput.fill(serviceName)
    await this.searchButton.click()
  }

  async openCreateModal(): Promise<void> {
    await this.createButton.click()
    await expect(this.page.getByRole('dialog')).toBeVisible()
  }

  async createService(serviceName: string, group = 'DEFAULT_GROUP'): Promise<void> {
    await this.openCreateModal()
    const dialog = this.page.getByRole('dialog')
    await dialog.getByPlaceholder('Service Name').fill(serviceName)
    await dialog.getByPlaceholder('DEFAULT_GROUP').fill(group)
    await dialog.getByRole('button', { name: 'Create' }).click()
    await expect(dialog).toBeHidden()
  }

  async editService(serviceName: string, protectThreshold = '0.5'): Promise<void> {
    const row = this.row(serviceName)
    await row.getByTitle('Edit', { exact: true }).click()
    const dialog = this.page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await dialog.locator('input[type="number"]').fill(protectThreshold)
    await dialog.getByRole('button', { name: 'Save' }).click()
    await expect(dialog).toBeHidden()
  }

  async deleteService(serviceName: string): Promise<void> {
    await this.row(serviceName).getByTitle('Delete', { exact: true }).click()
    const confirm = this.page.getByRole('alertdialog')
    await expect(confirm).toBeVisible()
    await confirm.getByRole('button', { name: 'Delete' }).click()
    await expect(confirm).toBeHidden()
  }
}

export class UserListPage {
  constructor(readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/users')
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { name: 'User List' })
  }

  get searchInput(): Locator {
    return this.page.getByPlaceholder('Search by username')
  }

  get searchButton(): Locator {
    return this.page.getByRole('button', { name: 'Search' })
  }

  get createButton(): Locator {
    return this.page.getByRole('button', { name: 'Create User' })
  }

  row(username: string): Locator {
    return this.page.locator('tbody tr').filter({ hasText: username })
  }

  async search(username: string): Promise<void> {
    await this.searchInput.fill(username)
    await this.searchButton.click()
  }

  async createUser(username: string, password: string): Promise<void> {
    await this.createButton.click()
    const dialog = this.page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await dialog.locator('input[type="text"]').fill(username)
    await dialog.locator('input[type="password"]').fill(password)
    await dialog.getByRole('button', { name: 'Create' }).click()
    await expect(dialog).toBeHidden()
  }

  async resetPassword(username: string, newPassword: string): Promise<void> {
    await this.row(username).getByTitle('Reset Password', { exact: true }).click()
    const dialog = this.page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await dialog.locator('input[type="password"]').fill(newPassword)
    await dialog.getByRole('button', { name: 'Confirm' }).click()
    await expect(dialog).toBeHidden()
  }

  async deleteUser(username: string): Promise<void> {
    await this.row(username).getByTitle('Delete', { exact: true }).click()
    const confirm = this.page.getByRole('alertdialog')
    await expect(confirm).toBeVisible()
    await confirm.getByRole('button', { name: 'Delete' }).click()
    await expect(confirm).toBeHidden()
  }
}

export class RoleListPage {
  constructor(readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/roles')
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { name: 'Role Management' })
  }

  get bindButton(): Locator {
    return this.page.getByRole('button', { name: 'Bind Role' })
  }

  get searchRoleInput(): Locator {
    return this.page.getByPlaceholder('Search by role name')
  }

  get searchUsernameInput(): Locator {
    return this.page.getByPlaceholder('Search by username')
  }

  get searchButton(): Locator {
    return this.page.getByRole('button', { name: 'Search' })
  }

  row(role: string, username: string): Locator {
    return this.page.locator('tbody tr').filter({ hasText: role }).filter({ hasText: username })
  }

  async bindRole(role: string, username: string): Promise<void> {
    await this.bindButton.click()
    const dialog = this.page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await dialog.locator('input[type="text"]').nth(0).fill(role)
    await dialog.locator('input[type="text"]').nth(1).fill(username)
    await dialog.getByRole('button', { name: 'Create' }).click()
    await expect(dialog).toBeHidden()
  }

  async deleteRole(role: string, username: string): Promise<void> {
    await this.row(role, username).getByTitle('Delete', { exact: true }).click()
    const confirm = this.page.getByRole('alertdialog')
    await expect(confirm).toBeVisible()
    await confirm.getByRole('button', { name: 'Delete' }).click()
    await expect(confirm).toBeHidden()
  }
}

export class PermissionListPage {
  constructor(readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/permissions')
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { name: 'Permissions' })
  }

  get addButton(): Locator {
    return this.page.getByRole('button', { name: 'Add Permission' })
  }

  row(role: string): Locator {
    return this.page.locator('tbody tr').filter({ hasText: role })
  }

  async addPermission(role: string, resource = '*:*:*', action = 'r'): Promise<void> {
    await this.addButton.click()
    const dialog = this.page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await dialog.locator('input[type="text"]').fill(role)
    await dialog.locator('select').nth(0).selectOption(resource)
    await dialog.locator('select').nth(1).selectOption(action)
    await dialog.getByRole('button', { name: 'Create' }).click()
    await expect(dialog).toBeHidden()
  }

  async deletePermission(role: string): Promise<void> {
    await this.row(role).getByTitle('Delete', { exact: true }).click()
    const confirm = this.page.getByRole('alertdialog')
    await expect(confirm).toBeVisible()
    await confirm.getByRole('button', { name: 'Delete' }).click()
    await expect(confirm).toBeHidden()
  }
}

export class McpListPage {
  constructor(readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/mcp')
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { name: 'MCP Servers' })
  }

  get searchInput(): Locator {
    return this.page.getByPlaceholder('Search by server name')
  }

  get searchButton(): Locator {
    return this.page.getByRole('button', { name: 'Search' })
  }

  get addButton(): Locator {
    return this.page.getByRole('button', { name: 'Add MCP Server' })
  }

  row(name: string): Locator {
    return this.page.locator('tbody tr').filter({ hasText: name })
  }

  async search(name: string): Promise<void> {
    await this.searchInput.fill(name)
    await this.searchButton.click()
  }

  async openEditor(): Promise<void> {
    await this.addButton.click()
    await expect(this.page).toHaveURL(/\/mcp\/new/)
  }
}

export class McpEditorPage {
  constructor(readonly page: Page) {}

  get nameInput(): Locator {
    return this.page.getByPlaceholder('Enter server name')
  }

  get typeSelect(): Locator {
    return this.page.locator('select').first()
  }

  get urlInput(): Locator {
    return this.page.getByPlaceholder('http://localhost:3000')
  }

  get commandInput(): Locator {
    return this.page.getByPlaceholder('npx -y @modelcontextprotocol/server-xxx')
  }

  get createButton(): Locator {
    return this.page.getByRole('button', { name: 'Create' })
  }

  get saveButton(): Locator {
    return this.page.getByRole('button', { name: 'Save' })
  }

  async createHttpServer(name: string, url = 'http://localhost:3000'): Promise<void> {
    await this.nameInput.fill(name)
    await this.typeSelect.selectOption('http')
    await this.urlInput.fill(url)
    await this.createButton.click()
  }

  async updateDescription(description: string): Promise<void> {
    await this.page.getByPlaceholder('Enter description').fill(description)
    await this.saveButton.click()
  }
}
