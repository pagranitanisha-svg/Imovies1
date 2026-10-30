import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FaArrowLeft, FaCalendarAlt, FaMapMarkerAlt, FaTicketAlt } from 'react-icons/fa'
import { getShows } from '../services/bookingService'
import { getMovie } from '../services/movieService'
import { getApiError } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'

const dateKey = (value) => new Date(value).toISOString().slice(0, 10)
const prettyDate = (key) => new Date(`${key}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })

export default function ShowtimeSelection() {
  const { id } = useParams()
  const [movie, setMovie] = useState(null)
  const [shows, setShows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedDate, setSelectedDate] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [movieResult, showResult] = await Promise.all([getMovie(id), getShows({ movie: id })])
      setMovie(movieResult)
      setShows(showResult)
      const dates = [...new Set(showResult.map((show) => dateKey(show.showDate)))].sort()
      setSelectedDate((current) => dates.includes(current) ? current : dates[0] || '')
    } catch (requestError) {
      setError(getApiError(requestError))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  const dates = useMemo(() => [...new Set(shows.map((show) => dateKey(show.showDate)))].sort(), [shows])
  const selectedShows = shows.filter((show) => dateKey(show.showDate) === selectedDate)
  const groups = selectedShows.reduce((result, show) => {
    const theatreId = show.theatre?._id || 'unknown'
    if (!result[theatreId]) result[theatreId] = { theatre: show.theatre, shows: [] }
    result[theatreId].shows.push(show)
    return result
  }, {})

  if (loading) return <div className="container page-container"><LoadingSpinner label="Finding showtimes" /></div>
  if (error) return <div className="container page-container"><ErrorMessage message={error} onRetry={load} /></div>

  return (
    <div className="container page-container showtime-page">
      <Link to={`/movies/${id}`} className="back-link dark-back"><FaArrowLeft /> Movie details</Link>
      <div className="page-intro showtime-intro"><span className="eyebrow">PICK YOUR SCREENING</span><h1>{movie?.title || 'Choose a showtime'}</h1><p>Select a date and cinema to find your seats.</p></div>
      <section className="date-picker" aria-label="Select show date">
        <div className="date-picker-title"><FaCalendarAlt /><span>Choose a date</span></div>
        {dates.length ? <div className="date-options">{dates.map((date) => <button key={date} className={selectedDate === date ? 'date-option selected' : 'date-option'} onClick={() => setSelectedDate(date)}><small>{prettyDate(date).split(',')[0]}</small><strong>{new Date(`${date}T12:00:00`).getDate()}</strong><small>{new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { month: 'short' })}</small></button>)}</div> : null}
      </section>
      {Object.keys(groups).length === 0 ? <div className="empty-state"><span className="empty-state-mark">⌚</span><h3>No showtimes available</h3><p>There are no active screenings for this movie yet.</p><Link className="btn btn-outline-light mt-3" to={`/movies/${id}`}>Back to movie</Link></div> : (
        <div className="theatre-list">
          {Object.values(groups).map(({ theatre, shows: theatreShows }) => (
            <article className="theatre-show-card" key={theatre?._id}>
              <div className="theatre-show-heading"><div className="theatre-icon"><FaTicketAlt /></div><div><h2>{theatre?.name || 'Cinema'}</h2><p><FaMapMarkerAlt /> {theatre?.location || theatre?.address}</p></div></div>
              <div className="showtime-chips">{theatreShows.sort((a, b) => a.startTime.localeCompare(b.startTime)).map((show) => <Link className="showtime-chip" key={show._id} to={`/shows/${show._id}/seats`}><strong>{show.startTime}</strong><span>₹{Number(show.ticketPrice).toFixed(0)} / seat</span></Link>)}</div>
            </article>
          ))}
        </div>
      )}
      <p className="demo-payment-note">Ticket purchase uses a simulated demo confirmation. No payment details are collected.</p>
    </div>
  )
}
