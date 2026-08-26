import type { NextFunction, Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import type { MembershipRole } from '../lib/enums.js'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      membership?: Awaited<ReturnType<typeof prisma.membership.findFirst>>
    }
  }
}

/** Loads the caller's accepted membership for req.params.legacyId. 404s the legacy's existence on purpose. */
export async function loadMembership(req: Request, res: Response, next: NextFunction) {
  const { legacyId } = req.params
  const membership = await prisma.membership.findFirst({
    where: { legacyId, userId: req.userId, acceptedAt: { not: null } },
  })
  if (!membership) {
    return res.status(404).json({ error: 'No se encontró ese legado, o no tienes acceso a él.' })
  }
  req.membership = membership
  next()
}

export function requireRole(...roles: MembershipRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.membership || !roles.includes(req.membership.role as MembershipRole)) {
      return res.status(403).json({ error: 'No tienes permiso para esta acción.' })
    }
    next()
  }
}
