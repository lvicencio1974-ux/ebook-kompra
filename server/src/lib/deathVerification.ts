import { prisma } from './prisma.js'

/**
 * Grace-period requests unlock themselves once `unlockAt` has passed. There's no
 * background scheduler in this deployment, so this lazily finalizes a request
 * whenever it's touched (read or acted on) instead — safe because it's idempotent.
 */
export async function finalizeIfDue(requestId: string): Promise<void> {
  const request = await prisma.deathVerificationRequest.findUnique({ where: { id: requestId } })
  if (!request || request.status !== 'PENDING' || !request.unlockAt) return
  if (new Date() < request.unlockAt) return

  await prisma.$transaction([
    prisma.deathVerificationRequest.update({ where: { id: request.id }, data: { status: 'CONFIRMED' } }),
    prisma.legacy.update({
      where: { id: request.legacyId },
      data: { status: 'DEATH_CONFIRMED', deathConfirmedAt: request.unlockAt },
    }),
  ])
}

export async function finalizeAllDueForLegacy(legacyId: string): Promise<void> {
  const pending = await prisma.deathVerificationRequest.findMany({
    where: { legacyId, status: 'PENDING' },
  })
  for (const request of pending) {
    await finalizeIfDue(request.id)
  }
}
