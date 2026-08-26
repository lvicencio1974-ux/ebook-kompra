import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLegacy } from '../context/LegacyContext'
import { chatApi, ApiError } from '../api/client'

export default function Settings() {
  const { user, logout } = useAuth()
  const { activeLegacy, activeMembership, refresh } = useLegacy()
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function togglePause(paused: boolean) {
    if (!activeLegacy) return
    setBusy(true)
    setError(null)
    try {
      await chatApi.setPaused(activeLegacy.id, paused)
      await refresh()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo actualizar.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-serif text-3xl text-legado-100">Ajustes</h2>
      </div>

      <section className="card p-6 space-y-2">
        <h3 className="font-medium text-legado-100">Tu cuenta</h3>
        <p className="text-sm text-legado-200/70">{user?.name}</p>
        <p className="text-sm text-legado-200/50">{user?.email}</p>
        <button className="btn-secondary mt-3" onClick={logout}>
          Cerrar sesión
        </button>
      </section>

      {activeLegacy && activeMembership && activeMembership.role !== 'AUTHOR' && (
        <section className="card p-6 space-y-3">
          <h3 className="font-medium text-legado-100">Modo conversación</h3>
          <p className="text-sm text-legado-200/70">
            Si en algún momento sientes que hablar aquí no te hace bien, puedes pausarlo cuando
            quieras. Esto no borra tu acceso a la biblioteca de recuerdos.
          </p>
          {error && <p className="text-sm text-red-300">{error}</p>}
          {activeMembership.conversationPaused ? (
            <button className="btn-primary" disabled={busy} onClick={() => togglePause(false)}>
              Reactivar modo conversación
            </button>
          ) : (
            <button className="btn-secondary" disabled={busy} onClick={() => togglePause(true)}>
              Pausar modo conversación
            </button>
          )}
        </section>
      )}

      <section className="card p-6 space-y-2 text-sm text-legado-200/60">
        <h3 className="font-medium text-legado-100">Privacidad</h3>
        <p>
          Tus datos, fotos, videos y consejos se guardan cifrados en el servidor de este legado. No
          se comparten con nadie que no tenga una invitación aceptada.
        </p>
      </section>
    </div>
  )
}
