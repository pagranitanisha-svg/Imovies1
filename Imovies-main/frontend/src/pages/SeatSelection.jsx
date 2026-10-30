import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { FaArrowLeft, FaLock, FaTicketAlt } from 'react-icons/fa'
import { getApiError } from '../services/api'
import { createBooking, getSeats, getShow } from '../services/bookingService'
import { useToast } from '../context/ToastContext'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import SeatGrid from '../components/SeatGrid'

export default function SeatSelection() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { notify } = useToast()
  const [show, setShow] = useState(null)
  const [seatData, setSeatData] = useState(null)
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [showResult, seatResult] = await Promise.all([getShow(id), getSeats(id)])
      setShow(showResult)
      setSeatData(seatResult)
      setSelected([])
    } catch (requestError) {
      setError(getApiError(requestError))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  const toggleSeat = (seat) => setSelected((current) => current.includes(seat) ? current.filter((value) => value !== seat) : [...current, seat])
  const total = selected.length * Number(show?.ticketPrice || 0)
  const rows = show?.seatConfiguration?.rows || 0
  const cols = show?.seatConfiguration?.cols || 0

  const reserve = async () => {
    if (!selected.length) return
    setSubmitting(true)
    try {
      const refreshedSeats = await getSeats(id)
      const becameBooked = selected.filter((seat) => !refreshedSeats.availableSeats.includes(seat))
      if (becameBooked.length) {
        setSeatData(refreshedSeats)
        setSelected([])
        throw new Error(`Seat ${becameBooked.join(', ')} is no longer available. Please choose again.`)
      }
      const booking = await createBooking({ showId: id, selectedSeats: selected })
      notify('Your demo booking is confirmed.')
      try {
        setSeatData(await getSeats(id))
      } catch {
        notify('Booking confirmed, but seat availability could not be refreshed. Reload the seat map before another selection.', 'error')
      }
      navigate(`/bookings/confirmation/${booking._id}`, { state: { booking } })
    } catch (requestError) {
      notify(requestError.response ? getApiError(requestError) : requestError.message || getApiError(requestError), 'error')
      if (requestError.response?.status === 409) await load()
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="container page-container"><LoadingSpinner label="Loading seat map" /></div>
  if (error || !show || !seatData) return <div className="container page-container"><ErrorMessage message={error || 'Show unavailable.'} onRetry={load} /></div>

  const showDate = new Date(show.showDate).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
  return (
    <div className="container page-container seat-page">
      <Link className="back-link dark-back" to={`/movies/${show.movie?._id}/shows`}><FaArrowLeft /> Change showtime</Link>
      <div className="page-intro seat-intro"><span className="eyebrow">YOUR NIGHT, YOUR SEATS</span><h1>Choose your <em>seats.</em></h1><p>{show.movie?.title} · {show.theatre?.name} · {showDate} at {show.startTime}</p></div>
      <div className="seat-layout">
        <section className="seat-map-card"><SeatGrid rows={rows} cols={cols} bookedSeats={seatData.bookedSeats} selectedSeats={selected} onToggle={toggleSeat} disabled={submitting} /></section>
        <aside className="booking-summary-card">
          <span className="eyebrow">BOOKING SUMMARY</span><h2>{show.movie?.title}</h2>
          <div className="summary-rule" />
          <div className="summary-info"><span>Cinema</span><strong>{show.theatre?.name}</strong></div>
          <div className="summary-info"><span>Showtime</span><strong>{showDate}<br />{show.startTime}</strong></div>
          <div className="summary-info"><span>Selected seats</span><strong>{selected.length ? selected.join(', ') : 'Choose your seats'}</strong></div>
          <div className="summary-info"><span>Price per seat</span><strong>₹{Number(show.ticketPrice).toFixed(2)}</strong></div>
          <div className="summary-total"><span>Total <small>({selected.length} {selected.length === 1 ? 'ticket' : 'tickets'})</small></span><strong>₹{total.toFixed(2)}</strong></div>
          <button className="btn btn-danger btn-lg w-100 mt-3" type="button" disabled={!selected.length || submitting} onClick={reserve}><FaTicketAlt /> {submitting ? 'Confirming…' : 'Confirm demo booking'}</button>
          <p className="summary-secure"><FaLock /> Demo confirmation only. No card details collected.</p>
        </aside>
      </div>
    </div>
  )
}
