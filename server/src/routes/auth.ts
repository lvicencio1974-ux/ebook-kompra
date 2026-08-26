import { Router } from 'express'
import { z } from 'zod'
import { authenticator } from 'otplib'
import { prisma } from '../lib/prisma.js'
import { hashPassword, signAuthToken, verifyPassword } from '../lib/auth.js'
import { requireAuth } from '../middleware/requireAuth.js'

export const authRouter = Router()

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.'),
  name: z.string().min(1),
  birthDate: z.string().datetime().optional(),
})

authRouter.post('/signup', async (req, res) => {
  const parsed = signupSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message })

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } })
  if (existing) return res.status(409).json({ error: 'Ya existe una cuenta con ese correo.' })

  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      passwordHash: await hashPassword(parsed.data.password),
      name: parsed.data.name,
      birthDate: parsed.data.birthDate ? new Date(parsed.data.birthDate) : undefined,
    },
  })

  res.status(201).json({ token: signAuthToken({ userId: user.id }), user: { id: user.id, email: user.email, name: user.name } })
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  totpCode: z.string().optional(),
})

authRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message })

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } })
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return res.status(401).json({ error: 'Correo o contraseña incorrectos.' })
  }

  if (user.totpEnabled) {
    if (!parsed.data.totpCode) {
      return res.status(401).json({ error: 'Se requiere el código de doble factor.', totpRequired: true })
    }
    const valid = authenticator.check(parsed.data.totpCode, user.totpSecret!)
    if (!valid) return res.status(401).json({ error: 'Código de doble factor inválido.' })
  }

  res.json({ token: signAuthToken({ userId: user.id }), user: { id: user.id, email: user.email, name: user.name } })
})

authRouter.get('/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId! } })
  res.json({ id: user.id, email: user.email, name: user.name, totpEnabled: user.totpEnabled })
})

// --- Doble factor (TOTP), recomendado para cuentas de autor dado lo sensible del contenido ---

authRouter.post('/totp/enroll', requireAuth, async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId! } })
  const secret = authenticator.generateSecret()
  await prisma.user.update({ where: { id: user.id }, data: { totpSecret: secret, totpEnabled: false } })
  const otpauthUrl = authenticator.keyuri(user.email, 'Legado Digital', secret)
  res.json({ otpauthUrl })
})

const totpConfirmSchema = z.object({ code: z.string() })

authRouter.post('/totp/confirm', requireAuth, async (req, res) => {
  const parsed = totpConfirmSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message })

  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId! } })
  if (!user.totpSecret) return res.status(400).json({ error: 'Primero inicia el proceso de doble factor.' })
  if (!authenticator.check(parsed.data.code, user.totpSecret)) {
    return res.status(400).json({ error: 'Código inválido.' })
  }
  await prisma.user.update({ where: { id: user.id }, data: { totpEnabled: true } })
  res.json({ ok: true })
})
