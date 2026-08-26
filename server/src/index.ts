import express from 'express'
import cors from 'cors'
import { env } from './lib/env.js'
import { authRouter } from './routes/auth.js'
import { legaciesRouter } from './routes/legacies.js'
import { invitesRouter } from './routes/invites.js'
import { contentRouter } from './routes/content.js'
import { deathVerificationRouter } from './routes/deathVerification.js'
import { chatRouter } from './routes/chat.js'
import { isClaudeConfigured } from './lib/claude.js'
import { voiceProviderStatus } from './providers/voiceProvider.js'
import { avatarProviderStatus } from './providers/avatarProvider.js'

const app = express()
app.use(cors())
app.use(express.json({ limit: '2mb' }))

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    engines: {
      chatGenerative: isClaudeConfigured() ? 'claude' : 'local-matcher (sin ANTHROPIC_API_KEY)',
      voiceCloning: voiceProviderStatus.configured,
      videoAvatar: avatarProviderStatus.configured,
    },
  })
})

app.use('/auth', authRouter)
app.use('/legacies', legaciesRouter)
app.use('/invites', invitesRouter)
app.use('/legacies/:legacyId/content', contentRouter)
app.use('/legacies/:legacyId/death-verification', deathVerificationRouter)
app.use('/legacies/:legacyId/chat', chatRouter)

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err)
  res.status(500).json({ error: 'Error interno del servidor.' })
})

app.listen(env.port, () => {
  console.log(`Legado Digital backend escuchando en http://localhost:${env.port}`)
})
