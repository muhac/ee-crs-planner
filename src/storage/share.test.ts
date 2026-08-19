import { describe, it, expect } from 'vitest'
import { compressToEncodedURIComponent } from 'lz-string'
import type { StoredProfile } from './schema'
import { decodeShare, encodeShare, parseShareHash, SHARE_HASH_PREFIX } from './share'

const stored: StoredProfile = {
  id: 'abc',
  name: '测试档案',
  updatedAt: '2026-08-18',
  profile: {
    dateOfBirth: '1997-01-10',
    education: 'bachelors',
    canadianEducationCredential: 'none',
    firstLanguage: { language: 'english', clb: { listening: 8, reading: 8, writing: 7, speaking: 7 } },
    secondLanguage: null,
    canadianWorkMonths: 12,
    foreignWorkMonths: 36,
    workingInCanada: true,
    workingAbroad: false,
    canadianWorkTeer: 'teer-0-1',
    jobOffer: false,
    settlementFunds: true,
    relativeInCanada: false,
    certificateOfQualification: false,
    provincialNomination: false,
    siblingInCanada: false,
    spouse: null,
  },
  scenarios: [{ id: 's1', name: '继续工作', events: [], horizonMonths: 36 }],
}

describe('share encoding', () => {
  it('round-trips a stored profile', () => {
    expect(decodeShare(encodeShare(stored))).toEqual(stored)
  })

  it('produces a URL-safe string', () => {
    expect(encodeShare(stored)).toMatch(/^[A-Za-z0-9+$\-_.!*'(),]+$/)
  })

  it('rejects garbage input', () => {
    expect(decodeShare('not-a-valid-blob')).toBeNull()
    expect(decodeShare('')).toBeNull()
  })

  it('upgrades v1 payloads: working flags move from scenario to profile', () => {
    const { workingInCanada: _wic, workingAbroad: _wa, ...v1Profile } = stored.profile
    const v1 = {
      app: 'ee-crs',
      schemaVersion: 1,
      profile: {
        ...stored,
        profile: v1Profile,
        scenarios: [
          { id: 's1', name: '继续工作', workingInCanada: true, workingAbroad: false, events: [], horizonMonths: 36 },
        ],
      },
    }
    const decoded = decodeShare(compressToEncodedURIComponent(JSON.stringify(v1)))
    expect(decoded).toEqual(stored)
  })

  it('upgrades v2 payloads: spouse language and events gain a full test result', () => {
    const clb9 = { listening: 9, reading: 9, writing: 9, speaking: 9 }
    const v2 = {
      app: 'ee-crs',
      schemaVersion: 2,
      profile: {
        ...stored,
        profile: { ...stored.profile, spouse: { education: 'bachelors', language: clb9, canadianWorkMonths: 0 } },
        scenarios: [
          {
            id: 's1',
            name: '继续工作',
            events: [{ id: 'e1', date: '2027-01-01', type: 'spouse-language-update', clb: clb9 }],
            horizonMonths: 36,
          },
        ],
      },
    }
    const decoded = decodeShare(compressToEncodedURIComponent(JSON.stringify(v2)))
    expect(decoded?.profile.spouse?.language).toEqual({ language: 'english', clb: clb9 })
    expect(decoded?.scenarios[0].events[0]).toEqual({
      id: 'e1',
      date: '2027-01-01',
      type: 'spouse-language-update',
      test: { language: 'english', clb: clb9 },
    })
  })

  it('parses only well-formed share hashes', () => {
    expect(parseShareHash(SHARE_HASH_PREFIX + encodeShare(stored))).toEqual(stored)
    expect(parseShareHash('#other=123')).toBeNull()
    expect(parseShareHash('')).toBeNull()
  })
})
