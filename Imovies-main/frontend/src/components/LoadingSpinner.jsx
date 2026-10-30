export default function LoadingSpinner({ label = 'Loading', compact = false }) {
  return (
    <div className={`loading-state ${compact ? 'loading-compact' : ''}`} role="status">
      <span className="spinner-border text-danger" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}
