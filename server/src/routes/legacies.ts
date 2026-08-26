import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { loadMembership, requireRole } from '../middleware/loadMembership.js'
import { MEMBERSHIP_ROLES } from '../lib/enums.js'
import { serializeLegacy } from '../lib/legacySerializer.js'

export const legaciesRouter = Router()
legaciesRouter.use(requireAuth)

const membershipWithUser = {
  memberships: { include: { user: { select: { id: true, name: true, email: true } } } },
} as const

const createLegacySchema = z.object({ name: z.string().min(1) })

legaciesRouter.post('/', async (req, res) => {
  const parsed = createLegacySchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message })

  const legacy = await prisma.legacy.create({
    data: {
      name: parsed.data.name,
      authorId: req.userId!,
      memberships: {
        create: { role: 'AUTHOR', userId: req.userId!, acceptedAt: new Date() },
      },
    },
    include: membershipWithUser,
  })
  res.status(201).json(serializeLegacy(legacy))
})

legaciesRouter.get('/', async (req, res) => {
  const legacies = await prisma.legacy.findMany({
    where: { memberships: { some: { userId: req.userId!, acceptedAt: { not: null } } } },
    include: membershipWithUser,
  })
  res.json(legacies.map(serializeLegacy))
})

legaciesRouter.get('/:legacyId', loadMembership, async (req, res) => {
  const legacy = await prisma.legacy.findUniqueOrThrow({
    where: { id: req.params.legacyId },
    include: membershipWithUser,
  })
  res.json(serializeLegacy(legacy))
})

const updateLegacySchema = z.object({
  name: z.string().min(1).optional(),
  bio: z.string().optional(),
  humor: z.string().optional(),
  traits: z.array(z.string()).optional(),
  values: z.array(z.string()).optional(),
  phrases: z.array(z.string()).optional(),
})

// El autor edita su propio perfil: quién es, qué valora, cómo habla. Esto alimenta el
// prompt del chat y la respuesta de respaldo cuando no hay una fuente exacta.
legaciesRouter.put('/:legacyId', loadMembership, requireRole('AUTHOR'), async (req, res) => {
  const parsed = updateLegacySchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message })

  const { traits, values, phrases, ...rest } = parsed.data
  const legacy = await prisma.legacy.update({
    where: { id: req.params.legacyId },
    data: {
      ...rest,
      traits: traits ? JSON.stringify(traits) : undefined,
      values: values ? JSON.stringify(values) : undefined,
      phrases: phrases ? JSON.stringify(phrases) : undefined,
    },
    include: membershipWithUser,
  })
  res.json(serializeLegacy(legacy))
})

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(MEMBERSHIP_ROLES).refine((r) => r !== 'AUTHOR', 'No se puede invitar como autor.'),
  relationship: z.string().optional(),
  minAccessAge: z.number().int().min(0).max(120).optional(),
})

// Solo el autor invita beneficiarios y albaceas de confianza.
legaciesRouter.post('/:legacyId/invites', loadMembership, requireRole('AUTHOR'), async (req, res) => {
  const parsed = inviteSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message })

  const membership = await prisma.membership.create({
    data: {
      legacyId: req.params.legacyId,
      role: parsed.data.role,
      relationship: parsed.data.relationship,
      minAccessAge: parsed.data.minAccessAge,
      inviteEmail: parsed.data.email,
      inviteToken: uuid(),
    },
  })

  // No hay proveedor de correo configurado: se entrega el enlace de invitación
  // para que el autor lo comparta manualmente. Un envío por email real es una
  // integración futura (ver README de server/).
  console.log(`[invite] Enlace de invitación para ${parsed.data.email}: /invites/${membership.inviteToken}/accept`)

  res.status(201).json({ membershipId: membership.id, inviteToken: membership.inviteToken })
})

legaciesRouter.get('/:legacyId/invites', loadMembership, requireRole('AUTHOR'), async (req, res) => {
  const invites = await prisma.membership.findMany({ where: { legacyId: req.params.legacyId, role: { not: 'AUTHOR' } } })
  res.json(invites)
})
