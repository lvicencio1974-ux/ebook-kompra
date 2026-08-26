import { useEffect, useState } from 'react'
import { useLegacy } from '../context/LegacyContext'
import { legaciesApi, ApiError } from '../api/client'
import TagInput from '../components/TagInput'

export default function Profile() {
  const { activeLegacy, refresh } = useLegacy()
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [humor, setHumor] = useState('')
  const [traits, setTraits] = useState<string[]>([])
  const [values, setValues] = useState<string[]>([])
  const [phrases, setPhrases] = useState<string[]>([])
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!activeLegacy) return
    setName(activeLegacy.name)
    setBio(activeLegacy.bio ?? '')
    setHumor(activeLegacy.humor ?? '')
    setTraits(activeLegacy.traits)
    setValues(activeLegacy.values)
    setPhrases(activeLegacy.phrases)
  }, [activeLegacy])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!activeLegacy) return
    setBusy(true)
    setError(null)
    try {
      await legaciesApi.update(activeLegacy.id, { name, bio, humor, traits, values, phrases })
      await refresh()
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo guardar el perfil.')
    } finally {
      setBusy(false)
    }
  }

  if (!activeLegacy) return null

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-serif text-3xl text-legado-100">Mi perfil</h2>
        <p className="mt-2 text-legado-200/70 max-w-2xl">
          Estos datos ayudan a que tus consejos y respuestas suenen como tú: tu forma de ser, lo que
          valoras y las frases que más dices.
        </p>
      </div>

      <form onSubmit={handleSave} className="card p-6 space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Nombre del legado</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="label">Tu estilo de humor</label>
            <input
              className="input"
              value={humor}
              onChange={(e) => setHumor(e.target.value)}
              placeholder="Ej. Bromista, irónico, cariñoso..."
            />
          </div>
        </div>

        <div>
          <label className="label">Cuéntanos quién eres</label>
          <textarea
            className="input min-h-[120px]"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tu historia, de dónde vienes, qué te hace ser tú..."
          />
        </div>

        <TagInput label="Características de tu personalidad" placeholder="Ej. paciente, curioso, terco..." values={traits} onChange={setTraits} />
        <TagInput label="Tus valores más importantes" placeholder="Ej. honestidad, familia, esfuerzo..." values={values} onChange={setValues} />
        <TagInput label="Frases o dichos que sueles decir" placeholder="Ej. Todo pasa por algo..." values={phrases} onChange={setPhrases} />

        {error && <p className="text-sm text-red-300">{error}</p>}

        <div className="flex items-center gap-3">
          <button type="submit" className="btn-primary" disabled={busy}>
            Guardar perfil
          </button>
          {saved && <span className="text-sm text-legado-300">Guardado ✓</span>}
        </div>
      </form>
    </div>
  )
}
