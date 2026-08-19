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
  | { id: string; date: string; type: 'work-status-update'; target: 'canada' | 'abroad'; working: boolean }
  | { id: string; date: string; type: 'education-update'; education: EducationLevel; canadianEducationCredential?: CanadianEducationCredential }
  | { id: string; date: string; type: 'provincial-nomination' }
  | { id: string; date: string; type: 'certificate-of-qualification' }
  | { id: string; date: string; type: 'sibling-in-canada' }
  | { id: string; date: string; type: 'spouse-language-update'; test: LanguageTestResult }
  | { id: string; date: string; type: 'spouse-education-update'; education: EducationLevel }
  | { id: string; date: string; type: 'spouse-work-status-update'; working: boolean }

export interface Scenario {
  id: string
  name: string
  events: FutureEvent[]
  horizonMonths: number
  /** Show this scenario's curve on the home-page overview. */
  pinned: boolean
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
    case 'work-status-update':
      return event.target === 'canada'
        ? { ...profile, workingInCanada: event.working }
        : { ...profile, workingAbroad: event.working }
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
    case 'spouse-education-update':
      return profile.spouse
        ? { ...profile, spouse: { ...profile.spouse, education: event.education } }
        : profile
    case 'spouse-work-status-update':
      return profile.spouse
        ? { ...profile, spouse: { ...profile.spouse, workingInCanada: event.working } }
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

  // Work experience accrues per the working status in effect during each
  // month; status events flip it from their date onward.
  const statusEvents = scenario.events
    .filter((e) => e.type === 'work-status-update' || e.type === 'spouse-work-status-update')
    .sort((a, b) => a.date.localeCompare(b.date))
  let workingInCanada = base.workingInCanada
  let workingAbroad = base.workingAbroad
  let spouseWorking = base.spouse?.workingInCanada ?? false
  let canadianWorkMonths = base.canadianWorkMonths
  let foreignWorkMonths = base.foreignWorkMonths
  let spouseWorkMonths = base.spouse?.canadianWorkMonths ?? 0
  let next = 0
  for (let k = 0; k < monthOffset; k++) {
    const monthStart = addMonths(startDate, k)
    while (next < statusEvents.length && statusEvents[next].date <= monthStart) {
      const e = statusEvents[next++]
      if (e.type === 'spouse-work-status-update') spouseWorking = e.working
      else if (e.target === 'canada') workingInCanada = e.working
      else workingAbroad = e.working
    }
    if (workingInCanada) canadianWorkMonths++
    if (workingAbroad) foreignWorkMonths++
    if (spouseWorking) spouseWorkMonths++
  }

  let profile: Profile = {
    ...base,
    canadianWorkMonths,
    foreignWorkMonths,
    spouse: base.spouse ? { ...base.spouse, canadianWorkMonths: spouseWorkMonths } : null,
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
