import { describe, it, expect } from 'vitest'
import { clbToMinScore, scoreToClb } from './language-tests'

describe('scoreToClb', () => {
  it('CELPIP maps levels directly, capping at CLB 10', () => {
    expect(scoreToClb('celpip', 'listening', 12)).toBe(10)
    expect(scoreToClb('celpip', 'speaking', 10)).toBe(10)
    expect(scoreToClb('celpip', 'reading', 9)).toBe(9)
    expect(scoreToClb('celpip', 'writing', 4)).toBe(4)
    expect(scoreToClb('celpip', 'writing', 3)).toBe(3)
  })

  it('IELTS boundaries per ability', () => {
    expect(scoreToClb('ielts', 'listening', 8.5)).toBe(10)
    expect(scoreToClb('ielts', 'listening', 8.0)).toBe(9)
    expect(scoreToClb('ielts', 'listening', 7.5)).toBe(8)
    expect(scoreToClb('ielts', 'listening', 6.0)).toBe(7)
    expect(scoreToClb('ielts', 'listening', 4.5)).toBe(4)
    expect(scoreToClb('ielts', 'listening', 4.0)).toBe(3)
    expect(scoreToClb('ielts', 'reading', 8.0)).toBe(10)
    expect(scoreToClb('ielts', 'reading', 6.5)).toBe(8)
    expect(scoreToClb('ielts', 'reading', 3.5)).toBe(4)
    expect(scoreToClb('ielts', 'reading', 3.0)).toBe(3)
    expect(scoreToClb('ielts', 'writing', 7.5)).toBe(10)
    expect(scoreToClb('ielts', 'writing', 5.5)).toBe(6)
    expect(scoreToClb('ielts', 'speaking', 7.0)).toBe(9)
    expect(scoreToClb('ielts', 'speaking', 6.5)).toBe(8)
  })

  it('PTE Core boundaries per ability', () => {
    expect(scoreToClb('pte', 'listening', 89)).toBe(10)
    expect(scoreToClb('pte', 'listening', 88)).toBe(9)
    expect(scoreToClb('pte', 'listening', 28)).toBe(4)
    expect(scoreToClb('pte', 'listening', 27)).toBe(3)
    expect(scoreToClb('pte', 'reading', 88)).toBe(10)
    expect(scoreToClb('pte', 'reading', 77)).toBe(8)
    expect(scoreToClb('pte', 'writing', 90)).toBe(10)
    expect(scoreToClb('pte', 'writing', 89)).toBe(9)
    expect(scoreToClb('pte', 'writing', 41)).toBe(4)
    expect(scoreToClb('pte', 'speaking', 84)).toBe(9)
    expect(scoreToClb('pte', 'speaking', 68)).toBe(7)
  })

  it('TEF Canada boundaries per ability', () => {
    expect(scoreToClb('tef', 'listening', 316)).toBe(10)
    expect(scoreToClb('tef', 'listening', 315)).toBe(9)
    expect(scoreToClb('tef', 'listening', 145)).toBe(4)
    expect(scoreToClb('tef', 'listening', 144)).toBe(3)
    expect(scoreToClb('tef', 'reading', 263)).toBe(10)
    expect(scoreToClb('tef', 'reading', 207)).toBe(7)
    expect(scoreToClb('tef', 'writing', 393)).toBe(10)
    expect(scoreToClb('tef', 'writing', 310)).toBe(7)
    expect(scoreToClb('tef', 'speaking', 226)).toBe(5)
    expect(scoreToClb('tef', 'speaking', 181)).toBe(4)
  })

  it('TCF Canada boundaries per ability', () => {
    expect(scoreToClb('tcf', 'listening', 549)).toBe(10)
    expect(scoreToClb('tcf', 'listening', 548)).toBe(9)
    expect(scoreToClb('tcf', 'listening', 331)).toBe(4)
    expect(scoreToClb('tcf', 'listening', 330)).toBe(3)
    expect(scoreToClb('tcf', 'reading', 524)).toBe(9)
    expect(scoreToClb('tcf', 'reading', 453)).toBe(7)
    expect(scoreToClb('tcf', 'writing', 16)).toBe(10)
    expect(scoreToClb('tcf', 'writing', 10)).toBe(7)
    expect(scoreToClb('tcf', 'writing', 6)).toBe(5)
    expect(scoreToClb('tcf', 'speaking', 4)).toBe(4)
    expect(scoreToClb('tcf', 'speaking', 3)).toBe(3)
  })
})

describe('clbToMinScore', () => {
  it('returns the lowest raw score for a CLB level', () => {
    expect(clbToMinScore('ielts', 'listening', 9)).toBe(8.0)
    expect(clbToMinScore('ielts', 'reading', 4)).toBe(3.5)
    expect(clbToMinScore('pte', 'writing', 7)).toBe(69)
    expect(clbToMinScore('tef', 'speaking', 10)).toBe(393)
    expect(clbToMinScore('celpip', 'listening', 10)).toBe(10)
  })
  it('handles below-4 levels', () => {
    expect(clbToMinScore('ielts', 'listening', 3)).toBe(0)
  })
})
