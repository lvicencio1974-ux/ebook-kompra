import { useEffect, useState } from 'react'
import { v4 as uuid } from 'uuid'
import { storiesStore } from '../db'
import type { Story } from '../types'

const CATEGORIES = ['infancia', 'familia', 'amor', 'trabajo', 'aprendizajes', 'otro']

export default function Stories() {
  const [stories, setStories] = useState<Story[]>([])
  const [editing, setEditing] = useState<Story | null>(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    refresh()
  }, [])

  function refresh() {
    storiesStore.all().then(setStories)
  }

  function startNew() {
    setEditing({ id: uuid(), title: '', content: '', category: 'familia', createdAt: Date.now() })
    setShowForm(true)
  }

  function startEdit(story: Story) {
    setEditing(story)
    setShowForm(true)
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!editing) return
    await storiesStore.save(editing)
    setShowForm(false)
    setEditing(null)
    refresh()
  }

  async function remove(id: string) {
    if (!confirm('¿Eliminar esta historia? No se puede deshacer.')) return
    await storiesStore.remove(id)
    refresh()
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
        {!showForm && (
          <button className="btn-primary shrink-0" onClick={startNew}>
            + Nueva historia
          </button>
        )}
      </div>

      {showForm && editing && (
        <form onSubmit={save} className="card p-6 space-y-4">
          <div>
            <label className="label">Título</label>
            <input
              className="input"
              value={editing.title}
              onChange={(e) => setEditing({ ...editing, title: e.target.value })}
              placeholder="Ej. El día que nació tu hermana"
              required
            />
          </div>
          <div>
            <label className="label">Categoría</label>
            <select
              className="input"
              value={editing.category}
              onChange={(e) => setEditing({ ...editing, category: e.target.value })}
            >
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
              value={editing.content}
              onChange={(e) => setEditing({ ...editing, content: e.target.value })}
              placeholder="Escribe con calma, como si se lo contaras en persona..."
              required
            />
          </div>
          <div className="flex gap-3">
            <button type="submit" className="btn-primary">
              Guardar historia
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setShowForm(false)
                setEditing(null)
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {stories.length === 0 && !showForm && (
          <p className="text-legado-200/50 text-sm">Todavía no has escrito ninguna historia.</p>
        )}
        {stories.map((story) => (
          <div key={story.id} className="card p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="chip mb-2">{story.category}</span>
                <h3 className="font-serif text-lg text-legado-100">{story.title}</h3>
              </div>
              <div className="flex gap-2 shrink-0">
                <button className="btn-secondary !py-1.5 !px-3 text-xs" onClick={() => startEdit(story)}>
                  Editar
                </button>
                <button className="btn-danger" onClick={() => remove(story.id)}>
                  Eliminar
                </button>
              </div>
            </div>
            <p className="mt-3 text-sm text-legado-200/70 whitespace-pre-wrap leading-relaxed">
              {story.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
