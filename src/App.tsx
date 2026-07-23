import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { CommandPalette } from '@/components/search/CommandPalette'
import { QuickCaptureModal } from '@/components/common/QuickCaptureModal'
import { EmptyState } from '@/components/ui/Panel'
import { AppShell } from '@/layouts/AppShell'
import { usePrefsStore } from '@/lib/prefs-store'
import { bootstrapApp } from '@/services/bootstrap'
import CaptureInboxPage from '@/pages/CaptureInboxPage'
import CareerPage from '@/pages/CareerPage'
import CommandCenterPage from '@/pages/CommandCenterPage'
import DatasetDetailPage from '@/pages/DatasetDetailPage'
import DatasetsPage from '@/pages/DatasetsPage'
import DashboardDetailPage from '@/pages/DashboardDetailPage'
import DashboardsPage from '@/pages/DashboardsPage'
import FormulaDetailPage from '@/pages/FormulaDetailPage'
import FormulasPage from '@/pages/FormulasPage'
import InterviewLabPage from '@/pages/InterviewLabPage'
import InterviewQuestionPage from '@/pages/InterviewQuestionPage'
import JobApplicationPage from '@/pages/JobApplicationPage'
import KnowledgeDetailPage from '@/pages/KnowledgeDetailPage'
import KpiDetailPage from '@/pages/KpiDetailPage'
import KpisPage from '@/pages/KpisPage'
import LibraryPage from '@/pages/LibraryPage'
import NoteDetailPage from '@/pages/NoteDetailPage'
import NotesPage from '@/pages/NotesPage'
import PortfolioDetailPage from '@/pages/PortfolioDetailPage'
import PortfolioPage from '@/pages/PortfolioPage'
import ProjectDetailPage from '@/pages/ProjectDetailPage'
import ProjectsPage from '@/pages/ProjectsPage'
import SearchPage from '@/pages/SearchPage'
import SettingsPage from '@/pages/SettingsPage'
import SqlQueryPage from '@/pages/SqlQueryPage'
import SqlVaultPage from '@/pages/SqlVaultPage'
import SqlWorkspacePage from '@/pages/SqlWorkspacePage'
import StarStoriesPage from '@/pages/StarStoriesPage'
import ThinkingPage from '@/pages/ThinkingPage'
import ThinkingSessionPage from '@/pages/ThinkingSessionPage'

export default function App() {
  const loadPrefs = usePrefsStore((state) => state.load)
  const landingPage = usePrefsStore((state) => state.preferences.defaultLandingPage)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    void bootstrapApp()
      .then(loadPrefs)
      .then(() => setReady(true))
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Unable to start AnalystOS')
        setReady(true)
      })
  }, [loadPrefs])

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
    <BrowserRouter>
      <AppShell>
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
      </AppShell>
      <CommandPalette />
      <QuickCaptureModal />
    </BrowserRouter>
  )
}

function HomePage({ landingPage }: { landingPage: string }) {
  if (landingPage && landingPage !== '/') return <Navigate to={landingPage} replace />
  return <CommandCenterPage />
}

