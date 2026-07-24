import { useEffect, useState } from 'react'
import { v4 as uuid } from 'uuid'
import { mediaStore } from '../db'
import type { MediaItem, MediaKind } from '../types'
import Recorder from '../components/Recorder'
import MediaPlayer from '../components/MediaPlayer'

export default function Gallery() {
  const [items, setItems] = useState<MediaItem[]>([])
  const [showRecorder, setShowRecorder] = useState(false)
  const [kind, setKind] = useState<MediaKind>('photo')
  const [title, setTitle] = useState('')
  const [filter, setFilter] = useState<'all' | MediaKind>('all')

  useEffect(() => {
    refresh()
  }, [])

  function refresh() {
    mediaStore.all().then(setItems)
  }

  async function handleCapture(blob: Blob, mimeType: string) {
    const item: MediaItem = {
      id: uuid(),
      kind,
      mimeType,
      blob,
      title: title.trim() || 'Sin título',
      createdAt: Date.now(),
    }
    await mediaStore.save(item)
    setTitle('')
    setShowRecorder(false)
    refresh()
  }

  async function remove(id: string) {
    if (!confirm('¿Eliminar este archivo?')) return
    await mediaStore.remove(id)
    refresh()
  }

  const filtered = items.filter((i) => filter === 'all' || i.kind === filter)

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
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Vacaciones 2020, Mensaje de cumpleaños..."
            />
          </div>
          <div className="flex gap-2">
            {(['photo', 'video', 'audio'] as MediaKind[]).map((k) => (
              <button
                key={k}
                className={`btn-secondary !py-1 ${kind === k ? 'bg-legado-500/20' : ''}`}
                onClick={() => setKind(k)}
              >
                {k === 'photo' ? 'Foto' : k === 'video' ? 'Video' : 'Audio'}
              </button>
            ))}
          </div>
          <Recorder kind={kind} onCapture={handleCapture} />
          <button className="btn-secondary" onClick={() => setShowRecorder(false)}>
            Cancelar
          </button>
        </div>
      )}

      <div className="flex gap-2">
        {(['all', 'photo', 'video', 'audio'] as const).map((f) => (
          <button
            key={f}
            className={`btn-secondary !py-1 ${filter === f ? 'bg-legado-500/20' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'Todo' : f === 'photo' ? 'Fotos' : f === 'video' ? 'Videos' : 'Audios'}
          </button>
        ))}
      </div>

      {filtered.length === 0 && <p className="text-legado-200/50 text-sm">Aún no hay nada guardado aquí.</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item) => (
          <div key={item.id} className="card p-3 space-y-2">
            <MediaPlayer item={item} className="w-full rounded-lg max-h-52 object-cover" />
            <div className="flex items-center justify-between gap-2 px-1">
              <div>
                <p className="text-sm text-legado-100 truncate">{item.title}</p>
                <p className="text-xs text-legado-200/40">{new Date(item.createdAt).toLocaleDateString()}</p>
              </div>
              <button className="btn-danger shrink-0" onClick={() => remove(item.id)}>
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
