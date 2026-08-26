import { env } from '../lib/env.js'

/**
 * Voice cloning provider interface. Implementations turn a set of recorded voice
 * samples into a synthesizable voice, then text into audio in that voice.
 *
 * No real provider is wired in yet — set ELEVENLABS_API_KEY and swap
 * `getVoiceProvider()`'s return value for an ElevenLabs implementation when ready.
 * Nothing else in the codebase needs to change to activate it.
 */
export interface VoiceProvider {
  readonly name: string
  isConfigured(): boolean
  cloneVoice(samples: Buffer[]): Promise<{ voiceId: string }>
  synthesize(voiceId: string, text: string): Promise<Buffer>
}

class NoopVoiceProvider implements VoiceProvider {
  readonly name = 'noop'
  isConfigured() {
    return false
  }
  async cloneVoice(): Promise<{ voiceId: string }> {
    throw new Error('No hay proveedor de clonación de voz configurado. Define ELEVENLABS_API_KEY para activarlo.')
  }
  async synthesize(): Promise<Buffer> {
    throw new Error('No hay proveedor de clonación de voz configurado. Define ELEVENLABS_API_KEY para activarlo.')
  }
}

export function getVoiceProvider(): VoiceProvider {
  // TODO: cuando haya ELEVENLABS_API_KEY, devolver aquí una implementación real de VoiceProvider.
  return new NoopVoiceProvider()
}

export const voiceProviderStatus = {
  configured: !!env.elevenLabsApiKey,
}
