import type { Profile } from '@/engine/types'
import type { Scenario } from '@/engine/simulate'

export const SCHEMA_VERSION = 1

export interface StoredProfile {
  id: string
  name: string
  updatedAt: string
  profile: Profile
  scenarios: Scenario[]
}

export interface AppData {
  schemaVersion: typeof SCHEMA_VERSION
  profiles: StoredProfile[]
}

/** Envelope used by both JSON export files and share links. */
export interface ShareEnvelope {
  app: 'ee-crs'
  schemaVersion: typeof SCHEMA_VERSION
  profile: StoredProfile
}

export function emptyAppData(): AppData {
  return { schemaVersion: SCHEMA_VERSION, profiles: [] }
}

export function isShareEnvelope(value: unknown): value is ShareEnvelope {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    v.app === 'ee-crs' &&
    v.schemaVersion === SCHEMA_VERSION &&
    typeof v.profile === 'object' &&
    v.profile !== null &&
    typeof (v.profile as Record<string, unknown>).profile === 'object'
  )
}
