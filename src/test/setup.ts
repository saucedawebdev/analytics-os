import '@testing-library/jest-dom/vitest'
import 'fake-indexeddb/auto'
import { afterEach } from 'vitest'

afterEach(async () => {
  // Dexie databases persist across tests in the same jsdom/happy-dom context
  const { db } = await import('@/db')
  await db.delete()
  await db.open()
})
