import type { Profile, SpouseProfile } from '@/engine/types'
import type { Scenario } from '@/engine/simulate'
import type { StoredProfile } from '@/storage/schema'
import { todayIso } from '@/engine/dates'

export function newId(): string {
  return crypto.randomUUID()
}

export function defaultProfile(): Profile {
  return {
    dateOfBirth: '1996-01-01',
    education: 'bachelors',
    canadianEducationCredential: 'none',
    firstLanguage: {
      language: 'english',
      clb: { listening: 7, reading: 7, writing: 7, speaking: 7 },
    },
    secondLanguage: null,
    canadianWorkMonths: 0,
    foreignWorkMonths: 0,
    workingInCanada: false,
    workingAbroad: false,
    canadianWorkTeer: 'teer-0-1',
    jobOffer: false,
    settlementFunds: true,
    relativeInCanada: false,
    certificateOfQualification: false,
    provincialNomination: false,
    siblingInCanada: false,
    spouse: null,
  }
}

export function defaultSpouse(): SpouseProfile {
  return {
    education: 'bachelors',
    language: null,
    canadianWorkMonths: 0,
    workingInCanada: false,
    studiedInCanada: false,
  }
}

export function defaultScenario(name: string): Scenario {
  return {
    id: newId(),
    name,
    events: [],
    horizonMonths: 36,
  }
}

export function newStoredProfile(name: string, scenarioName: string): StoredProfile {
  return {
    id: newId(),
    name,
    updatedAt: todayIso(),
    profile: defaultProfile(),
    scenarios: [defaultScenario(scenarioName)],
  }
}
