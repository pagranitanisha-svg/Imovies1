import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FaArrowLeft, FaCalendarAlt, FaClock, FaPlay, FaStar, FaTicketAlt } from 'react-icons/fa'
import { getApiError } from '../services/api'
import { getMovie } from '../services/movieService'
import ErrorMessage from '../components/ErrorMessage'
import LoadingSpinner from '../components/LoadingSpinner'

const fallbackBackdrop = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1800&q=85'

export default function MovieDetails() {
  const { id } = useParams()
  const [movie, setMovie] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadMovie = async () => {
    setLoading(true)
    setError('')
    try {
      setMovie(await getMovie(id))
    } catch (requestError) {
      setError(getApiError(requestError))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadMovie() }, [id])

  if (loading) return <div className="container page-container"><LoadingSpinner label="Loading movie details" /></div>
  if (error || !movie) return <div className="container page-container"><ErrorMessage message={error || 'Movie not found.'} onRetry={loadMovie} /></div>

  const releaseDate = movie.releaseDate ? new Date(movie.releaseDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Coming soon'
  return (
    <>
      <section className="movie-detail-hero" style={{ '--movie-backdrop': `url("${movie.banner || movie.poster || fallbackBackdrop}")` }}>
        <div className="movie-detail-overlay" />
        <div className="container movie-detail-content">
          <Link to="/movies" className="back-link"><FaArrowLeft /> Back to movies</Link>
          <div className="movie-detail-main">
            <div className="detail-poster"><img src={movie.poster || fallbackBackdrop} alt={`${movie.title} poster`} onError={(event) => { event.currentTarget.src = fallbackBackdrop }} /></div>
            <div className="detail-copy">
              <span className="eyebrow">{movie.status === 'upcoming' ? 'COMING SOON' : 'NOW SHOWING'}</span>
              <h1>{movie.title}</h1>
              <div className="detail-meta"><span><FaStar /> {Number(movie.rating || 0).toFixed(1)} / 10</span><span><FaClock /> {movie.duration} min</span><span>{movie.language}</span></div>
              <div className="detail-genres">{(movie.genre || []).map((item) => <span key={item}>{item}</span>)}</div>
              <p className="detail-description">{movie.description}</p>
              <div className="detail-facts"><div><span>DIRECTOR</span><strong>{movie.director || '—'}</strong></div><div><span>RELEASE DATE</span><strong><FaCalendarAlt /> {releaseDate}</strong></div></div>
              <div className="detail-actions"><Link className="btn btn-danger btn-lg" to={`/movies/${movie._id}/shows`}><FaTicketAlt /> Find showtimes</Link><button className="btn btn-outline-light btn-lg" type="button" onClick={() => document.getElementById('movie-story')?.scrollIntoView({ behavior: 'smooth' })}><FaPlay /> Movie details</button></div>
            </div>
          </div>
        </div>
      </section>
      <section className="container detail-lower" id="movie-story">
        <div><span className="eyebrow">THE STORY</span><h2>About the film</h2><p>{movie.description}</p></div>
        <div><span className="eyebrow">THE PEOPLE</span><h2>Cast & crew</h2><p><strong>Director:</strong> {movie.director || 'Not listed'}</p><p><strong>Cast:</strong> {movie.cast?.length ? movie.cast.join(', ') : 'Cast details coming soon'}</p></div>
      </section>
    </>
  )
}
