import { describe, expect, it } from 'vitest'
import { greetingForHour, parseCsv, toCsv, truncate, cn } from '@/utils'
import { scoreMatch } from '@/utils/search-score'

describe('utils', () => {
  it('greets by hour', () => {
    expect(greetingForHour(8)).toBe('Good morning')
    expect(greetingForHour(14)).toBe('Good afternoon')
    expect(greetingForHour(20)).toBe('Good evening')
  })

  it('truncates text', () => {
    expect(truncate('abcdefghij', 5)).toBe('abcd…')
  })

  it('parses and serializes csv', () => {
    const csv = toCsv([
      { name: 'A', value: 1 },
      { name: 'B, C', value: 2 },
    ])
    const parsed = parseCsv(csv)
    expect(parsed.headers).toEqual(['name', 'value'])
    expect(parsed.rows[0]).toEqual(['A', '1'])
    expect(parsed.rows[1]?.[0]).toBe('B, C')
  })

  it('joins class names', () => {
    expect(cn('a', false, 'b', undefined)).toBe('a b')
  })
})

describe('search scoring', () => {
  it('scores exact matches higher', () => {
    expect(scoreMatch('retention', 'retention')).toBeGreaterThan(
      scoreMatch('retention', 'customer retention rate'),
    )
  })
})
