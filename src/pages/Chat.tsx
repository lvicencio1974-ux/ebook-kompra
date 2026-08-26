import { useEffect, useRef, useState } from 'react'
import { useLegacy } from '../context/LegacyContext'
import { chatApi, ApiError } from '../api/client'
import type { ChatMessageResponse } from '../api/types'
import { GUIDED_PROMPTS } from '../constants/guidedPrompts'

interface ChatMessage {
  id: string
  from: 'user' | 'avatar'
  text: string
  response?: ChatMessageResponse
}

const CATEGORY_LABELS = Array.from(new Map(GUIDED_PROMPTS.map((p) => [p.category, p.categoryLabel])))

export default function Chat() {
  const { activeLegacy, activeMembership } = useLegacy()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [blocked, setBlocked] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [disclaimer, setDisclaimer] = useState<string | null>(null)
  const [griefResources, setGriefResources] = useState<ChatMessageResponse['griefResources']>([])
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!activeLegacy) return
    chatApi
      .history(activeLegacy.id)
      .then((logs) => {
        setMessages(
          logs.flatMap((log) => [
            { id: `${log.id}-q`, from: 'user' as const, text: log.question },
            { id: `${log.id}-a`, from: 'avatar' as const, text: log.answer },
          ])
        )
      })
      .catch(() => {})
  }, [activeLegacy])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function ask(question: string) {
    if (!activeLegacy || !question.trim()) return
    setBusy(true)
    setBlocked(null)
    const userMsg: ChatMessage = { id: crypto.randomUUID(), from: 'user', text: question }
    setMessages((prev) => [...prev, userMsg])
    try {
      const response = await chatApi.ask(activeLegacy.id, question)
      setDisclaimer(response.disclaimer)
      setGriefResources(response.griefResources)
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), from: 'avatar', text: response.answer, response }])
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setBlocked(err.message)
        setMessages((prev) => prev.slice(0, -1))
      } else {
        setMessages((prev) => [...prev, { id: crypto.randomUUID(), from: 'avatar', text: 'Ocurrió un error al responder. Intenta de nuevo.' }])
      }
    } finally {
      setBusy(false)
    }
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed) return
    ask(trimmed)
    setInput('')
  }

  if (!activeLegacy) return null

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] max-h-[900px]">
      <div>
        <h2 className="font-serif text-3xl text-legado-100">Hablar con {activeLegacy.name}</h2>
        {disclaimer && <p className="mt-2 text-xs text-legado-300 italic">{disclaimer}</p>}
      </div>

      {blocked && (
        <div className="card p-4 my-4 border-legado-400/40">
          <p className="text-sm text-legado-100">{blocked}</p>
          {activeMembership?.role !== 'AUTHOR' && (
            <button className="btn-secondary mt-3 !py-1" onClick={() => chatApi.setPaused(activeLegacy.id, false).then(() => setBlocked(null))}>
              Reactivar el modo conversación
            </button>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2 my-4">
        {CATEGORY_LABELS.map(([category, label]) => (
          <button key={category} className="chip hover:bg-legado-500/25" onClick={() => ask(label)}>
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 card p-5">
        {messages.length === 0 && (
          <p className="text-sm text-legado-200/50">
            Escribe una pregunta o elige un tema para empezar.
          </p>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                msg.from === 'user' ? 'bg-legado-500/25 text-legado-50' : 'bg-night-900/70 border border-legado-700/30 text-legado-100'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
              {msg.response && msg.response.sources.length > 0 && (
                <p className="mt-2 text-xs text-legado-300">
                  Basado en: {msg.response.sources.map((s) => s.title).join(', ')}
                </p>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="mt-4 flex gap-2">
        <input className="input" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Escribe tu pregunta..." disabled={busy} />
        <button type="submit" className="btn-primary shrink-0" disabled={busy}>
          Enviar
        </button>
      </form>

      {griefResources.length > 0 && (
        <details className="mt-4 text-xs text-legado-200/50">
          <summary className="cursor-pointer hover:text-legado-200/80">Recursos de acompañamiento</summary>
          <ul className="mt-2 space-y-2">
            {griefResources.map((r) => (
              <li key={r.label}>
                <p className="text-legado-200/70">{r.label}</p>
                <p>{r.detail}</p>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}
