import 'dotenv/config'

function required(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}. Copia .env.example a .env y complétala.`)
  }
  return value
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: required('JWT_SECRET'),
  mediaEncryptionKey: required('MEDIA_ENCRYPTION_KEY'),
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  elevenLabsApiKey: process.env.ELEVENLABS_API_KEY || '',
  heygenApiKey: process.env.HEYGEN_API_KEY || '',
  deathVerificationGraceDays: Number(process.env.DEATH_VERIFICATION_GRACE_DAYS ?? 7),
}
