import { Router } from 'express'
import { v4 as uuid } from 'uuid'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { loadMembership, requireRole } from '../middleware/loadMembership.js'
import { MEMBERSHIP_ROLES } from '../lib/enums.js'

export const legaciesRouter = Router()
legaciesRouter.use(requireAuth)

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
    include: { memberships: true },
  })
  res.status(201).json(legacy)
})

legaciesRouter.get('/', async (req, res) => {
  const legacies = await prisma.legacy.findMany({
    where: { memberships: { some: { userId: req.userId!, acceptedAt: { not: null } } } },
    include: { memberships: true },
  })
  res.json(legacies)
})

legaciesRouter.get('/:legacyId', loadMembership, async (req, res) => {
  const legacy = await prisma.legacy.findUniqueOrThrow({
    where: { id: req.params.legacyId },
    include: { memberships: true },
  })
  res.json(legacy)
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
