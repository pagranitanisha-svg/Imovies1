import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FaCheck, FaFilm, FaMapMarkerAlt, FaTicketAlt, FaTimes } from 'react-icons/fa'
import { getApiError } from '../services/api'
import { getBooking } from '../services/bookingService'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'

export default function BookingConfirmation() {
  const { id } = useParams()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadBooking = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setBooking(await getBooking(id))
    } catch (requestError) {
      setError(getApiError(requestError))
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { loadBooking() }, [loadBooking])

  if (loading) return <div className="container page-container"><LoadingSpinner label="Loading your ticket" /></div>
  if (error || !booking) return <div className="container page-container"><ErrorMessage message={error || 'Booking could not be found.'} onRetry={loadBooking} /></div>

  const cancelled = booking.bookingStatus === 'cancelled'
  const date = booking.show?.showDate ? new Date(booking.show.showDate).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : 'Show date'
  return (
    <div className="container page-container confirmation-page">
      <div className="confirmation-heading"><span className={`confirmation-check${cancelled ? ' cancelled' : ''}`}>{cancelled ? <FaTimes /> : <FaCheck />}</span><span className="eyebrow">{cancelled ? 'BOOKING CANCELLED' : 'YOUR NIGHT IS SET'}</span><h1>{cancelled ? <>This booking was <em>cancelled.</em></> : <>It’s a <em>movie night.</em></>}</h1><p>{cancelled ? 'This ticket is no longer valid. Your seats have been released.' : 'Your demo booking is confirmed. Your ticket details are below.'}</p></div>
      <article className="digital-ticket">
        <div className="ticket-main">
          <div className="ticket-brand"><FaFilm /> iMovies <span>{cancelled ? 'CANCELLED TICKET' : 'DEMO TICKET'}</span></div>
          <h2>{booking.movie?.title || 'Movie ticket'}</h2>
          <div className="ticket-place"><FaMapMarkerAlt /> {booking.theatre?.name || 'Cinema'} · {booking.theatre?.location || ''}</div>
          <div className="ticket-details-grid"><div><small>DATE</small><strong>{date}</strong></div><div><small>SHOWTIME</small><strong>{booking.show?.startTime || '—'}</strong></div><div><small>SEATS</small><strong>{booking.selectedSeats?.join(', ') || '—'}</strong></div><div><small>REFERENCE</small><strong className="reference-code">{booking.bookingReference}</strong></div></div>
        </div>
        <div className="ticket-side"><span className="ticket-stub-icon"><FaTicketAlt /></span><small>DEMO TOTAL</small><strong>₹{Number(booking.totalAmount || 0).toFixed(2)}</strong><span>Payment simulated</span><div className="barcode" aria-label="Decorative ticket barcode" /></div>
      </article>
      <div className="confirmation-actions"><Link className="btn btn-danger" to="/my-bookings">View my bookings</Link><Link className="btn btn-outline-light" to="/movies">Discover more films</Link></div>
      <p className="demo-payment-note">{cancelled ? 'This booking was cancelled; no payment was processed.' : 'This is an academic demo booking. No real payment was processed.'}</p>
    </div>
  )
}
