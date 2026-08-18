export type Ability = 'listening' | 'reading' | 'writing' | 'speaking'

export const ABILITIES: Ability[] = ['listening', 'reading', 'writing', 'speaking']

/** CLB (English) or NCLC (French) level per ability, 0–10+. */
export interface ClbScores {
  listening: number
  reading: number
  writing: number
  speaking: number
}

export type OfficialLanguage = 'english' | 'french'

export interface LanguageTestResult {
  language: OfficialLanguage
  clb: ClbScores
}

export type EducationLevel =
  | 'less-than-secondary'
  | 'secondary'
  | 'one-year-post-secondary'
  | 'two-year-post-secondary'
  | 'bachelors'
  | 'two-or-more-credentials'
  | 'masters-or-professional'
  | 'doctoral'

export type CanadianEducationCredential = 'none' | 'one-or-two-year' | 'three-plus-year'

export interface SpouseProfile {
  education: EducationLevel
  /** Spouse's first official language test; null if not tested. */
  language: ClbScores | null
  canadianWorkMonths: number
}

export interface Profile {
  /** ISO date, e.g. "1995-06-15". */
  dateOfBirth: string
  education: EducationLevel
  canadianEducationCredential: CanadianEducationCredential
  firstLanguage: LanguageTestResult
  secondLanguage: LanguageTestResult | null
  canadianWorkMonths: number
  foreignWorkMonths: number
  certificateOfQualification: boolean
  provincialNomination: boolean
  siblingInCanada: boolean
  /** null → scored as "without spouse" (single, spouse not accompanying, or spouse is citizen/PR). */
  spouse: SpouseProfile | null
}

export interface CoreBreakdown {
  age: number
  education: number
  firstLanguage: number
  secondLanguage: number
  canadianWork: number
  subtotal: number
}

export interface SpouseBreakdown {
  education: number
  language: number
  canadianWork: number
  subtotal: number
}

export interface TransferabilityBreakdown {
  educationLanguage: number
  educationCanadianWork: number
  /** min(50, educationLanguage + educationCanadianWork) */
  educationSubtotal: number
  foreignWorkLanguage: number
  foreignWorkCanadianWork: number
  /** min(50, foreignWorkLanguage + foreignWorkCanadianWork) */
  foreignWorkSubtotal: number
  certificate: number
  /** min(100, educationSubtotal + foreignWorkSubtotal + certificate) */
  subtotal: number
}

export interface AdditionalBreakdown {
  provincialNomination: number
  sibling: number
  french: number
  canadianEducation: number
  /** min(600, sum of the above) */
  subtotal: number
}

export interface ScoreBreakdown {
  age: number
  withSpouse: boolean
  core: CoreBreakdown
  spouse: SpouseBreakdown
  transferability: TransferabilityBreakdown
  additional: AdditionalBreakdown
  total: number
}
