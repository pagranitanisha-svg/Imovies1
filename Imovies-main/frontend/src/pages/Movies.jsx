import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FaSearch } from 'react-icons/fa'
import { getApiError } from '../services/api'
import { getMovies } from '../services/movieService'
import ErrorMessage from '../components/ErrorMessage'
import LoadingSpinner from '../components/LoadingSpinner'
import MovieGrid from '../components/MovieGrid'

export default function Movies() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [genres, setGenres] = useState([])
  const [languages, setLanguages] = useState([])
  const [movies, setMovies] = useState([])
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const status = searchParams.get('status') || ''
  const genre = searchParams.get('genre') || ''
  const language = searchParams.get('language') || ''
  const page = Number(searchParams.get('page') || 1)

  const fetchMovies = useCallback(async (params = Object.fromEntries(searchParams.entries())) => {
    setLoading(true)
    setError('')
    try {
      const response = await getMovies({ limit: 12, ...params })
      setMovies(response.data)
      setPagination(response.pagination || { page: 1, pages: 1, total: response.count })
      setGenres((current) => [...new Set([...current, ...response.data.flatMap((movie) => movie.genre || [])])].sort())
      setLanguages((current) => [...new Set([...current, ...response.data.map((movie) => movie.language).filter(Boolean)])].sort())
    } catch (requestError) {
      setError(getApiError(requestError))
    } finally {
      setLoading(false)
    }
  }, [searchParams])

  useEffect(() => {
    setSearch(searchParams.get('search') || '')
    fetchMovies()
  }, [fetchMovies, searchParams])

  const submitSearch = (event) => {
    event.preventDefault()
    const next = new URLSearchParams(searchParams)
    if (search.trim()) next.set('search', search.trim())
    else next.delete('search')
    next.delete('page')
    setSearchParams(next)
  }

  const updateFilter = (key, value) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    next.delete('page')
    setSearchParams(next)
  }

  return (
    <div className="container page-container">
      <div className="page-intro">
        <span className="eyebrow">THE MOVIE COLLECTION</span>
        <h1>Find your <em>next story.</em></h1>
        <p>Explore what’s on now and what’s coming soon. Your next favourite is one search away.</p>
      </div>
      <section className="explorer-panel">
        <form className="explorer-search" onSubmit={submitSearch}>
          <FaSearch aria-hidden="true" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by movie title..." aria-label="Search movie title" />
          <button className="btn btn-danger" type="submit">Search</button>
        </form>
        <div className="filter-row">
          <label>Release status<select value={status} onChange={(event) => updateFilter('status', event.target.value)}><option value="">All movies</option><option value="now_showing">Now showing</option><option value="upcoming">Coming soon</option></select></label>
          <label>Genre<select value={genre} onChange={(event) => updateFilter('genre', event.target.value)}><option value="">All genres</option>{genres.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label>Language<select value={language} onChange={(event) => updateFilter('language', event.target.value)}><option value="">All languages</option>{languages.map((item) => <option key={item}>{item}</option>)}</select></label>
          {(status || genre || language || searchParams.has('search')) && <button className="filter-clear" type="button" onClick={() => { setSearch(''); setSearchParams({}) }}>Clear filters</button>}
        </div>
      </section>
      <div className="results-meta"><span>{loading ? 'Finding movies…' : error ? 'Movies unavailable' : `${pagination.total} ${pagination.total === 1 ? 'movie' : 'movies'} found`}</span><span>{status === 'now_showing' ? 'Now showing' : status === 'upcoming' ? 'Coming soon' : 'All releases'}</span></div>
      {loading ? <LoadingSpinner label="Loading movie collection" /> : error ? <ErrorMessage message={error} onRetry={() => fetchMovies()} /> : <MovieGrid movies={movies} />}
      {!loading && !error && pagination.pages > 1 && <div className="pagination-controls"><button disabled={page <= 1} onClick={() => updateFilter('page', String(page - 1))}>Previous</button><span>Page {page} of {pagination.pages}</span><button disabled={page >= pagination.pages} onClick={() => updateFilter('page', String(page + 1))}>Next</button></div>}
    </div>
  )
}
