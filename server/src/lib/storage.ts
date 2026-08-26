import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { encryptBuffer, decryptBuffer } from './mediaCrypto.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const STORAGE_ROOT = path.resolve(__dirname, '../../storage')

function pathFor(legacyId: string, contentId: string): string {
  return path.join(STORAGE_ROOT, legacyId, `${contentId}.enc`)
}

export async function saveEncryptedMedia(legacyId: string, contentId: string, plaintext: Buffer): Promise<string> {
  const filePath = pathFor(legacyId, contentId)
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, encryptBuffer(plaintext))
  return filePath
}

export async function readEncryptedMedia(filePath: string): Promise<Buffer> {
  return decryptBuffer(await readFile(filePath))
}

export async function deleteMedia(filePath: string): Promise<void> {
  await unlink(filePath).catch(() => {})
}
