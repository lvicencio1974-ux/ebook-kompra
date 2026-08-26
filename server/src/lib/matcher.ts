import type { ContentItem } from '@prisma/client'

const STOPWORDS = new Set([
  'de', 'la', 'que', 'el', 'en', 'y', 'a', 'los', 'del', 'se', 'las', 'por',
  'un', 'para', 'con', 'no', 'una', 'su', 'al', 'lo', 'como', 'mas', 'pero',
  'sus', 'le', 'ya', 'o', 'este', 'si', 'porque', 'esta', 'entre', 'cuando',
  'muy', 'sin', 'sobre', 'tambien', 'me', 'hasta', 'donde', 'quien', 'desde',
  'todo', 'nos', 'durante', 'todos', 'uno', 'les', 'ni', 'contra', 'otros',
  'ese', 'eso', 'ante', 'ellos', 'e', 'esto', 'mi', 'tu', 'te', 'yo', 'es',
  'soy', 'eres', 'que', 'como', 'cual',
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
  for (const t of queryTokens) if (targetTokens.has(t)) s += 1
  return s
}

export function findRelevantContent(query: string, items: ContentItem[], limit = 5): ContentItem[] {
  const queryTokens = tokenize(query)
  if (queryTokens.length === 0) return []

  return items
    .map((item) => ({
      item,
      score: score(queryTokens, `${item.category ?? ''} ${item.title} ${item.textContent ?? ''} ${item.transcript ?? ''}`),
    }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.item)
}
