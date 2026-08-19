import type {
  CanadianEducationCredential,
  EducationLevel,
  LanguageTestResult,
  Profile,
  ScoreBreakdown,
} from './types'
import { addMonths } from './dates'
import { calculateCrs } from './crs'

export type FutureEvent =
  | { id: string; date: string; type: 'language-update'; target: 'first' | 'second'; test: LanguageTestResult }
  | { id: string; date: string; type: 'education-update'; education: EducationLevel; canadianEducationCredential?: CanadianEducationCredential }
  | { id: string; date: string; type: 'provincial-nomination' }
  | { id: string; date: string; type: 'certificate-of-qualification' }
  | { id: string; date: string; type: 'sibling-in-canada' }
  | { id: string; date: string; type: 'spouse-language-update'; test: LanguageTestResult }

export interface Scenario {
  id: string
  name: string
  events: FutureEvent[]
  horizonMonths: number
}

export interface SimulationPoint {
  monthOffset: number
  date: string
  score: ScoreBreakdown
}

function applyEvent(profile: Profile, event: FutureEvent): Profile {
  switch (event.type) {
    case 'language-update':
      return event.target === 'first'
        ? { ...profile, firstLanguage: event.test }
        : { ...profile, secondLanguage: event.test }
    case 'education-update':
      return {
        ...profile,
        education: event.education,
        canadianEducationCredential:
          event.canadianEducationCredential ?? profile.canadianEducationCredential,
      }
    case 'provincial-nomination':
      return { ...profile, provincialNomination: true }
    case 'certificate-of-qualification':
      return { ...profile, certificateOfQualification: true }
    case 'sibling-in-canada':
      return { ...profile, siblingInCanada: true }
    case 'spouse-language-update':
      return profile.spouse
        ? { ...profile, spouse: { ...profile.spouse, language: event.test } }
        : profile
  }
}

/** The profile as it would look `monthOffset` months after `startDate`. */
export function projectProfile(
  base: Profile,
  scenario: Scenario,
  startDate: string,
  monthOffset: number,
): Profile {
  const date = addMonths(startDate, monthOffset)
  let profile: Profile = {
    ...base,
    canadianWorkMonths: base.canadianWorkMonths + (base.workingInCanada ? monthOffset : 0),
    foreignWorkMonths: base.foreignWorkMonths + (base.workingAbroad ? monthOffset : 0),
  }
  const dueEvents = scenario.events
    .filter((e) => e.date <= date)
    .sort((a, b) => a.date.localeCompare(b.date))
  for (const event of dueEvents) {
    profile = applyEvent(profile, event)
  }
  return profile
}

export function simulate(base: Profile, scenario: Scenario, startDate: string): SimulationPoint[] {
  const points: SimulationPoint[] = []
  for (let offset = 0; offset <= scenario.horizonMonths; offset++) {
    const date = addMonths(startDate, offset)
    const profile = projectProfile(base, scenario, startDate, offset)
    points.push({ monthOffset: offset, date, score: calculateCrs(profile, date) })
  }
  return points
}
