import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { ApiError } from '../api/client'

export default function Login() {
  const { login, signup } = useAuth()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [needsTotp, setNeedsTotp] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (mode === 'signup') {
        await signup(email, password, name)
      } else {
        await login(email, password, needsTotp ? totpCode : undefined)
      }
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401 && err.message.includes('doble factor') && !needsTotp) {
          setNeedsTotp(true)
          setError('Ingresa tu código de doble factor.')
        } else {
          setError(err.message)
        }
      } else {
        setError('No se pudo conectar con el servidor. ¿Está corriendo el backend?')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card w-full max-w-md p-8">
        <h1 className="font-serif text-2xl text-legado-100">Legado Digital</h1>
        <p className="mt-1 text-sm text-legado-200/60">
          {mode === 'login' ? 'Entra a tu cuenta.' : 'Crea tu cuenta para empezar tu legado o aceptar una invitación.'}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="label">Tu nombre</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
          )}
          <div>
            <label className="label">Correo</label>
            <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="label">Contraseña</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>
          {needsTotp && (
            <div>
              <label className="label">Código de doble factor</label>
              <input className="input" value={totpCode} onChange={(e) => setTotpCode(e.target.value)} />
            </div>
          )}

          {error && <p className="text-sm text-red-300">{error}</p>}

          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {mode === 'login' ? 'Entrar' : 'Crear cuenta'}
          </button>
        </form>

        <button
          className="mt-4 text-sm text-legado-300 hover:underline"
          onClick={() => {
            setMode(mode === 'login' ? 'signup' : 'login')
            setError(null)
            setNeedsTotp(false)
          }}
        >
          {mode === 'login' ? '¿No tienes cuenta? Crea una' : '¿Ya tienes cuenta? Entra'}
        </button>
      </div>
    </div>
  )
}
