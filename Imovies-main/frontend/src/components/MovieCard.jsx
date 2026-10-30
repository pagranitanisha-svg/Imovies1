import { Link } from 'react-router-dom'
import { FaStar } from 'react-icons/fa'

const fallbackPoster = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80'

export default function MovieCard({ movie }) {
  const genres = Array.isArray(movie.genre) ? movie.genre.slice(0, 2).join(' · ') : movie.genre
  return (
    <article className="movie-card">
      <Link to={`/movies/${movie._id}`} className="movie-card-poster" aria-label={`View ${movie.title} details`}>
        <img
          src={movie.poster || fallbackPoster}
          alt={`${movie.title} poster`}
          loading="lazy"
          onError={(event) => { event.currentTarget.src = fallbackPoster }}
        />
        <span className="movie-rating"><FaStar /> {Number(movie.rating || 0).toFixed(1)}</span>
      </Link>
      <div className="movie-card-body">
        <div className="movie-card-copy">
          <h3><Link to={`/movies/${movie._id}`}>{movie.title}</Link></h3>
          <p>{genres || 'Cinema'} <span>•</span> {movie.language || '—'}</p>
        </div>
        <Link className="btn btn-sm btn-outline-danger movie-card-action" to={`/movies/${movie._id}/shows`}>Book</Link>
      </div>
    </article>
  )
}
