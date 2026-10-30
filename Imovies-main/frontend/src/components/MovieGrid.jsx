import MovieCard from './MovieCard'

export default function MovieGrid({ movies, emptyTitle = 'No movies found', emptyText = 'Try a different search or filter.' }) {
  if (!movies.length) {
    return <div className="empty-state"><span className="empty-state-mark">i</span><h3>{emptyTitle}</h3><p>{emptyText}</p></div>
  }
  return <div className="movie-grid">{movies.map((movie) => <MovieCard key={movie._id} movie={movie} />)}</div>
}
