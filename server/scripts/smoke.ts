/**
 * End-to-end smoke test for the Legado Digital backend. Boots the server against a
 * throwaway SQLite database, drives the full author -> beneficiary/executor ->
 * death verification -> chat flow through the real HTTP API, and exits non-zero on
 * the first failed assertion. Not a substitute for a proper test suite, but enough
 * to catch a broken flow before it ships.
 *
 * Usage: npm run smoke
 */
import { spawn, type ChildProcess } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { existsSync, rmSync } from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const DB_FILE = path.join(ROOT, 'smoke-test.db')
const PORT = 4123
const BASE_URL = `http://localhost:${PORT}`

let failures = 0
function assertTrue(condition: boolean, message: string) {
  if (!condition) {
    failures++
    console.error(`✗ ${message}`)
  } else {
    console.log(`✓ ${message}`)
  }
}

async function api(
  method: string,
  urlPath: string,
  opts: { token?: string; json?: unknown; form?: FormData } = {}
): Promise<{ status: number; body: any }> {
  const headers: Record<string, string> = {}
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`
  let body: string | FormData | undefined
  if (opts.json !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(opts.json)
  } else if (opts.form) {
    body = opts.form
  }
  const res = await fetch(`${BASE_URL}${urlPath}`, { method, headers, body })
  const text = await res.text()
  let parsed: any
  try {
    parsed = text ? JSON.parse(text) : undefined
  } catch {
    parsed = text
  }
  return { status: res.status, body: parsed }
}

function randomEmail(prefix: string): string {
  return `${prefix}-${randomBytes(4).toString('hex')}@example.com`
}

async function waitForHealth(): Promise<void> {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`${BASE_URL}/health`)
      if (res.ok) return
    } catch {
      // server not up yet
    }
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error('El servidor no respondió a /health a tiempo.')
}

async function main() {
  if (existsSync(DB_FILE)) rmSync(DB_FILE)

  const testEnv = {
    ...process.env,
    PORT: String(PORT),
    DATABASE_URL: `file:${DB_FILE}`,
    JWT_SECRET: randomBytes(32).toString('hex'),
    MEDIA_ENCRYPTION_KEY: randomBytes(32).toString('hex'),
    ANTHROPIC_API_KEY: '', // fuerza el respaldo local, sin gastar cuota real
    DEATH_VERIFICATION_GRACE_DAYS: '0',
  }

  await new Promise<void>((resolve, reject) => {
    const migrate = spawn('npx', ['prisma', 'migrate', 'deploy'], { cwd: ROOT, env: testEnv, stdio: 'inherit' })
    migrate.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`prisma migrate deploy salió con código ${code}`))))
  })

  const server: ChildProcess = spawn('npx', ['tsx', 'src/index.ts'], {
    cwd: ROOT,
    env: testEnv,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  server.stdout?.on('data', (d) => process.stdout.write(`[server] ${d}`))
  server.stderr?.on('data', (d) => process.stderr.write(`[server] ${d}`))

  try {
    await waitForHealth()

    // 1. El autor se registra y crea su legado.
    const authorEmail = randomEmail('author')
    const signup = await api('POST', '/auth/signup', {
      json: { email: authorEmail, password: 'correcthorsebattery', name: 'Autora de Prueba' },
    })
    assertTrue(signup.status === 201, 'el autor se registra')
    const authorToken = signup.body.token as string

    const legacyRes = await api('POST', '/legacies', { token: authorToken, json: { name: 'Legado de Prueba' } })
    assertTrue(legacyRes.status === 201, 'se crea el legado')
    const legacyId = legacyRes.body.id as string

    // 2. Invita a un beneficiario y a un albacea.
    const inviteBeneficiary = await api('POST', `/legacies/${legacyId}/invites`, {
      token: authorToken,
      json: { email: randomEmail('hijo'), role: 'BENEFICIARY', relationship: 'hija' },
    })
    assertTrue(inviteBeneficiary.status === 201, 'se invita a un beneficiario')
    const beneficiaryToken0 = inviteBeneficiary.body.inviteToken as string

    const inviteExecutor = await api('POST', `/legacies/${legacyId}/invites`, {
      token: authorToken,
      json: { email: randomEmail('albacea'), role: 'EXECUTOR', relationship: 'hermano' },
    })
    assertTrue(inviteExecutor.status === 201, 'se invita a un albacea')
    const executorInviteToken = inviteExecutor.body.inviteToken as string

    // 3. El beneficiario y el albacea crean cuenta y aceptan su invitación.
    const beneficiarySignup = await api('POST', '/auth/signup', {
      json: { email: randomEmail('hijo-cuenta'), password: 'correcthorsebattery', name: 'Hija de Prueba' },
    })
    const beneficiaryToken = beneficiarySignup.body.token as string
    const acceptBeneficiary = await api('POST', `/invites/${beneficiaryToken0}/accept`, { token: beneficiaryToken })
    assertTrue(acceptBeneficiary.status === 200, 'el beneficiario acepta la invitación')

    const executorSignup = await api('POST', '/auth/signup', {
      json: { email: randomEmail('albacea-cuenta'), password: 'correcthorsebattery', name: 'Albacea de Prueba' },
    })
    const executorToken = executorSignup.body.token as string
    const acceptExecutor = await api('POST', `/invites/${executorInviteToken}/accept`, { token: executorToken })
    assertTrue(acceptExecutor.status === 200, 'el albacea acepta la invitación')

    // 4. El autor deja contenido: uno inmediato, uno solo post-mortem, y un consejo con archivo adjunto.
    const immediateContent = await api('POST', `/legacies/${legacyId}/content`, {
      token: authorToken,
      json: { type: 'STORY', title: 'Historia visible ya', textContent: 'Esto se puede ver de inmediato.', visibility: 'IMMEDIATE' },
    })
    assertTrue(immediateContent.status === 201, 'se crea contenido de visibilidad inmediata')

    const postmortemForm = new FormData()
    postmortemForm.append('type', 'ADVICE')
    postmortemForm.append('title', 'Consejo sobre el trabajo duro')
    postmortemForm.append('category', 'trabajo')
    postmortemForm.append('textContent', 'Trabaja con honestidad y no le temas al esfuerzo.')
    postmortemForm.append('visibility', 'POSTMORTEM')
    postmortemForm.append('media', new Blob([Buffer.from('contenido de video falso')], { type: 'video/webm' }), 'clip.webm')
    const postmortemContent = await api('POST', `/legacies/${legacyId}/content`, { token: authorToken, form: postmortemForm })
    assertTrue(postmortemContent.status === 201, 'se crea contenido post-mortem con archivo adjunto cifrado')
    const postmortemContentId = postmortemContent.body.id as string

    // 5. Antes de la muerte, el beneficiario ve solo lo inmediato, y el chat está bloqueado.
    const contentBeforeDeath = await api('GET', `/legacies/${legacyId}/content`, { token: beneficiaryToken })
    assertTrue(
      contentBeforeDeath.body.length === 1 && contentBeforeDeath.body[0].visibility === 'IMMEDIATE',
      'el beneficiario solo ve el contenido inmediato antes de la confirmación de fallecimiento'
    )

    const chatBeforeDeath = await api('POST', `/legacies/${legacyId}/chat`, {
      token: beneficiaryToken,
      json: { question: '¿qué me aconsejas sobre el trabajo?' },
    })
    assertTrue(chatBeforeDeath.status === 403, 'el chat está bloqueado mientras el legado sigue activo')

    // 6. El albacea inicia la verificación de fallecimiento con un documento.
    const certForm = new FormData()
    certForm.append('certificate', new Blob([Buffer.from('acta de defunción falsa')], { type: 'application/pdf' }), 'acta.pdf')
    const startVerification = await api('POST', `/legacies/${legacyId}/death-verification`, { token: executorToken, form: certForm })
    assertTrue(startVerification.status === 201, 'el albacea inicia la verificación de fallecimiento')
    const requestId = startVerification.body.id as string

    // El propio albacea no puede confirmarse a sí mismo.
    const selfConfirm = await api('POST', `/legacies/${legacyId}/death-verification/${requestId}/confirm`, { token: executorToken })
    assertTrue(selfConfirm.status === 403, 'quien inicia la verificación no puede autoconfirmarse')

    // 7. El beneficiario da la segunda confirmación (persona de confianza distinta). Con
    //    DEATH_VERIFICATION_GRACE_DAYS=0, el período de gracia se vence de inmediato.
    const secondConfirm = await api('POST', `/legacies/${legacyId}/death-verification/${requestId}/confirm`, { token: beneficiaryToken })
    assertTrue(secondConfirm.status === 200, 'una segunda persona de confianza confirma')

    const finalizedStatus = await api('GET', `/legacies/${legacyId}/death-verification/${requestId}`, { token: authorToken })
    assertTrue(finalizedStatus.body.status === 'CONFIRMED', 'la verificación se finaliza automáticamente tras el período de gracia')

    // 8. Ahora el beneficiario ve todo el contenido visible y puede conversar.
    const contentAfterDeath = await api('GET', `/legacies/${legacyId}/content`, { token: beneficiaryToken })
    assertTrue(contentAfterDeath.body.length === 2, 'el beneficiario ve el contenido post-mortem tras la confirmación')

    const chatAfterDeath = await api('POST', `/legacies/${legacyId}/chat`, {
      token: beneficiaryToken,
      json: { question: '¿qué me aconsejas sobre el trabajo?' },
    })
    assertTrue(chatAfterDeath.status === 200, 'el chat responde tras la confirmación de fallecimiento')
    assertTrue(chatAfterDeath.body.engine === 'local-matcher', 'sin ANTHROPIC_API_KEY, el chat usa el respaldo local')
    assertTrue(
      typeof chatAfterDeath.body.answer === 'string' && chatAfterDeath.body.answer.includes('honestidad'),
      'la respuesta cita el consejo grabado, sin inventar contenido'
    )
    assertTrue(typeof chatAfterDeath.body.disclaimer === 'string' && chatAfterDeath.body.disclaimer.length > 0, 'toda respuesta incluye el aviso de transparencia')

    // 9. El beneficiario puede pausar el modo conversación sin perder la biblioteca.
    const pause = await api('PATCH', `/legacies/${legacyId}/chat/pause`, { token: beneficiaryToken, json: { paused: true } })
    assertTrue(pause.status === 200, 'el beneficiario puede pausar el modo conversación')
    const chatWhilePaused = await api('POST', `/legacies/${legacyId}/chat`, { token: beneficiaryToken, json: { question: 'hola' } })
    assertTrue(chatWhilePaused.status === 403, 'el chat respeta la pausa del beneficiario')
    const libraryStillWorks = await api('GET', `/legacies/${legacyId}/content`, { token: beneficiaryToken })
    assertTrue(libraryStillWorks.status === 200 && libraryStillWorks.body.length === 2, 'la biblioteca sigue disponible aunque el chat esté pausado')

    // 10. El archivo adjunto se puede descargar y llega descifrado correctamente.
    const mediaRes = await fetch(`${BASE_URL}/legacies/${legacyId}/content/${postmortemContentId}/media`, {
      headers: { Authorization: `Bearer ${authorToken}` },
    })
    const mediaBuffer = Buffer.from(await mediaRes.arrayBuffer())
    assertTrue(mediaBuffer.toString('utf-8') === 'contenido de video falso', 'el archivo cifrado se descifra correctamente al descargarlo')

    // --- Segundo legado: probar la cancelación por parte del autor (válvula de seguridad) ---
    const legacy2 = await api('POST', '/legacies', { token: authorToken, json: { name: 'Legado de Prueba 2' } })
    const legacy2Id = legacy2.body.id as string
    const invite2 = await api('POST', `/legacies/${legacy2Id}/invites`, {
      token: authorToken,
      json: { email: randomEmail('albacea2'), role: 'EXECUTOR' },
    })
    const executor2Signup = await api('POST', '/auth/signup', {
      json: { email: randomEmail('albacea2-cuenta'), password: 'correcthorsebattery', name: 'Albacea 2' },
    })
    const executor2Token = executor2Signup.body.token as string
    await api('POST', `/invites/${invite2.body.inviteToken}/accept`, { token: executor2Token })

    const certForm2 = new FormData()
    certForm2.append('certificate', new Blob([Buffer.from('acta equivocada')], { type: 'application/pdf' }), 'acta.pdf')
    const badVerification = await api('POST', `/legacies/${legacy2Id}/death-verification`, { token: executor2Token, form: certForm2 })
    const badRequestId = badVerification.body.id as string

    const cancel = await api('POST', `/legacies/${legacy2Id}/death-verification/${badRequestId}/cancel`, {
      token: authorToken,
      json: { reason: 'Fue un error, estoy vivo.' },
    })
    assertTrue(cancel.status === 200, 'el autor puede cancelar una verificación iniciada por error')

    const legacy2After = await api('GET', `/legacies/${legacy2Id}`, { token: authorToken })
    assertTrue(legacy2After.body.status === 'ACTIVE', 'el legado vuelve a ACTIVE tras la cancelación')
  } finally {
    server.kill()
    await new Promise((r) => setTimeout(r, 300))
    if (existsSync(DB_FILE)) rmSync(DB_FILE)
    const journal = `${DB_FILE}-journal`
    if (existsSync(journal)) rmSync(journal)
  }

  if (failures > 0) {
    console.error(`\n${failures} verificación(es) fallaron.`)
    process.exit(1)
  }
  console.log('\nTodas las verificaciones pasaron.')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
