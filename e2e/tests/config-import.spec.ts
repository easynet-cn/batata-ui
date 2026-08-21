import { test, expect } from '../fixtures'
import { listConfigs, deleteConfig } from '../helpers/api'

// Minimal STORE-method ZIP encoder (no external dependency needed).
// The server infers config metadata from the entry path: `group/dataId`.
function crc32(buf: Buffer): number {
  const table = crc32Table
  let crc = ~0
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff]
  }
  return ~crc >>> 0
}

const crc32Table: Uint32Array = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    t[n] = c >>> 0
  }
  return t
})()

function createZip(files: Array<{ name: string; content: string }>): Buffer {
  const chunks: Buffer[] = []
  const central: Buffer[] = []
  let offset = 0
  for (const f of files) {
    const nameBuf = Buffer.from(f.name, 'utf8')
    const dataBuf = Buffer.from(f.content, 'utf8')
    const crc = crc32(dataBuf)

    const local = Buffer.alloc(30)
    local.writeUInt32LE(0x04034b50, 0)
    local.writeUInt16LE(20, 4)
    local.writeUInt16LE(0, 6)
    local.writeUInt16LE(0, 8) // STORE
    local.writeUInt16LE(0, 10)
    local.writeUInt16LE(0, 12)
    local.writeUInt32LE(crc, 14)
    local.writeUInt32LE(dataBuf.length, 18)
    local.writeUInt32LE(dataBuf.length, 22)
    local.writeUInt16LE(nameBuf.length, 26)
    local.writeUInt16LE(0, 28)
    chunks.push(local, nameBuf, dataBuf)

    const localOffset = offset
    offset += local.length + nameBuf.length + dataBuf.length

    const cd = Buffer.alloc(46)
    cd.writeUInt32LE(0x02014b50, 0)
    cd.writeUInt16LE(20, 4)
    cd.writeUInt16LE(20, 6)
    cd.writeUInt16LE(0, 8)
    cd.writeUInt16LE(0, 10)
    cd.writeUInt16LE(0, 12)
    cd.writeUInt16LE(0, 14)
    cd.writeUInt32LE(crc, 16)
    cd.writeUInt32LE(dataBuf.length, 20)
    cd.writeUInt32LE(dataBuf.length, 24)
    cd.writeUInt16LE(nameBuf.length, 28)
    cd.writeUInt16LE(0, 30)
    cd.writeUInt16LE(0, 32)
    cd.writeUInt16LE(0, 34)
    cd.writeUInt16LE(0, 36)
    cd.writeUInt32LE(0, 38)
    cd.writeUInt32LE(localOffset, 42)
    central.push(cd, nameBuf)
  }
  const centralBuf = Buffer.concat(central)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(0, 4)
  end.writeUInt16LE(0, 6)
  end.writeUInt16LE(files.length, 8)
  end.writeUInt16LE(files.length, 10)
  end.writeUInt32LE(centralBuf.length, 12)
  end.writeUInt32LE(offset, 16)
  end.writeUInt16LE(0, 20)
  return Buffer.concat([...chunks, centralBuf, end])
}

const SUFFIX = Date.now().toString(36)
const DATA_ID = `e2e-import-${SUFFIX}.yaml`
const GROUP = 'DEFAULT_GROUP'
const CONTENT = 'imported: true\n'

test.describe('config import', () => {
  test('import a config from a zip file', async ({ page, api, cleanup }) => {
    cleanup.push(async () => {
      await deleteConfig(api, DATA_ID, GROUP, 'public')
    })

    // ---- Build a nacos-format export zip: entries named `group/dataId` ----
    const zip = createZip([{ name: `${GROUP}/${DATA_ID}`, content: CONTENT }])

    // ---- Open the import modal and upload the zip ----
    await page.goto('/configs')
    await page.getByRole('button', { name: 'Import' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    await dialog.locator('input[type="file"]').setInputFiles({
      name: 'configs.zip',
      mimeType: 'application/zip',
      buffer: zip,
    })
    await dialog.getByRole('button', { name: 'Import' }).click()
    await expect(dialog).toBeHidden()

    // ---- The imported config exists (verified via API) ----
    const list = await listConfigs(api, { dataId: DATA_ID, namespaceId: 'public' })
    expect(list.pageItems.some((c) => c.dataId === DATA_ID)).toBe(true)
  })
})
