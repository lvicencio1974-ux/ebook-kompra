import { useState } from 'react'
import { useLegacy } from '../context/LegacyContext'
import { legaciesApi, ApiError } from '../api/client'
import type { MembershipRole } from '../api/types'

const ROLE_LABELS: Record<MembershipRole, string> = {
  AUTHOR: 'Autor',
  BENEFICIARY: 'Beneficiario',
  EXECUTOR: 'Albacea digital',
}

export default function People() {
  const { activeLegacy, refresh } = useLegacy()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<MembershipRole>('BENEFICIARY')
  const [relationship, setRelationship] = useState('')
  const [minAccessAge, setMinAccessAge] = useState('')
  const [lastInviteLink, setLastInviteLink] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (!activeLegacy) return null

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!activeLegacy) return
    setBusy(true)
    setError(null)
    try {
      const { inviteToken } = await legaciesApi.invite(activeLegacy.id, {
        email,
        role,
        relationship: relationship || undefined,
        minAccessAge: minAccessAge ? Number(minAccessAge) : undefined,
      })
      const link = `${window.location.origin}${window.location.pathname}#/aceptar/${inviteToken}`
      setLastInviteLink(link)
      setEmail('')
      setRelationship('')
      setMinAccessAge('')
      await refresh()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo crear la invitación.')
    } finally {
      setBusy(false)
    }
  }

  const others = activeLegacy.memberships.filter((m) => m.role !== 'AUTHOR')

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-serif text-3xl text-legado-100">Personas invitadas</h2>
        <p className="mt-2 text-legado-200/70 max-w-2xl">
          Invita a tus beneficiarios (quienes recibirán acceso) y a tu albacea digital (quien
          confirmará tu fallecimiento junto a otra persona de confianza para desbloquear el modo
          conversación).
        </p>
      </div>

      <form onSubmit={handleInvite} className="card p-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Correo</label>
            <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="label">Rol</label>
            <select className="input" value={role} onChange={(e) => setRole(e.target.value as MembershipRole)}>
              <option value="BENEFICIARY">Beneficiario</option>
              <option value="EXECUTOR">Albacea digital</option>
            </select>
          </div>
          <div>
            <label className="label">Relación (opcional)</label>
            <input className="input" value={relationship} onChange={(e) => setRelationship(e.target.value)} placeholder="Ej. hija, hermano..." />
          </div>
          {role === 'BENEFICIARY' && (
            <div>
              <label className="label">Edad mínima de acceso (opcional)</label>
              <input type="number" min={0} max={120} className="input" value={minAccessAge} onChange={(e) => setMinAccessAge(e.target.value)} />
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-300">{error}</p>}

        <button type="submit" className="btn-primary" disabled={busy}>
          Invitar
        </button>
      </form>

      {lastInviteLink && (
        <div className="card p-5">
          <p className="text-sm text-legado-200/80 mb-2">
            No hay envío de correo automático todavía — comparte este enlace tú mismo con esa persona:
          </p>
          <div className="flex gap-2">
            <input readOnly className="input font-mono text-xs" value={lastInviteLink} onFocus={(e) => e.target.select()} />
            <button
              className="btn-secondary shrink-0"
              onClick={() => navigator.clipboard.writeText(lastInviteLink)}
            >
              Copiar
            </button>
          </div>
        </div>
      )}

      <section className="space-y-3">
        <h3 className="font-medium text-legado-100">Personas con acceso o invitación pendiente</h3>
        {others.length === 0 && <p className="text-sm text-legado-200/50">Todavía no has invitado a nadie.</p>}
        <div className="space-y-2">
          {others.map((m) => (
            <div key={m.id} className="card p-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-legado-100">{m.user?.name || m.inviteEmail}</p>
                <p className="text-xs text-legado-200/50">
                  {ROLE_LABELS[m.role]} {m.relationship ? `· ${m.relationship}` : ''} {m.minAccessAge ? `· acceso desde los ${m.minAccessAge} años` : ''}
                </p>
              </div>
              <span className={`chip ${m.acceptedAt ? '' : 'opacity-60'}`}>{m.acceptedAt ? 'Activo' : 'Invitación pendiente'}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
