/**
 * Express Entry pool eligibility: Canadian Experience Class, Federal Skilled
 * Worker (including the FSW 67-point selection grid), and Federal Skilled
 * Trades, per the official IRCC criteria.
 *
 * Known simplifications (stated in the UI): experience entered is assumed to
 * fall within each program's look-back window and to be continuous/skilled;
 * FST trade-occupation membership is approximated by the certificate/job-offer
 * requirement itself.
 */
import type { Ability, ClbScores, EducationLevel, Profile } from './types'
import { ABILITIES } from './types'
import { ageAt } from './dates'

export interface EligibilityReason {
  key: string
  params?: Record<string, number>
}

export interface ProgramStatus {
  eligible: boolean
  reasons: EligibilityReason[]
}

export interface EligibilityResult {
  cec: ProgramStatus
  fsw: ProgramStatus & { points67: number }
  fst: ProgramStatus
  anyEligible: boolean
}

function allAtLeast(clb: ClbScores, level: number): boolean {
  return ABILITIES.every((a) => clb[a] >= level)
}

/** FSW-67: first official language, points per ability (minimum CLB 7). */
function fswLanguagePoints(clbLevel: number): number {
  if (clbLevel >= 9) return 6
  if (clbLevel >= 8) return 5
  if (clbLevel >= 7) return 4
  return 0
}

const FSW_EDUCATION_POINTS: Record<EducationLevel, number> = {
  'doctoral': 25,
  'masters-or-professional': 23,
  'two-or-more-credentials': 22,
  'bachelors': 21,
  'two-year-post-secondary': 19,
  'one-year-post-secondary': 15,
  'secondary': 5,
  'less-than-secondary': 0,
}

function fswExperiencePoints(years: number): number {
  if (years >= 6) return 15
  if (years >= 4) return 13
  if (years >= 2) return 11
  if (years >= 1) return 9
  return 0
}

function fswAgePoints(age: number): number {
  if (age < 18) return 0
  if (age <= 35) return 12
  // 36 → 11, dropping one point per year; 47+ → 0.
  return Math.max(0, 12 - (age - 35))
}

/** The FSW 67-point selection grid total. */
export function fsw67Points(profile: Profile, asOf: string): number {
  const clb = profile.firstLanguage.clb
  const language =
    ABILITIES.reduce((sum, a) => sum + fswLanguagePoints(clb[a]), 0) +
    (profile.secondLanguage && allAtLeast(profile.secondLanguage.clb, 5) ? 4 : 0)

  const education = FSW_EDUCATION_POINTS[profile.education]

  const totalWorkYears = Math.floor(
    (profile.canadianWorkMonths + profile.foreignWorkMonths) / 12,
  )
  const experience = fswExperiencePoints(totalWorkYears)

  const age = fswAgePoints(ageAt(profile.dateOfBirth, asOf))

  const arrangedEmployment = profile.jobOffer ? 10 : 0

  let adaptability = 0
  if (profile.spouse?.language && allAtLeast(profile.spouse.language.clb, 4)) adaptability += 5
  // Own past studies: requires 2+ academic years in a 2+ year program.
  if (
    profile.canadianEducationCredential === 'two-year' ||
    profile.canadianEducationCredential === 'three-plus-year'
  ) {
    adaptability += 5
  }
  if (profile.spouse?.studiedInCanada) adaptability += 5
  // Own past work in Canada is the only 10-point adaptability factor.
  if (profile.canadianWorkMonths >= 12) adaptability += 10
  if ((profile.spouse?.canadianWorkMonths ?? 0) >= 12) adaptability += 5
  if (profile.jobOffer) adaptability += 5
  if (profile.siblingInCanada || profile.relativeInCanada) adaptability += 5
  adaptability = Math.min(10, adaptability)

  return language + education + experience + age + arrangedEmployment + adaptability
}

const FSW_PASS_MARK = 67

export function checkEligibility(profile: Profile, asOf: string): EligibilityResult {
  const clb = profile.firstLanguage.clb

  // CEC: 12 months skilled Canadian experience (last 3 years, assumed) and
  // CLB 7 (TEER 0/1) or CLB 5 (TEER 2/3) in every ability. No funds required.
  const cecReasons: EligibilityReason[] = []
  if (profile.canadianWorkMonths < 12) {
    cecReasons.push({ key: 'cecExperience', params: { have: profile.canadianWorkMonths } })
  }
  const cecClb = profile.canadianWorkTeer === 'teer-0-1' ? 7 : 5
  if (!allAtLeast(clb, cecClb)) {
    cecReasons.push({ key: 'cecLanguage', params: { need: cecClb } })
  }

  // FSW: CLB 7 in every ability, 12+ months skilled experience, 67+ grid
  // points, settlement funds. Funds are waived only with a valid job offer
  // AND authorization to work in Canada (approximated by workingInCanada).
  const fundsOk = profile.settlementFunds || (profile.jobOffer && profile.workingInCanada)
  const points67 = fsw67Points(profile, asOf)
  const fswReasons: EligibilityReason[] = []
  if (!allAtLeast(clb, 7)) fswReasons.push({ key: 'fswLanguage' })
  if (profile.canadianWorkMonths + profile.foreignWorkMonths < 12) {
    fswReasons.push({ key: 'fswExperience' })
  }
  if (points67 < FSW_PASS_MARK) {
    fswReasons.push({ key: 'fswPoints', params: { points: points67 } })
  }
  if (!fundsOk) fswReasons.push({ key: 'funds' })

  // FST: certificate of qualification or job offer, 24 months trade
  // experience (last 5 years, assumed), CLB 5 speaking/listening and
  // CLB 4 reading/writing, settlement funds.
  const fstReasons: EligibilityReason[] = []
  if (!profile.certificateOfQualification && !profile.jobOffer) {
    fstReasons.push({ key: 'fstCertificate' })
  }
  if (profile.canadianWorkMonths + profile.foreignWorkMonths < 24) {
    fstReasons.push({ key: 'fstExperience' })
  }
  const fstLanguageOk = (['speaking', 'listening'] as Ability[]).every((a) => clb[a] >= 5) &&
    (['reading', 'writing'] as Ability[]).every((a) => clb[a] >= 4)
  if (!fstLanguageOk) fstReasons.push({ key: 'fstLanguage' })
  if (!fundsOk) fstReasons.push({ key: 'funds' })

  const cec = { eligible: cecReasons.length === 0, reasons: cecReasons }
  const fsw = { eligible: fswReasons.length === 0, reasons: fswReasons, points67 }
  const fst = { eligible: fstReasons.length === 0, reasons: fstReasons }
  return { cec, fsw, fst, anyEligible: cec.eligible || fsw.eligible || fst.eligible }
}
