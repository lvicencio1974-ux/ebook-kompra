import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/requireAuth.js'

export const invitesRouter = Router()

invitesRouter.post('/:token/accept', requireAuth, async (req, res) => {
  const membership = await prisma.membership.findUnique({ where: { inviteToken: req.params.token } })
  if (!membership) return res.status(404).json({ error: 'Invitación no encontrada o ya usada.' })
  if (membership.acceptedAt) return res.status(409).json({ error: 'Esta invitación ya fue aceptada.' })

  const updated = await prisma.membership.update({
    where: { id: membership.id },
    data: { userId: req.userId!, acceptedAt: new Date() },
  })
  res.json(updated)
})
