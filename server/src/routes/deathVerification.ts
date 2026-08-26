import { Router, type Request, type Response } from 'express'
import multer from 'multer'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { loadMembership, requireRole } from '../middleware/loadMembership.js'
import { saveEncryptedMedia, readEncryptedMedia } from '../lib/storage.js'
import { env } from '../lib/env.js'
import { finalizeAllDueForLegacy, finalizeIfDue } from '../lib/deathVerification.js'

export const deathVerificationRouter = Router({ mergeParams: true })
deathVerificationRouter.use(requireAuth, loadMembership)

interface LegacyParams {
  legacyId: string
  [key: string]: string
}
interface RequestParams extends LegacyParams {
  requestId: string
}

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } })

// El albacea digital abre el proceso subiendo el acta de defunción (u otro documento
// verificable). Esto por sí solo NO desbloquea nada: hace falta una segunda confirmación
// de otra persona de confianza del legado, y luego un período de gracia (ver confirm()).
deathVerificationRouter.post('/', requireRole('EXECUTOR'), upload.single('certificate'), async (req: Request<LegacyParams>, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'Falta el documento de defunción.' })

  const legacy = await prisma.legacy.findUniqueOrThrow({ where: { id: req.params.legacyId } })
  if (legacy.status !== 'ACTIVE') {
    return res.status(409).json({ error: 'Ya existe un proceso de verificación en curso o ya confirmado para este legado.' })
  }

  const gracePeriodDays = Number(req.body.gracePeriodDays) || env.deathVerificationGraceDays

  const created = await prisma.deathVerificationRequest.create({
    data: {
      legacyId: req.params.legacyId,
      initiatedByMembershipId: req.membership!.id,
      certificatePath: '', // se completa abajo una vez que sabemos el id
      certificateMimeType: req.file!.mimetype,
      gracePeriodDays,
    },
  })
  const certificatePath = await saveEncryptedMedia(req.params.legacyId, `death-cert-${created.id}`, req.file!.buffer)

  const [request] = await prisma.$transaction([
    prisma.deathVerificationRequest.update({ where: { id: created.id }, data: { certificatePath } }),
    prisma.legacy.update({ where: { id: req.params.legacyId }, data: { status: 'DEATH_PENDING' } }),
  ])

  res.status(201).json(request)
})

deathVerificationRouter.get('/', async (req: Request<LegacyParams>, res: Response) => {
  await finalizeAllDueForLegacy(req.params.legacyId)
  const requests = await prisma.deathVerificationRequest.findMany({ where: { legacyId: req.params.legacyId } })
  res.json(requests)
})

// Segunda confirmación por otra persona de confianza del legado (no el mismo albacea
// que inició el proceso, y no el propio autor). A partir de aquí arranca el período de
// gracia durante el cual el autor puede cancelar si esto fue un error o un fraude.
deathVerificationRouter.post('/:requestId/confirm', requireRole('EXECUTOR', 'BENEFICIARY'), async (req: Request<RequestParams>, res: Response) => {
  const request = await prisma.deathVerificationRequest.findUnique({ where: { id: req.params.requestId } })
  if (!request || request.legacyId !== req.params.legacyId) return res.status(404).json({ error: 'No encontrado.' })
  if (request.status !== 'PENDING') return res.status(409).json({ error: 'Esta solicitud ya no está pendiente.' })
  if (request.initiatedByMembershipId === req.membership!.id) {
    return res.status(403).json({ error: 'La confirmación debe venir de una persona distinta a quien inició el proceso.' })
  }
  if (request.secondConfirmerMembershipId) {
    return res.status(409).json({ error: 'Esta solicitud ya tiene una segunda confirmación.' })
  }

  const unlockAt = new Date(Date.now() + request.gracePeriodDays * 24 * 60 * 60 * 1000)
  const updated = await prisma.deathVerificationRequest.update({
    where: { id: request.id },
    data: { secondConfirmerMembershipId: req.membership!.id, secondConfirmedAt: new Date(), unlockAt },
  })
  res.json(updated)
})

const schemaWithReason = z.object({ reason: z.string().optional() })

// Válvula de seguridad: mientras dure el período de gracia, el propio autor puede
// cancelar una verificación iniciada por error o de forma fraudulenta.
deathVerificationRouter.post('/:requestId/cancel', requireRole('AUTHOR'), async (req: Request<RequestParams>, res: Response) => {
  const parsed = schemaWithReason.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message })

  const request = await prisma.deathVerificationRequest.findUnique({ where: { id: req.params.requestId } })
  if (!request || request.legacyId !== req.params.legacyId) return res.status(404).json({ error: 'No encontrado.' })
  if (request.status !== 'PENDING') return res.status(409).json({ error: 'Esta solicitud ya no está pendiente.' })

  await prisma.$transaction([
    prisma.deathVerificationRequest.update({ where: { id: request.id }, data: { status: 'CANCELLED', cancelledAt: new Date() } }),
    prisma.legacy.update({ where: { id: req.params.legacyId }, data: { status: 'ACTIVE' } }),
  ])
  res.json({ ok: true })
})

// Un albacea puede rechazar una solicitud iniciada por otro (por ejemplo, si sospecha
// que es un error) antes de que llegue a tener segunda confirmación.
deathVerificationRouter.post('/:requestId/reject', requireRole('EXECUTOR'), async (req: Request<RequestParams>, res: Response) => {
  const request = await prisma.deathVerificationRequest.findUnique({ where: { id: req.params.requestId } })
  if (!request || request.legacyId !== req.params.legacyId) return res.status(404).json({ error: 'No encontrado.' })
  if (request.status !== 'PENDING') return res.status(409).json({ error: 'Esta solicitud ya no está pendiente.' })
  if (request.secondConfirmerMembershipId) {
    return res.status(409).json({ error: 'Ya fue confirmada por una segunda persona; usa la cancelación del autor si sigue en período de gracia.' })
  }

  await prisma.$transaction([
    prisma.deathVerificationRequest.update({ where: { id: request.id }, data: { status: 'REJECTED' } }),
    prisma.legacy.update({ where: { id: req.params.legacyId }, data: { status: 'ACTIVE' } }),
  ])
  res.json({ ok: true })
})

deathVerificationRouter.get('/:requestId/certificate', requireRole('AUTHOR', 'EXECUTOR'), async (req: Request<RequestParams>, res: Response) => {
  const request = await prisma.deathVerificationRequest.findUnique({ where: { id: req.params.requestId } })
  if (!request || request.legacyId !== req.params.legacyId) return res.status(404).json({ error: 'No encontrado.' })

  const buffer = await readEncryptedMedia(request.certificatePath)
  res.setHeader('Content-Type', request.certificateMimeType)
  res.send(buffer)
})

deathVerificationRouter.get('/:requestId', async (req: Request<RequestParams>, res: Response) => {
  await finalizeIfDue(req.params.requestId)
  const request = await prisma.deathVerificationRequest.findUnique({ where: { id: req.params.requestId } })
  if (!request || request.legacyId !== req.params.legacyId) return res.status(404).json({ error: 'No encontrado.' })
  res.json(request)
})
