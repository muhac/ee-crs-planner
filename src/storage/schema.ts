import type { ClbScores, Profile } from '@/engine/types'
import type { Scenario } from '@/engine/simulate'

export const SCHEMA_VERSION = 7

/** Schema versions this build can read (older ones are upgraded on load). */
const READABLE_VERSIONS: number[] = [1, 2, 3, 4, 5, 6, 7]

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
 * v3 → v4: SpouseProfile gains a workingInCanada flag (defaults false).
 * v4 → v5: pool-eligibility fields (TEER, job offer, funds, relative,
 * spouse studied in Canada) with permissive defaults.
 * v5 → v6: Scenario gains a pinned flag (defaults true).
 * v6 → v7: the 'one-or-two-year' Canadian credential split into 'one-year'
 * and 'two-year'; old values map to 'two-year', which keeps both the CRS
 * points (15) and the FSW-67 study adaptability credit unchanged.
 */
const upgradeCredential = (value: unknown) =>
  value === 'one-or-two-year' ? 'two-year' : (value as Profile['canadianEducationCredential'])

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
      canadianWorkTeer: sp.profile.canadianWorkTeer ?? 'teer-0-1',
      canadianEducationCredential: upgradeCredential(sp.profile.canadianEducationCredential),
      jobOffer: (sp.profile.jobOffer as boolean | undefined) ?? false,
      settlementFunds: (sp.profile.settlementFunds as boolean | undefined) ?? true,
      relativeInCanada: (sp.profile.relativeInCanada as boolean | undefined) ?? false,
      spouse: spouse
        ? {
            ...spouse,
            language: spouseLanguage,
            workingInCanada:
              (spouse.workingInCanada as boolean | undefined) ?? false,
            studiedInCanada:
              (spouse.studiedInCanada as boolean | undefined) ?? false,
          }
        : null,
    },
    scenarios: scenarios.map(({ workingInCanada: _wic, workingAbroad: _wa, ...rest }) => ({
      ...rest,
      pinned: (rest.pinned as boolean | undefined) ?? true,
      events: rest.events.map((event) => {
        if (event.type === 'spouse-language-update' && 'clb' in event) {
          return {
            id: event.id,
            date: event.date,
            type: event.type,
            test: { language: 'english' as const, clb: (event as unknown as { clb: ClbScores }).clb },
          }
        }
        if (event.type === 'education-update' && event.canadianEducationCredential) {
          return {
            ...event,
            canadianEducationCredential: upgradeCredential(event.canadianEducationCredential),
          }
        }
        return event
      }),
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
