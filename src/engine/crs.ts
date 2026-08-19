import type {
  AdditionalBreakdown,
  ClbScores,
  CoreBreakdown,
  Profile,
  ScoreBreakdown,
  SpouseBreakdown,
  TransferabilityBreakdown,
} from './types'
import { ABILITIES } from './types'
import { ageAt } from './dates'
import {
  ADDITIONAL_POINTS,
  AGE_POINTS,
  EDUCATION_POINTS,
  SECOND_LANGUAGE_CAP,
  SPOUSE_EDUCATION_POINTS,
  TRANSFER_EDUCATION_POINTS,
  TRANSFERABILITY_SECTION_CAP,
  TRANSFERABILITY_TOTAL_CAP,
  canadianWorkPoints,
  firstLanguageAbilityPoints,
  secondLanguageAbilityPoints,
  spouseCanadianWorkPoints,
  spouseLanguageAbilityPoints,
  transferForeignWorkPoints,
} from './tables'

function allAbilitiesAtLeast(clb: ClbScores, level: number): boolean {
  return ABILITIES.every((a) => clb[a] >= level)
}

function fullYears(months: number): number {
  return Math.floor(months / 12)
}

function coreFactors(profile: Profile, age: number, withSpouse: boolean): CoreBreakdown {
  const agePts = age >= 18 && age <= 44 ? AGE_POINTS[age][withSpouse ? 0 : 1] : 0
  const educationPts = EDUCATION_POINTS[profile.education][withSpouse ? 0 : 1]

  const firstLanguagePts = ABILITIES.reduce(
    (sum, a) => sum + firstLanguageAbilityPoints(profile.firstLanguage.clb[a], withSpouse),
    0,
  )
  const secondRaw = profile.secondLanguage
    ? ABILITIES.reduce((sum, a) => sum + secondLanguageAbilityPoints(profile.secondLanguage!.clb[a]), 0)
    : 0
  const secondLanguagePts = Math.min(secondRaw, SECOND_LANGUAGE_CAP[withSpouse ? 0 : 1])

  const canadianWorkPts = canadianWorkPoints(fullYears(profile.canadianWorkMonths), withSpouse)

  return {
    age: agePts,
    education: educationPts,
    firstLanguage: firstLanguagePts,
    secondLanguage: secondLanguagePts,
    canadianWork: canadianWorkPts,
    subtotal: agePts + educationPts + firstLanguagePts + secondLanguagePts + canadianWorkPts,
  }
}

function spouseFactors(profile: Profile): SpouseBreakdown {
  if (!profile.spouse) {
    return { education: 0, language: 0, canadianWork: 0, subtotal: 0 }
  }
  const { education, language, canadianWorkMonths } = profile.spouse
  const educationPts = SPOUSE_EDUCATION_POINTS[education]
  const languagePts = language
    ? ABILITIES.reduce((sum, a) => sum + spouseLanguageAbilityPoints(language.clb[a]), 0)
    : 0
  const workPts = spouseCanadianWorkPoints(fullYears(canadianWorkMonths))
  return {
    education: educationPts,
    language: languagePts,
    canadianWork: workPts,
    subtotal: educationPts + languagePts + workPts,
  }
}

/** Pick from a [weakTier, strongTier] pair; tier -1 → no points. */
function tierPoints(row: readonly [number, number], tier: number): number {
  return tier === 1 ? row[1] : tier === 0 ? row[0] : 0
}

function transferability(profile: Profile): TransferabilityBreakdown {
  const clb = profile.firstLanguage.clb
  const languageTier = allAbilitiesAtLeast(clb, 9) ? 1 : allAbilitiesAtLeast(clb, 7) ? 0 : -1
  const canadianYears = fullYears(profile.canadianWorkMonths)
  const canadianTier = canadianYears >= 2 ? 1 : canadianYears >= 1 ? 0 : -1

  const educationRow = TRANSFER_EDUCATION_POINTS[profile.education]
  const educationLanguage = tierPoints(educationRow, languageTier)
  const educationCanadianWork = tierPoints(educationRow, canadianTier)
  const educationSubtotal = Math.min(
    TRANSFERABILITY_SECTION_CAP,
    educationLanguage + educationCanadianWork,
  )

  const foreignRow = transferForeignWorkPoints(fullYears(profile.foreignWorkMonths))
  const foreignWorkLanguage = tierPoints(foreignRow, languageTier)
  const foreignWorkCanadianWork = tierPoints(foreignRow, canadianTier)
  const foreignWorkSubtotal = Math.min(
    TRANSFERABILITY_SECTION_CAP,
    foreignWorkLanguage + foreignWorkCanadianWork,
  )

  // The certificate table uses lower CLB thresholds (5 / 7) than the others.
  const certificateTier = allAbilitiesAtLeast(clb, 7) ? 1 : allAbilitiesAtLeast(clb, 5) ? 0 : -1
  const certificate = profile.certificateOfQualification
    ? tierPoints([25, 50], certificateTier)
    : 0

  return {
    educationLanguage,
    educationCanadianWork,
    educationSubtotal,
    foreignWorkLanguage,
    foreignWorkCanadianWork,
    foreignWorkSubtotal,
    certificate,
    subtotal: Math.min(
      TRANSFERABILITY_TOTAL_CAP,
      educationSubtotal + foreignWorkSubtotal + certificate,
    ),
  }
}

function frenchBonus(profile: Profile): number {
  const tests = [profile.firstLanguage, profile.secondLanguage].filter((t) => t != null)
  const french = tests.find((t) => t.language === 'french')
  const english = tests.find((t) => t.language === 'english')
  if (!french || !allAbilitiesAtLeast(french.clb, 7)) return 0
  return english && allAbilitiesAtLeast(english.clb, 5)
    ? ADDITIONAL_POINTS.frenchWithEnglishClb5
    : ADDITIONAL_POINTS.frenchOnly
}

function additionalPoints(profile: Profile): AdditionalBreakdown {
  const provincialNomination = profile.provincialNomination
    ? ADDITIONAL_POINTS.provincialNomination
    : 0
  const sibling = profile.siblingInCanada ? ADDITIONAL_POINTS.sibling : 0
  const french = frenchBonus(profile)
  const canadianEducation =
    profile.canadianEducationCredential === 'three-plus-year'
      ? ADDITIONAL_POINTS.canadianEducationThreePlusYear
      : profile.canadianEducationCredential !== 'none'
        ? ADDITIONAL_POINTS.canadianEducationOneOrTwoYear
        : 0
  return {
    provincialNomination,
    sibling,
    french,
    canadianEducation,
    subtotal: Math.min(
      ADDITIONAL_POINTS.cap,
      provincialNomination + sibling + french + canadianEducation,
    ),
  }
}

/**
 * The same profile with first/second official language designations swapped
 * (IRCC lets applicants choose which is first). Null without a second language.
 */
export function swapLanguages(profile: Profile): Profile | null {
  if (!profile.secondLanguage) return null
  return {
    ...profile,
    firstLanguage: profile.secondLanguage,
    secondLanguage: profile.firstLanguage,
  }
}

/** Extra points available by swapping the language designations (0 if none). */
export function swapGain(profile: Profile, asOf: string): number {
  const swapped = swapLanguages(profile)
  if (!swapped) return 0
  return Math.max(0, calculateCrs(swapped, asOf).total - calculateCrs(profile, asOf).total)
}

export function calculateCrs(profile: Profile, asOf: string): ScoreBreakdown {
  const withSpouse = profile.spouse !== null
  const age = ageAt(profile.dateOfBirth, asOf)
  const core = coreFactors(profile, age, withSpouse)
  const spouse = spouseFactors(profile)
  const transfer = transferability(profile)
  const additional = additionalPoints(profile)
  return {
    age,
    withSpouse,
    core,
    spouse,
    transferability: transfer,
    additional,
    total: core.subtotal + spouse.subtotal + transfer.subtotal + additional.subtotal,
  }
}
