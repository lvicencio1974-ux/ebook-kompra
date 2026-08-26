import { useCallback, useEffect, useState } from 'react'
import { useLegacy } from '../context/LegacyContext'
import { deathVerificationApi, ApiError } from '../api/client'
import type { DeathVerificationRequest } from '../api/types'

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmada',
  REJECTED: 'Rechazada',
  CANCELLED: 'Cancelada',
}

export default function DeathVerification() {
  const { activeLegacy, activeMembership, refresh } = useLegacy()
  const [requests, setRequests] = useState<DeathVerificationRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [certificate, setCertificate] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    if (!activeLegacy) return
    setLoading(true)
    try {
      setRequests(await deathVerificationApi.list(activeLegacy.id))
    } finally {
      setLoading(false)
    }
  }, [activeLegacy])

  useEffect(() => {
    load()
  }, [load])

  if (!activeLegacy || !activeMembership) return null

  const role = activeMembership.role
  const membershipName = (id: string) => {
    const m = activeLegacy.memberships.find((mm) => mm.id === id)
    return m?.user?.name || m?.inviteEmail || 'alguien'
  }

  async function start(e: React.FormEvent) {
    e.preventDefault()
    if (!certificate || !activeLegacy) return
    setBusy(true)
    setError(null)
    try {
      await deathVerificationApi.start(activeLegacy.id, { blob: certificate, filename: certificate.name })
      setCertificate(null)
      await load()
      await refresh()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo iniciar la verificación.')
    } finally {
      setBusy(false)
    }
  }

  async function confirm(requestId: string) {
    if (!activeLegacy) return
    setError(null)
    try {
      await deathVerificationApi.confirm(activeLegacy.id, requestId)
      await load()
      await refresh()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo confirmar.')
    }
  }

  async function cancel(requestId: string) {
    if (!activeLegacy) return
    if (!confirm2('¿Cancelar esta verificación? Esto la marca como un error o intento fraudulento.')) return
    setError(null)
    try {
      await deathVerificationApi.cancel(activeLegacy.id, requestId, 'Cancelado desde la app.')
      await load()
      await refresh()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo cancelar.')
    }
  }

  async function reject(requestId: string) {
    if (!activeLegacy) return
    setError(null)
    try {
      await deathVerificationApi.reject(activeLegacy.id, requestId)
      await load()
      await refresh()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo rechazar.')
    }
  }

  const canStart = role === 'EXECUTOR' && activeLegacy.status === 'ACTIVE'

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-serif text-3xl text-legado-100">Verificación de fallecimiento</h2>
        <p className="mt-2 text-legado-200/70 max-w-2xl">
          Este proceso desbloquea el modo conversación para los beneficiarios. Requiere un
          documento verificable, una segunda confirmación de otra persona de confianza, y luego un
          período de gracia durante el cual el autor puede cancelar si sigue vivo.
        </p>
        <p className="mt-3 text-sm">
          Estado actual del legado: <span className="chip">{activeLegacy.status}</span>
        </p>
      </div>

      {canStart && (
        <form onSubmit={start} className="card p-6 space-y-4">
          <h3 className="font-medium text-legado-100">Iniciar verificación</h3>
          <div>
            <label className="label">Documento (ej. acta de defunción)</label>
            <input
              type="file"
              className="input"
              onChange={(e) => setCertificate(e.target.files?.[0] ?? null)}
              required
            />
          </div>
          {error && <p className="text-sm text-red-300">{error}</p>}
          <button type="submit" className="btn-primary" disabled={busy || !certificate}>
            Iniciar proceso
          </button>
        </form>
      )}

      {loading && <p className="text-sm text-legado-200/50">Cargando…</p>}

      <div className="space-y-4">
        {requests.map((req) => (
          <div key={req.id} className="card p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="chip">{STATUS_LABELS[req.status]}</span>
              <span className="text-xs text-legado-200/40">{new Date(req.createdAt).toLocaleString()}</span>
            </div>
            <p className="text-sm text-legado-200/70">Iniciado por {membershipName(req.initiatedByMembershipId)}</p>
            {req.secondConfirmerMembershipId && (
              <p className="text-sm text-legado-200/70">Confirmado por {membershipName(req.secondConfirmerMembershipId)}</p>
            )}
            {req.status === 'PENDING' && req.unlockAt && (
              <p className="text-sm text-legado-300">
                Se desbloquea automáticamente el {new Date(req.unlockAt).toLocaleString()} si nadie cancela.
              </p>
            )}

            {error && <p className="text-sm text-red-300">{error}</p>}

            <div className="flex flex-wrap gap-2 pt-2">
              {req.status === 'PENDING' && !req.secondConfirmerMembershipId && req.initiatedByMembershipId !== activeMembership.id && (
                <button className="btn-primary" onClick={() => confirm(req.id)}>
                  Confirmar como segunda persona de confianza
                </button>
              )}
              {req.status === 'PENDING' && role === 'AUTHOR' && (
                <button className="btn-danger" onClick={() => cancel(req.id)}>
                  Cancelar (sigo vivo / esto fue un error)
                </button>
              )}
              {req.status === 'PENDING' && role === 'EXECUTOR' && !req.secondConfirmerMembershipId && (
                <button className="btn-secondary" onClick={() => reject(req.id)}>
                  Rechazar
                </button>
              )}
            </div>
          </div>
        ))}
        {!loading && requests.length === 0 && <p className="text-sm text-legado-200/50">No hay procesos de verificación registrados.</p>}
      </div>
    </div>
  )
}

function confirm2(message: string): boolean {
  return window.confirm(message)
}
