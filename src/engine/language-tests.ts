/**
 * CLB/NCLC equivalency for the five tests IRCC accepts for Express Entry,
 * transcribed from the official charts:
 * https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/documents/language-requirements/language-testing.html
 * (TEF Canada uses the "Équivalence ancien score" column, per IRCC guidance.)
 */
import type { Ability, LanguageTestType, OfficialLanguage } from './types'

export const TESTS_FOR_LANGUAGE: Record<OfficialLanguage, LanguageTestType[]> = {
  english: ['celpip', 'ielts', 'pte'],
  french: ['tef', 'tcf'],
}

/** Display names are the same in every UI language. */
export const TEST_LABELS: Record<LanguageTestType, string> = {
  celpip: 'CELPIP-General',
  ielts: 'IELTS (G)',
  pte: 'PTE Core',
  tef: 'TEF Canada',
  tcf: 'TCF Canada',
}

/** [minScore, CLB] rows, highest first; anything below the last row is CLB 3 ("below 4"). */
type Thresholds = Record<Ability, Array<readonly [number, number]>>

const CELPIP_ROWS: Array<readonly [number, number]> = [
  [10, 10], [9, 9], [8, 8], [7, 7], [6, 6], [5, 5], [4, 4],
]

const THRESHOLDS: Record<LanguageTestType, Thresholds> = {
  celpip: {
    listening: CELPIP_ROWS,
    reading: CELPIP_ROWS,
    writing: CELPIP_ROWS,
    speaking: CELPIP_ROWS,
  },
  ielts: {
    listening: [[8.5, 10], [8.0, 9], [7.5, 8], [6.0, 7], [5.5, 6], [5.0, 5], [4.5, 4]],
    reading: [[8.0, 10], [7.0, 9], [6.5, 8], [6.0, 7], [5.0, 6], [4.0, 5], [3.5, 4]],
    writing: [[7.5, 10], [7.0, 9], [6.5, 8], [6.0, 7], [5.5, 6], [5.0, 5], [4.0, 4]],
    speaking: [[7.5, 10], [7.0, 9], [6.5, 8], [6.0, 7], [5.5, 6], [5.0, 5], [4.0, 4]],
  },
  pte: {
    listening: [[89, 10], [82, 9], [71, 8], [60, 7], [50, 6], [39, 5], [28, 4]],
    reading: [[88, 10], [78, 9], [69, 8], [60, 7], [51, 6], [42, 5], [33, 4]],
    writing: [[90, 10], [88, 9], [79, 8], [69, 7], [60, 6], [51, 5], [41, 4]],
    speaking: [[89, 10], [84, 9], [76, 8], [68, 7], [59, 6], [51, 5], [42, 4]],
  },
  tef: {
    listening: [[316, 10], [298, 9], [280, 8], [249, 7], [217, 6], [181, 5], [145, 4]],
    reading: [[263, 10], [248, 9], [233, 8], [207, 7], [181, 6], [151, 5], [121, 4]],
    writing: [[393, 10], [371, 9], [349, 8], [310, 7], [271, 6], [226, 5], [181, 4]],
    speaking: [[393, 10], [371, 9], [349, 8], [310, 7], [271, 6], [226, 5], [181, 4]],
  },
  tcf: {
    listening: [[549, 10], [523, 9], [503, 8], [458, 7], [398, 6], [369, 5], [331, 4]],
    reading: [[549, 10], [524, 9], [499, 8], [453, 7], [406, 6], [375, 5], [342, 4]],
    writing: [[16, 10], [14, 9], [12, 8], [10, 7], [7, 6], [6, 5], [4, 4]],
    speaking: [[16, 10], [14, 9], [12, 8], [10, 7], [7, 6], [6, 5], [4, 4]],
  },
}

export function scoreToClb(test: LanguageTestType, ability: Ability, score: number): number {
  for (const [min, clb] of THRESHOLDS[test][ability]) {
    if (score >= min) return clb
  }
  return 3
}

/** Lowest raw score that maps to the given CLB level (used to seed inputs). */
export function clbToMinScore(test: LanguageTestType, ability: Ability, clb: number): number {
  const row = THRESHOLDS[test][ability].find(([, c]) => c === Math.min(clb, 10))
  return row ? row[0] : 0
}

export type TestInputSpec =
  | { kind: 'select'; options: number[] }
  | { kind: 'number'; min: number; max: number; step: number }

function range(from: number, to: number, step: number): number[] {
  const out: number[] = []
  for (let v = from; v <= to + 1e-9; v += step) out.push(Number(v.toFixed(1)))
  return out
}

/** What input control a test uses for one ability, mirroring the real score sheets. */
export function testInputSpec(test: LanguageTestType, ability: Ability): TestInputSpec {
  switch (test) {
    case 'celpip':
      // CELPIP levels; 3 stands for "M–3".
      return { kind: 'select', options: range(3, 12, 1) }
    case 'ielts':
      // Band scores in 0.5 steps; 2.5 stands for "below 3.0".
      return { kind: 'select', options: range(2.5, 9, 0.5) }
    case 'pte':
      return { kind: 'number', min: 10, max: 90, step: 1 }
    case 'tef':
      return {
        kind: 'number',
        min: 0,
        max: ability === 'listening' ? 360 : ability === 'reading' ? 300 : 450,
        step: 1,
      }
    case 'tcf':
      return ability === 'listening' || ability === 'reading'
        ? { kind: 'number', min: 100, max: 699, step: 1 }
        : { kind: 'number', min: 0, max: 20, step: 1 }
  }
}
