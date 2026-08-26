import { useState } from 'react'
import { useLegacy } from '../context/LegacyContext'
import { useContent } from '../hooks/useContent'
import type { ContentVisibility } from '../api/types'
import VisibilityPicker from '../components/VisibilityPicker'
import { ApiError } from '../api/client'

const CATEGORIES = ['infancia', 'familia', 'amor', 'trabajo', 'aprendizajes', 'otro']

interface Draft {
  title: string
  category: string
  textContent: string
  visibility: ContentVisibility
  visibleFromDate: string
  visibleFromAge: string
  recipientMembershipId: string
}

const emptyDraft = (): Draft => ({
  title: '',
  category: 'familia',
  textContent: '',
  visibility: 'POSTMORTEM',
  visibleFromDate: '',
  visibleFromAge: '',
  recipientMembershipId: '',
})

export default function Stories() {
  const { activeLegacy } = useLegacy()
  const { items, create, remove } = useContent(activeLegacy?.id)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const stories = items.filter((i) => i.type === 'STORY')
  const recipients = activeLegacy?.memberships.filter((m) => m.role === 'BENEFICIARY' && m.acceptedAt) ?? []

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!draft) return
    setBusy(true)
    setError(null)
    try {
      await create({
        type: 'STORY',
        title: draft.title,
        category: draft.category,
        textContent: draft.textContent,
        visibility: draft.visibility,
        visibleFromDate: draft.visibleFromDate || undefined,
        visibleFromAge: draft.visibleFromAge ? Number(draft.visibleFromAge) : undefined,
        recipientMembershipId: draft.recipientMembershipId || undefined,
      })
      setDraft(null)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo guardar la historia.')
    } finally {
      setBusy(false)
    }
  }

  async function handleRemove(id: string) {
    if (!confirm('¿Eliminar esta historia? No se puede deshacer.')) return
    await remove(id)
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl text-legado-100">Historias y recuerdos</h2>
          <p className="mt-2 text-legado-200/70 max-w-2xl">
            Escribe los momentos, anécdotas y aprendizajes que quieres que tus hijos conserven.
          </p>
        </div>
        {!draft && (
          <button className="btn-primary shrink-0" onClick={() => setDraft(emptyDraft())}>
            + Nueva historia
          </button>
        )}
      </div>

      {draft && (
        <form onSubmit={save} className="card p-6 space-y-4">
          <div>
            <label className="label">Título</label>
            <input
              className="input"
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="Ej. El día que nació tu hermana"
              required
            />
          </div>
          <div>
            <label className="label">Categoría</label>
            <select className="input" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Cuéntala</label>
            <textarea
              className="input min-h-[160px]"
              value={draft.textContent}
              onChange={(e) => setDraft({ ...draft, textContent: e.target.value })}
              placeholder="Escribe con calma, como si se lo contaras en persona..."
              required
            />
          </div>

          <VisibilityPicker
            visibility={draft.visibility}
            visibleFromDate={draft.visibleFromDate}
            visibleFromAge={draft.visibleFromAge}
            recipientMembershipId={draft.recipientMembershipId}
            recipients={recipients}
            onChange={(fields) => setDraft({ ...draft, ...fields })}
          />

          {error && <p className="text-sm text-red-300">{error}</p>}

          <div className="flex gap-3">
            <button type="submit" className="btn-primary" disabled={busy}>
              Guardar historia
            </button>
            <button type="button" className="btn-secondary" onClick={() => setDraft(null)}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {stories.length === 0 && !draft && <p className="text-legado-200/50 text-sm">Todavía no has escrito ninguna historia.</p>}
        {stories.map((story) => (
          <div key={story.id} className="card p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="chip mb-2">{story.category}</span>
                <h3 className="font-serif text-lg text-legado-100">{story.title}</h3>
              </div>
              <button className="btn-danger shrink-0" onClick={() => handleRemove(story.id)}>
                Eliminar
              </button>
            </div>
            <p className="mt-3 text-sm text-legado-200/70 whitespace-pre-wrap leading-relaxed">{story.textContent}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
