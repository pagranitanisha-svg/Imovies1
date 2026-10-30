import { useCallback, useEffect, useMemo, useState } from 'react'
import { FaCalendarAlt, FaFilm, FaMapMarkerAlt, FaPlus, FaTicketAlt, FaTrash, FaUsers, FaEdit } from 'react-icons/fa'
import { getApiError } from '../services/api'
import { createMovie, deleteMovie, getMovies, updateMovie } from '../services/movieService'
import { cancelBooking, getAllBookings, getSeats, getShows } from '../services/bookingService'
import { createShow, createTheatre, deleteShow, deleteTheatre, getTheatres, updateShow, updateTheatre } from '../services/theatreService'
import { useToast } from '../context/ToastContext'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'

const tabs = [
  { key: 'movies', label: 'Movies', icon: FaFilm },
  { key: 'theatres', label: 'Theatres', icon: FaMapMarkerAlt },
  { key: 'shows', label: 'Showtimes', icon: FaCalendarAlt },
  { key: 'bookings', label: 'Bookings', icon: FaTicketAlt },
]

export default function AdminDashboard() {
  const [tab, setTab] = useState('movies')
  const [data, setData] = useState({ movies: [], theatres: [], shows: [], bookings: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editor, setEditor] = useState(null)
  const [saving, setSaving] = useState(false)
  const { notify } = useToast()

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [movieResult, theatreResult, showResult, bookingResult] = await Promise.all([
        getMovies({ limit: 100 }),
        getTheatres(),
        getShows(),
        getAllBookings(),
      ])
      setData({ movies: movieResult.data, theatres: theatreResult, shows: showResult, bookings: bookingResult })
    } catch (requestError) {
      setError(getApiError(requestError))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const stats = useMemo(() => [
    { title: 'Movies', value: data.movies.length, icon: FaFilm, accent: 'red' },
    { title: 'Theatres', value: data.theatres.length, icon: FaMapMarkerAlt, accent: 'blue' },
    { title: 'Active shows', value: data.shows.length, icon: FaCalendarAlt, accent: 'violet' },
    { title: 'Bookings', value: data.bookings.length, icon: FaTicketAlt, accent: 'amber' },
  ], [data])

  const newRecord = () => {
    const initial = {
      movies: { title: '', description: '', poster: '', banner: '', genre: '', language: '', duration: '', rating: '', releaseDate: '', cast: '', director: '', status: 'now_showing' },
      theatres: { name: '', location: '', address: '', screens: '[{"name":"Screen 1","seatLayout":{"rows":8,"cols":12}}]' },
      shows: { movie: data.movies[0]?._id || '', theatre: data.theatres[0]?._id || '', screen: data.theatres[0]?.screens?.[0]?.name || '', showDate: '', startTime: '19:30', ticketPrice: '', status: 'active' },
    }
    setEditor({ type: tab, record: null, values: initial[tab] })
  }

  const editRecord = (type, record) => {
    const values = type === 'movies'
      ? { ...record, genre: record.genre?.join(', ') || '', cast: record.cast?.join(', ') || '', releaseDate: record.releaseDate?.slice(0, 10) || '', duration: String(record.duration), rating: String(record.rating) }
      : type === 'theatres'
        ? { ...record, screens: JSON.stringify(record.screens.map((screen) => ({ name: screen.name, seatLayout: screen.seatLayout })), null, 2) }
        : { ...record, movie: record.movie?._id || record.movie, theatre: record.theatre?._id || record.theatre, showDate: record.showDate?.slice(0, 10) || '' }
    setEditor({ type, record, values })
  }

  const save = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      let payload = { ...editor.values }
      if (editor.type === 'movies') {
        payload = {
          ...payload,
          genre: typeof payload.genre === 'string' ? payload.genre.split(',').map((item) => item.trim()).filter(Boolean) : payload.genre,
          cast: typeof payload.cast === 'string' ? payload.cast.split(',').map((item) => item.trim()).filter(Boolean) : payload.cast,
          duration: Number(payload.duration),
          rating: Number(payload.rating || 0),
        }
        delete payload._id
        delete payload.createdAt
        delete payload.updatedAt
        if (editor.record) await updateMovie(editor.record._id, payload)
        else await createMovie(payload)
      } else if (editor.type === 'theatres') {
        const screens = JSON.parse(payload.screens)
        const originalScreens = editor.record?.screens?.map(({ name, seatLayout }) => ({ name, seatLayout }))
        payload.screens = screens
        if (originalScreens && JSON.stringify(screens) === JSON.stringify(originalScreens)) delete payload.screens
        delete payload._id
        delete payload.createdAt
        delete payload.updatedAt
        if (editor.record) await updateTheatre(editor.record._id, payload)
        else await createTheatre(payload)
      } else {
        delete payload._id
        delete payload.movie?.title
        delete payload.theatre?.name
        delete payload.createdAt
        delete payload.updatedAt
        delete payload.bookedSeats
        delete payload.seatConfiguration
        if (editor.record) await updateShow(editor.record._id, payload)
        else await createShow(payload)
      }
      notify(`${editor.type.slice(0, -1)} ${editor.record ? 'updated' : 'created'} successfully.`)
      setEditor(null)
      await load()
    } catch (requestError) {
      const message = requestError instanceof SyntaxError ? 'Screens must be valid JSON.' : getApiError(requestError)
      notify(message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (type, record) => {
    if (!window.confirm(`Delete "${record.title || record.name || record.movie?.title || 'this record'}"? This cannot be undone.`)) return
    try {
      if (type === 'movies') await deleteMovie(record._id)
      if (type === 'theatres') await deleteTheatre(record._id)
      if (type === 'shows') await deleteShow(record._id)
      notify('Record deleted.')
      await load()
    } catch (requestError) {
      notify(getApiError(requestError), 'error')
    }
  }

  const cancelBookingRecord = async (booking) => {
    if (!window.confirm(`Cancel booking ${booking.bookingReference}?`)) return
    try {
      await cancelBooking(booking._id)
      notify('Booking cancelled.')
      try {
        await getSeats(booking.show?._id || booking.show)
        notify('Seat availability refreshed.', 'info')
      } catch {
        notify('Booking cancelled, but seat availability could not be refreshed.', 'error')
      }
      await load()
    } catch (requestError) {
      notify(getApiError(requestError), 'error')
    }
  }

  if (loading) return <div className="container page-container"><LoadingSpinner label="Loading admin dashboard" /></div>
  if (error) return <div className="container page-container"><ErrorMessage message={error} onRetry={load} /></div>

  return (
    <div className="container page-container admin-page">
      <div className="admin-heading"><div><span className="eyebrow">IMOVIES CONTROL ROOM</span><h1>Admin <em>dashboard.</em></h1><p>Manage your cinema catalogue, screenings, and bookings.</p></div><div className="admin-live"><span /> LIVE DATA</div></div>
      <div className="admin-stats">{stats.map(({ title, value, icon: Icon, accent }) => <article className={`admin-stat stat-${accent}`} key={title}><span className="admin-stat-icon"><Icon /></span><span>{title}</span><strong>{value}</strong></article>)}</div>
      <div className="admin-tabs" role="tablist">{tabs.map(({ key, label, icon: Icon }) => <button type="button" role="tab" aria-selected={tab === key} className={tab === key ? 'admin-tab active' : 'admin-tab'} key={key} onClick={() => setTab(key)}><Icon /> {label}<span>{data[key].length}</span></button>)}</div>
      <section className="admin-content">
        <div className="admin-content-heading"><div><span className="eyebrow">MANAGE CATALOGUE</span><h2>{tabs.find((item) => item.key === tab)?.label}</h2></div>{tab !== 'bookings' && <button className="btn btn-danger" onClick={newRecord}><FaPlus /> Add {tab.slice(0, -1)}</button>}</div>
        {tab === 'movies' && <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Movie</th><th>Status</th><th>Language</th><th>Rating</th><th>Actions</th></tr></thead><tbody>{data.movies.map((movie) => <tr key={movie._id}><td><strong>{movie.title}</strong><small>{movie.genre?.join(', ')}</small></td><td><span className="status-badge">{movie.status?.replace('_', ' ')}</span></td><td>{movie.language}</td><td>{Number(movie.rating || 0).toFixed(1)}</td><td><RowActions onEdit={() => editRecord('movies', movie)} onDelete={() => remove('movies', movie)} /></td></tr>)}</tbody></table></div>}
        {tab === 'theatres' && <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Theatre</th><th>Location</th><th>Screens</th><th>Actions</th></tr></thead><tbody>{data.theatres.map((theatre) => <tr key={theatre._id}><td><strong>{theatre.name}</strong><small>{theatre.address}</small></td><td>{theatre.location}</td><td>{theatre.screens?.length || 0}</td><td><RowActions onEdit={() => editRecord('theatres', theatre)} onDelete={() => remove('theatres', theatre)} /></td></tr>)}</tbody></table></div>}
        {tab === 'shows' && <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Film / Theatre</th><th>Date</th><th>Time</th><th>Price</th><th>Actions</th></tr></thead><tbody>{data.shows.map((show) => <tr key={show._id}><td><strong>{show.movie?.title}</strong><small>{show.theatre?.name} · {show.screen}</small></td><td>{new Date(show.showDate).toLocaleDateString()}</td><td>{show.startTime}</td><td>₹{show.ticketPrice}</td><td><RowActions onEdit={() => editRecord('shows', show)} onDelete={() => remove('shows', show)} /></td></tr>)}</tbody></table></div>}
        {tab === 'bookings' && <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Reference</th><th>Customer</th><th>Film</th><th>Status</th><th>Total</th><th>Actions</th></tr></thead><tbody>{data.bookings.map((booking) => <tr key={booking._id}><td><strong>{booking.bookingReference}</strong><small>{booking.selectedSeats?.join(', ')}</small></td><td>{booking.user?.name}<small>{booking.user?.email}</small></td><td>{booking.movie?.title}</td><td><span className={`status-badge ${booking.bookingStatus}`}>{booking.bookingStatus}</span></td><td>₹{Number(booking.totalAmount).toFixed(2)}</td><td>{booking.bookingStatus === 'confirmed' && canCancelBooking(booking) ? <button className="table-action danger" onClick={() => cancelBookingRecord(booking)}>Cancel</button> : '—'}</td></tr>)}</tbody></table></div>}
        {tab === 'bookings' && <p className="admin-note"><FaUsers /> The backend does not expose a registered-users listing endpoint, so user administration is not available on this dashboard.</p>}
      </section>
      {editor && <AdminEditor editor={editor} data={data} onChange={(key, value) => setEditor((current) => ({ ...current, values: { ...current.values, [key]: value } }))} onClose={() => setEditor(null)} onSubmit={save} saving={saving} />}
    </div>
  )
}

function RowActions({ onEdit, onDelete }) {
  return <div className="table-actions"><button type="button" className="table-action" onClick={onEdit} aria-label="Edit"><FaEdit /> Edit</button><button type="button" className="table-action danger" onClick={onDelete} aria-label="Delete"><FaTrash /></button></div>
}

function AdminEditor({ editor, data, onChange, onClose, onSubmit, saving }) {
  const fields = editor.type === 'movies'
    ? [['title', 'Title', 'text', true], ['description', 'Description', 'textarea', true], ['poster', 'Poster URL', 'url'], ['banner', 'Banner URL', 'url'], ['genre', 'Genres (comma separated)', 'text', true], ['language', 'Language', 'text'], ['duration', 'Duration (minutes)', 'number', true], ['rating', 'Rating / 10', 'number'], ['releaseDate', 'Release date', 'date', true], ['cast', 'Cast (comma separated)', 'text'], ['director', 'Director', 'text'], ['status', 'Release status', 'select']]
    : editor.type === 'theatres'
      ? [['name', 'Theatre name', 'text', true], ['location', 'Location', 'text', true], ['address', 'Address', 'text', true], ['screens', 'Screens JSON', 'textarea', true]]
      : [['movie', 'Movie', 'movie', true], ['theatre', 'Theatre', 'theatre', true], ['screen', 'Screen', 'screen', true], ['showDate', 'Date', 'date', true], ['startTime', 'Start time', 'time', true], ['ticketPrice', 'Ticket price', 'number', true], ['status', 'Status', 'show-status']]

  const set = (key, value) => onChange(key, value)
  const screensForSelectedTheatre = data.theatres.find((item) => item._id === editor.values.theatre)?.screens || []
  return (
    <div className="modal-backdrop-custom" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="admin-editor" role="dialog" aria-modal="true" aria-labelledby="editor-title">
        <div className="editor-heading"><div><span className="eyebrow">{editor.record ? 'UPDATE RECORD' : 'NEW RECORD'}</span><h2 id="editor-title">{editor.record ? 'Edit' : 'Add'} {editor.type.slice(0, -1)}</h2></div><button type="button" className="editor-close" onClick={onClose} aria-label="Close">×</button></div>
        <form className="editor-form" onSubmit={onSubmit}>
          <div className="editor-fields">
            {fields.map(([key, label, type, required]) => (
              <label className={type === 'textarea' ? 'field-wide' : ''} key={key}>{label}
                {type === 'textarea' ? <textarea value={editor.values[key] ?? ''} required={required} rows={key === 'description' ? 3 : 6} onChange={(event) => set(key, event.target.value)} />
                  : type === 'select' ? <select value={editor.values[key] ?? 'now_showing'} onChange={(event) => set(key, event.target.value)}><option value="now_showing">Now showing</option><option value="upcoming">Upcoming</option></select>
                    : type === 'movie' ? <select required value={editor.values[key] || ''} onChange={(event) => set(key, event.target.value)}>{data.movies.map((movie) => <option value={movie._id} key={movie._id}>{movie.title}</option>)}</select>
                      : type === 'theatre' ? <select required value={editor.values[key] || ''} onChange={(event) => { const theatre = data.theatres.find((item) => item._id === event.target.value); set(key, event.target.value); set('screen', theatre?.screens?.[0]?.name || '') }}>{data.theatres.map((theatre) => <option value={theatre._id} key={theatre._id}>{theatre.name}</option>)}</select>
                        : type === 'screen' ? <select required value={editor.values[key] || ''} onChange={(event) => set(key, event.target.value)}>{screensForSelectedTheatre.map((screen) => <option value={screen.name} key={screen._id || screen.name}>{screen.name}</option>)}</select>
                          : type === 'show-status' ? <select value={editor.values[key] || 'active'} onChange={(event) => set(key, event.target.value)}><option value="active">Active</option><option value="cancelled">Cancelled</option></select>
                            : <input type={type} required={required} min={type === 'number' ? '0' : undefined} step={key === 'rating' ? '0.1' : type === 'number' ? '1' : undefined} value={editor.values[key] ?? ''} onChange={(event) => set(key, event.target.value)} />}
              </label>
            ))}
          </div>
          <div className="editor-actions"><button type="button" className="btn btn-outline-light" onClick={onClose}>Cancel</button><button type="submit" className="btn btn-danger" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button></div>
        </form>
      </section>
    </div>
  )
}

function canCancelBooking(booking) {
  if (!booking.show?.showDate || !booking.show?.startTime) return false
  const showDate = new Date(booking.show.showDate).toISOString().slice(0, 10)
  return new Date(`${showDate}T${booking.show.startTime}:00Z`).getTime() > Date.now()
}
