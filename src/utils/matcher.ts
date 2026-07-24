import type { AdviceEntry, Profile, Story } from '../types'

const STOPWORDS = new Set([
  'de', 'la', 'que', 'el', 'en', 'y', 'a', 'los', 'del', 'se', 'las', 'por',
  'un', 'para', 'con', 'no', 'una', 'su', 'al', 'lo', 'como', 'mas', 'mas',
  'pero', 'sus', 'le', 'ya', 'o', 'este', 'si', 'si', 'porque', 'esta',
  'entre', 'cuando', 'muy', 'sin', 'sobre', 'tambien', 'me', 'hasta', 'donde',
  'quien', 'desde', 'todo', 'nos', 'durante', 'todos', 'uno', 'les', 'ni',
  'contra', 'otros', 'ese', 'eso', 'ante', 'ellos', 'e', 'esto', 'mi', 'tu',
  'te', 'yo', 'es', 'soy', 'eres', 'que', 'como', 'cual',
])

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w))
}

function score(queryTokens: string[], target: string): number {
  const targetTokens = new Set(tokenize(target))
  let s = 0
  for (const t of queryTokens) {
    if (targetTokens.has(t)) s += 1
  }
  return s
}

export interface MatchResult {
  advice?: AdviceEntry
  story?: Story
  score: number
}

export function findBestMatches(query: string, advice: AdviceEntry[], stories: Story[], limit = 3): MatchResult[] {
  const queryTokens = tokenize(query)
  if (queryTokens.length === 0) return []

  const results: MatchResult[] = []

  for (const a of advice) {
    const s = score(queryTokens, `${a.category} ${a.prompt} ${a.textResponse}`)
    if (s > 0) results.push({ advice: a, score: s })
  }
  for (const st of stories) {
    const s = score(queryTokens, `${st.category} ${st.title} ${st.content}`)
    if (s > 0) results.push({ story: st, score: s })
  }

  results.sort((a, b) => b.score - a.score)
  return results.slice(0, limit)
}

export function fallbackResponse(profile: Profile | undefined): string {
  const phrase = profile?.phrases?.length
    ? profile.phrases[Math.floor(Math.random() * profile.phrases.length)]
    : null
  const value = profile?.values?.length
    ? profile.values[Math.floor(Math.random() * profile.values.length)]
    : null

  const lines = [
    'No guarde una respuesta preparada para eso exactamente, pero quiero que sepas algo que siempre fue verdad para mi:',
  ]
  if (phrase) {
    lines.push(`"${phrase}"`)
  } else if (value) {
    lines.push(`Para mi, algo tan importante como esto siempre paso por lo mismo: ${value}.`)
  } else {
    lines.push('Piensa con calma, escucha tu corazon, y recuerda que te quise con todo lo que tenia.')
  }
  lines.push('Prueba a explorar las categorias de consejos o mis historias, quiza encuentres algo mas cercano a lo que buscas.')
  return lines.join('\n\n')
}
