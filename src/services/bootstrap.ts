import {
  allBuiltinKnowledge,
  builtinFormulas,
  builtinInterviewQuestions,
  builtinKpis,
  builtinStarterNotes,
} from '@/data/builtin'
import { createDemoData, removeDemoData } from '@/data/demo'
import { db, ensurePreferences, getMeta, setMeta } from '@/db'
import { BUILTIN_CONTENT_VERSION } from '@/types'
import { nowIso } from '@/utils'
import { logActivity } from '@/services/data-service'

export async function seedBuiltInContent(force = false): Promise<void> {
  const version = await getMeta('builtinContentVersion')
  if (!force && version === String(BUILTIN_CONTENT_VERSION)) {
    const kpiCount = await db.kpis.filter((k) => k.isBuiltIn).count()
    if (kpiCount > 0) return
  }

  // Built-in knowledge stays in-memory from modules; persist formulas/kpis/interview/notes for querying + annotations
  const formulas = builtinFormulas
  const kpis = builtinKpis
  const questions = builtinInterviewQuestions
  const notes = builtinStarterNotes

  await db.transaction('rw', [db.formulas, db.kpis, db.interviewQuestions, db.notes], async () => {
    await db.formulas.filter((f) => f.isBuiltIn).delete()
    await db.kpis.filter((k) => k.isBuiltIn).delete()
    await db.interviewQuestions.filter((q) => q.isBuiltIn).delete()
    await db.notes.filter((n) => Boolean(n.isBuiltIn)).delete()
    await db.formulas.bulkPut(formulas)
    await db.kpis.bulkPut(kpis)
    await db.interviewQuestions.bulkPut(questions)
    await db.notes.bulkPut(notes)
  })

  await setMeta('builtinContentVersion', String(BUILTIN_CONTENT_VERSION))
  await setMeta('builtinKnowledgeCount', String(allBuiltinKnowledge().length))
}

export async function resetBuiltInContent(): Promise<void> {
  await seedBuiltInContent(true)
  await logActivity('system', 'Built-in content reset')
}

export async function bootstrapApp(): Promise<void> {
  await ensurePreferences()
  await seedBuiltInContent()

  const prefs = await ensurePreferences()
  if (!prefs.demoDataInstalled && !prefs.onboarded) {
    await createDemoData()
    await db.preferences.update('preferences', {
      demoDataInstalled: true,
      onboarded: true,
      updatedAt: nowIso(),
    })
  }
}

export async function restoreDemoData(): Promise<void> {
  await removeDemoData()
  await createDemoData()
  await db.preferences.update('preferences', {
    demoDataInstalled: true,
    updatedAt: nowIso(),
  })
  await logActivity('system', 'Demo data restored')
}

export { removeDemoData }
