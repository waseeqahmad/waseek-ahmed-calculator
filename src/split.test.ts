import { describe, expect, it } from 'vitest'
import { addFriendError, buildMessage, emptyBill, fmt, parseBill, parseTotal, payerError, split, summary, waUrl } from './split'

// Shares as the UI shows them: payer first, then each friend.
function shares(total: number, n: number) {
  const s = split(total, n)
  if ('error' in s) return s.error
  return [s.payerShare, ...Array(n - 1).fill(s.friendShare)]
}

describe('S-1 parseTotal', () => {
  it.each([
    ['900', 900],
    ['1000', 1000],
    ['1,500', 1500],
    ['  1500  ', 1500],
    ['10000000', 10_000_000],
    ['10,000,000', 10_000_000],
    ['1', 1],
  ])('%j reads as %d', (raw, value) => expect(parseTotal(raw)).toEqual({ value, error: null }))

  it('empty is a hint, not an error', () => {
    expect(parseTotal('')).toEqual({ value: null, error: null })
    expect(parseTotal('   ')).toEqual({ value: null, error: null })
  })

  it.each([
    ['10000001', "Total can't be more than 10,000,000 PKR"],
    ['99999999999999999999999', "Total can't be more than 10,000,000 PKR"],
    ['0', 'Total must be more than 0 PKR'],
    ['-50', 'Total must be more than 0 PKR'],
    ['1500.50', 'Enter whole rupees (no paisa)'],
    ['1500.', 'Enter whole rupees (no paisa)'],
    ['.5', 'Enter whole rupees (no paisa)'],
    ['12abc', 'Enter a number in whole rupees'],
    ['abc', 'Enter a number in whole rupees'],
    ['1e5', 'Enter a number in whole rupees'],
    ['.', 'Enter a number in whole rupees'],
    [',', 'Enter a number in whole rupees'],
    ['1,,5', 'Enter a number in whole rupees'],
  ])('%j is rejected with %j', (raw, error) => expect(parseTotal(raw)).toEqual({ value: null, error }))
})

describe('S-1 split', () => {
  it.each([
    [900, 3, [300, 300, 300]],
    [1000, 3, [332, 334, 334]],
    [1500, 3, [500, 500, 500]],
    [10_000_000, 3, [3_333_332, 3_333_334, 3_333_334]],
    [1, 2, [0, 1]],
    [10, 10, Array(10).fill(1)],
    [900, 2, [450, 450]],
  ])('%d between %d', (total, n, expected) => expect(shares(total, n)).toEqual(expected))

  it('too small', () => {
    expect(shares(11, 10)).toBe('Total is too small to split between 10 people in whole rupees.')
  })

  it('formats with thousands separators', () => {
    expect(`${fmt(3_333_334)} PKR`).toBe('3,333,334 PKR')
  })

  it('property: shares are whole, never negative, and always add up exactly to the total', () => {
    let seed = 42 // mulberry32, seeded so failures reproduce
    const rand = () => {
      seed = (seed + 0x6d2b79f5) | 0
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
    for (let i = 0; i < 20_000; i++) {
      const total = 1 + Math.floor(rand() * (i % 2 ? 10_000_000 : 200))
      const n = 2 + Math.floor(rand() * 49)
      const s = split(total, n)
      if ('error' in s) {
        expect(Math.ceil(total / n) * (n - 1)).toBeGreaterThan(total) // friends' round-up really overshoots
        continue
      }
      expect(Number.isInteger(s.friendShare) && Number.isInteger(s.payerShare)).toBe(true)
      expect(s.payerShare).toBeGreaterThanOrEqual(0)
      expect(s.payerShare).toBeLessThanOrEqual(s.friendShare)
      expect(s.friendShare * (n - 1) + s.payerShare).toBe(total)
    }
  })
})

describe('S-2 names', () => {
  const friends = ['Ali', 'Sara']
  it.each([
    ['Ahmed', null],
    ['علی', null],
    ['Sara 🍕', null],
    ['a'.repeat(30), null],
    ['🍕'.repeat(30), null],
    ['', 'Enter a name'],
    ['   ', 'Enter a name'],
    ['ali', 'Ali is already in the list'],
    [' ALI ', 'Ali is already in the list'],
    ['waseek', 'Waseek is already in the list'],
    ['a'.repeat(31), 'Names can be up to 30 characters.'],
  ])('adding %j → %j', (name, error) => expect(addFriendError(name, 'Waseek', friends)).toBe(error))

  it('at most 50 people, payer included', () => {
    const many = Array.from({ length: 48 }, (_, i) => `F${i}`)
    expect(addFriendError('Ahmed', 'Waseek', many)).toBeNull() // 49th friend, 50 people
    expect(addFriendError('Ahmed', 'Waseek', [...many, 'X'])).toBe('A bill can have at most 50 people.')
  })

  it('payer name', () => {
    expect(payerError('', friends)).toBeNull() // shown as the grey hint
    expect(payerError('Ali', friends)).toBe('Ali is already in the list')
    expect(payerError('Waseek', friends)).toBeNull()
  })
})

describe('S-4 message', () => {
  it('with payment details', () => {
    expect(buildMessage(1000, 3, 334, 'Waseek', 'Meezan · Waseek Ahmed · 0123456789')).toBe(
      'Bill split: 1,000 PKR between 3 people\n' +
        'Please send 334 PKR each to Waseek:\n' +
        'Meezan · Waseek Ahmed · 0123456789\n' +
        'Send a screenshot here once done 🙏',
    )
  })

  it('empty or spaces-only details', () => {
    const expected = 'Bill split: 1,000 PKR between 3 people\nPlease send 334 PKR each to Waseek.\nSend a screenshot here once done 🙏'
    expect(buildMessage(1000, 3, 334, 'Waseek', '')).toBe(expected)
    expect(buildMessage(1000, 3, 334, ' Waseek ', '   \n ')).toBe(expected)
  })

  it('multi-line details kept as typed, outer spaces trimmed', () => {
    expect(buildMessage(1000, 3, 334, 'Waseek', '  Meezan\n0123456789\n ')).toContain('to Waseek:\nMeezan\n0123456789\nSend')
  })

  it('wa.me url', () => {
    expect(waUrl('a b\n🙏')).toBe('https://wa.me/?text=a%20b%0A%F0%9F%99%8F')
  })
})

describe('S-5 summary', () => {
  it.each([
    [0, '1 of 3 paid · 668 PKR still to collect'],
    [1, '2 of 3 paid · 334 PKR still to collect'],
    [2, 'Everyone has paid ✓'],
  ])('%d friends ticked', (paid, text) => expect(summary(3, 334, paid)).toBe(text))
})

describe('S-6 parseBill', () => {
  const good = { payer: 'Waseek', total: 1000, details: '', friends: [{ name: 'Ali', paid: true }], view: 'track', sent: true }

  it('round-trips a valid bill', () => expect(parseBill(JSON.stringify(good))).toEqual(good))

  it.each([
    null,
    '',
    '{not json',
    'null',
    '[]',
    '"x"',
    JSON.stringify({ ...good, total: 1000.5 }),
    JSON.stringify({ ...good, total: '1000' }),
    JSON.stringify({ ...good, total: 0 }),
    JSON.stringify({ ...good, total: 10_000_001 }),
    JSON.stringify({ ...good, view: 'home' }),
    JSON.stringify({ ...good, friends: [{ name: 'Ali', paid: 'yes' }] }),
    JSON.stringify({ ...good, friends: [{ name: 'Ali', paid: false }, { name: 'ali', paid: false }] }),
    JSON.stringify({ ...good, friends: [null] }),
    JSON.stringify({ ...good, details: 'x'.repeat(201) }),
    JSON.stringify({ ...good, sent: undefined }),
  ])('damaged %j → empty bill', (raw) => expect(parseBill(raw)).toEqual(emptyBill()))
})
