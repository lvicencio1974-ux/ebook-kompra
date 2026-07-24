import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { profileStore, storiesStore, adviceStore, mediaStore } from '../db'
import type { Profile } from '../types'
import { GUIDED_PROMPTS } from '../types'

export default function Dashboard() {
  const [profile, setProfile] = useState<Profile | undefined>()
  const [counts, setCounts] = useState({ stories: 0, advice: 0, media: 0 })

  useEffect(() => {
    profileStore.get().then(setProfile)
    Promise.all([storiesStore.all(), adviceStore.all(), mediaStore.all()]).then(
      ([stories, advice, media]) => setCounts({ stories: stories.length, advice: advice.length, media: media.length })
    )
  }, [])

  const doneCount = counts.advice
  const totalPrompts = GUIDED_PROMPTS.length
  const progress = Math.min(100, Math.round((doneCount / totalPrompts) * 100))

  return (
    <div className="space-y-8">
      <section>
        <h2 className="font-serif text-3xl text-legado-100">
          {profile?.name ? `Hola, ${profile.name}` : 'Bienvenido a Legado Digital'}
        </h2>
        <p className="mt-3 text-legado-200/70 leading-relaxed max-w-2xl">
          Esta es una app para dejar algo tuyo: tus historias, tu voz, tu manera de ver la vida y
          tus consejos, grabados en video, audio o texto — para que tus hijos puedan encontrarte
          cuando más lo necesiten, incluso cuando ya no estés. Todo lo que guardes aquí se queda en
          este dispositivo; tú decides cuándo y con quién compartirlo.
        </p>
      </section>

      {!profile?.name && (
        <div className="card p-5">
          <p className="text-sm text-legado-200/80">
            Para empezar, cuéntanos quién eres.
          </p>
          <Link to="/perfil" className="btn-primary mt-3 inline-flex">
            Crear mi perfil
          </Link>
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-3">
        <Link to="/historias" className="card p-5 hover:border-legado-400/50 transition">
          <p className="text-2xl font-serif text-legado-100">{counts.stories}</p>
          <p className="text-sm text-legado-200/60 mt-1">Historias y recuerdos</p>
        </Link>
        <Link to="/consejos" className="card p-5 hover:border-legado-400/50 transition">
          <p className="text-2xl font-serif text-legado-100">{counts.advice}</p>
          <p className="text-sm text-legado-200/60 mt-1">Consejos grabados</p>
        </Link>
        <Link to="/galeria" className="card p-5 hover:border-legado-400/50 transition">
          <p className="text-2xl font-serif text-legado-100">{counts.media}</p>
          <p className="text-sm text-legado-200/60 mt-1">Fotos y videos</p>
        </Link>
      </section>

      <section className="card p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-legado-100">Tu progreso en los consejos guiados</h3>
          <span className="text-sm text-legado-200/60">{doneCount}/{totalPrompts}</span>
        </div>
        <div className="h-2 rounded-full bg-night-900 overflow-hidden">
          <div className="h-full bg-legado-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
        <Link to="/consejos" className="btn-secondary mt-4 inline-flex">
          Seguir grabando consejos
        </Link>
      </section>

      <section className="card p-6">
        <h3 className="font-medium text-legado-100 mb-2">¿Cómo funciona?</h3>
        <ol className="space-y-2 text-sm text-legado-200/70 list-decimal list-inside">
          <li>Completa tu <strong>perfil</strong>: tu forma de ser, tus valores y tus frases favoritas.</li>
          <li>Escribe tus <strong>historias</strong> más importantes.</li>
          <li>Responde a los <strong>consejos guiados</strong> en video, audio o texto — para momentos clave de la vida de tus hijos.</li>
          <li>Sube <strong>fotos y videos</strong> que quieras dejarles.</li>
          <li>Tus hijos podrán entrar a <strong>"Hablar conmigo"</strong> y hacer preguntas para encontrar tus palabras.</li>
          <li>Exporta un <strong>respaldo</strong> desde Ajustes para guardarlo o compartirlo con tu familia.</li>
        </ol>
      </section>
    </div>
  )
}
