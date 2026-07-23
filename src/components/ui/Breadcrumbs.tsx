import { Link } from 'react-router-dom'
import { formatDate } from '@/utils'

export function Breadcrumbs({
  items,
}: {
  items: Array<{ label: string; to?: string }>
}) {
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      {items.map((item, i) => (
        <span key={`${item.label}-${i}`} className="row" style={{ gap: 8 }}>
          {i > 0 ? <span aria-hidden>/</span> : null}
          {item.to ? <Link to={item.to}>{item.label}</Link> : <span>{item.label}</span>}
        </span>
      ))}
    </nav>
  )
}

export function MetaLine({
  left,
  right,
}: {
  left?: string
  right?: string | null
}) {
  return (
    <p className="list-item-meta">
      {left}
      {left && right ? ' · ' : ''}
      {right ? formatDate(right) : null}
    </p>
  )
}

export function SaveIndicator({ status }: { status: 'idle' | 'saving' | 'saved' | 'error' }) {
  if (status === 'idle') return null
  const label =
    status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved' : 'Save failed'
  return (
    <span className={`badge ${status === 'error' ? 'badge-danger' : 'badge-success'}`}>{label}</span>
  )
}
