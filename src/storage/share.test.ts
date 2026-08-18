import { describe, it, expect } from 'vitest'
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
    certificateOfQualification: false,
    provincialNomination: false,
    siblingInCanada: false,
    spouse: null,
  },
  scenarios: [
    { id: 's1', name: '继续工作', workingInCanada: true, workingAbroad: false, events: [], horizonMonths: 36 },
  ],
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

  it('parses only well-formed share hashes', () => {
    expect(parseShareHash(SHARE_HASH_PREFIX + encodeShare(stored))).toEqual(stored)
    expect(parseShareHash('#other=123')).toBeNull()
    expect(parseShareHash('')).toBeNull()
  })
})
