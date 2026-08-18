import { useCallback, useState } from 'react'
import type { AppData, StoredProfile } from '@/storage/schema'
import { loadAppData, saveAppData } from '@/storage/local'
import { todayIso } from '@/engine/dates'

export function useAppData() {
  const [data, setData] = useState<AppData>(loadAppData)

  const update = useCallback((fn: (prev: AppData) => AppData) => {
    setData((prev) => {
      const next = fn(prev)
      saveAppData(next)
      return next
    })
  }, [])

  const addProfile = useCallback(
    (profile: StoredProfile) => {
      update((prev) => ({ ...prev, profiles: [...prev.profiles, profile] }))
    },
    [update],
  )

  const updateProfile = useCallback(
    (id: string, fn: (prev: StoredProfile) => StoredProfile) => {
      update((prev) => ({
        ...prev,
        profiles: prev.profiles.map((p) =>
          p.id === id ? { ...fn(p), updatedAt: todayIso() } : p,
        ),
      }))
    },
    [update],
  )

  const removeProfile = useCallback(
    (id: string) => {
      update((prev) => ({ ...prev, profiles: prev.profiles.filter((p) => p.id !== id) }))
    },
    [update],
  )

  return { data, addProfile, updateProfile, removeProfile }
}
