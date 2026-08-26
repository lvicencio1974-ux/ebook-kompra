import { useMemo, useState } from 'react'
import { useLegacy } from '../context/LegacyContext'
import { useContent } from '../hooks/useContent'
import { GUIDED_PROMPTS } from '../constants/guidedPrompts'
import type { ContentItem, MediaKind } from '../api/types'
import Recorder from '../components/Recorder'
import MediaPlayer from '../components/MediaPlayer'
import { ApiError } from '../api/client'

const CATEGORY_LABELS = Array.from(new Map(GUIDED_PROMPTS.map((p) => [p.category, p.categoryLabel])))

export default function Advice() {
  const { activeLegacy } = useLegacy()
  const { items, create, update, remove } = useContent(activeLegacy?.id)
  const [activePrompt, setActivePrompt] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [textDraft, setTextDraft] = useState('')
  const [recordKind, setRecordKind] = useState<MediaKind>('VIDEO')
  const [captured, setCaptured] = useState<{ blob: Blob; mimeType: string } | null>(null)
  const [customPrompt, setCustomPrompt] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const entries = items.filter((i) => i.type === 'ADVICE')
  const entryByPrompt = useMemo(() => {
    const map = new Map<string, ContentItem>()
    for (const e of entries) map.set(e.title, e)
    return map
  }, [entries])

  function openPrompt(category: string, prompt: string) {
    setActiveCategory(category)
    setActivePrompt(prompt)
    setTextDraft(entryByPrompt.get(prompt)?.textContent ?? '')
    setCaptured(null)
    setError(null)
  }

  function closePrompt() {
    setActivePrompt(null)
    setActiveCategory(null)
    setCaptured(null)
    setTextDraft('')
  }

  async function saveEntry() {
    if (!activePrompt || !activeCategory) return
    setBusy(true)
    setError(null)
    try {
      const existing = entryByPrompt.get(activePrompt)

      if (existing && !captured) {
        // Sin una grabación nueva, solo actualizamos el texto del consejo ya guardado.
        await update(existing.id, { textContent: textDraft || undefined })
      } else {
        // Con una grabación nueva no se puede reemplazar el archivo de un consejo existente
        // (la API no soporta editar el adjunto), así que se reemplaza el registro completo.
        if (existing) await remove(existing.id)
        const kind: MediaKind | undefined = captured
          ? captured.mimeType.startsWith('audio')
            ? 'AUDIO'
            : captured.mimeType.startsWith('video')
            ? 'VIDEO'
            : 'PHOTO'
          : undefined
        await create(
          {
            type: 'ADVICE',
            title: activePrompt,
            category: activeCategory,
            textContent: textDraft || undefined,
            mediaKind: kind,
            visibility: 'POSTMORTEM',
          },
          captured ? { blob: captured.blob, filename: `consejo.${captured.mimeType.split('/')[1] || 'webm'}` } : undefined
        )
      }
      closePrompt()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo guardar el consejo.')
    } finally {
      setBusy(false)
    }
  }

  function saveCustom() {
    const prompt = customPrompt.trim()
    if (!prompt) return
    setCustomPrompt('')
    openPrompt('personalizado', prompt)
  }

  async function removeEntry(entry: ContentItem) {
    if (!confirm('¿Eliminar este consejo?')) return
    await remove(entry.id)
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
          <input className="input" value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)} placeholder="Escribe tu propia pregunta o tema..." />
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
                  className={`card p-4 text-left transition hover:border-legado-400/50 ${existing ? 'border-legado-400/40' : ''}`}
                >
                  <p className="text-sm text-legado-100">{p.prompt}</p>
                  <p className="mt-2 text-xs text-legado-300">{existing ? '✓ Respondido — toca para editar' : 'Sin responder'}</p>
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
              <textarea className="input min-h-[100px]" value={textDraft} onChange={(e) => setTextDraft(e.target.value)} placeholder="Escribe tu respuesta..." />
            </div>

            <div>
              <label className="label">O grábate en video/audio</label>
              <div className="flex gap-2 mb-3">
                <button className={`btn-secondary !py-1 ${recordKind === 'VIDEO' ? 'bg-legado-500/20' : ''}`} onClick={() => setRecordKind('VIDEO')}>
                  Video
                </button>
                <button className={`btn-secondary !py-1 ${recordKind === 'AUDIO' ? 'bg-legado-500/20' : ''}`} onClick={() => setRecordKind('AUDIO')}>
                  Audio
                </button>
              </div>
              {!captured && <Recorder kind={recordKind} onCapture={(blob, mimeType) => setCaptured({ blob, mimeType })} />}
              {captured && (
                <div className="space-y-2">
                  <p className="text-xs text-legado-200/50">Grabación lista para guardar ({captured.mimeType}).</p>
                  <button className="btn-secondary" onClick={() => setCaptured(null)}>
                    Grabar de nuevo
                  </button>
                </div>
              )}
              {!captured && entryByPrompt.get(activePrompt)?.hasMedia && activeLegacy && (
                <div className="mt-3">
                  <p className="text-xs text-legado-200/50 mb-1">Grabación actual:</p>
                  <MediaPlayer legacyId={activeLegacy.id} item={entryByPrompt.get(activePrompt)!} />
                </div>
              )}
            </div>

            {error && <p className="text-sm text-red-300">{error}</p>}

            <div className="flex gap-3 pt-2">
              <button className="btn-primary" onClick={saveEntry} disabled={busy}>
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
                  <p className="text-sm text-legado-100">{entry.title}</p>
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
