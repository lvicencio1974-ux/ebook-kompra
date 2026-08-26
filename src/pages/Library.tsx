import { useLegacy } from '../context/LegacyContext'
import { useContent } from '../hooks/useContent'
import MediaPlayer from '../components/MediaPlayer'

const TYPE_LABELS: Record<string, string> = {
  STORY: 'Historias',
  ADVICE: 'Consejos',
  MEDIA: 'Fotos y videos',
  CAPSULE: 'Cápsulas',
}

export default function Library() {
  const { activeLegacy } = useLegacy()
  const { items, loading } = useContent(activeLegacy?.id)

  if (!activeLegacy) return null

  const groups = ['STORY', 'ADVICE', 'MEDIA', 'CAPSULE']
    .map((type) => ({ type, items: items.filter((i) => i.type === type) }))
    .filter((g) => g.items.length > 0)

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-serif text-3xl text-legado-100">Biblioteca de recuerdos</h2>
        <p className="mt-2 text-legado-200/70 max-w-2xl">
          Esto es lo que {activeLegacy.name} dejó disponible para ti hasta ahora.
        </p>
      </div>

      {loading && <p className="text-legado-200/50 text-sm">Cargando…</p>}
      {!loading && items.length === 0 && (
        <p className="text-legado-200/50 text-sm">
          Todavía no hay nada disponible para ti aquí. Puede que algunos contenidos se desbloqueen más
          adelante, según lo que su autor haya decidido.
        </p>
      )}

      {groups.map((group) => (
        <section key={group.type} className="space-y-3">
          <h3 className="font-medium text-legado-100">{TYPE_LABELS[group.type]}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {group.items.map((item) => (
              <div key={item.id} className="card p-4 space-y-2">
                {item.category && <span className="chip">{item.category}</span>}
                <h4 className="font-serif text-lg text-legado-100">{item.title}</h4>
                {item.textContent && <p className="text-sm text-legado-200/70 whitespace-pre-wrap leading-relaxed">{item.textContent}</p>}
                {item.hasMedia && <MediaPlayer legacyId={activeLegacy.id} item={item} className="w-full rounded-lg max-h-64" />}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
