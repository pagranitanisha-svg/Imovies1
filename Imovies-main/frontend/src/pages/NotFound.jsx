import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="container not-found-page">
      <span className="not-found-code">404</span><span className="eyebrow">WRONG SCREENING</span>
      <h1>This page isn’t<br /><em>on the programme.</em></h1>
      <p>The page may have moved, or that ticket may be for another show.</p>
      <Link className="btn btn-danger" to="/">Back to the lobby</Link>
    </div>
  )
}
