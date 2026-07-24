import { NavLink, Route, Routes } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import Stories from './pages/Stories'
import Advice from './pages/Advice'
import Gallery from './pages/Gallery'
import Chat from './pages/Chat'
import Settings from './pages/Settings'
import { profileStore } from './db'

const NAV = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/perfil', label: 'Mi perfil' },
  { to: '/historias', label: 'Historias' },
  { to: '/consejos', label: 'Consejos' },
  { to: '/galeria', label: 'Fotos y videos' },
  { to: '/hablar', label: 'Hablar conmigo' },
  { to: '/ajustes', label: 'Ajustes' },
]

export default function App() {
  const [name, setName] = useState<string>('')

  useEffect(() => {
    profileStore.get().then((p) => setName(p?.name || ''))
  }, [])

  return (
    <div className="min-h-full flex flex-col md:flex-row">
      <aside className="md:w-64 md:min-h-screen border-b md:border-b-0 md:border-r border-legado-700/20 bg-night-900/80">
        <div className="p-6">
          <h1 className="font-serif text-xl text-legado-100">Legado Digital</h1>
          <p className="mt-1 text-xs text-legado-200/50">
            {name ? `El legado de ${name}` : 'Tu voz, viva para siempre'}
          </p>
        </div>
        <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible px-3 pb-4 md:pb-6">
          {NAV.map((item) => (
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
        <div className="hidden md:block px-6 py-4 text-xs text-legado-200/40 border-t border-legado-700/20">
          Todo se guarda solo en este navegador. Nadie más puede verlo salvo que lo exportes y lo compartas.
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
            <Route path="/hablar" element={<Chat />} />
            <Route path="/ajustes" element={<Settings />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}
