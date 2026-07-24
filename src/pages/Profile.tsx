import { useEffect, useState } from 'react'
import { profileStore } from '../db'
import { emptyProfile, type Profile as ProfileType } from '../types'
import TagInput from '../components/TagInput'

export default function Profile() {
  const [profile, setProfile] = useState<ProfileType>(emptyProfile())
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    profileStore.get().then((p) => {
      if (p) setProfile(p)
      setLoading(false)
    })
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    await profileStore.save(profile)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  if (loading) return null

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-serif text-3xl text-legado-100">Mi perfil</h2>
        <p className="mt-2 text-legado-200/70 max-w-2xl">
          Estos datos ayudan a que tus consejos y respuestas suenen como tú: tu forma de ser, lo que
          valoras y las frases que más dices.
        </p>
      </div>

      <form onSubmit={handleSave} className="card p-6 space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Tu nombre</label>
            <input
              className="input"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              placeholder="Ej. Luis Vicencio"
            />
          </div>
          <div>
            <label className="label">¿Cómo te dicen tus hijos?</label>
            <input
              className="input"
              value={profile.relationship}
              onChange={(e) => setProfile({ ...profile, relationship: e.target.value })}
              placeholder="Ej. Papá, Mamá, Abuelo..."
            />
          </div>
          <div>
            <label className="label">Fecha de nacimiento</label>
            <input
              type="date"
              className="input"
              value={profile.birthDate}
              onChange={(e) => setProfile({ ...profile, birthDate: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Tu estilo de humor</label>
            <input
              className="input"
              value={profile.humor}
              onChange={(e) => setProfile({ ...profile, humor: e.target.value })}
              placeholder="Ej. Bromista, irónico, cariñoso..."
            />
          </div>
        </div>

        <div>
          <label className="label">Cuéntanos quién eres</label>
          <textarea
            className="input min-h-[120px]"
            value={profile.bio}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            placeholder="Tu historia, de dónde vienes, qué te hace ser tú..."
          />
        </div>

        <TagInput
          label="Características de tu personalidad"
          placeholder="Ej. paciente, curioso, terco..."
          values={profile.traits}
          onChange={(traits) => setProfile({ ...profile, traits })}
        />

        <TagInput
          label="Tus valores más importantes"
          placeholder="Ej. honestidad, familia, esfuerzo..."
          values={profile.values}
          onChange={(values) => setProfile({ ...profile, values })}
        />

        <TagInput
          label="Frases o dichos que sueles decir"
          placeholder="Ej. Todo pasa por algo..."
          values={profile.phrases}
          onChange={(phrases) => setProfile({ ...profile, phrases })}
        />

        <div className="flex items-center gap-3">
          <button type="submit" className="btn-primary">
            Guardar perfil
          </button>
          {saved && <span className="text-sm text-legado-300">Guardado ✓</span>}
        </div>
      </form>
    </div>
  )
}
