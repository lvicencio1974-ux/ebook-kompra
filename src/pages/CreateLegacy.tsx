import { useState } from 'react'
import { useLegacy } from '../context/LegacyContext'
import { ApiError } from '../api/client'

export default function CreateLegacy() {
  const { createLegacy } = useLegacy()
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await createLegacy(name.trim())
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo crear el legado.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card w-full max-w-md p-8">
        <h1 className="font-serif text-2xl text-legado-100">Crea tu legado</h1>
        <p className="mt-2 text-sm text-legado-200/60">
          Este es el espacio donde irás dejando tu historia, tus consejos y tus recuerdos para las
          personas que quieres. Puedes ponerle tu nombre, o algo más personal.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="label">Nombre del legado</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. El legado de Luis Vicencio"
              required
            />
          </div>
          {error && <p className="text-sm text-red-300">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={busy}>
            Crear
          </button>
        </form>
      </div>
    </div>
  )
}
