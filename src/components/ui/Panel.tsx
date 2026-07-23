import type { ReactNode } from 'react'
import { cn } from '@/utils'

export function Badge({
  children,
  tone = 'default',
}: {
  children: ReactNode
  tone?: 'default' | 'accent' | 'success' | 'warning' | 'danger' | 'builtin'
}) {
  return (
    <span
      className={cn(
        'badge',
        tone === 'accent' && 'badge-accent',
        tone === 'success' && 'badge-success',
        tone === 'warning' && 'badge-warning',
        tone === 'danger' && 'badge-danger',
        tone === 'builtin' && 'badge-builtin',
      )}
    >
      {children}
    </span>
  )
}

export function Panel({
  title,
  action,
  children,
  className,
}: {
  title?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('panel', className)}>
      {(title || action) && (
        <div className="panel-header">
          {title ? <h2 className="panel-title">{title}</h2> : <div />}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      <p>{description}</p>
      {action ? <div style={{ marginTop: 16 }}>{action}</div> : null}
    </div>
  )
}

export function PageHeader({
  title,
  subtitle,
  actions,
  breadcrumbs,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
  breadcrumbs?: ReactNode
}) {
  return (
    <header className="page-header">
      {breadcrumbs}
      <div className="row-wrap">
        <div className="spacer">
          <h1 className="page-title">{title}</h1>
          {subtitle ? <p className="page-subtitle">{subtitle}</p> : null}
        </div>
        {actions}
      </div>
    </header>
  )
}
