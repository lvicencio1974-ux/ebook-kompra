import { profileStore, storiesStore, adviceStore, mediaStore, wipeAll } from '../db'
import type { Backup, MediaItem } from '../types'
import { v4 as uuid } from 'uuid'

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl)
  return res.blob()
}

export async function buildBackup(): Promise<Backup> {
  const [profile, stories, advice, media] = await Promise.all([
    profileStore.get(),
    storiesStore.all(),
    adviceStore.all(),
    mediaStore.all(),
  ])

  const mediaWithData = await Promise.all(
    media.map(async (m) => ({
      id: m.id,
      kind: m.kind,
      mimeType: m.mimeType,
      title: m.title,
      createdAt: m.createdAt,
      linkedAdviceId: m.linkedAdviceId,
      dataUrl: await blobToDataUrl(m.blob),
    }))
  )

  return {
    version: 1,
    exportedAt: Date.now(),
    profile: profile ?? null,
    stories,
    advice,
    media: mediaWithData,
  }
}

export function downloadBackup(backup: Backup) {
  const json = JSON.stringify(backup, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const dateStr = new Date(backup.exportedAt).toISOString().slice(0, 10)
  a.href = url
  a.download = `legado-digital-backup-${dateStr}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export async function restoreBackup(backup: Backup, mode: 'merge' | 'replace') {
  if (mode === 'replace') {
    await wipeAll()
  }
  if (backup.profile) {
    await profileStore.save(backup.profile)
  }
  for (const story of backup.stories) {
    await storiesStore.save(story)
  }
  for (const entry of backup.advice) {
    await adviceStore.save(entry)
  }
  for (const m of backup.media) {
    const blob = await dataUrlToBlob(m.dataUrl)
    const item: MediaItem = {
      id: mode === 'merge' ? uuid() : m.id,
      kind: m.kind,
      mimeType: m.mimeType,
      title: m.title,
      createdAt: m.createdAt,
      linkedAdviceId: m.linkedAdviceId,
      blob,
    }
    await mediaStore.save(item)
  }
}

export function parseBackupFile(file: File): Promise<Backup> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string) as Backup
        resolve(data)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = reject
    reader.readAsText(file)
  })
}
