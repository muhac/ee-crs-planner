import { describe, it, expect } from 'vitest'
import type { Profile } from './types'
import type { Scenario } from './simulate'
import { projectProfile, simulate } from './simulate'

const START = '2026-08-18'

function profile(overrides: Partial<Profile> = {}): Profile {
  return {
    dateOfBirth: '1997-01-10',
    education: 'bachelors',
    canadianEducationCredential: 'none',
    firstLanguage: { language: 'english', clb: { listening: 8, reading: 8, writing: 7, speaking: 7 } },
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

function scenario(overrides: Partial<Scenario> = {}): Scenario {
  return {
    id: 's1',
    name: 'test',
    events: [],
    horizonMonths: 36,
    ...overrides,
  }
}

describe('simulate', () => {
  it('returns one point per month including month 0', () => {
    const points = simulate(profile(), scenario({ horizonMonths: 12 }), START)
    expect(points).toHaveLength(13)
    expect(points[0].date).toBe('2026-08-18')
    expect(points[1].date).toBe('2026-09-18')
    expect(points[12].date).toBe('2027-08-18')
  })

  it('month 0 equals the plain current score', () => {
    const points = simulate(profile(), scenario(), START)
    expect(points[0].score.core.age).toBe(110)
    expect(points[0].score.core.canadianWork).toBe(0)
  })

  it('accrues Canadian work experience while working in Canada', () => {
    const points = simulate(profile({ workingInCanada: true }), scenario(), START)
    expect(points[11].score.core.canadianWork).toBe(0)
    expect(points[12].score.core.canadianWork).toBe(40)
    expect(points[24].score.core.canadianWork).toBe(53)
  })

  it('accrues foreign work experience while working abroad', () => {
    const points = simulate(
      profile({ foreignWorkMonths: 30, workingAbroad: true }),
      scenario(),
      START,
    )
    // 30 → 36 months at offset 6: foreign×language tier moves from 1-2yr (13) to 3+yr (25)
    expect(points[5].score.transferability.foreignWorkLanguage).toBe(13)
    expect(points[6].score.transferability.foreignWorkLanguage).toBe(25)
  })

  it('starts accruing Canadian experience from a start-working event', () => {
    const sc = scenario({
      events: [
        { id: 'e1', date: '2027-02-01', type: 'work-status-update', target: 'canada', working: true },
      ],
    })
    // Event lands between offsets 5 (2027-01-18) and 6 (2027-02-18):
    // months accrue from the offset-6 boundary onward.
    expect(projectProfile(profile(), sc, START, 6).canadianWorkMonths).toBe(0)
    expect(projectProfile(profile(), sc, START, 7).canadianWorkMonths).toBe(1)
    expect(projectProfile(profile(), sc, START, 18).canadianWorkMonths).toBe(12)
    expect(projectProfile(profile(), sc, START, 18).workingInCanada).toBe(true)
    const points = simulate(profile(), sc, START)
    expect(points[17].score.core.canadianWork).toBe(0)
    expect(points[18].score.core.canadianWork).toBe(40)
  })

  it('stops accruing after a stop-working event', () => {
    const sc = scenario({
      events: [
        { id: 'e1', date: '2027-02-01', type: 'work-status-update', target: 'canada', working: false },
      ],
    })
    const base = profile({ workingInCanada: true })
    expect(projectProfile(base, sc, START, 6).canadianWorkMonths).toBe(6)
    expect(projectProfile(base, sc, START, 36).canadianWorkMonths).toBe(6)
    expect(projectProfile(base, sc, START, 36).workingInCanada).toBe(false)
  })

  it('accrues spouse Canadian experience and applies spouse events', () => {
    const base = profile({
      spouse: {
        education: 'secondary',
        language: null,
        canadianWorkMonths: 0,
        workingInCanada: true,
      studiedInCanada: false,
      },
    })
    const sc = scenario({
      events: [
        { id: 'e1', date: '2027-06-01', type: 'spouse-education-update', education: 'masters-or-professional' },
        { id: 'e2', date: '2027-08-01', type: 'spouse-work-status-update', working: false },
      ],
    })
    // Spouse works from month 0; stops after 2027-08-18 boundary (offset 12).
    expect(projectProfile(base, sc, START, 12).spouse?.canadianWorkMonths).toBe(12)
    expect(projectProfile(base, sc, START, 36).spouse?.canadianWorkMonths).toBe(12)
    expect(projectProfile(base, sc, START, 36).spouse?.workingInCanada).toBe(false)
    const points = simulate(base, sc, START)
    expect(points[11].score.spouse.canadianWork).toBe(0)
    expect(points[12].score.spouse.canadianWork).toBe(5)
    // Spouse education upgrades between offsets 9 and 10.
    expect(points[9].score.spouse.education).toBe(2)
    expect(points[10].score.spouse.education).toBe(10)
  })

  it('drops age points after a birthday', () => {
    // 30th birthday on 2026-11-05, between offsets 2 and 3
    const points = simulate(profile({ dateOfBirth: '1996-11-05' }), scenario(), START)
    expect(points[2].score.core.age).toBe(110)
    expect(points[3].score.core.age).toBe(105)
  })

  it('applies dated events from their month onward', () => {
    const points = simulate(
      profile(),
      scenario({
        events: [
          {
            id: 'e1',
            date: '2027-01-01',
            type: 'language-update',
            target: 'first',
            test: { language: 'english', clb: { listening: 9, reading: 9, writing: 9, speaking: 9 } },
          },
        ],
      }),
      START,
    )
    // offset 4 → 2026-12-18 (before the event), offset 5 → 2027-01-18 (after)
    expect(points[4].score.core.firstLanguage).toBe(23 + 23 + 17 + 17)
    expect(points[5].score.core.firstLanguage).toBe(124)
  })

  it('applies education and boolean events', () => {
    const points = simulate(
      profile(),
      scenario({
        events: [
          { id: 'e1', date: '2027-06-01', type: 'education-update', education: 'masters-or-professional', canadianEducationCredential: 'one-or-two-year' },
          { id: 'e2', date: '2028-01-01', type: 'provincial-nomination' },
        ],
      }),
      START,
    )
    expect(points[9].score.core.education).toBe(120)
    expect(points[10].score.core.education).toBe(135)
    expect(points[10].score.additional.canadianEducation).toBe(15)
    expect(points[16].score.additional.provincialNomination).toBe(0)
    expect(points[17].score.additional.provincialNomination).toBe(600)
  })

  it('applies second-language and spouse events', () => {
    const points = simulate(
      profile({
        spouse: { education: 'secondary', language: null, canadianWorkMonths: 0, workingInCanada: false, studiedInCanada: false },
      }),
      scenario({
        events: [
          {
            id: 'e1',
            date: '2026-10-01',
            type: 'language-update',
            target: 'second',
            test: { language: 'french', clb: { listening: 5, reading: 5, writing: 5, speaking: 5 } },
          },
          {
            id: 'e2',
            date: '2026-10-01',
            type: 'spouse-language-update',
            test: {
              language: 'english',
              clb: { listening: 9, reading: 9, writing: 9, speaking: 9 },
            },
          },
        ],
      }),
      START,
    )
    expect(points[1].score.core.secondLanguage).toBe(0)
    expect(points[2].score.core.secondLanguage).toBe(4)
    expect(points[2].score.spouse.language).toBe(20)
  })
})
