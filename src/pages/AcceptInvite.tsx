import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLegacy } from '../context/LegacyContext'
import { invitesApi } from '../api/client'
import { ApiError } from '../api/client'
import Login from './Login'

export default function AcceptInvite() {
  const { token } = useParams<{ token: string }>()
  const { user } = useAuth()
  const { refresh, setActiveLegacyId } = useLegacy()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'idle' | 'accepting' | 'done' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user || !token || status !== 'idle') return
    setStatus('accepting')
    invitesApi
      .accept(token)
      .then(async (membership) => {
        await refresh()
        setActiveLegacyId(membership.legacyId)
        setStatus('done')
        navigate('/', { replace: true })
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : 'No se pudo aceptar la invitación.')
        setStatus('error')
      })
  }, [user, token, status, refresh, setActiveLegacyId, navigate])

  if (!user) {
    return (
      <div>
        <div className="max-w-md mx-auto pt-10 px-4 text-center text-sm text-legado-200/70">
          Inicia sesión o crea una cuenta para aceptar tu invitación.
        </div>
        <Login />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card w-full max-w-md p-8 text-center">
        {status === 'accepting' && <p className="text-legado-200/70">Aceptando invitación…</p>}
        {status === 'error' && <p className="text-red-300">{error}</p>}
      </div>
    </div>
  )
}
