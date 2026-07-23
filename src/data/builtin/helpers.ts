import type { BuiltInKnowledgeEntry, Difficulty, KnowledgeCategory } from '@/types'
import { SCHEMA_VERSION, BUILTIN_CONTENT_VERSION } from '@/types'

const FIXED = '2026-01-01T00:00:00.000Z'

export function builtinEntry(partial: {
  id: string
  title: string
  category: KnowledgeCategory
  subcategory: string
  difficulty: Difficulty
  summary: string
  whatItDoes: string
  whyItMatters: string
  whenToUse: string
  syntaxOrFormula: string
  businessExample: string
  workedExample: string
  commonMistakes: string
  bestPractices: string
  relatedTopicIds?: string[]
  practicePrompt: string
  interviewQuestion: string
  tags?: string[]
}): BuiltInKnowledgeEntry {
  return {
    ...partial,
    relatedTopicIds: partial.relatedTopicIds ?? [],
    tags: partial.tags ?? [],
    createdAt: FIXED,
    updatedAt: FIXED,
    schemaVersion: SCHEMA_VERSION,
    recordVersion: 1,
    favorite: false,
    pinned: false,
    isBuiltIn: true,
    contentVersion: BUILTIN_CONTENT_VERSION,
  }
}
