import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FaArrowRight, FaFilm, FaPlay, FaTicketAlt } from 'react-icons/fa'
import { getMovies } from '../services/movieService'
import { getApiError } from '../services/api'
import MovieGrid from '../components/MovieGrid'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'

const genres = [
  { name: 'Action', mark: '01', tone: 'genre-red' },
  { name: 'Drama', mark: '02', tone: 'genre-violet' },
  { name: 'Comedy', mark: '03', tone: 'genre-blue' },
  { name: 'Sci-Fi', mark: '04', tone: 'genre-amber' },
  { name: 'Adventure', mark: '05', tone: 'genre-green' },
  { name: 'Thriller', mark: '06', tone: 'genre-pink' },
]

function MovieSection({ title, eyebrow, movies, loading, error, onRetry, action }) {
  return (
    <section className="content-section">
      <div className="section-heading">
        <div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div>
        {action && <Link className="text-link" to={action.to}>{action.label}<FaArrowRight /></Link>}
      </div>
      {loading ? <LoadingSpinner label={`Loading ${title.toLowerCase()}`} /> : error ? <ErrorMessage message={error} onRetry={onRetry} /> : <MovieGrid movies={movies} emptyTitle="Nothing on this list yet" />}
    </section>
  )
}

export default function Home() {
  const [nowShowing, setNowShowing] = useState([])
  const [upcoming, setUpcoming] = useState([])
  const [loadingNow, setLoadingNow] = useState(true)
  const [loadingUpcoming, setLoadingUpcoming] = useState(true)
  const [errorNow, setErrorNow] = useState('')
  const [errorUpcoming, setErrorUpcoming] = useState('')

  const loadNowShowing = async () => {
    setLoadingNow(true)
    setErrorNow('')
    try {
      const response = await getMovies({ status: 'now_showing', limit: 8 })
      setNowShowing(response.data)
    } catch (error) {
      setErrorNow(getApiError(error))
    } finally {
      setLoadingNow(false)
    }
  }

  const loadUpcoming = async () => {
    setLoadingUpcoming(true)
    setErrorUpcoming('')
    try {
      const response = await getMovies({ status: 'upcoming', limit: 8 })
      setUpcoming(response.data)
    } catch (error) {
      setErrorUpcoming(getApiError(error))
    } finally {
      setLoadingUpcoming(false)
    }
  }

  useEffect(() => {
    loadNowShowing()
    loadUpcoming()
  }, [])

  const featured = useMemo(() => nowShowing[0], [nowShowing])
  const trending = useMemo(
    () => [...nowShowing].sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0)).slice(0, 4),
    [nowShowing],
  )

  return (
    <>
      <section className="hero-section">
        <div className="hero-backdrop" />
        <div className="container hero-content">
          <div className="hero-copy">
            <div className="hero-kicker"><span className="live-dot" /> YOUR SEAT IS WAITING</div>
            <h1>Stories worth<br /><em>leaving home for.</em></h1>
            <p>Find your next favorite film, pick the perfect seats, and make tonight a movie night.</p>
            <div className="hero-actions">
              <Link className="btn btn-danger btn-lg" to="/movies"><FaTicketAlt /> Explore movies</Link>
              <Link className="hero-watch-link" to="/movies?status=now_showing"><span><FaPlay /></span> See what’s showing</Link>
            </div>
            {featured && <div className="hero-featured-note"><FaFilm /> FEATURED TONIGHT <strong>{featured.title}</strong></div>}
          </div>
          <div className="hero-art" aria-hidden="true">
            {featured?.poster ? <img src={featured.poster} alt="" onError={(event) => { event.currentTarget.style.display = 'none' }} /> : <div className="hero-art-placeholder"><FaFilm /><span>THE<br />BIG<br />PICTURE</span></div>}
            <div className="hero-art-label"><span>YOUR NEXT<br />CINEMA NIGHT</span><FaArrowRight /></div>
          </div>
          <div className="hero-index"><span>01</span><i /><span>04</span></div>
        </div>
      </section>

      <div className="container">
        <MovieSection title="Trending movies" eyebrow="TOP RATED RIGHT NOW" movies={trending} loading={loadingNow} error={errorNow} onRetry={loadNowShowing} />
        <MovieSection title="Now showing" eyebrow="ON THE BIG SCREEN" movies={nowShowing} loading={loadingNow} error={errorNow} onRetry={loadNowShowing} action={{ to: '/movies?status=now_showing', label: 'View all' }} />
        <section className="content-section genre-section">
          <div className="section-heading"><div><span className="eyebrow">PICK YOUR MOOD</span><h2>Explore by genre</h2></div><Link className="text-link" to="/movies">All genres <FaArrowRight /></Link></div>
          <div className="genre-grid">
            {genres.map((genre) => <Link key={genre.name} className={`genre-tile ${genre.tone}`} to={`/movies?genre=${encodeURIComponent(genre.name)}`}><span>{genre.mark}</span><strong>{genre.name}</strong><FaArrowRight /></Link>)}
          </div>
        </section>
        <MovieSection title="Coming soon" eyebrow="SAVE THE DATE" movies={upcoming} loading={loadingUpcoming} error={errorUpcoming} onRetry={loadUpcoming} action={{ to: '/movies?status=upcoming', label: 'See upcoming' }} />
        <section className="home-callout">
          <div><span className="eyebrow">THE MAGIC IS BETTER TOGETHER</span><h2>Make it a movie night.</h2><p>Choose your film, gather your people, and we’ll save you the best seats.</p></div>
          <Link className="btn btn-light" to="/movies">Find your film <FaArrowRight /></Link>
        </section>
      </div>
    </>
  )
}
