import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FaCalendarAlt, FaTicketAlt } from 'react-icons/fa'
import { cancelBooking, getMyBookings, getSeats } from '../services/bookingService'
import { getApiError } from '../services/api'
import { useToast } from '../context/ToastContext'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'

export default function MyBookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { notify } = useToast()

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setBookings(await getMyBookings())
    } catch (requestError) {
      setError(getApiError(requestError))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const cancel = async (booking) => {
    if (!window.confirm(`Cancel booking ${booking.bookingReference}?`)) return
    try {
      await cancelBooking(booking._id)
      notify('Booking cancelled.')
      try {
        await getSeats(booking.show?._id || booking.show)
        notify('Seat availability refreshed.', 'info')
      } catch {
        notify('Booking cancelled, but seat availability could not be refreshed. Reload before selecting seats.', 'error')
      }
      await load()
    } catch (requestError) {
      notify(getApiError(requestError), 'error')
    }
  }

  const now = Date.now()
  const upcoming = bookings.filter((booking) => {
    if (booking.bookingStatus !== 'confirmed' || !booking.show?.showDate || !booking.show?.startTime) return false
    const showStart = new Date(`${new Date(booking.show.showDate).toISOString().slice(0, 10)}T${booking.show.startTime}:00Z`).getTime()
    return showStart >= now
  })
  const previous = bookings.filter((booking) => !upcoming.includes(booking))

  return (
    <div className="container page-container">
      <div className="page-intro"><span className="eyebrow">YOUR CINEMA JOURNAL</span><h1>My <em>bookings.</em></h1><p>Your plans, tickets, and nights at the movies—all together.</p></div>
      {loading ? <LoadingSpinner label="Loading your bookings" /> : error ? <ErrorMessage message={error} onRetry={load} /> : !bookings.length ? <div className="empty-state"><span className="empty-state-mark"><FaTicketAlt /></span><h3>No bookings yet</h3><p>When you book a movie, your tickets will be waiting here.</p><Link className="btn btn-danger mt-3" to="/movies">Explore movies</Link></div> : (
        <div className="booking-history">
          <BookingGroup title="Upcoming nights" bookings={upcoming} onCancel={cancel} empty="No upcoming bookings. Pick your next movie night." />
          <BookingGroup title="Past & cancelled" bookings={previous} />
        </div>
      )}
    </div>
  )
}

function BookingGroup({ title, bookings, onCancel, empty }) {
  return (
    <section className="booking-group"><div className="section-heading"><h2>{title}</h2><span className="count-pill">{bookings.length}</span></div>
      {!bookings.length ? <p className="booking-empty">{empty || 'Nothing here yet.'}</p> : bookings.map((booking) => {
        const showDate = booking.show?.showDate ? new Date(booking.show.showDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : 'Show date unavailable'
        return (
          <article className="booking-list-card" key={booking._id}>
            <div className="booking-card-icon"><FaTicketAlt /></div>
            <div className="booking-list-main"><div className="booking-list-title"><h3>{booking.movie?.title || 'Movie'}</h3><span className={`status-badge ${booking.bookingStatus}`}>{booking.bookingStatus}</span></div>
              <p><FaCalendarAlt /> {showDate} · {booking.show?.startTime || '—'} · {booking.theatre?.name || 'Cinema'}</p>
              <span className="booking-reference">Ref: {booking.bookingReference} · Seats: {booking.selectedSeats?.join(', ')}</span>
            </div>
            <div className="booking-list-side"><strong>₹{Number(booking.totalAmount).toFixed(2)}</strong><Link to={`/bookings/confirmation/${booking._id}`}>View ticket</Link>{booking.bookingStatus === 'confirmed' && onCancel && canCancelBooking(booking) && <button type="button" onClick={() => onCancel(booking)}>Cancel booking</button>}</div>
          </article>
        )
      })}
    </section>
  )
}

function canCancelBooking(booking) {
  if (!booking.show?.showDate || !booking.show?.startTime) return false
  const showDate = new Date(booking.show.showDate).toISOString().slice(0, 10)
  const showStart = new Date(`${showDate}T${booking.show.startTime}:00Z`).getTime()
  return showStart > Date.now()
}
