export function scoreMatch(query: string, ...fields: Array<string | undefined | null>): number {
  const q = query.trim().toLowerCase()
  if (!q) return 0
  let score = 0
  for (const field of fields) {
    if (!field) continue
    const f = field.toLowerCase()
    if (f === q) score += 100
    else if (f.startsWith(q)) score += 60
    else if (f.includes(q)) score += 30
    for (const w of q.split(/\s+/).filter(Boolean)) {
      if (f.includes(w)) score += 8
    }
  }
  return score
}
