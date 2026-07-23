import { NavLink, useLocation } from 'react-router-dom'
import {
  BriefcaseBusiness,
  FolderKanban,
  Home,
  Library,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  Brain,
  Database,
  Code2,
  LayoutDashboard,
  GraduationCap,
  Sparkles,
  LineChart,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useUiStore } from '@/lib/ui-store'
import { usePrefsStore } from '@/lib/prefs-store'
import { cn } from '@/utils'
import { Button } from '@/components/ui/Button'
import { SaveIndicator } from '@/components/ui/Breadcrumbs'

type NavItem = { to: string; label: string; icon: ReactNode; end?: boolean }

const PRIMARY_NAV: NavItem[] = [
  { to: '/', label: 'Command Center', icon: <Home size={18} />, end: true },
  { to: '/projects', label: 'Projects', icon: <FolderKanban size={18} /> },
  { to: '/sql', label: 'SQL Vault', icon: <Code2 size={18} /> },
  { to: '/library', label: 'Knowledge', icon: <Library size={18} /> },
  { to: '/datasets', label: 'Datasets', icon: <Database size={18} /> },
  { to: '/thinking', label: 'Thinking Mode', icon: <Brain size={18} /> },
  { to: '/dashboards', label: 'Dashboards', icon: <LayoutDashboard size={18} /> },
  { to: '/portfolio', label: 'Portfolio', icon: <Sparkles size={18} /> },
  { to: '/interview', label: 'Interview Lab', icon: <GraduationCap size={18} /> },
  { to: '/career', label: 'Career Hub', icon: <BriefcaseBusiness size={18} /> },
  { to: '/notes', label: 'Notebook', icon: <Library size={18} /> },
  { to: '/formulas', label: 'Formulas', icon: <LineChart size={18} /> },
  { to: '/kpis', label: 'KPIs', icon: <LineChart size={18} /> },
  { to: '/capture', label: 'Capture Inbox', icon: <Plus size={18} /> },
  { to: '/settings', label: 'Settings', icon: <Settings size={18} /> },
]

export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation()
  const setCommandOpen = useUiStore((s) => s.setCommandOpen)
  const setCaptureOpen = useUiStore((s) => s.setCaptureOpen)
  const moreOpen = useUiStore((s) => s.mobileNavMoreOpen)
  const setMoreOpen = useUiStore((s) => s.setMobileNavMoreOpen)
  const collapsed = useUiStore((s) => s.sidebarCollapsed)
  const setCollapsed = useUiStore((s) => s.setSidebarCollapsed)
  const saveStatus = useUiStore((s) => s.saveStatus)
  const displayName = usePrefsStore((s) => s.preferences.displayName)

  return (
    <div className={cn('app-shell', collapsed && 'collapsed')}>
      <header className="topbar">
        <div className="brand" aria-label="AnalystOS">
          <div className="brand-mark" aria-hidden>
            A
          </div>
          <div>
            <div>AnalystOS</div>
            <div className="list-item-meta" style={{ margin: 0, fontSize: 11 }}>
              {displayName ? displayName : 'Your second brain for analytics'}
            </div>
          </div>
        </div>
        <div className="spacer" />
        <SaveIndicator status={saveStatus} />
        <Button
          className="no-print"
          variant="secondary"
          size="sm"
          onClick={() => setCommandOpen(true)}
          aria-label="Open search"
        >
          <Search size={16} />
          <span className="hide-mobile">Search</span>
          <span className="badge mono" style={{ display: 'none' }} data-desktop-only>
            ⌘K
          </span>
        </Button>
        <Button className="no-print" variant="primary" size="sm" onClick={() => setCaptureOpen(true)}>
          <Plus size={16} />
          Capture
        </Button>
        <Button
          className="no-print"
          variant="ghost"
          size="icon"
          aria-label="Toggle navigation density"
          onClick={() => setCollapsed(!collapsed)}
          style={{ display: 'none' }}
          data-desktop-toggle
        >
          <MoreHorizontal size={18} />
        </Button>
      </header>

      <nav className="desktop-nav no-print" aria-label="Main">
        {PRIMARY_NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => cn(isActive && 'active')}
            title={item.label}
          >
            {item.icon}
            {!collapsed ? <span>{item.label}</span> : null}
          </NavLink>
        ))}
      </nav>

      <main className="main-workspace">{children}</main>

      <nav className="bottom-nav no-print" aria-label="Mobile">
        <NavLink to="/" end className={({ isActive }) => cn(isActive && 'active')}>
          <Home size={18} />
          Home
        </NavLink>
        <NavLink to="/projects" className={({ isActive }) => cn(isActive && 'active')}>
          <FolderKanban size={18} />
          Projects
        </NavLink>
        <button type="button" className="capture-fab" aria-label="Quick capture" onClick={() => setCaptureOpen(true)}>
          <Plus size={22} />
        </button>
        <NavLink to="/library" className={({ isActive }) => cn(isActive && 'active')}>
          <Library size={18} />
          Library
        </NavLink>
        <button
          type="button"
          className={cn((moreOpen || ['/sql','/datasets','/thinking','/dashboards','/portfolio','/interview','/career','/notes','/settings','/capture','/formulas','/kpis'].some(p => location.pathname.startsWith(p))) && 'active')}
          onClick={() => setMoreOpen(!moreOpen)}
        >
          <MoreHorizontal size={18} />
          More
        </button>
      </nav>

      {moreOpen ? (
        <div className="modal-backdrop no-print" style={{ zIndex: 55 }} onClick={() => setMoreOpen(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0, fontFamily: 'var(--font-display)' }}>More</h2>
            <div className="list">
              {PRIMARY_NAV.filter((n) => !['/', '/projects', '/library'].includes(n.to)).map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className="list-item"
                  onClick={() => setMoreOpen(false)}
                >
                  <div className="row">
                    {item.icon}
                    <strong>{item.label}</strong>
                  </div>
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
