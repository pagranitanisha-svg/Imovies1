import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { FaBars, FaFilm, FaSearch, FaTicketAlt, FaTimes, FaUserCircle } from 'react-icons/fa'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import Footer from './Footer'

export default function SiteLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [search, setSearch] = useState('')
  const { user, logout } = useAuth()
  const { notify } = useToast()
  const navigate = useNavigate()

  const submitSearch = (event) => {
    event.preventDefault()
    navigate(`/movies${search.trim() ? `?search=${encodeURIComponent(search.trim())}` : ''}`)
    setMenuOpen(false)
  }

  const signOut = () => {
    logout()
    notify('You have been signed out.', 'info')
    navigate('/')
  }

  const navLink = ({ isActive }) => `nav-link ${isActive ? 'active' : ''}`

  return (
    <div className="app-shell">
      <header className="site-header">
        <nav className="navbar navbar-expand-lg container">
          <Link className="brand-lockup" to="/" aria-label="iMovies home" onClick={() => setMenuOpen(false)}>
            <span className="brand-symbol"><FaFilm /></span><span>i<span>Movies</span></span>
          </Link>
          <button className="mobile-menu-toggle" type="button" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <FaTimes /> : <FaBars />}
          </button>
          <div className={`site-nav-content ${menuOpen ? 'is-open' : ''}`}>
            <div className="navbar-nav main-nav">
              <NavLink end className={navLink} to="/" onClick={() => setMenuOpen(false)}>Home</NavLink>
              <NavLink className={navLink} to="/movies" onClick={() => setMenuOpen(false)}>Movies</NavLink>
              <NavLink className={navLink} to="/movies?status=now_showing" onClick={() => setMenuOpen(false)}>Now Showing</NavLink>
              <NavLink className={navLink} to="/movies?status=upcoming" onClick={() => setMenuOpen(false)}>Coming Soon</NavLink>
            </div>
            <form className="header-search" onSubmit={submitSearch} role="search">
              <FaSearch aria-hidden="true" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search movies" aria-label="Search movies" />
            </form>
            <div className="navbar-nav account-nav">
              {user ? (
                <>
                  <NavLink className={navLink} to="/my-bookings" onClick={() => setMenuOpen(false)}><FaTicketAlt /> My bookings</NavLink>
                  <div className="account-dropdown">
                    <button className="account-trigger" type="button" onClick={() => navigate('/profile')}><FaUserCircle /> <span>{user.name}</span></button>
                    <div className="account-menu">
                      <Link to="/profile">My profile</Link>
                      {user.role === 'admin' && <Link to="/admin">Admin dashboard</Link>}
                      <button type="button" onClick={signOut}>Sign out</button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <NavLink className="nav-link" to="/login" onClick={() => setMenuOpen(false)}>Sign in</NavLink>
                  <Link className="btn btn-danger btn-sm nav-join" to="/register" onClick={() => setMenuOpen(false)}>Join iMovies</Link>
                </>
              )}
            </div>
          </div>
        </nav>
      </header>
      <main className="site-main"><Outlet /></main>
      <Footer />
    </div>
  )
}
