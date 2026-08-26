import { Router, type Request, type Response } from 'express'
import multer from 'multer'
import { v4 as uuid } from 'uuid'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { loadMembership, requireRole } from '../middleware/loadMembership.js'
import { CONTENT_TYPES, CONTENT_VISIBILITIES, MEDIA_KINDS } from '../lib/enums.js'
import { deleteMedia, readEncryptedMedia, saveEncryptedMedia } from '../lib/storage.js'
import { isContentVisible } from '../lib/contentVisibility.js'

export const contentRouter = Router({ mergeParams: true })
contentRouter.use(requireAuth, loadMembership)

// mergeParams makes :legacyId (and :contentId, on nested routes) available on req.params
// at runtime, but Express's typings don't know that from a router mounted elsewhere —
// these aliases just tell TypeScript what loadMembership's caller already guarantees.
interface LegacyParams {
  legacyId: string
  [key: string]: string
}
interface ContentParams extends LegacyParams {
  contentId: string
}

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 500 * 1024 * 1024 } })

const createSchema = z.object({
  type: z.enum(CONTENT_TYPES),
  title: z.string().min(1),
  category: z.string().optional(),
  textContent: z.string().optional(),
  transcript: z.string().optional(),
  mediaKind: z.enum(MEDIA_KINDS).optional(),
  visibility: z.enum(CONTENT_VISIBILITIES).default('POSTMORTEM'),
  visibleFromDate: z.string().datetime().optional(),
  visibleFromAge: z.coerce.number().int().min(0).max(120).optional(),
  recipientMembershipId: z.string().optional(),
})

// El autor crea historias, consejos, cápsulas dirigidas y sube el archivo multimedia asociado
// (opcional) en la misma llamada. El archivo se cifra en reposo antes de tocar disco.
contentRouter.post('/', requireRole('AUTHOR'), upload.single('media'), async (req: Request<LegacyParams>, res: Response) => {
  const parsed = createSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message })

  const data = parsed.data
  if (data.visibility === 'DATE' && !data.visibleFromDate) {
    return res.status(400).json({ error: 'Falta la fecha de desbloqueo para visibilidad tipo DATE.' })
  }
  if (data.visibility === 'AGE' && !data.visibleFromAge) {
    return res.status(400).json({ error: 'Falta la edad mínima para visibilidad tipo AGE.' })
  }

  const id = uuid()
  let mediaPath: string | undefined
  if (req.file) {
    mediaPath = await saveEncryptedMedia(req.params.legacyId, id, req.file.buffer)
  }

  const content = await prisma.contentItem.create({
    data: {
      id,
      legacyId: req.params.legacyId,
      type: data.type,
      title: data.title,
      category: data.category,
      textContent: data.textContent,
      transcript: data.transcript,
      mediaPath,
      mediaMimeType: req.file?.mimetype,
      mediaKind: data.mediaKind,
      visibility: data.visibility,
      visibleFromDate: data.visibleFromDate ? new Date(data.visibleFromDate) : undefined,
      visibleFromAge: data.visibleFromAge,
      recipientMembershipId: data.recipientMembershipId,
    },
  })
  res.status(201).json(content)
})

contentRouter.get('/', async (req: Request<LegacyParams>, res: Response) => {
  const legacy = await prisma.legacy.findUniqueOrThrow({ where: { id: req.params.legacyId } })
  const viewerUser = await prisma.user.findUniqueOrThrow({ where: { id: req.userId! } })
  const items = await prisma.contentItem.findMany({ where: { legacyId: req.params.legacyId } })

  const visible = items
    .filter((item) => isContentVisible(item, legacy, req.membership!, viewerUser))
    .map(({ mediaPath, ...rest }) => ({ ...rest, hasMedia: !!mediaPath }))

  res.json(visible)
})

contentRouter.get('/:contentId/media', async (req: Request<ContentParams>, res: Response) => {
  const legacy = await prisma.legacy.findUniqueOrThrow({ where: { id: req.params.legacyId } })
  const viewerUser = await prisma.user.findUniqueOrThrow({ where: { id: req.userId! } })
  const content = await prisma.contentItem.findUnique({ where: { id: req.params.contentId } })

  if (!content || content.legacyId !== req.params.legacyId || !content.mediaPath) {
    return res.status(404).json({ error: 'Archivo no encontrado.' })
  }
  if (!isContentVisible(content, legacy, req.membership!, viewerUser)) {
    return res.status(403).json({ error: 'Este contenido todavía no está disponible para ti.' })
  }

  const buffer = await readEncryptedMedia(content.mediaPath)
  res.setHeader('Content-Type', content.mediaMimeType || 'application/octet-stream')
  res.send(buffer)
})

const updateSchema = createSchema.partial()

contentRouter.put('/:contentId', requireRole('AUTHOR'), async (req: Request<ContentParams>, res: Response) => {
  const parsed = updateSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message })

  const existing = await prisma.contentItem.findUnique({ where: { id: req.params.contentId } })
  if (!existing || existing.legacyId !== req.params.legacyId) {
    return res.status(404).json({ error: 'Contenido no encontrado.' })
  }

  const data = parsed.data
  const updated = await prisma.contentItem.update({
    where: { id: req.params.contentId },
    data: {
      ...data,
      visibleFromDate: data.visibleFromDate ? new Date(data.visibleFromDate) : undefined,
    },
  })
  res.json(updated)
})

contentRouter.delete('/:contentId', requireRole('AUTHOR'), async (req: Request<ContentParams>, res: Response) => {
  const existing = await prisma.contentItem.findUnique({ where: { id: req.params.contentId } })
  if (!existing || existing.legacyId !== req.params.legacyId) {
    return res.status(404).json({ error: 'Contenido no encontrado.' })
  }
  if (existing.mediaPath) await deleteMedia(existing.mediaPath)
  await prisma.contentItem.delete({ where: { id: req.params.contentId } })
  res.status(204).end()
})
