import type { ClbScores, Profile } from '@/engine/types'
import type { Scenario } from '@/engine/simulate'

export const SCHEMA_VERSION = 3

/** Schema versions this build can read (older ones are upgraded on load). */
const READABLE_VERSIONS: number[] = [1, 2, 3]

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

/**
 * Upgrade a stored profile written by any readable schema version.
 * v1 → v2: the working-status flags moved from Scenario to Profile; a flag
 * set in any v1 scenario carries over to the profile.
 * v2 → v3: spouse language and spouse-language-update events hold a full
 * LanguageTestResult instead of bare CLB scores.
 */
export function upgradeStoredProfile(sp: StoredProfile): StoredProfile {
  const scenarios = sp.scenarios as Array<
    Scenario & { workingInCanada?: boolean; workingAbroad?: boolean }
  >

  const spouse = sp.profile.spouse
  const spouseLanguage =
    spouse?.language && !('clb' in spouse.language)
      ? { language: 'english' as const, clb: spouse.language as unknown as ClbScores }
      : (spouse?.language ?? null)

  return {
    ...sp,
    profile: {
      ...sp.profile,
      // v1 profiles lack the flags at runtime even though the type requires them
      workingInCanada:
        (sp.profile.workingInCanada as boolean | undefined) ??
        scenarios.some((s) => s.workingInCanada === true),
      workingAbroad:
        (sp.profile.workingAbroad as boolean | undefined) ??
        scenarios.some((s) => s.workingAbroad === true),
      spouse: spouse ? { ...spouse, language: spouseLanguage } : null,
    },
    scenarios: scenarios.map(({ workingInCanada: _wic, workingAbroad: _wa, ...rest }) => ({
      ...rest,
      events: rest.events.map((event) =>
        event.type === 'spouse-language-update' && 'clb' in event
          ? {
              id: event.id,
              date: event.date,
              type: event.type,
              test: { language: 'english' as const, clb: (event as unknown as { clb: ClbScores }).clb },
            }
          : event,
      ),
    })),
  }
}

export function isShareEnvelope(value: unknown): value is ShareEnvelope {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    v.app === 'ee-crs' &&
    READABLE_VERSIONS.includes(v.schemaVersion as number) &&
    typeof v.profile === 'object' &&
    v.profile !== null &&
    typeof (v.profile as Record<string, unknown>).profile === 'object'
  )
}

export function isReadableAppData(value: unknown): value is AppData {
  return (
    typeof value === 'object' &&
    value !== null &&
    READABLE_VERSIONS.includes((value as AppData).schemaVersion) &&
    Array.isArray((value as AppData).profiles)
  )
}
