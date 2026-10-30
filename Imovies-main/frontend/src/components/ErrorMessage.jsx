import { FaRedo } from 'react-icons/fa'

export default function ErrorMessage({ message, onRetry }) {
  return (
    <div className="state-card error-state" role="alert">
      <span className="state-icon">!</span>
      <h2>We couldn’t load this right now</h2>
      <p>{message}</p>
      {onRetry && <button className="btn btn-outline-light mt-3" type="button" onClick={onRetry}><FaRedo className="me-2" />Try again</button>}
    </div>
  )
}
