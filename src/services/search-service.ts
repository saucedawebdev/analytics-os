import type { RecordType } from '@/types'
import { allBuiltinKnowledge, builtinFormulas, builtinInterviewQuestions, builtinKpis } from '@/data/builtin'
import { db } from '@/db'

export type SearchHit = {
  id: string
  type: RecordType | 'builtin_formula' | 'builtin_kpi' | 'command'
  title: string
  subtitle?: string
  path: string
  score: number
  tags?: string[]
  favorite?: boolean
}

function scoreText(query: string, ...fields: Array<string | undefined | null>): number {
  const q = query.trim().toLowerCase()
  if (!q) return 0
  let score = 0
  for (const field of fields) {
    if (!field) continue
    const f = field.toLowerCase()
    if (f === q) score += 100
    else if (f.startsWith(q)) score += 60
    else if (f.includes(q)) score += 30
    const words = q.split(/\s+/).filter(Boolean)
    for (const w of words) {
      if (f.includes(w)) score += 8
    }
  }
  return score
}

export async function globalSearch(query: string, limit = 60): Promise<SearchHit[]> {
  const q = query.trim()
  if (!q) return []
  const hits: SearchHit[] = []

  const knowledge = allBuiltinKnowledge()
  for (const k of knowledge) {
    const score = scoreText(q, k.title, k.summary, k.category, k.subcategory, ...(k.tags ?? []))
    if (score > 0) {
      hits.push({
        id: k.id,
        type: 'builtin_knowledge',
        title: k.title,
        subtitle: `${k.category} · ${k.subcategory}`,
        path: `/library/${k.id}`,
        score,
        tags: k.tags,
        favorite: k.favorite,
      })
    }
  }

  for (const f of builtinFormulas) {
    const score = scoreText(q, f.name, f.description, f.syntax, f.category)
    if (score > 0) {
      hits.push({
        id: f.id,
        type: 'formula',
        title: f.name,
        subtitle: `Formula · ${f.category}`,
        path: `/formulas/${f.id}`,
        score,
        favorite: f.favorite,
      })
    }
  }

  for (const k of builtinKpis) {
    const score = scoreText(q, k.name, k.definition, k.industry, k.category)
    if (score > 0) {
      hits.push({
        id: k.id,
        type: 'kpi',
        title: k.name,
        subtitle: `KPI · ${k.industry}`,
        path: `/kpis/${k.id}`,
        score,
        favorite: k.favorite,
      })
    }
  }

  for (const iq of builtinInterviewQuestions) {
    const score = scoreText(q, iq.question, iq.category, iq.keyConcepts)
    if (score > 0) {
      hits.push({
        id: iq.id,
        type: 'interview_question',
        title: iq.question,
        subtitle: `Interview · ${iq.category}`,
        path: `/interview/${iq.id}`,
        score,
        favorite: iq.favorite,
      })
    }
  }

  const [
    notes,
    queries,
    projects,
    datasets,
    dashboards,
    portfolio,
    personalK,
    captures,
    jobs,
    thinking,
  ] = await Promise.all([
    db.notes.toArray(),
    db.sqlQueries.toArray(),
    db.projects.toArray(),
    db.datasets.toArray(),
    db.dashboardPlans.toArray(),
    db.portfolioCaseStudies.toArray(),
    db.personalKnowledge.toArray(),
    db.quickCaptures.toArray(),
    db.jobApplications.toArray(),
    db.thinkingSessions.toArray(),
  ])

  for (const n of notes) {
    const score = scoreText(q, n.title, n.content, n.type, ...(n.tags ?? []))
    if (score > 0) {
      hits.push({
        id: n.id,
        type: 'note',
        title: n.title,
        subtitle: `Note · ${n.type}`,
        path: `/notes/${n.id}`,
        score: score + (n.favorite ? 5 : 0),
        tags: n.tags,
        favorite: n.favorite,
      })
    }
  }

  for (const s of queries) {
    const score = scoreText(q, s.title, s.explanation, s.businessQuestion, s.sql, ...(s.tags ?? []))
    if (score > 0) {
      hits.push({
        id: s.id,
        type: 'sql_query',
        title: s.title,
        subtitle: `SQL · ${s.dialect}`,
        path: `/sql/${s.id}`,
        score: score + (s.favorite ? 5 : 0),
        tags: s.tags,
        favorite: s.favorite,
      })
    }
  }

  for (const p of projects) {
    const score = scoreText(q, p.title, p.summary, p.primaryQuestion, p.businessArea, ...(p.tags ?? []))
    if (score > 0) {
      hits.push({
        id: p.id,
        type: 'project',
        title: p.title,
        subtitle: `Project · ${p.status}`,
        path: `/projects/${p.id}`,
        score: score + (p.favorite ? 5 : 0) + (p.pinned ? 3 : 0),
        tags: p.tags,
        favorite: p.favorite,
      })
    }
  }

  for (const d of datasets) {
    const score = scoreText(q, d.name, d.description, d.source, ...(d.tags ?? []))
    if (score > 0) {
      hits.push({
        id: d.id,
        type: 'dataset',
        title: d.name,
        subtitle: `Dataset · ${d.fileType}`,
        path: `/datasets/${d.id}`,
        score,
        tags: d.tags,
      })
    }
  }

  for (const d of dashboards) {
    const score = scoreText(q, d.name, d.primaryQuestion, d.audience)
    if (score > 0) {
      hits.push({
        id: d.id,
        type: 'dashboard_plan',
        title: d.name,
        subtitle: 'Dashboard plan',
        path: `/dashboards/${d.id}`,
        score,
      })
    }
  }

  for (const p of portfolio) {
    const score = scoreText(q, p.title, p.oneSentenceSummary, p.businessProblem)
    if (score > 0) {
      hits.push({
        id: p.id,
        type: 'portfolio_case_study',
        title: p.title,
        subtitle: 'Portfolio',
        path: `/portfolio/${p.id}`,
        score,
      })
    }
  }

  for (const k of personalK) {
    const score = scoreText(q, k.title, k.summary, k.personalNotes)
    if (score > 0) {
      hits.push({
        id: k.id,
        type: 'personal_knowledge',
        title: k.title,
        subtitle: `Personal · ${k.category}`,
        path: `/library/personal/${k.id}`,
        score,
      })
    }
  }

  for (const c of captures) {
    const score = scoreText(q, c.title, c.body, c.type)
    if (score > 0) {
      hits.push({
        id: c.id,
        type: 'quick_capture',
        title: c.title,
        subtitle: `Capture · ${c.type}`,
        path: `/capture`,
        score,
      })
    }
  }

  for (const j of jobs) {
    const score = scoreText(q, j.company, j.jobTitle, j.notes, j.status)
    if (score > 0) {
      hits.push({
        id: j.id,
        type: 'job_application',
        title: `${j.jobTitle} @ ${j.company}`,
        subtitle: `Career · ${j.status}`,
        path: `/career/jobs/${j.id}`,
        score,
      })
    }
  }

  for (const t of thinking) {
    const score = scoreText(q, t.title, t.answers.primaryQuestion, t.answers.requested)
    if (score > 0) {
      hits.push({
        id: t.id,
        type: 'thinking_session',
        title: t.title,
        subtitle: 'Thinking Mode',
        path: `/thinking/${t.id}`,
        score,
      })
    }
  }

  return hits.sort((a, b) => b.score - a.score).slice(0, limit)
}

export function groupHits(hits: SearchHit[]): Record<string, SearchHit[]> {
  const groups: Record<string, SearchHit[]> = {}
  for (const hit of hits) {
    const key = hit.type
    if (!groups[key]) groups[key] = []
    groups[key].push(hit)
  }
  return groups
}

export type CommandItem = {
  id: string
  title: string
  subtitle?: string
  path?: string
  action?: 'export' | 'theme' | 'capture' | 'settings'
  keywords: string[]
}

export const COMMANDS: CommandItem[] = [
  { id: 'cmd-note', title: 'Create new note', path: '/notes/new', keywords: ['note', 'create', 'new'] },
  { id: 'cmd-query', title: 'Create new query', path: '/sql/new', keywords: ['sql', 'query', 'create'] },
  { id: 'cmd-project', title: 'Create new project', path: '/projects/new', keywords: ['project', 'create'] },
  { id: 'cmd-dataset', title: 'Add dataset', path: '/datasets/new', keywords: ['dataset', 'csv'] },
  { id: 'cmd-thinking', title: 'Run Thinking Mode', path: '/thinking/new', keywords: ['thinking', 'plan'] },
  { id: 'cmd-interview', title: 'Practice interview question', path: '/interview', keywords: ['interview'] },
  { id: 'cmd-library', title: 'Open knowledge library', path: '/library', keywords: ['library', 'sql'] },
  { id: 'cmd-sql', title: 'Open SQL Vault', path: '/sql', keywords: ['sql', 'vault'] },
  { id: 'cmd-export', title: 'Export backup', action: 'export', keywords: ['export', 'backup'] },
  { id: 'cmd-theme', title: 'Toggle theme', action: 'theme', keywords: ['theme', 'dark', 'light'] },
  { id: 'cmd-settings', title: 'Open settings', path: '/settings', keywords: ['settings'] },
  { id: 'cmd-capture', title: 'Quick capture', action: 'capture', keywords: ['capture', 'inbox'] },
  { id: 'cmd-dashboards', title: 'Open dashboards', path: '/dashboards', keywords: ['dashboard'] },
  { id: 'cmd-portfolio', title: 'Open portfolio', path: '/portfolio', keywords: ['portfolio'] },
  { id: 'cmd-career', title: 'Open career hub', path: '/career', keywords: ['career', 'jobs'] },
]

export function searchCommands(query: string): CommandItem[] {
  const q = query.trim().toLowerCase()
  if (!q) return COMMANDS
  return COMMANDS.filter(
    (c) =>
      c.title.toLowerCase().includes(q) ||
      c.keywords.some((k) => k.includes(q) || q.includes(k)),
  )
}
