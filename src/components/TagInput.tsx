import { useState } from 'react'

interface Props {
  label: string
  placeholder?: string
  values: string[]
  onChange: (values: string[]) => void
}

export default function TagInput({ label, placeholder, values, onChange }: Props) {
  const [draft, setDraft] = useState('')

  function addTag() {
    const trimmed = draft.trim()
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed])
    }
    setDraft('')
  }

  function removeTag(tag: string) {
    onChange(values.filter((v) => v !== tag))
  }

  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex flex-wrap gap-2 mb-2">
        {values.map((tag) => (
          <span key={tag} className="chip">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-1 text-legado-200/50 hover:text-red-300"
              aria-label={`Quitar ${tag}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="input"
          placeholder={placeholder}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addTag()
            }
          }}
        />
        <button type="button" className="btn-secondary" onClick={addTag}>
          Añadir
        </button>
      </div>
    </div>
  )
}
