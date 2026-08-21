import { chromium } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  ADMIN_USER,
  BASE_URL,
  STORAGE_KEYS,
  ensureAdminInitialized,
  login,
  waitForServer,
} from './helpers/api'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Global setup: waits for the server, bootstraps the admin user and
 * persists an authenticated storage state for all specs.
 */
export default async function globalSetup(): Promise<void> {
  const storageDir = path.join(__dirname, '.auth')
  const statePath = path.join(storageDir, 'user.json')
  fs.mkdirSync(storageDir, { recursive: true })

  const browser = await chromium.launch()
  const ctx = await browser.newContext()
  const request = ctx.request

  await waitForServer(request)
  await ensureAdminInitialized(request)
  const { accessToken } = await login(request)

  const page = await ctx.newPage()
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' }).catch(() => {})

  await page.evaluate(
    ([tokenKey, token, userKey, username, adminUser, providerKey, langKey]) => {
      localStorage.setItem(tokenKey, token)
      localStorage.setItem(username, adminUser)
      localStorage.setItem(userKey, JSON.stringify({ name: adminUser, globalAdmin: true }))
      localStorage.setItem(providerKey, 'batata')
      localStorage.setItem(langKey, 'en')
    },
    [
      STORAGE_KEYS.token,
      accessToken,
      STORAGE_KEYS.user,
      STORAGE_KEYS.username,
      ADMIN_USER,
      STORAGE_KEYS.provider,
      STORAGE_KEYS.lang,
    ] as const,
  )

  await ctx.storageState({ path: statePath })
  await ctx.close()
  await browser.close()
  console.log(`[global-setup] storageState written to ${statePath}`)
}
