import { Link } from 'react-router-dom'
import { useLegacy } from '../context/LegacyContext'
import { useContent } from '../hooks/useContent'
import { GUIDED_PROMPTS } from '../constants/guidedPrompts'

export default function Dashboard() {
  const { activeLegacy, activeMembership } = useLegacy()
  const { items } = useContent(activeLegacy?.id)
  const role = activeMembership?.role

  if (!activeLegacy) return null

  if (role === 'AUTHOR') {
    const stories = items.filter((i) => i.type === 'STORY').length
    const advice = items.filter((i) => i.type === 'ADVICE').length
    const media = items.filter((i) => i.type === 'MEDIA').length
    const totalPrompts = GUIDED_PROMPTS.length
    const progress = Math.min(100, Math.round((advice / totalPrompts) * 100))

    return (
      <div className="space-y-8">
        <section>
          <h2 className="font-serif text-3xl text-legado-100">Hola, {activeLegacy.name}</h2>
          <p className="mt-3 text-legado-200/70 leading-relaxed max-w-2xl">
            Esta es una app para dejar algo tuyo: tus historias, tu voz, tu manera de ver la vida
            y tus consejos, grabados en video, audio o texto — para que tus hijos puedan
            encontrarte cuando más lo necesiten, incluso cuando ya no estés.
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          <Link to="/historias" className="card p-5 hover:border-legado-400/50 transition">
            <p className="text-2xl font-serif text-legado-100">{stories}</p>
            <p className="text-sm text-legado-200/60 mt-1">Historias y recuerdos</p>
          </Link>
          <Link to="/consejos" className="card p-5 hover:border-legado-400/50 transition">
            <p className="text-2xl font-serif text-legado-100">{advice}</p>
            <p className="text-sm text-legado-200/60 mt-1">Consejos grabados</p>
          </Link>
          <Link to="/galeria" className="card p-5 hover:border-legado-400/50 transition">
            <p className="text-2xl font-serif text-legado-100">{media}</p>
            <p className="text-sm text-legado-200/60 mt-1">Fotos y videos</p>
          </Link>
        </section>

        <section className="card p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-legado-100">Tu progreso en los consejos guiados</h3>
            <span className="text-sm text-legado-200/60">{advice}/{totalPrompts}</span>
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
            <li>Responde a los <strong>consejos guiados</strong> en video, audio o texto.</li>
            <li>Sube <strong>fotos y videos</strong> que quieras dejarles.</li>
            <li>Invita a tus <strong>beneficiarios y albacea</strong> en "Personas invitadas".</li>
            <li>Cuando corresponda, tu albacea inicia la <strong>verificación de fallecimiento</strong> para desbloquear el modo conversación.</li>
          </ol>
        </section>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="font-serif text-3xl text-legado-100">Bienvenido/a</h2>
        <p className="mt-3 text-legado-200/70 leading-relaxed max-w-2xl">
          Tienes acceso al legado de <strong>{activeLegacy.name}</strong>{' '}
          {activeLegacy.status === 'DEATH_CONFIRMED'
            ? 'Puedes explorar la biblioteca de recuerdos y hablar con su avatar cuando quieras.'
            : 'Por ahora puedes ver el contenido que ya está disponible. El modo conversación se desbloqueará cuando el fallecimiento sea confirmado.'}
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Link to="/biblioteca" className="card p-5 hover:border-legado-400/50 transition">
          <p className="font-medium text-legado-100">Biblioteca de recuerdos</p>
          <p className="text-sm text-legado-200/60 mt-1">Historias, consejos, fotos y videos disponibles para ti.</p>
        </Link>
        {(role === 'BENEFICIARY') && (
          <Link to="/hablar" className="card p-5 hover:border-legado-400/50 transition">
            <p className="font-medium text-legado-100">Hablar conmigo</p>
            <p className="text-sm text-legado-200/60 mt-1">Conversa con el avatar cuando esté disponible.</p>
          </Link>
        )}
        <Link to="/verificacion" className="card p-5 hover:border-legado-400/50 transition">
          <p className="font-medium text-legado-100">Verificación de fallecimiento</p>
          <p className="text-sm text-legado-200/60 mt-1">Estado del proceso que desbloquea el modo conversación.</p>
        </Link>
      </section>
    </div>
  )
}
