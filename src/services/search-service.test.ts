import { describe, expect, it } from 'vitest'
import { allBuiltinKnowledge } from '@/data/builtin'
import { builtinSqlEntries } from '@/data/builtin/sql-library'
import { builtinFormulas } from '@/data/builtin/formulas'
import { builtinKpis } from '@/data/builtin/kpis'
import { builtinInterviewQuestions } from '@/data/builtin/interview-questions'
import { KNOWLEDGE_CATEGORIES } from '@/types'
import { searchCommands, globalSearch } from '@/services/search-service'
import { scoreMatch } from '@/utils/search-score'

describe('built-in content', () => {
  it('includes a substantial SQL library', () => {
    expect(builtinSqlEntries.length).toBeGreaterThanOrEqual(80)
    expect(builtinSqlEntries.every((e) => e.category === 'SQL' && e.isBuiltIn)).toBe(true)
  })

  it('orders knowledge categories correctly when present', () => {
    const knowledge = allBuiltinKnowledge()
    expect(knowledge.length).toBeGreaterThan(100)
    for (const cat of KNOWLEDGE_CATEGORIES) {
      expect(knowledge.some((k) => k.category === cat)).toBe(true)
    }
  })

  it('seeds formulas, kpis, and interview questions', () => {
    expect(builtinFormulas.length).toBeGreaterThan(40)
    expect(builtinKpis.length).toBeGreaterThan(25)
    expect(builtinInterviewQuestions.length).toBeGreaterThan(50)
  })
})

describe('search service', () => {
  it('finds commands', () => {
    const cmds = searchCommands('export')
    expect(cmds.some((c) => c.id === 'cmd-export')).toBe(true)
  })

  it('searches built-in knowledge deterministically', async () => {
    const hits = await globalSearch('GROUP BY')
    expect(hits.length).toBeGreaterThan(0)
    expect(hits.some((h) => h.type === 'builtin_knowledge')).toBe(true)
  })

  it('uses shared scoring helper', () => {
    expect(scoreMatch('sql', 'SQL Vault')).toBeGreaterThan(0)
  })
})
