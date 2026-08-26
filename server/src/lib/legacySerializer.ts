import type { Legacy } from '@prisma/client'

function parseArray(json: string | null): string[] {
  if (!json) return []
  try {
    const parsed = JSON.parse(json)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export interface SerializedLegacy extends Omit<Legacy, 'traits' | 'values' | 'phrases'> {
  traits: string[]
  values: string[]
  phrases: string[]
}

/** The DB stores traits/values/phrases as JSON strings (SQLite has no array column); expand them for API responses. */
export function serializeLegacy<T extends Legacy>(legacy: T): Omit<T, 'traits' | 'values' | 'phrases'> & SerializedLegacy {
  return {
    ...legacy,
    traits: parseArray(legacy.traits),
    values: parseArray(legacy.values),
    phrases: parseArray(legacy.phrases),
  }
}
