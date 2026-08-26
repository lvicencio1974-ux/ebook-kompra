import { useCallback, useEffect, useState } from 'react'
import { contentApi, type CreateContentInput } from '../api/client'
import type { ContentItem } from '../api/types'

export function useContent(legacyId: string | undefined) {
  const [items, setItems] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!legacyId) return
    setLoading(true)
    try {
      setItems(await contentApi.list(legacyId))
    } finally {
      setLoading(false)
    }
  }, [legacyId])

  useEffect(() => {
    refresh()
  }, [refresh])

  const create = useCallback(
    async (input: CreateContentInput, file?: { blob: Blob; filename: string }) => {
      if (!legacyId) return
      await contentApi.create(legacyId, input, file)
      await refresh()
    },
    [legacyId, refresh]
  )

  const update = useCallback(
    async (contentId: string, input: Partial<CreateContentInput>) => {
      if (!legacyId) return
      await contentApi.update(legacyId, contentId, input)
      await refresh()
    },
    [legacyId, refresh]
  )

  const remove = useCallback(
    async (contentId: string) => {
      if (!legacyId) return
      await contentApi.remove(legacyId, contentId)
      await refresh()
    },
    [legacyId, refresh]
  )

  return { items, loading, refresh, create, update, remove }
}
