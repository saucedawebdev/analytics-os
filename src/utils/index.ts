import { v4 as uuidv4 } from 'uuid'
import type { ISODate } from '@/types'
import { SCHEMA_VERSION } from '@/types'

export function createId(): string {
  return uuidv4()
}

export function nowIso(): ISODate {
  return new Date().toISOString()
}

export function timestamps() {
  const now = nowIso()
  return {
    id: createId(),
    createdAt: now,
    updatedAt: now,
    schemaVersion: SCHEMA_VERSION,
    recordVersion: 1,
  }
}

export function touchUpdated<T extends { updatedAt: ISODate; recordVersion?: number }>(
  record: T,
): T {
  return {
    ...record,
    updatedAt: nowIso(),
    recordVersion: (record.recordVersion ?? 1) + 1,
  }
}

export function greetingForHour(hour: number): string {
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function formatDate(iso: string | undefined | null, format = 'MMM d, yyyy'): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  if (format === 'MMM d, yyyy') {
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
  }
  if (format === 'yyyy-MM-dd') {
    return d.toISOString().slice(0, 10)
  }
  return d.toLocaleDateString()
}

export function truncate(text: string, max = 120): string {
  const t = text.trim()
  if (t.length <= max) return t
  return `${t.slice(0, max - 1)}…`
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function downloadText(filename: string, content: string, mime = 'text/plain'): void {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function downloadJson(filename: string, data: unknown): void {
  downloadText(filename, JSON.stringify(data, null, 2), 'application/json')
}

export function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return ''
  const headers = Object.keys(rows[0] ?? {})
  const escape = (v: unknown) => {
    const s = v == null ? '' : String(v)
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
    return s
  }
  return [headers.join(','), ...rows.map((r) => headers.map((h) => escape(r[h])).join(','))].join(
    '\n',
  )
}

export function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const lines: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    const next = text[i + 1]
    if (ch === '"' && inQuotes && next === '"') {
      current += '"'
      i++
      continue
    }
    if (ch === '"') {
      inQuotes = !inQuotes
      continue
    }
    if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && next === '\n') i++
      lines.push(current)
      current = ''
      continue
    }
    current += ch
  }
  if (current.length) lines.push(current)

  const parseLine = (line: string): string[] => {
    const cells: string[] = []
    let cell = ''
    let q = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      const next = line[i + 1]
      if (ch === '"' && q && next === '"') {
        cell += '"'
        i++
        continue
      }
      if (ch === '"') {
        q = !q
        continue
      }
      if (ch === ',' && !q) {
        cells.push(cell)
        cell = ''
        continue
      }
      cell += ch
    }
    cells.push(cell)
    return cells
  }

  const parsed = lines.filter((l) => l.trim().length > 0).map(parseLine)
  const headers = parsed[0] ?? []
  const rows = parsed.slice(1)
  return { headers, rows }
}

export function debounce<T extends (...args: never[]) => void>(fn: T, ms: number): T {
  let t: ReturnType<typeof setTimeout> | undefined
  return ((...args: Parameters<T>) => {
    if (t) clearTimeout(t)
    t = setTimeout(() => fn(...args), ms)
  }) as T
}

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

export function confidenceLabel(c: string): string {
  const map: Record<string, string> = {
    not_confident: 'Not confident',
    developing: 'Developing',
    comfortable: 'Comfortable',
    strong: 'Strong',
  }
  return map[c] ?? c
}

export function statusLabel(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
