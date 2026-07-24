import { useEffect, useState } from 'react'
import type { MediaItem } from '../types'

export default function MediaPlayer({ item, className }: { item: MediaItem; className?: string }) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    const objectUrl = URL.createObjectURL(item.blob)
    setUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [item.blob])

  if (!url) return null

  if (item.kind === 'photo') {
    return <img src={url} alt={item.title} className={className ?? 'w-full rounded-xl'} />
  }
  if (item.kind === 'video') {
    return <video src={url} controls className={className ?? 'w-full rounded-xl'} />
  }
  return <audio src={url} controls className={className ?? 'w-full'} />
}
