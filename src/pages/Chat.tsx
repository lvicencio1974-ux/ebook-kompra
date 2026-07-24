import { useEffect, useRef, useState } from 'react'
import { adviceStore, mediaStore, profileStore, storiesStore } from '../db'
import type { AdviceEntry, MediaItem, Profile, Story } from '../types'
import { GUIDED_PROMPTS } from '../types'
import { fallbackResponse, findBestMatches } from '../utils/matcher'
import MediaPlayer from '../components/MediaPlayer'

interface ChatMessage {
  id: string
  from: 'user' | 'avatar'
  text?: string
  advice?: AdviceEntry
  story?: Story
  media?: MediaItem
}

const CATEGORY_LABELS = Array.from(new Map(GUIDED_PROMPTS.map((p) => [p.category, p.categoryLabel])))

export default function Chat() {
  const [profile, setProfile] = useState<Profile | undefined>()
  const [advice, setAdvice] = useState<AdviceEntry[]>([])
  const [stories, setStories] = useState<Story[]>([])
  const [mediaMap, setMediaMap] = useState<Record<string, MediaItem>>({})
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    Promise.all([profileStore.get(), adviceStore.all(), storiesStore.all(), mediaStore.all()]).then(
      ([p, a, s, m]) => {
        setProfile(p)
        setAdvice(a)
        setStories(s)
        const map: Record<string, MediaItem> = {}
        for (const item of m) map[item.id] = item
        setMediaMap(map)
        setMessages([
          {
            id: 'welcome',
            from: 'avatar',
            text: p?.name
              ? `Hola, soy ${p.name}. Aquí guardé cosas que quería decirte. Pregúntame lo que necesites, o elige una categoría abajo.`
              : 'Aún no se ha creado un perfil. Ve a "Mi perfil" para empezar a construir este espacio.',
          },
        ])
      }
    )
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function respondTo(query: string) {
    const userMsg: ChatMessage = { id: crypto.randomUUID(), from: 'user', text: query }
    const matches = findBestMatches(query, advice, stories, 1)

    let avatarMsg: ChatMessage
    if (matches.length > 0 && matches[0].advice) {
      const a = matches[0].advice
      avatarMsg = {
        id: crypto.randomUUID(),
        from: 'avatar',
        text: a.textResponse || undefined,
        advice: a,
        media: a.mediaId ? mediaMap[a.mediaId] : undefined,
      }
    } else if (matches.length > 0 && matches[0].story) {
      const s = matches[0].story
      avatarMsg = { id: crypto.randomUUID(), from: 'avatar', text: s.content, story: s }
    } else {
      avatarMsg = { id: crypto.randomUUID(), from: 'avatar', text: fallbackResponse(profile) }
    }

    setMessages((prev) => [...prev, userMsg, avatarMsg])
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed) return
    respondTo(trimmed)
    setInput('')
  }

  function askCategory(category: string, label: string) {
    respondTo(`${label} ${category}`)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] max-h-[900px]">
      <div>
        <h2 className="font-serif text-3xl text-legado-100">
          Hablar con {profile?.name || 'tu ser querido'}
        </h2>
        <p className="mt-2 text-legado-200/70 max-w-2xl">
          Escribe una pregunta o elige un tema. Se buscará entre los consejos e historias guardadas
          la respuesta más cercana.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 my-4">
        {CATEGORY_LABELS.map(([category, label]) => (
          <button key={category} className="chip hover:bg-legado-500/25" onClick={() => askCategory(category, label)}>
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 card p-5">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                msg.from === 'user'
                  ? 'bg-legado-500/25 text-legado-50'
                  : 'bg-night-900/70 border border-legado-700/30 text-legado-100'
              }`}
            >
              {msg.advice && (
                <p className="text-xs text-legado-300 mb-1">Consejo: {msg.advice.prompt}</p>
              )}
              {msg.story && <p className="text-xs text-legado-300 mb-1">Historia: {msg.story.title}</p>}
              {msg.text && <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>}
              {msg.media && (
                <div className="mt-2">
                  <MediaPlayer item={msg.media} className="max-w-xs rounded-lg" />
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="mt-4 flex gap-2">
        <input
          className="input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu pregunta..."
        />
        <button type="submit" className="btn-primary shrink-0">
          Enviar
        </button>
      </form>
    </div>
  )
}
