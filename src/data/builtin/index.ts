import type { BuiltInKnowledgeEntry } from '@/types'
import { builtinFormulas } from '@/data/builtin/formulas'
import { builtinInterviewQuestions } from '@/data/builtin/interview-questions'
import { builtinKpis } from '@/data/builtin/kpis'
import { builtinExcelEntries } from '@/data/builtin/knowledge-excel'
import {
  builtinBusinessEntries,
  builtinCareerEntries,
  builtinCommEntries,
  builtinPowerBiEntries,
  builtinPythonEntries,
  builtinStatsEntries,
  builtinTableauEntries,
  builtinVizEntries,
} from '@/data/builtin/knowledge-viz-tools'
import { builtinSqlEntries } from '@/data/builtin/sql-library'
import { builtinStarterNotes } from '@/data/builtin/starter-notes'

export { builtinFormulas, builtinInterviewQuestions, builtinKpis, builtinStarterNotes }
export { builtinExcelEntries } from '@/data/builtin/knowledge-excel'
export {
  builtinBusinessEntries,
  builtinCareerEntries,
  builtinCommEntries,
  builtinPowerBiEntries,
  builtinPythonEntries,
  builtinStatsEntries,
  builtinTableauEntries,
  builtinVizEntries,
} from '@/data/builtin/knowledge-viz-tools'
export { builtinSqlEntries } from '@/data/builtin/sql-library'

export function allBuiltinKnowledge(): BuiltInKnowledgeEntry[] {
  return [
    ...builtinSqlEntries,
    ...builtinExcelEntries,
    ...builtinTableauEntries,
    ...builtinPowerBiEntries,
    ...builtinPythonEntries,
    ...builtinStatsEntries,
    ...builtinBusinessEntries,
    ...builtinVizEntries,
    ...builtinCommEntries,
    ...builtinCareerEntries,
  ]
}
