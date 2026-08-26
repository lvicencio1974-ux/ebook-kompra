import { NavLink, Route, Routes } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from './context/AuthContext'
import { useLegacy } from './context/LegacyContext'
import Login from './pages/Login'
import CreateLegacy from './pages/CreateLegacy'
import AcceptInvite from './pages/AcceptInvite'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import Stories from './pages/Stories'
import Advice from './pages/Advice'
import Gallery from './pages/Gallery'
import Library from './pages/Library'
import People from './pages/People'
import DeathVerification from './pages/DeathVerification'
import Chat from './pages/Chat'
import Settings from './pages/Settings'

function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Login />
  return <>{children}</>
}

function LegacyGate({ children }: { children: ReactNode }) {
  const { legacies, loading, activeLegacy } = useLegacy()
  if (loading) return null
  if (legacies.length === 0 || !activeLegacy) return <CreateLegacy />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/aceptar/:token" element={<AcceptInvite />} />
      <Route
        path="*"
        element={
          <AuthGate>
            <LegacyGate>
              <Layout />
            </LegacyGate>
          </AuthGate>
        }
      />
    </Routes>
  )
}

function Layout() {
  const { user, logout } = useAuth()
  const { legacies, activeLegacy, activeMembership, setActiveLegacyId } = useLegacy()
  const role = activeMembership?.role

  const nav = [
    { to: '/', label: 'Inicio', end: true, show: true },
    { to: '/perfil', label: 'Mi perfil', show: role === 'AUTHOR' },
    { to: '/historias', label: 'Historias', show: role === 'AUTHOR' },
    { to: '/consejos', label: 'Consejos', show: role === 'AUTHOR' },
    { to: '/galeria', label: 'Fotos y videos', show: role === 'AUTHOR' },
    { to: '/personas', label: 'Personas invitadas', show: role === 'AUTHOR' },
    { to: '/biblioteca', label: 'Biblioteca', show: role === 'BENEFICIARY' || role === 'EXECUTOR' },
    { to: '/verificacion', label: 'Verificación de fallecimiento', show: true },
    { to: '/hablar', label: 'Hablar conmigo', show: role === 'AUTHOR' || role === 'BENEFICIARY' },
    { to: '/ajustes', label: 'Ajustes', show: true },
  ].filter((item) => item.show)

  return (
    <div className="min-h-full flex flex-col md:flex-row">
      <aside className="md:w-64 md:min-h-screen border-b md:border-b-0 md:border-r border-legado-700/20 bg-night-900/80">
        <div className="p-6">
          <h1 className="font-serif text-xl text-legado-100">Legado Digital</h1>
          <p className="mt-1 text-xs text-legado-200/50">{activeLegacy?.name}</p>
        </div>

        {legacies.length > 1 && (
          <div className="px-6 pb-4">
            <select
              className="input !py-1.5 !text-sm"
              value={activeLegacy?.id}
              onChange={(e) => setActiveLegacyId(e.target.value)}
            >
              {legacies.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible px-3 pb-4 md:pb-6">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-xl px-4 py-2.5 text-sm transition ${
                  isActive
                    ? 'bg-legado-500/20 text-legado-100 font-medium'
                    : 'text-legado-200/60 hover:bg-legado-500/10 hover:text-legado-100'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden md:block px-6 py-4 text-xs text-legado-200/40 border-t border-legado-700/20 space-y-2">
          <p>{user?.name} · {user?.email}</p>
          <button onClick={logout} className="text-legado-300 hover:underline">
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <div className="max-w-4xl mx-auto px-5 py-8 md:px-10 md:py-12">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/perfil" element={<Profile />} />
            <Route path="/historias" element={<Stories />} />
            <Route path="/consejos" element={<Advice />} />
            <Route path="/galeria" element={<Gallery />} />
            <Route path="/personas" element={<People />} />
            <Route path="/biblioteca" element={<Library />} />
            <Route path="/verificacion" element={<DeathVerification />} />
            <Route path="/hablar" element={<Chat />} />
            <Route path="/ajustes" element={<Settings />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}
