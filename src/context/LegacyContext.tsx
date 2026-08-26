import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { legaciesApi } from '../api/client'
import type { Legacy, Membership } from '../api/types'
import { useAuth } from './AuthContext'

const ACTIVE_LEGACY_KEY = 'legado-digital-active-legacy'

interface LegacyContextValue {
  legacies: Legacy[]
  loading: boolean
  activeLegacy: Legacy | null
  activeMembership: Membership | null
  setActiveLegacyId: (id: string) => void
  refresh: () => Promise<void>
  createLegacy: (name: string) => Promise<Legacy>
}

const LegacyContext = createContext<LegacyContextValue | null>(null)

export function LegacyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [legacies, setLegacies] = useState<Legacy[]>([])
  const [loading, setLoading] = useState(true)
  const [activeLegacyId, setActiveLegacyIdState] = useState<string | null>(() => localStorage.getItem(ACTIVE_LEGACY_KEY))
  // Only the very first fetch should gate rendering (LegacyGate unmounts <Layout/> while
  // loading). Later refresh() calls — after creating an invite, content, etc. — must not
  // flip loading back to true, or they'd unmount the page mid-action and wipe its local state.
  const hasLoadedOnce = useRef(false)

  const refresh = useCallback(async () => {
    if (!user) {
      setLegacies([])
      setLoading(false)
      hasLoadedOnce.current = false // el próximo login (mismo u otro usuario) debe volver a mostrar la carga inicial
      return
    }
    if (!hasLoadedOnce.current) setLoading(true)
    try {
      const list = await legaciesApi.list()
      setLegacies(list)
      setActiveLegacyIdState((current) => {
        if (current && list.some((l) => l.id === current)) return current
        return list[0]?.id ?? null
      })
    } finally {
      setLoading(false)
      hasLoadedOnce.current = true
    }
  }, [user])

  useEffect(() => {
    refresh()
  }, [refresh])

  const setActiveLegacyId = useCallback((id: string) => {
    localStorage.setItem(ACTIVE_LEGACY_KEY, id)
    setActiveLegacyIdState(id)
  }, [])

  const createLegacy = useCallback(
    async (name: string) => {
      const legacy = await legaciesApi.create({ name })
      setLegacies((prev) => [...prev, legacy])
      setActiveLegacyId(legacy.id)
      return legacy
    },
    [setActiveLegacyId]
  )

  const activeLegacy = useMemo(() => legacies.find((l) => l.id === activeLegacyId) ?? null, [legacies, activeLegacyId])
  const activeMembership = useMemo(
    () => activeLegacy?.memberships.find((m) => m.userId === user?.id) ?? null,
    [activeLegacy, user]
  )

  return (
    <LegacyContext.Provider value={{ legacies, loading, activeLegacy, activeMembership, setActiveLegacyId, refresh, createLegacy }}>
      {children}
    </LegacyContext.Provider>
  )
}

export function useLegacy(): LegacyContextValue {
  const ctx = useContext(LegacyContext)
  if (!ctx) throw new Error('useLegacy debe usarse dentro de <LegacyProvider>')
  return ctx
}
