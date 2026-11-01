// Pure split maths, validation and message text. No React here.

export const MAX_TOTAL = 10_000_000
export const MAX_PEOPLE = 50
export const MAX_NAME = 30
export const MAX_DETAILS = 200

export type Friend = { name: string; paid: boolean }
export type Bill = {
  payer: string
  total: number | null // integer rupees, only ever a valid total
  details: string
  friends: Friend[]
  view: 'setup' | 'track'
  sent: boolean
}

export const emptyBill = (): Bill => ({ payer: '', total: null, details: '', friends: [], view: 'setup', sent: false })

export const fmt = (n: number) => n.toLocaleString('en-US')

/** value: integer rupees, or null. error: null when empty (show the hint instead). */
export function parseTotal(raw: string): { value: number | null; error: string | null } {
  const s = raw.trim()
  if (!s) return { value: null, error: null }
  // Commas are allowed between digits, so both 1,500 and 1,00,000 read as you'd expect.
  if (/^-?\d+(,\d+)*$/.test(s)) {
    const n = Number(s.replace(/,/g, ''))
    if (n <= 0) return { value: null, error: 'Total must be more than 0 PKR' }
    if (n > MAX_TOTAL) return { value: null, error: "Total can't be more than 10,000,000 PKR" }
    return { value: n, error: null }
  }
  if (/^-?(\d+(,\d+)*)?\.\d*$/.test(s) && /\d/.test(s)) return { value: null, error: 'Enter whole rupees (no paisa)' }
  return { value: null, error: 'Enter a number in whole rupees' }
}

/** Shared name rules. `others` is everyone already on the bill, payer included. */
export function nameError(name: string, others: string[]): string | null {
  const n = name.trim()
  if (!n) return 'Enter a name'
  if ([...n].length > MAX_NAME) return 'Names can be up to 30 characters.'
  const key = n.toLocaleLowerCase()
  const dup = others.find((o) => o.trim().toLocaleLowerCase() === key)
  return dup ? `${dup.trim()} is already in the list` : null
}

export function addFriendError(name: string, payer: string, friends: string[]): string | null {
  if (!name.trim()) return 'Enter a name'
  if (friends.length + 1 >= MAX_PEOPLE) return 'A bill can have at most 50 people.'
  return nameError(name, [payer, ...friends])
}

/** null for an empty name: the UI shows the grey hint `Enter your name` instead. */
export function payerError(payer: string, friends: string[]): string | null {
  return payer.trim() ? nameError(payer, friends) : null
}

/** n counts everyone, payer included (n >= 2). */
export function split(total: number, n: number): { friendShare: number; payerShare: number } | { error: string } {
  const q = Math.trunc(total / n)
  const r = total - q * n
  const friendShare = r > 0 ? q + 1 : q
  const payerShare = total - friendShare * (n - 1)
  if (payerShare < 0) return { error: `Total is too small to split between ${n} people in whole rupees.` }
  return { friendShare, payerShare }
}

export const billLine = (total: number, n: number) => `${fmt(total)} PKR between ${n} people`

export function buildMessage(total: number, n: number, friendShare: number, payer: string, details: string): string {
  const d = details.trim()
  const send = `Please send ${fmt(friendShare)} PKR each to ${payer.trim()}`
  return [`Bill split: ${billLine(total, n)}`, d ? `${send}:\n${d}` : `${send}.`, 'Send a screenshot here once done 🙏'].join('\n')
}

export const waUrl = (message: string) => `https://wa.me/?text=${encodeURIComponent(message)}`

/** paidFriends excludes the payer, who always counts as paid. */
export function summary(n: number, friendShare: number, paidFriends: number): string {
  const unpaid = n - 1 - paidFriends
  if (unpaid === 0) return 'Everyone has paid ✓'
  return `${paidFriends + 1} of ${n} paid · ${fmt(unpaid * friendShare)} PKR still to collect`
}

/** localStorage is a trust boundary: anything missing or off-shape is an empty bill. */
export function parseBill(raw: string | null): Bill {
  try {
    const b = JSON.parse(raw ?? 'null')
    const names: string[] = []
    const ok =
      b !== null && typeof b === 'object' &&
      typeof b.payer === 'string' &&
      (b.total === null || (Number.isInteger(b.total) && b.total > 0 && b.total <= MAX_TOTAL)) &&
      typeof b.details === 'string' && b.details.length <= MAX_DETAILS &&
      (b.view === 'setup' || b.view === 'track') &&
      typeof b.sent === 'boolean' &&
      Array.isArray(b.friends) &&
      b.friends.every((f: unknown) => {
        if (!f || typeof f !== 'object') return false
        const { name, paid } = f as Friend
        if (typeof name !== 'string' || typeof paid !== 'boolean' || name !== name.trim()) return false
        if (addFriendError(name, '', names)) return false
        names.push(name)
        return true
      })
    if (!ok) return emptyBill()
    return { payer: b.payer, total: b.total, details: b.details, view: b.view, sent: b.sent, friends: b.friends.map(({ name, paid }: Friend) => ({ name, paid })) }
  } catch {
    return emptyBill()
  }
}
