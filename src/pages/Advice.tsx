import { useEffect, useMemo, useState } from 'react'
import { v4 as uuid } from 'uuid'
import { adviceStore, mediaStore } from '../db'
import { GUIDED_PROMPTS, type AdviceEntry, type MediaItem, type MediaKind } from '../types'
import Recorder from '../components/Recorder'
import MediaPlayer from '../components/MediaPlayer'

const CATEGORY_LABELS = Array.from(new Map(GUIDED_PROMPTS.map((p) => [p.category, p.categoryLabel])))

export default function Advice() {
  const [entries, setEntries] = useState<AdviceEntry[]>([])
  const [media, setMedia] = useState<Record<string, MediaItem>>({})
  const [activePrompt, setActivePrompt] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [textDraft, setTextDraft] = useState('')
  const [recordKind, setRecordKind] = useState<MediaKind>('video')
  const [capturedBlob, setCapturedBlob] = useState<{ blob: Blob; mimeType: string } | null>(null)
  const [customPrompt, setCustomPrompt] = useState('')

  useEffect(() => {
    refresh()
  }, [])

  async function refresh() {
    const all = await adviceStore.all()
    setEntries(all)
    const items = await mediaStore.all()
    const map: Record<string, MediaItem> = {}
    for (const m of items) map[m.id] = m
    setMedia(map)
  }

  const entryByPrompt = useMemo(() => {
    const map = new Map<string, AdviceEntry>()
    for (const e of entries) map.set(e.prompt, e)
    return map
  }, [entries])

  function openPrompt(category: string, prompt: string) {
    setActiveCategory(category)
    setActivePrompt(prompt)
    const existing = entryByPrompt.get(prompt)
    setTextDraft(existing?.textResponse ?? '')
    setCapturedBlob(null)
  }

  function closePrompt() {
    setActivePrompt(null)
    setActiveCategory(null)
    setCapturedBlob(null)
    setTextDraft('')
  }

  async function saveEntry() {
    if (!activePrompt || !activeCategory) return
    const existing = entryByPrompt.get(activePrompt)
    let mediaId = existing?.mediaId

    if (capturedBlob) {
      const kind: MediaKind = capturedBlob.mimeType.startsWith('audio')
        ? 'audio'
        : capturedBlob.mimeType.startsWith('video')
        ? 'video'
        : 'photo'
      const item: MediaItem = {
        id: uuid(),
        kind,
        mimeType: capturedBlob.mimeType,
        blob: capturedBlob.blob,
        title: activePrompt,
        createdAt: Date.now(),
      }
      await mediaStore.save(item)
      mediaId = item.id
    }

    const entry: AdviceEntry = {
      id: existing?.id ?? uuid(),
      category: activeCategory,
      prompt: activePrompt,
      textResponse: textDraft,
      mediaId,
      createdAt: existing?.createdAt ?? Date.now(),
      done: true,
    }
    await adviceStore.save(entry)
    closePrompt()
    refresh()
  }

  async function saveCustom() {
    const prompt = customPrompt.trim()
    if (!prompt) return
    setCustomPrompt('')
    openPrompt('personalizado', prompt)
  }

  async function removeEntry(entry: AdviceEntry) {
    if (!confirm('¿Eliminar este consejo?')) return
    await adviceStore.remove(entry.id)
    if (entry.mediaId) await mediaStore.remove(entry.mediaId)
    refresh()
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-serif text-3xl text-legado-100">Consejos para tus hijos</h2>
        <p className="mt-2 text-legado-200/70 max-w-2xl">
          Responde estas preguntas guiadas en video, audio o texto. Piensa en los momentos de la
          vida de tus hijos en los que te gustaría estar presente con tus palabras.
        </p>
      </div>

      <div className="card p-5">
        <label className="label">¿Quieres responder a una pregunta propia?</label>
        <div className="flex gap-2">
          <input
            className="input"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Escribe tu propia pregunta o tema..."
          />
          <button className="btn-secondary shrink-0" onClick={saveCustom}>
            Responder
          </button>
        </div>
      </div>

      {CATEGORY_LABELS.map(([category, label]) => (
        <section key={category} className="space-y-3">
          <h3 className="font-medium text-legado-100">{label}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {GUIDED_PROMPTS.filter((p) => p.category === category).map((p) => {
              const existing = entryByPrompt.get(p.prompt)
              return (
                <button
                  key={p.prompt}
                  onClick={() => openPrompt(p.category, p.prompt)}
                  className={`card p-4 text-left transition hover:border-legado-400/50 ${
                    existing ? 'border-legado-400/40' : ''
                  }`}
                >
                  <p className="text-sm text-legado-100">{p.prompt}</p>
                  <p className="mt-2 text-xs text-legado-300">
                    {existing ? '✓ Respondido — toca para editar' : 'Sin responder'}
                  </p>
                </button>
              )
            })}
          </div>
        </section>
      ))}

      {activePrompt && (
        <div className="fixed inset-0 z-20 flex items-end md:items-center justify-center bg-black/60 p-4">
          <div className="card w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-5">
            <div>
              <span className="chip mb-2">{activeCategory}</span>
              <h3 className="font-serif text-xl text-legado-100">{activePrompt}</h3>
            </div>

            <div>
              <label className="label">Respuesta en texto (opcional si grabas video o audio)</label>
              <textarea
                className="input min-h-[100px]"
                value={textDraft}
                onChange={(e) => setTextDraft(e.target.value)}
                placeholder="Escribe tu respuesta..."
              />
            </div>

            <div>
              <label className="label">O grábate en video/audio</label>
              <div className="flex gap-2 mb-3">
                <button
                  className={`btn-secondary !py-1 ${recordKind === 'video' ? 'bg-legado-500/20' : ''}`}
                  onClick={() => setRecordKind('video')}
                >
                  Video
                </button>
                <button
                  className={`btn-secondary !py-1 ${recordKind === 'audio' ? 'bg-legado-500/20' : ''}`}
                  onClick={() => setRecordKind('audio')}
                >
                  Audio
                </button>
              </div>
              {!capturedBlob && (
                <Recorder kind={recordKind} onCapture={(blob, mimeType) => setCapturedBlob({ blob, mimeType })} />
              )}
              {capturedBlob && (
                <div className="space-y-2">
                  <MediaPlayer
                    item={{
                      id: 'preview',
                      kind: recordKind,
                      mimeType: capturedBlob.mimeType,
                      blob: capturedBlob.blob,
                      title: 'preview',
                      createdAt: Date.now(),
                    }}
                  />
                  <button className="btn-secondary" onClick={() => setCapturedBlob(null)}>
                    Grabar de nuevo
                  </button>
                </div>
              )}
              {!capturedBlob && entryByPrompt.get(activePrompt)?.mediaId && media[entryByPrompt.get(activePrompt)!.mediaId!] && (
                <div className="mt-3">
                  <p className="text-xs text-legado-200/50 mb-1">Grabación actual:</p>
                  <MediaPlayer item={media[entryByPrompt.get(activePrompt)!.mediaId!]} />
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button className="btn-primary" onClick={saveEntry}>
                Guardar
              </button>
              <button className="btn-secondary" onClick={closePrompt}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {entries.length > 0 && (
        <section className="space-y-3">
          <h3 className="font-medium text-legado-100">Todos tus consejos guardados</h3>
          <div className="space-y-2">
            {entries.map((entry) => (
              <div key={entry.id} className="card p-4 flex items-start justify-between gap-4">
                <div>
                  <span className="chip mb-1">{entry.category}</span>
                  <p className="text-sm text-legado-100">{entry.prompt}</p>
                </div>
                <button className="btn-danger shrink-0" onClick={() => removeEntry(entry)}>
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
