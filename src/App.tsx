import { lazy, Suspense, useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { CommandPalette } from '@/components/search/CommandPalette'
import { QuickCaptureModal } from '@/components/common/QuickCaptureModal'
import { PwaUpdateBanner } from '@/components/common/PwaUpdateBanner'
import { EmptyState } from '@/components/ui/Panel'
import { AppShell } from '@/layouts/AppShell'
import { usePrefsStore } from '@/lib/prefs-store'
import { useUiStore } from '@/lib/ui-store'
import { bootstrapApp } from '@/services/bootstrap'
import { registerPwa } from '@/lib/pwa'

const CommandCenterPage = lazy(() => import('@/pages/CommandCenterPage'))
const CaptureInboxPage = lazy(() => import('@/pages/CaptureInboxPage'))
const CareerPage = lazy(() => import('@/pages/CareerPage'))
const DatasetDetailPage = lazy(() => import('@/pages/DatasetDetailPage'))
const DatasetsPage = lazy(() => import('@/pages/DatasetsPage'))
const DashboardDetailPage = lazy(() => import('@/pages/DashboardDetailPage'))
const DashboardsPage = lazy(() => import('@/pages/DashboardsPage'))
const FormulaDetailPage = lazy(() => import('@/pages/FormulaDetailPage'))
const FormulasPage = lazy(() => import('@/pages/FormulasPage'))
const InterviewLabPage = lazy(() => import('@/pages/InterviewLabPage'))
const InterviewQuestionPage = lazy(() => import('@/pages/InterviewQuestionPage'))
const JobApplicationPage = lazy(() => import('@/pages/JobApplicationPage'))
const KnowledgeDetailPage = lazy(() => import('@/pages/KnowledgeDetailPage'))
const KpiDetailPage = lazy(() => import('@/pages/KpiDetailPage'))
const KpisPage = lazy(() => import('@/pages/KpisPage'))
const LibraryPage = lazy(() => import('@/pages/LibraryPage'))
const NoteDetailPage = lazy(() => import('@/pages/NoteDetailPage'))
const NotesPage = lazy(() => import('@/pages/NotesPage'))
const PortfolioDetailPage = lazy(() => import('@/pages/PortfolioDetailPage'))
const PortfolioPage = lazy(() => import('@/pages/PortfolioPage'))
const ProjectDetailPage = lazy(() => import('@/pages/ProjectDetailPage'))
const ProjectsPage = lazy(() => import('@/pages/ProjectsPage'))
const SearchPage = lazy(() => import('@/pages/SearchPage'))
const SettingsPage = lazy(() => import('@/pages/SettingsPage'))
const SqlQueryPage = lazy(() => import('@/pages/SqlQueryPage'))
const SqlVaultPage = lazy(() => import('@/pages/SqlVaultPage'))
const SqlWorkspacePage = lazy(() => import('@/pages/SqlWorkspacePage'))
const StarStoriesPage = lazy(() => import('@/pages/StarStoriesPage'))
const ThinkingPage = lazy(() => import('@/pages/ThinkingPage'))
const ThinkingSessionPage = lazy(() => import('@/pages/ThinkingSessionPage'))

const routerBasename = import.meta.env.BASE_URL.replace(/\/$/, '') || undefined

function RouteFallback() {
  return (
    <div className="page">
      <EmptyState title="Loading module" description="Preparing this workspace view." />
    </div>
  )
}

export default function App() {
  const loadPrefs = usePrefsStore((state) => state.load)
  const landingPage = usePrefsStore((state) => state.preferences.defaultLandingPage)
  const setCommandOpen = useUiStore((state) => state.setCommandOpen)
  const setCaptureOpen = useUiStore((state) => state.setCaptureOpen)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    void bootstrapApp()
      .then(loadPrefs)
      .then(() => {
        registerPwa()
        setReady(true)
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Unable to start AnalystOS')
        setReady(true)
      })
  }, [loadPrefs])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey
      if (meta && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCommandOpen(true)
      }
      if (meta && e.key.toLowerCase() === 'n' && !e.shiftKey) {
        const tag = (e.target as HTMLElement | null)?.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) {
          return
        }
        e.preventDefault()
        setCaptureOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setCaptureOpen, setCommandOpen])

  if (!ready) {
    return (
      <div className="page">
        <EmptyState title="Loading AnalystOS" description="Preparing your local workspace." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="page">
        <EmptyState title="Startup failed" description={error} />
      </div>
    )
  }

  return (
    <BrowserRouter basename={routerBasename}>
      <AppShell>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<HomePage landingPage={landingPage} />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/new" element={<ProjectDetailPage />} />
            <Route path="/projects/:id" element={<ProjectDetailPage />} />
            <Route path="/sql" element={<SqlVaultPage />} />
            <Route path="/sql/workspace" element={<SqlWorkspacePage />} />
            <Route path="/sql/new" element={<SqlQueryPage />} />
            <Route path="/sql/:id" element={<SqlQueryPage />} />
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/library/:id" element={<KnowledgeDetailPage />} />
            <Route path="/notes" element={<NotesPage />} />
            <Route path="/notes/new" element={<NoteDetailPage />} />
            <Route path="/notes/:id" element={<NoteDetailPage />} />
            <Route path="/datasets" element={<DatasetsPage />} />
            <Route path="/datasets/new" element={<DatasetDetailPage />} />
            <Route path="/datasets/:id" element={<DatasetDetailPage />} />
            <Route path="/thinking" element={<ThinkingPage />} />
            <Route path="/thinking/new" element={<ThinkingSessionPage />} />
            <Route path="/thinking/:id" element={<ThinkingSessionPage />} />
            <Route path="/formulas" element={<FormulasPage />} />
            <Route path="/formulas/:id" element={<FormulaDetailPage />} />
            <Route path="/kpis" element={<KpisPage />} />
            <Route path="/kpis/:id" element={<KpiDetailPage />} />
            <Route path="/dashboards" element={<DashboardsPage />} />
            <Route path="/dashboards/new" element={<DashboardDetailPage />} />
            <Route path="/dashboards/:id" element={<DashboardDetailPage />} />
            <Route path="/portfolio" element={<PortfolioPage />} />
            <Route path="/portfolio/new" element={<PortfolioDetailPage />} />
            <Route path="/portfolio/:id" element={<PortfolioDetailPage />} />
            <Route path="/interview" element={<InterviewLabPage />} />
            <Route path="/interview/:id" element={<InterviewQuestionPage />} />
            <Route path="/star-stories" element={<StarStoriesPage />} />
            <Route path="/career" element={<CareerPage />} />
            <Route path="/career/jobs/new" element={<JobApplicationPage />} />
            <Route path="/career/jobs/:id" element={<JobApplicationPage />} />
            <Route path="/capture" element={<CaptureInboxPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AppShell>
      <CommandPalette />
      <QuickCaptureModal />
      <PwaUpdateBanner />
    </BrowserRouter>
  )
}

function HomePage({ landingPage }: { landingPage: string }) {
  if (landingPage && landingPage !== '/') return <Navigate to={landingPage} replace />
  return <CommandCenterPage />
}
