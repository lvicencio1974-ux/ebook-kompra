import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Profile, Story, AdviceEntry, MediaItem } from './types'

interface LegadoDB extends DBSchema {
  profile: { key: string; value: Profile }
  stories: { key: string; value: Story }
  advice: { key: string; value: AdviceEntry }
  media: { key: string; value: MediaItem }
}

let dbPromise: Promise<IDBPDatabase<LegadoDB>> | null = null

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<LegadoDB>('legado-digital', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('profile')) db.createObjectStore('profile', { keyPath: 'id' })
        if (!db.objectStoreNames.contains('stories')) db.createObjectStore('stories', { keyPath: 'id' })
        if (!db.objectStoreNames.contains('advice')) db.createObjectStore('advice', { keyPath: 'id' })
        if (!db.objectStoreNames.contains('media')) db.createObjectStore('media', { keyPath: 'id' })
      },
    })
  }
  return dbPromise
}

export const profileStore = {
  async get(): Promise<Profile | undefined> {
    const db = await getDb()
    return db.get('profile', 'main')
  },
  async save(profile: Profile) {
    const db = await getDb()
    await db.put('profile', { ...profile, updatedAt: Date.now() })
  },
}

export const storiesStore = {
  async all(): Promise<Story[]> {
    const db = await getDb()
    const items = await db.getAll('stories')
    return items.sort((a, b) => b.createdAt - a.createdAt)
  },
  async save(story: Story) {
    const db = await getDb()
    await db.put('stories', story)
  },
  async remove(id: string) {
    const db = await getDb()
    await db.delete('stories', id)
  },
}

export const adviceStore = {
  async all(): Promise<AdviceEntry[]> {
    const db = await getDb()
    const items = await db.getAll('advice')
    return items.sort((a, b) => b.createdAt - a.createdAt)
  },
  async save(entry: AdviceEntry) {
    const db = await getDb()
    await db.put('advice', entry)
  },
  async remove(id: string) {
    const db = await getDb()
    await db.delete('advice', id)
  },
}

export const mediaStore = {
  async all(): Promise<MediaItem[]> {
    const db = await getDb()
    const items = await db.getAll('media')
    return items.sort((a, b) => b.createdAt - a.createdAt)
  },
  async get(id: string): Promise<MediaItem | undefined> {
    const db = await getDb()
    return db.get('media', id)
  },
  async save(item: MediaItem) {
    const db = await getDb()
    await db.put('media', item)
  },
  async remove(id: string) {
    const db = await getDb()
    await db.delete('media', id)
  },
}

export async function wipeAll() {
  const db = await getDb()
  await Promise.all([
    db.clear('profile'),
    db.clear('stories'),
    db.clear('advice'),
    db.clear('media'),
  ])
}
