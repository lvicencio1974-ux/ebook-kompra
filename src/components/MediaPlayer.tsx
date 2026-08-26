import { useEffect, useState } from 'react'
import { contentApi } from '../api/client'
import type { ContentItem } from '../api/types'

interface Props {
  legacyId: string
  item: Pick<ContentItem, 'id' | 'title' | 'mediaKind'>
  className?: string
}

export default function MediaPlayer({ legacyId, item, className }: Props) {
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let objectUrl: string | null = null
    let cancelled = false
    contentApi
      .fetchMedia(legacyId, item.id)
      .then((blob) => {
        if (cancelled) return
        objectUrl = URL.createObjectURL(blob)
        setUrl(objectUrl)
      })
      .catch(() => !cancelled && setError(true))
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [legacyId, item.id])

  if (error) return <p className="text-xs text-red-300">No se pudo cargar el archivo.</p>
  if (!url) return <p className="text-xs text-legado-200/40">Cargando…</p>

  if (item.mediaKind === 'PHOTO') {
    return <img src={url} alt={item.title} className={className ?? 'w-full rounded-xl'} />
  }
  if (item.mediaKind === 'VIDEO') {
    return <video src={url} controls className={className ?? 'w-full rounded-xl'} />
  }
  return <audio src={url} controls className={className ?? 'w-full'} />
}
