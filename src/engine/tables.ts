/**
 * CRS point tables, transcribed from the official IRCC grid:
 * https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/eligibility/criteria-comprehensive-ranking-system/grid.html
 * (page last updated 2026-06-22; job-offer points removed as of 2025-03-25)
 *
 * Every entry is [withSpouse, withoutSpouse] unless noted otherwise.
 */
import type { EducationLevel } from './types'

type Pair = readonly [withSpouse: number, withoutSpouse: number]

/** Age → points. Ages outside [18, 44] score 0. */
export const AGE_POINTS: Record<number, Pair> = {
  18: [90, 99],
  19: [95, 105],
  20: [100, 110], 21: [100, 110], 22: [100, 110], 23: [100, 110], 24: [100, 110],
  25: [100, 110], 26: [100, 110], 27: [100, 110], 28: [100, 110], 29: [100, 110],
  30: [95, 105],
  31: [90, 99],
  32: [85, 94],
  33: [80, 88],
  34: [75, 83],
  35: [70, 77],
  36: [65, 72],
  37: [60, 66],
  38: [55, 61],
  39: [50, 55],
  40: [45, 50],
  41: [35, 39],
  42: [25, 28],
  43: [15, 17],
  44: [5, 6],
}

export const EDUCATION_POINTS: Record<EducationLevel, Pair> = {
  'less-than-secondary': [0, 0],
  'secondary': [28, 30],
  'one-year-post-secondary': [84, 90],
  'two-year-post-secondary': [91, 98],
  'bachelors': [112, 120],
  'two-or-more-credentials': [119, 128],
  'masters-or-professional': [126, 135],
  'doctoral': [140, 150],
}

/** First official language, points per ability at a given CLB level. */
export function firstLanguageAbilityPoints(clbLevel: number, withSpouse: boolean): number {
  const table: Array<[minClb: number, pts: Pair]> = [
    [10, [32, 34]],
    [9, [29, 31]],
    [8, [22, 23]],
    [7, [16, 17]],
    [6, [8, 9]],
    [4, [6, 6]],
  ]
  for (const [min, pair] of table) {
    if (clbLevel >= min) return withSpouse ? pair[0] : pair[1]
  }
  return 0
}

/** Second official language, points per ability (same with or without spouse). */
export function secondLanguageAbilityPoints(clbLevel: number): number {
  if (clbLevel >= 9) return 6
  if (clbLevel >= 7) return 3
  if (clbLevel >= 5) return 1
  return 0
}

export const SECOND_LANGUAGE_CAP: Pair = [22, 24]

/** Canadian work experience (principal applicant), by full years. */
export function canadianWorkPoints(years: number, withSpouse: boolean): number {
  const table: Array<[minYears: number, pts: Pair]> = [
    [5, [70, 80]],
    [4, [63, 72]],
    [3, [56, 64]],
    [2, [46, 53]],
    [1, [35, 40]],
  ]
  for (const [min, pair] of table) {
    if (years >= min) return withSpouse ? pair[0] : pair[1]
  }
  return 0
}

export const SPOUSE_EDUCATION_POINTS: Record<EducationLevel, number> = {
  'less-than-secondary': 0,
  'secondary': 2,
  'one-year-post-secondary': 6,
  'two-year-post-secondary': 7,
  'bachelors': 8,
  'two-or-more-credentials': 9,
  'masters-or-professional': 10,
  'doctoral': 10,
}

export function spouseLanguageAbilityPoints(clbLevel: number): number {
  if (clbLevel >= 9) return 5
  if (clbLevel >= 7) return 3
  if (clbLevel >= 5) return 1
  return 0
}

export function spouseCanadianWorkPoints(years: number): number {
  const table: Array<[minYears: number, pts: number]> = [
    [5, 10], [4, 9], [3, 8], [2, 7], [1, 5],
  ]
  for (const [min, pts] of table) {
    if (years >= min) return pts
  }
  return 0
}

/**
 * Skill transferability — education rows, used by both the "education ×
 * language" and "education × Canadian work experience" tables.
 * Value is [weakTier, strongTier] where the tier is decided by the paired
 * factor (CLB 7 vs 9; 1 year vs 2+ years of Canadian experience).
 */
export const TRANSFER_EDUCATION_POINTS: Record<EducationLevel, Pair> = {
  'less-than-secondary': [0, 0],
  'secondary': [0, 0],
  'one-year-post-secondary': [13, 25],
  'two-year-post-secondary': [13, 25],
  'bachelors': [13, 25],
  'two-or-more-credentials': [25, 50],
  'masters-or-professional': [25, 50],
  'doctoral': [25, 50],
}

/** Skill transferability — foreign work experience rows: [weakTier, strongTier]. */
export function transferForeignWorkPoints(years: number): Pair {
  if (years >= 3) return [25, 50]
  if (years >= 1) return [13, 25]
  return [0, 0]
}

export const TRANSFERABILITY_SECTION_CAP = 50
export const TRANSFERABILITY_TOTAL_CAP = 100

export const ADDITIONAL_POINTS = {
  sibling: 15,
  frenchWithEnglishClb5: 50,
  frenchOnly: 25,
  canadianEducationOneOrTwoYear: 15,
  canadianEducationThreePlusYear: 30,
  provincialNomination: 600,
  cap: 600,
} as const
