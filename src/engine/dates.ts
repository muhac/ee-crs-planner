/**
 * Timezone-free ISO date ("YYYY-MM-DD") arithmetic, so scores never shift
 * depending on the browser's locale.
 */

interface Ymd {
  y: number
  m: number
  d: number
}

function parse(iso: string): Ymd {
  const [y, m, d] = iso.split('-').map(Number)
  return { y, m: m ?? 1, d: d ?? 1 }
}

function format({ y, m, d }: Ymd): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${y}-${pad(m)}-${pad(d)}`
}

export function ageAt(dateOfBirth: string, asOf: string): number {
  const dob = parse(dateOfBirth)
  const now = parse(asOf)
  let age = now.y - dob.y
  if (now.m < dob.m || (now.m === dob.m && now.d < dob.d)) age--
  return age
}

export function addMonths(iso: string, months: number): string {
  const { y, m, d } = parse(iso)
  const total = y * 12 + (m - 1) + months
  const ny = Math.floor(total / 12)
  const nm = (total % 12) + 1
  const daysInMonth = new Date(Date.UTC(ny, nm, 0)).getUTCDate()
  return format({ y: ny, m: nm, d: Math.min(d, daysInMonth) })
}

export function todayIso(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}
