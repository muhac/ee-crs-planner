import { describe, it, expect } from 'vitest'
import type { ClbScores, EducationLevel, HighWageLevel, Profile } from './types'
import { ageAt } from './dates'
import { calculateCrs, swapGain, swapLanguages } from './crs'
import { CRS_MAX } from './tables'

const AS_OF = '2026-08-18'

function clb(listening: number, reading: number, writing: number, speaking: number): ClbScores {
  return { listening, reading, writing, speaking }
}

function uniformClb(level: number): ClbScores {
  return clb(level, level, level, level)
}

/** DOB with birthday already passed in the AS_OF year → exact age. */
function dobForAge(age: number): string {
  return `${2026 - age}-01-01`
}

function baseProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    dateOfBirth: dobForAge(20),
    education: 'less-than-secondary',
    canadianEducationCredential: 'none',
    firstLanguage: { language: 'english', clb: uniformClb(0) },
    secondLanguage: null,
    canadianWorkMonths: 0,
    foreignWorkMonths: 0,
    workingInCanada: false,
    workingAbroad: false,
    canadianWorkTeer: 'teer-0-1',
    canadianWorkHighWage: 'none',
    jobOffer: false,
    jobOfferHighWage: 'none',
    settlementFunds: true,
    relativeInCanada: false,
    certificateOfQualification: false,
    provincialNomination: false,
    siblingInCanada: false,
    spouse: null,
    ...overrides,
  }
}

function score(overrides: Partial<Profile> = {}) {
  return calculateCrs(baseProfile(overrides), AS_OF)
}

describe('ageAt', () => {
  it('computes age before and after birthday', () => {
    expect(ageAt('1996-08-19', '2026-08-18')).toBe(29)
    expect(ageAt('1996-08-18', '2026-08-18')).toBe(30)
    expect(ageAt('1996-08-17', '2026-08-18')).toBe(30)
  })
})

describe('core: age', () => {
  const casesWithout: Array<[number, number]> = [
    [17, 0], [18, 99], [19, 105], [20, 110], [29, 110], [30, 105], [31, 99],
    [32, 94], [33, 88], [34, 83], [35, 77], [36, 72], [37, 66], [38, 61],
    [39, 55], [40, 50], [41, 39], [42, 28], [43, 17], [44, 6], [45, 0], [50, 0],
  ]
  it.each(casesWithout)('age %i → %i points (without spouse)', (age, pts) => {
    expect(score({ dateOfBirth: dobForAge(age) }).core.age).toBe(pts)
  })

  const spouse = { education: 'secondary', language: null, canadianWorkMonths: 0, workingInCanada: false, studiedInCanada: false } as const
  const casesWith: Array<[number, number]> = [
    [18, 90], [19, 95], [25, 100], [30, 95], [35, 70], [40, 45], [44, 5], [45, 0],
  ]
  it.each(casesWith)('age %i → %i points (with spouse)', (age, pts) => {
    expect(score({ dateOfBirth: dobForAge(age), spouse }).core.age).toBe(pts)
  })
})

describe('core: education', () => {
  const cases: Array<[EducationLevel, number, number]> = [
    ['less-than-secondary', 0, 0],
    ['secondary', 30, 28],
    ['one-year-post-secondary', 90, 84],
    ['two-year-post-secondary', 98, 91],
    ['bachelors', 120, 112],
    ['two-or-more-credentials', 128, 119],
    ['masters-or-professional', 135, 126],
    ['doctoral', 150, 140],
  ]
  it.each(cases)('%s → %i without / %i with spouse', (level, without, withSp) => {
    expect(score({ education: level }).core.education).toBe(without)
    const spouse = { education: 'secondary', language: null, canadianWorkMonths: 0, workingInCanada: false, studiedInCanada: false } as const
    expect(score({ education: level, spouse }).core.education).toBe(withSp)
  })
})

describe('core: first official language', () => {
  const perAbility: Array<[number, number, number]> = [
    // CLB level, without spouse, with spouse
    [3, 0, 0], [4, 6, 6], [5, 6, 6], [6, 9, 8], [7, 17, 16],
    [8, 23, 22], [9, 31, 29], [10, 34, 32], [12, 34, 32],
  ]
  it.each(perAbility)('CLB %i on all abilities', (level, without, withSp) => {
    expect(
      score({ firstLanguage: { language: 'english', clb: uniformClb(level) } }).core.firstLanguage,
    ).toBe(without * 4)
    const spouse = { education: 'secondary', language: null, canadianWorkMonths: 0, workingInCanada: false, studiedInCanada: false } as const
    expect(
      score({ firstLanguage: { language: 'english', clb: uniformClb(level) }, spouse }).core
        .firstLanguage,
    ).toBe(withSp * 4)
  })

  it('scores mixed abilities independently', () => {
    // L9 R8 W7 S6 → 31 + 23 + 17 + 9 = 80
    expect(
      score({ firstLanguage: { language: 'english', clb: clb(9, 8, 7, 6) } }).core.firstLanguage,
    ).toBe(80)
  })
})

describe('core: second official language', () => {
  const mk = (level: number): Partial<Profile> => ({
    firstLanguage: { language: 'english', clb: uniformClb(9) },
    secondLanguage: { language: 'french', clb: uniformClb(level) },
  })
  it('scores per ability: ≤4→0, 5-6→1, 7-8→3, 9+→6', () => {
    expect(score(mk(4)).core.secondLanguage).toBe(0)
    expect(score(mk(5)).core.secondLanguage).toBe(4)
    expect(score(mk(6)).core.secondLanguage).toBe(4)
    expect(score(mk(7)).core.secondLanguage).toBe(12)
    expect(score(mk(8)).core.secondLanguage).toBe(12)
  })
  it('caps at 24 without spouse and 22 with spouse', () => {
    expect(score(mk(9)).core.secondLanguage).toBe(24)
    const spouse = { education: 'secondary', language: null, canadianWorkMonths: 0, workingInCanada: false, studiedInCanada: false } as const
    expect(score({ ...mk(9), spouse }).core.secondLanguage).toBe(22)
  })
})

describe('core: Canadian work experience', () => {
  const cases: Array<[number, number, number]> = [
    // months, without spouse, with spouse
    [0, 0, 0], [11, 0, 0], [12, 40, 35], [23, 40, 35], [24, 53, 46],
    [36, 64, 56], [48, 72, 63], [60, 80, 70], [90, 80, 70],
  ]
  it.each(cases)('%i months → %i without / %i with spouse', (months, without, withSp) => {
    expect(score({ canadianWorkMonths: months, workingInCanada: false }).core.canadianWork).toBe(without)
    const spouse = { education: 'secondary', language: null, canadianWorkMonths: 0, workingInCanada: false, studiedInCanada: false } as const
    expect(score({ canadianWorkMonths: months, spouse }).core.canadianWork).toBe(withSp)
  })
})

describe('core: labour market integration', () => {
  const spouse = { education: 'secondary', language: null, canadianWorkMonths: 0, workingInCanada: false, studiedInCanada: false } as const

  it('adds high-wage points once 12 months are in a listed occupation', () => {
    const cases: Array<[HighWageLevel, number]> = [['none', 0], ['130', 20], ['150', 40], ['200', 70]]
    for (const [level, pts] of cases) {
      expect(score({ canadianWorkMonths: 11, canadianWorkHighWage: level }).core.highWage).toBe(0)
      expect(score({ canadianWorkMonths: 12, canadianWorkHighWage: level }).core.highWage).toBe(pts)
      expect(score({ canadianWorkMonths: 12, canadianWorkHighWage: level, spouse }).core.highWage).toBe(pts)
    }
  })

  it('caps Canadian work at 150 without / 140 with spouse', () => {
    expect(score({ canadianWorkMonths: 60, canadianWorkHighWage: '200' }).core.labourMarket).toBe(150)
    expect(score({ canadianWorkMonths: 60, canadianWorkHighWage: '200', spouse }).core.labourMarket).toBe(140)
  })

  it('scores a job offer by its occupation level, same with or without spouse', () => {
    const cases: Array<[HighWageLevel, number]> = [['none', 0], ['130', 50], ['150', 70], ['200', 100]]
    for (const [level, pts] of cases) {
      expect(score({ jobOffer: true, jobOfferHighWage: level }).core.jobOffer).toBe(pts)
      expect(score({ jobOffer: true, jobOfferHighWage: level, spouse }).core.jobOffer).toBe(pts)
    }
  })

  it('ignores the offer level without a job offer', () => {
    expect(score({ jobOffer: false, jobOfferHighWage: '200' }).core.jobOffer).toBe(0)
  })

  it('takes the higher of Canadian work and job offer, never both', () => {
    // 1 year unlisted (40) vs 2× offer (100)
    const offerWins = score({ canadianWorkMonths: 12, jobOffer: true, jobOfferHighWage: '200' })
    expect(offerWins.core.canadianWork).toBe(40)
    expect(offerWins.core.jobOffer).toBe(100)
    expect(offerWins.core.labourMarket).toBe(100)
    expect(offerWins.core.subtotal).toBe(110 + 100)

    // 5 years at 1.3× (80 + 20) vs 1.5× offer (70)
    const workWins = score({
      canadianWorkMonths: 60,
      canadianWorkHighWage: '130',
      jobOffer: true,
      jobOfferHighWage: '150',
    })
    expect(workWins.core.labourMarket).toBe(100)
    expect(workWins.core.subtotal).toBe(110 + 100)
  })

  it('keeps skill transferability on work length only', () => {
    const plain = score({ education: 'bachelors', canadianWorkMonths: 24 })
    const highWage = score({ education: 'bachelors', canadianWorkMonths: 24, canadianWorkHighWage: '200' })
    expect(highWage.transferability).toEqual(plain.transferability)
  })
})

describe('spouse factors', () => {
  it('scores spouse education', () => {
    const cases: Array<[EducationLevel, number]> = [
      ['less-than-secondary', 0], ['secondary', 2], ['one-year-post-secondary', 6],
      ['two-year-post-secondary', 7], ['bachelors', 8], ['two-or-more-credentials', 9],
      ['masters-or-professional', 10], ['doctoral', 10],
    ]
    for (const [level, pts] of cases) {
      expect(
        score({ spouse: { education: level, language: null, canadianWorkMonths: 0, workingInCanada: false, studiedInCanada: false } }).spouse
          .education,
      ).toBe(pts)
    }
  })
  it('scores spouse language per ability: ≤4→0, 5-6→1, 7-8→3, 9+→5', () => {
    expect(
      score({
        spouse: {
          education: 'secondary',
          language: { language: 'english', clb: clb(9, 8, 6, 4) },
          canadianWorkMonths: 0,
          workingInCanada: false,
        studiedInCanada: false,
        },
      }).spouse.language,
    ).toBe(5 + 3 + 1 + 0)
    expect(
      score({
        spouse: {
          education: 'secondary',
          language: { language: 'english', clb: uniformClb(10) },
          canadianWorkMonths: 0,
          workingInCanada: false,
        studiedInCanada: false,
        },
      }).spouse.language,
    ).toBe(20)
  })
  it('scores spouse Canadian work experience', () => {
    const cases: Array<[number, number]> = [
      [0, 0], [11, 0], [12, 5], [24, 7], [36, 8], [48, 9], [60, 10], [72, 10],
    ]
    for (const [months, pts] of cases) {
      expect(
        score({ spouse: { education: 'less-than-secondary', language: null, canadianWorkMonths: months, workingInCanada: false, studiedInCanada: false } })
          .spouse.canadianWork,
      ).toBe(pts)
    }
  })
  it('reports zero spouse subtotal without a spouse', () => {
    expect(score().spouse.subtotal).toBe(0)
  })
})

describe('transferability: education × language', () => {
  it('requires CLB 7 on all abilities', () => {
    expect(
      score({ education: 'bachelors', firstLanguage: { language: 'english', clb: clb(7, 7, 7, 6) } })
        .transferability.educationLanguage,
    ).toBe(0)
  })
  it('bachelors: 13 at CLB7+, 25 at CLB9+', () => {
    expect(
      score({ education: 'bachelors', firstLanguage: { language: 'english', clb: uniformClb(7) } })
        .transferability.educationLanguage,
    ).toBe(13)
    expect(
      score({ education: 'bachelors', firstLanguage: { language: 'english', clb: clb(9, 9, 9, 8) } })
        .transferability.educationLanguage,
    ).toBe(13)
    expect(
      score({ education: 'bachelors', firstLanguage: { language: 'english', clb: uniformClb(9) } })
        .transferability.educationLanguage,
    ).toBe(25)
  })
  it('two-or-more credentials / masters / doctoral: 25 at CLB7+, 50 at CLB9+', () => {
    for (const level of ['two-or-more-credentials', 'masters-or-professional', 'doctoral'] as const) {
      expect(
        score({ education: level, firstLanguage: { language: 'english', clb: uniformClb(7) } })
          .transferability.educationLanguage,
      ).toBe(25)
      expect(
        score({ education: level, firstLanguage: { language: 'english', clb: uniformClb(9) } })
          .transferability.educationLanguage,
      ).toBe(50)
    }
  })
  it('secondary or less: 0', () => {
    expect(
      score({ education: 'secondary', firstLanguage: { language: 'english', clb: uniformClb(10) } })
        .transferability.educationLanguage,
    ).toBe(0)
  })
})

describe('transferability: education × Canadian work', () => {
  it('bachelors: 13 with 1 year, 25 with 2+ years', () => {
    expect(
      score({ education: 'bachelors', canadianWorkMonths: 12, workingInCanada: false }).transferability.educationCanadianWork,
    ).toBe(13)
    expect(
      score({ education: 'bachelors', canadianWorkMonths: 24, workingInCanada: false }).transferability.educationCanadianWork,
    ).toBe(25)
  })
  it('masters: 25 with 1 year, 50 with 2+ years', () => {
    expect(
      score({ education: 'masters-or-professional', canadianWorkMonths: 12, workingInCanada: false }).transferability
        .educationCanadianWork,
    ).toBe(25)
    expect(
      score({ education: 'masters-or-professional', canadianWorkMonths: 25, workingInCanada: false }).transferability
        .educationCanadianWork,
    ).toBe(50)
  })
  it('education subtotal caps at 50', () => {
    const s = score({
      education: 'doctoral',
      firstLanguage: { language: 'english', clb: uniformClb(9) },
      canadianWorkMonths: 24,
      workingInCanada: false,
    })
    expect(s.transferability.educationLanguage).toBe(50)
    expect(s.transferability.educationCanadianWork).toBe(50)
    expect(s.transferability.educationSubtotal).toBe(50)
  })
})

describe('transferability: foreign work experience', () => {
  it('foreign × language: 1-2yr → 13/25, 3+yr → 25/50', () => {
    const lang7 = { language: 'english', clb: uniformClb(7) } as const
    const lang9 = { language: 'english', clb: uniformClb(9) } as const
    expect(score({ foreignWorkMonths: 12, firstLanguage: lang7 }).transferability.foreignWorkLanguage).toBe(13)
    expect(score({ foreignWorkMonths: 24, firstLanguage: lang9 }).transferability.foreignWorkLanguage).toBe(25)
    expect(score({ foreignWorkMonths: 36, firstLanguage: lang7 }).transferability.foreignWorkLanguage).toBe(25)
    expect(score({ foreignWorkMonths: 36, firstLanguage: lang9 }).transferability.foreignWorkLanguage).toBe(50)
  })
  it('foreign × language: 0 below CLB 7 or without foreign experience', () => {
    expect(
      score({ foreignWorkMonths: 36, firstLanguage: { language: 'english', clb: uniformClb(6) } })
        .transferability.foreignWorkLanguage,
    ).toBe(0)
    expect(
      score({ foreignWorkMonths: 0, firstLanguage: { language: 'english', clb: uniformClb(9) } })
        .transferability.foreignWorkLanguage,
    ).toBe(0)
  })
  it('foreign × Canadian work: 1-2yr foreign → 13/25, 3+yr → 25/50', () => {
    expect(
      score({ foreignWorkMonths: 12, canadianWorkMonths: 12, workingInCanada: false }).transferability.foreignWorkCanadianWork,
    ).toBe(13)
    expect(
      score({ foreignWorkMonths: 12, canadianWorkMonths: 24, workingInCanada: false }).transferability.foreignWorkCanadianWork,
    ).toBe(25)
    expect(
      score({ foreignWorkMonths: 36, canadianWorkMonths: 12, workingInCanada: false }).transferability.foreignWorkCanadianWork,
    ).toBe(25)
    expect(
      score({ foreignWorkMonths: 36, canadianWorkMonths: 24, workingInCanada: false }).transferability.foreignWorkCanadianWork,
    ).toBe(50)
  })
  it('foreign subtotal caps at 50', () => {
    const s = score({
      foreignWorkMonths: 36,
      canadianWorkMonths: 24,
      firstLanguage: { language: 'english', clb: uniformClb(9) },
    })
    expect(s.transferability.foreignWorkSubtotal).toBe(50)
  })
})

describe('transferability: certificate of qualification', () => {
  it('25 at CLB5+ (one under 7), 50 at CLB7+', () => {
    expect(
      score({ certificateOfQualification: true, firstLanguage: { language: 'english', clb: uniformClb(5) } })
        .transferability.certificate,
    ).toBe(25)
    expect(
      score({ certificateOfQualification: true, firstLanguage: { language: 'english', clb: clb(7, 7, 7, 5) } })
        .transferability.certificate,
    ).toBe(25)
    expect(
      score({ certificateOfQualification: true, firstLanguage: { language: 'english', clb: uniformClb(7) } })
        .transferability.certificate,
    ).toBe(50)
  })
  it('0 below CLB 5 or without certificate', () => {
    expect(
      score({ certificateOfQualification: true, firstLanguage: { language: 'english', clb: clb(5, 5, 5, 4) } })
        .transferability.certificate,
    ).toBe(0)
    expect(
      score({ certificateOfQualification: false, firstLanguage: { language: 'english', clb: uniformClb(9) } })
        .transferability.certificate,
    ).toBe(0)
  })
})

describe('transferability: overall cap', () => {
  it('caps combined transferability at 100', () => {
    const s = score({
      education: 'doctoral',
      firstLanguage: { language: 'english', clb: uniformClb(9) },
      canadianWorkMonths: 24,
      foreignWorkMonths: 36,
      certificateOfQualification: true,
    })
    // 50 (education) + 50 (foreign) + 50 (certificate) → capped
    expect(s.transferability.subtotal).toBe(100)
  })
})

describe('additional points', () => {
  it('sibling in Canada → 15', () => {
    expect(score({ siblingInCanada: true }).additional.sibling).toBe(15)
  })
  it('provincial nomination → 600', () => {
    expect(score({ provincialNomination: true }).additional.provincialNomination).toBe(600)
  })
  it('Canadian education credential → 15 / 30', () => {
    expect(score({ canadianEducationCredential: 'one-year' }).additional.canadianEducation).toBe(15)
    expect(score({ canadianEducationCredential: 'two-year' }).additional.canadianEducation).toBe(15)
    expect(score({ canadianEducationCredential: 'three-plus-year' }).additional.canadianEducation).toBe(30)
  })
  it('French NCLC7+ with English CLB5+ → 50', () => {
    expect(
      score({
        firstLanguage: { language: 'french', clb: uniformClb(7) },
        secondLanguage: { language: 'english', clb: uniformClb(5) },
      }).additional.french,
    ).toBe(50)
  })
  it('French NCLC7+ with English CLB4 or lower / no English test → 25', () => {
    expect(
      score({
        firstLanguage: { language: 'french', clb: uniformClb(7) },
        secondLanguage: { language: 'english', clb: uniformClb(4) },
      }).additional.french,
    ).toBe(25)
    expect(
      score({ firstLanguage: { language: 'french', clb: uniformClb(7) } }).additional.french,
    ).toBe(25)
  })
  it('French as second language also qualifies', () => {
    expect(
      score({
        firstLanguage: { language: 'english', clb: uniformClb(9) },
        secondLanguage: { language: 'french', clb: uniformClb(7) },
      }).additional.french,
    ).toBe(50)
  })
  it('no bonus if any French ability under NCLC 7', () => {
    expect(
      score({
        firstLanguage: { language: 'french', clb: clb(7, 7, 7, 6) },
        secondLanguage: { language: 'english', clb: uniformClb(9) },
      }).additional.french,
    ).toBe(0)
  })
  it('caps additional points at 600', () => {
    const s = score({
      provincialNomination: true,
      siblingInCanada: true,
      canadianEducationCredential: 'three-plus-year',
      firstLanguage: { language: 'french', clb: uniformClb(7) },
      secondLanguage: { language: 'english', clb: uniformClb(5) },
    })
    expect(s.additional.subtotal).toBe(600)
  })
})

describe('language designation swap', () => {
  it('detects reversed designations and quantifies the gain', () => {
    const reversed = baseProfile({
      firstLanguage: { language: 'french', clb: uniformClb(5) },
      secondLanguage: { language: 'english', clb: uniformClb(9) },
    })
    // Reversed: first 6×4=24, second capped 24 → 48; no transferability (first < CLB7).
    expect(calculateCrs(reversed, AS_OF).core.firstLanguage).toBe(24)
    const gain = swapGain(reversed, AS_OF)
    // Swapped: first 31×4=124, second 1×4=4 → +76 core language alone.
    expect(gain).toBeGreaterThanOrEqual(76)
    expect(calculateCrs(swapLanguages(reversed)!, AS_OF).total).toBe(
      calculateCrs(reversed, AS_OF).total + gain,
    )
  })
  it('reports zero gain for correct designations or no second language', () => {
    expect(
      swapGain(
        baseProfile({
          firstLanguage: { language: 'english', clb: uniformClb(9) },
          secondLanguage: { language: 'french', clb: uniformClb(5) },
        }),
        AS_OF,
      ),
    ).toBe(0)
    expect(swapGain(baseProfile(), AS_OF)).toBe(0)
    expect(swapLanguages(baseProfile())).toBeNull()
  })
})

describe('integration', () => {
  it('single candidate, full profile', () => {
    const s = calculateCrs(
      baseProfile({
        dateOfBirth: '1997-01-10', // age 29 at AS_OF
        education: 'bachelors',
        firstLanguage: { language: 'english', clb: clb(8, 8, 7, 7) },
        canadianWorkMonths: 12,
        foreignWorkMonths: 36,
      }),
      AS_OF,
    )
    expect(s.core.age).toBe(110)
    expect(s.core.education).toBe(120)
    expect(s.core.firstLanguage).toBe(23 + 23 + 17 + 17)
    expect(s.core.canadianWork).toBe(40)
    expect(s.core.subtotal).toBe(350)
    expect(s.transferability.educationSubtotal).toBe(26)
    expect(s.transferability.foreignWorkSubtotal).toBe(50)
    expect(s.total).toBe(350 + 76)
  })

  it('married candidate with accompanying spouse', () => {
    const s = calculateCrs(
      baseProfile({
        dateOfBirth: '1997-01-10',
        education: 'bachelors',
        firstLanguage: { language: 'english', clb: uniformClb(9) },
        canadianWorkMonths: 36,
        siblingInCanada: true,
        spouse: {
          education: 'bachelors',
          language: { language: 'english', clb: clb(5, 6, 7, 8) },
          canadianWorkMonths: 24,
          workingInCanada: false,
        studiedInCanada: false,
        },
      }),
      AS_OF,
    )
    expect(s.withSpouse).toBe(true)
    expect(s.core.subtotal).toBe(100 + 112 + 116 + 56)
    expect(s.spouse.subtotal).toBe(8 + 8 + 7)
    expect(s.transferability.subtotal).toBe(50)
    expect(s.additional.subtotal).toBe(15)
    expect(s.total).toBe(384 + 23 + 50 + 15)
  })

  it('a maximal profile reaches CRS_MAX with or without a spouse', () => {
    const maximal = baseProfile({
      dateOfBirth: dobForAge(25),
      education: 'doctoral',
      firstLanguage: { language: 'french', clb: uniformClb(10) },
      secondLanguage: { language: 'english', clb: uniformClb(10) },
      canadianWorkMonths: 60,
      canadianWorkHighWage: '200',
      foreignWorkMonths: 36,
      provincialNomination: true,
    })
    expect(calculateCrs(maximal, AS_OF).total).toBe(CRS_MAX)
    const married = calculateCrs(
      {
        ...maximal,
        spouse: {
          education: 'doctoral',
          language: { language: 'english', clb: uniformClb(10) },
          canadianWorkMonths: 60,
          workingInCanada: false,
          studiedInCanada: false,
        },
      },
      AS_OF,
    )
    expect(married.total).toBe(CRS_MAX)
  })
})
