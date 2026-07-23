import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Field'
import { Badge, EmptyState, PageHeader, Panel } from '@/components/ui/Panel'
import { allBuiltinKnowledge } from '@/data/builtin'
import type { Difficulty, KnowledgeCategory } from '@/types'
import { confidenceLabel, statusLabel } from '@/utils'
import { DIFFICULTIES, KNOWLEDGE_CATEGORY_ORDER } from '@/pages/pageUtils'

type DifficultyFilter = Difficulty | 'all'

export default function LibraryPage() {
  const [category, setCategory] = useState<KnowledgeCategory>(KNOWLEDGE_CATEGORY_ORDER[0]!)
  const [difficulty, setDifficulty] = useState<DifficultyFilter>('all')
  const [search, setSearch] = useState('')
  const knowledge = useMemo(() => allBuiltinKnowledge(), [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return knowledge.filter((entry) => {
      const matchesCategory = entry.category === category
      const matchesDifficulty = difficulty === 'all' || entry.difficulty === difficulty
      const haystack = [
        entry.title,
        entry.summary,
        entry.subcategory,
        entry.whatItDoes,
        entry.whyItMatters,
        entry.whenToUse,
        entry.businessExample,
        ...(entry.tags ?? []),
      ]
        .join(' ')
        .toLowerCase()
      return matchesCategory && matchesDifficulty && (!q || haystack.includes(q))
    })
  }, [category, difficulty, knowledge, search])

  return (
    <div className="page">
      <PageHeader
        title="Knowledge Library"
        subtitle="Browse built-in analyst references by category, difficulty, and search."
      />

      <Panel title="Categories">
        <div className="tabs">
          {KNOWLEDGE_CATEGORY_ORDER.map((value) => (
            <Button
              key={value}
              size="sm"
              variant={value === category ? 'primary' : 'ghost'}
              onClick={() => setCategory(value)}
            >
              {value}
            </Button>
          ))}
        </div>
      </Panel>

      <Panel>
        <div className="row-wrap">
          <label className="field">
            <span className="label">Search</span>
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search topics, examples, tags" />
          </label>
          <label className="field">
            <span className="label">Difficulty</span>
            <Select value={difficulty} onChange={(event) => setDifficulty(event.target.value as DifficultyFilter)}>
              <option value="all">All difficulties</option>
              {DIFFICULTIES.map((value) => (
                <option key={value} value={value}>
                  {statusLabel(value)}
                </option>
              ))}
            </Select>
          </label>
        </div>
      </Panel>

      <Panel title={`${category} (${filtered.length})`}>
        {filtered.length === 0 ? (
          <EmptyState title="No entries found" description="Try another category, search term, or difficulty." />
        ) : (
          <div className="list">
            {filtered.map((entry) => (
              <Link key={entry.id} className="list-item" to={`/library/${entry.id}`}>
                <div className="spacer">
                  <div className="row-wrap">
                    <p className="list-item-title">{entry.title}</p>
                    <Badge tone="builtin">Built-in</Badge>
                  </div>
                  <p className="list-item-meta">{entry.summary}</p>
                  <p className="list-item-meta">
                    {entry.subcategory} · {confidenceLabel(entry.difficulty)}
                  </p>
                </div>
                <Badge>{statusLabel(entry.difficulty)}</Badge>
              </Link>
            ))}
          </div>
        )}
      </Panel>
    </div>
  )
}
