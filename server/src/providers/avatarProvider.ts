import { env } from '../lib/env.js'

/**
 * Talking-head video avatar provider interface (e.g. HeyGen, D-ID). Turns a source
 * video/photo plus a voice clip or text into a talking-avatar video clip.
 *
 * No real provider is wired in yet — set HEYGEN_API_KEY and swap
 * `getAvatarProvider()`'s return value for a real implementation when ready.
 */
export interface AvatarProvider {
  readonly name: string
  isConfigured(): boolean
  createAvatar(sourceVideo: Buffer): Promise<{ avatarId: string }>
  renderSpeech(avatarId: string, audio: Buffer): Promise<Buffer>
}

class NoopAvatarProvider implements AvatarProvider {
  readonly name = 'noop'
  isConfigured() {
    return false
  }
  async createAvatar(): Promise<{ avatarId: string }> {
    throw new Error('No hay proveedor de avatar de video configurado. Define HEYGEN_API_KEY para activarlo.')
  }
  async renderSpeech(): Promise<Buffer> {
    throw new Error('No hay proveedor de avatar de video configurado. Define HEYGEN_API_KEY para activarlo.')
  }
}

export function getAvatarProvider(): AvatarProvider {
  // TODO: cuando haya HEYGEN_API_KEY (o D-ID), devolver aquí una implementación real de AvatarProvider.
  return new NoopAvatarProvider()
}

export const avatarProviderStatus = {
  configured: !!env.heygenApiKey,
}
