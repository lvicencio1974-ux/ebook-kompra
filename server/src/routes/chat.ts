import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { loadMembership } from '../middleware/loadMembership.js'
import { isContentVisible } from '../lib/contentVisibility.js'
import { findRelevantContent } from '../lib/matcher.js'
import { generateAvatarReply, isClaudeConfigured } from '../lib/claude.js'
import { GRIEF_RESOURCES, NO_SOURCE_FALLBACK, recreationDisclaimer } from '../lib/safeguards.js'
import { finalizeAllDueForLegacy } from '../lib/deathVerification.js'

export const chatRouter = Router({ mergeParams: true })
chatRouter.use(requireAuth, loadMembership)

interface LegacyParams {
  legacyId: string
  [key: string]: string
}

function localAnswer(top: { title: string; textContent: string | null; transcript: string | null; mediaKind: string | null }): string {
  const text = top.textContent || top.transcript
  if (text) return text
  const kindLabel = top.mediaKind === 'AUDIO' ? 'un audio' : top.mediaKind === 'VIDEO' ? 'un video' : 'algo'
  return `Sobre eso dejé grabado ${kindLabel} llamado "${top.title}". Búscalo en la biblioteca de recuerdos para verlo — el chat todavía no puede reproducirlo aquí directamente.`
}

const askSchema = z.object({ question: z.string().min(1) })

chatRouter.post('/', async (req: Request<LegacyParams>, res: Response) => {
  const parsed = askSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message })

  await finalizeAllDueForLegacy(req.params.legacyId)

  const legacy = await prisma.legacy.findUniqueOrThrow({
    where: { id: req.params.legacyId },
    include: { author: true },
  })
  const membership = req.membership!

  if (membership.role !== 'AUTHOR') {
    if (legacy.status !== 'DEATH_CONFIRMED') {
      return res.status(403).json({
        error: 'El modo conversación todavía no está disponible: este legado sigue activo.',
      })
    }
    if (membership.conversationPaused) {
      return res.status(403).json({
        error: 'Pausaste el modo conversación para ti. Puedes reactivarlo cuando quieras desde tus ajustes.',
      })
    }
  }

  const viewerUser = await prisma.user.findUniqueOrThrow({ where: { id: req.userId! } })
  const allItems = await prisma.contentItem.findMany({ where: { legacyId: req.params.legacyId } })
  const visibleItems = allItems.filter((item) => isContentVisible(item, legacy, membership, viewerUser))

  const relevant = findRelevantContent(parsed.data.question, visibleItems)

  let answer: string
  let engine: 'claude' | 'local-matcher'

  if (relevant.length === 0) {
    answer = NO_SOURCE_FALLBACK
    engine = 'local-matcher'
  } else if (isClaudeConfigured()) {
    try {
      answer = await generateAvatarReply(legacy.author.name, parsed.data.question, relevant)
      engine = 'claude'
    } catch (err) {
      console.error('[chat] Claude falló, usando respaldo local:', err)
      answer = localAnswer(relevant[0])
      engine = 'local-matcher'
    }
  } else {
    answer = localAnswer(relevant[0])
    engine = 'local-matcher'
  }

  const usedContentIds = relevant.map((r) => r.id)
  await prisma.conversationLog.create({
    data: {
      legacyId: req.params.legacyId,
      askedByMembershipId: membership.id,
      question: parsed.data.question,
      answer,
      usedContentIds: JSON.stringify(usedContentIds),
      engine,
    },
  })

  res.json({
    answer,
    engine,
    sources: relevant.map((r) => ({ id: r.id, title: r.title, type: r.type, category: r.category })),
    disclaimer: recreationDisclaimer(legacy.author.name),
    griefResources: GRIEF_RESOURCES,
  })
})

chatRouter.get('/', async (req: Request<LegacyParams>, res: Response) => {
  const logs = await prisma.conversationLog.findMany({
    where: { legacyId: req.params.legacyId, askedByMembershipId: req.membership!.id },
    orderBy: { createdAt: 'asc' },
  })
  res.json(logs)
})

const pauseSchema = z.object({ paused: z.boolean() })

chatRouter.patch('/pause', async (req: Request<LegacyParams>, res: Response) => {
  if (req.membership!.role === 'AUTHOR') {
    return res.status(400).json({ error: 'Esta opción es para beneficiarios y albaceas, no para el autor.' })
  }
  const parsed = pauseSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message })

  const updated = await prisma.membership.update({
    where: { id: req.membership!.id },
    data: { conversationPaused: parsed.data.paused },
  })
  res.json(updated)
})
