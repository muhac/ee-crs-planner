import { describe, it, expect } from 'vitest'
import type { ClbScores, Profile } from './types'
import { checkEligibility, fsw67Points } from './eligibility'

const AS_OF = '2026-08-18'

function uniformClb(level: number): ClbScores {
  return { listening: level, reading: level, writing: level, speaking: level }
}

function profile(overrides: Partial<Profile> = {}): Profile {
  return {
    dateOfBirth: '1996-01-01', // age 30
    education: 'bachelors',
    canadianEducationCredential: 'none',
    firstLanguage: { language: 'english', clb: uniformClb(7) },
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
    ...overrides,
  }
}

describe('fsw67Points', () => {
  it('scores the reference profile', () => {
    // Language CLB7×4 = 16, bachelors 21, no experience 0, age 30 = 12,
    // no job offer, no adaptability.
    expect(fsw67Points(profile(), AS_OF)).toBe(16 + 21 + 12)
  })

  it('scores language per ability and the second-language bonus', () => {
    expect(
      fsw67Points(
        profile({
          firstLanguage: {
            language: 'english',
            clb: { listening: 9, reading: 8, writing: 7, speaking: 6 },
          },
        }),
        AS_OF,
      ),
    ).toBe(6 + 5 + 4 + 0 + 21 + 12)
    expect(
      fsw67Points(
        profile({ secondLanguage: { language: 'french', clb: uniformClb(5) } }),
        AS_OF,
      ),
    ).toBe(16 + 4 + 21 + 12)
  })

  it('scores experience brackets from combined months', () => {
    expect(fsw67Points(profile({ canadianWorkMonths: 12 }), AS_OF)).toBe(16 + 21 + 12 + 9 + 5)
    // +5 adaptability for 1yr Canadian work; 2-3yr bracket:
    expect(fsw67Points(profile({ foreignWorkMonths: 30 }), AS_OF)).toBe(16 + 21 + 12 + 11)
    expect(fsw67Points(profile({ foreignWorkMonths: 76 }), AS_OF)).toBe(16 + 21 + 12 + 15)
  })

  it('decreases age points after 35 and caps adaptability at 10', () => {
    expect(fsw67Points(profile({ dateOfBirth: '1988-01-01' }), AS_OF)).toBe(16 + 21 + 9) // age 38
    expect(fsw67Points(profile({ dateOfBirth: '1978-01-01' }), AS_OF)).toBe(16 + 21) // age 48
    const p = profile({
      jobOffer: true, // +10 arranged +5 adapt
      canadianWorkMonths: 12, // +9 exp +5 adapt
      canadianEducationCredential: 'one-or-two-year', // +5 adapt
    })
    // adaptability capped at 10: 16 + 21 + 12(age) + 9(exp) + 10(offer) + 10(adapt)
    expect(fsw67Points(p, AS_OF)).toBe(16 + 21 + 12 + 9 + 10 + 10)
  })
})

describe('checkEligibility', () => {
  it('CEC needs 12 months and the TEER-based language threshold', () => {
    expect(checkEligibility(profile(), AS_OF).cec.eligible).toBe(false)
    expect(checkEligibility(profile({ canadianWorkMonths: 12 }), AS_OF).cec.eligible).toBe(true)
    // TEER 0/1 needs CLB 7:
    expect(
      checkEligibility(
        profile({ canadianWorkMonths: 12, firstLanguage: { language: 'english', clb: uniformClb(5) } }),
        AS_OF,
      ).cec.eligible,
    ).toBe(false)
    // TEER 2/3 only needs CLB 5:
    expect(
      checkEligibility(
        profile({
          canadianWorkMonths: 12,
          canadianWorkTeer: 'teer-2-3',
          firstLanguage: { language: 'english', clb: uniformClb(5) },
        }),
        AS_OF,
      ).cec.eligible,
    ).toBe(true)
  })

  it('FSW needs CLB 7, 12 months experience, 67 points, and funds', () => {
    const ok = profile({ foreignWorkMonths: 72, secondLanguage: { language: 'french', clb: uniformClb(5) } })
    // 16 + 4 + 21 + 12 + 15 = 68 ≥ 67
    const r = checkEligibility(ok, AS_OF)
    expect(r.fsw.points67).toBe(68)
    expect(r.fsw.eligible).toBe(true)
    expect(checkEligibility(profile({ foreignWorkMonths: 72, secondLanguage: { language: 'french', clb: uniformClb(5) }, settlementFunds: false }), AS_OF).fsw.eligible).toBe(false)
    expect(checkEligibility(profile(), AS_OF).fsw.eligible).toBe(false) // no experience, 49 pts
  })

  it('FST needs certificate/offer, 24 months, and its language thresholds', () => {
    const base = profile({
      certificateOfQualification: true,
      canadianWorkMonths: 24,
      firstLanguage: {
        language: 'english',
        clb: { speaking: 5, listening: 5, reading: 4, writing: 4 },
      },
    })
    expect(checkEligibility(base, AS_OF).fst.eligible).toBe(true)
    expect(
      checkEligibility({ ...base, certificateOfQualification: false }, AS_OF).fst.eligible,
    ).toBe(false)
    expect(
      checkEligibility(
        { ...base, firstLanguage: { language: 'english', clb: { speaking: 4, listening: 5, reading: 4, writing: 4 } } },
        AS_OF,
      ).fst.eligible,
    ).toBe(false)
  })

  it('reports reasons with parameters', () => {
    const r = checkEligibility(profile({ canadianWorkMonths: 8 }), AS_OF)
    expect(r.cec.reasons).toEqual([{ key: 'cecExperience', params: { have: 8 } }])
    expect(r.anyEligible).toBe(false)
  })
})
