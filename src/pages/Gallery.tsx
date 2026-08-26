import { useState } from 'react'
import { useLegacy } from '../context/LegacyContext'
import { useContent } from '../hooks/useContent'
import type { ContentVisibility, MediaKind } from '../api/types'
import Recorder from '../components/Recorder'
import MediaPlayer from '../components/MediaPlayer'
import VisibilityPicker from '../components/VisibilityPicker'
import { ApiError } from '../api/client'

export default function Gallery() {
  const { activeLegacy } = useLegacy()
  const { items, create, remove } = useContent(activeLegacy?.id)
  const [showRecorder, setShowRecorder] = useState(false)
  const [kind, setKind] = useState<MediaKind>('PHOTO')
  const [title, setTitle] = useState('')
  const [visibility, setVisibility] = useState<ContentVisibility>('POSTMORTEM')
  const [visibleFromDate, setVisibleFromDate] = useState('')
  const [visibleFromAge, setVisibleFromAge] = useState('')
  const [recipientMembershipId, setRecipientMembershipId] = useState('')
  const [filter, setFilter] = useState<'all' | MediaKind>('all')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const media = items.filter((i) => i.type === 'MEDIA')
  const recipients = activeLegacy?.memberships.filter((m) => m.role === 'BENEFICIARY' && m.acceptedAt) ?? []

  async function handleCapture(blob: Blob, mimeType: string) {
    setBusy(true)
    setError(null)
    try {
      const ext = mimeType.split('/')[1] || 'bin'
      await create(
        {
          type: 'MEDIA',
          title: title.trim() || 'Sin título',
          mediaKind: kind,
          visibility,
          visibleFromDate: visibleFromDate || undefined,
          visibleFromAge: visibleFromAge ? Number(visibleFromAge) : undefined,
          recipientMembershipId: recipientMembershipId || undefined,
        },
        { blob, filename: `archivo.${ext}` }
      )
      setTitle('')
      setShowRecorder(false)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo subir el archivo.')
    } finally {
      setBusy(false)
    }
  }

  async function handleRemove(id: string) {
    if (!confirm('¿Eliminar este archivo?')) return
    await remove(id)
  }

  const filtered = media.filter((i) => filter === 'all' || i.mediaKind === filter)

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl text-legado-100">Fotos y videos</h2>
          <p className="mt-2 text-legado-200/70 max-w-2xl">
            Guarda imágenes y videos que quieras dejar para tus hijos: momentos cotidianos, mensajes
            directos a cámara, o recuerdos que no quieres que se pierdan.
          </p>
        </div>
        {!showRecorder && (
          <button className="btn-primary shrink-0" onClick={() => setShowRecorder(true)}>
            + Añadir
          </button>
        )}
      </div>

      {showRecorder && (
        <div className="card p-6 space-y-4">
          <div>
            <label className="label">Título</label>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej. Vacaciones 2020, Mensaje de cumpleaños..." />
          </div>
          <div className="flex gap-2">
            {(['PHOTO', 'VIDEO', 'AUDIO'] as MediaKind[]).map((k) => (
              <button key={k} className={`btn-secondary !py-1 ${kind === k ? 'bg-legado-500/20' : ''}`} onClick={() => setKind(k)}>
                {k === 'PHOTO' ? 'Foto' : k === 'VIDEO' ? 'Video' : 'Audio'}
              </button>
            ))}
          </div>

          <VisibilityPicker
            visibility={visibility}
            visibleFromDate={visibleFromDate}
            visibleFromAge={visibleFromAge}
            recipientMembershipId={recipientMembershipId}
            recipients={recipients}
            onChange={(fields) => {
              if (fields.visibility !== undefined) setVisibility(fields.visibility)
              if (fields.visibleFromDate !== undefined) setVisibleFromDate(fields.visibleFromDate)
              if (fields.visibleFromAge !== undefined) setVisibleFromAge(fields.visibleFromAge)
              if (fields.recipientMembershipId !== undefined) setRecipientMembershipId(fields.recipientMembershipId)
            }}
          />

          <Recorder kind={kind} onCapture={handleCapture} />
          {error && <p className="text-sm text-red-300">{error}</p>}
          {busy && <p className="text-sm text-legado-200/50">Subiendo…</p>}
          <button className="btn-secondary" onClick={() => setShowRecorder(false)}>
            Cancelar
          </button>
        </div>
      )}

      <div className="flex gap-2">
        {(['all', 'PHOTO', 'VIDEO', 'AUDIO'] as const).map((f) => (
          <button key={f} className={`btn-secondary !py-1 ${filter === f ? 'bg-legado-500/20' : ''}`} onClick={() => setFilter(f)}>
            {f === 'all' ? 'Todo' : f === 'PHOTO' ? 'Fotos' : f === 'VIDEO' ? 'Videos' : 'Audios'}
          </button>
        ))}
      </div>

      {filtered.length === 0 && <p className="text-legado-200/50 text-sm">Aún no hay nada guardado aquí.</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item) => (
          <div key={item.id} className="card p-3 space-y-2">
            {activeLegacy && <MediaPlayer legacyId={activeLegacy.id} item={item} className="w-full rounded-lg max-h-52 object-cover" />}
            <div className="flex items-center justify-between gap-2 px-1">
              <div>
                <p className="text-sm text-legado-100 truncate">{item.title}</p>
                <p className="text-xs text-legado-200/40">{new Date(item.createdAt).toLocaleDateString()}</p>
              </div>
              <button className="btn-danger shrink-0" onClick={() => handleRemove(item.id)}>
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
