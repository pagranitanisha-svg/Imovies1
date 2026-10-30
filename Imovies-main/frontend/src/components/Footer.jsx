import { Link } from 'react-router-dom'
import { FaFilm, FaInstagram, FaTwitter, FaYoutube } from 'react-icons/fa'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-main">
        <div className="footer-brand">
          <Link className="brand-lockup" to="/"><span className="brand-symbol"><FaFilm /></span><span>i<span>Movies</span></span></Link>
          <p>Your next great cinema night starts here.</p>
        </div>
        <div className="footer-links">
          <div><h3>Explore</h3><Link to="/movies">All movies</Link><Link to="/movies?status=now_showing">Now showing</Link><Link to="/movies?status=upcoming">Coming soon</Link></div>
          <div><h3>Your account</h3><Link to="/profile">Profile</Link><Link to="/my-bookings">My bookings</Link><Link to="/login">Sign in</Link></div>
          <div><h3>iMovies</h3><a href="mailto:support@imovies.example">Help & support</a><a href="mailto:feedback@imovies.example">Send feedback</a></div>
        </div>
        <div className="footer-social"><a aria-label="Instagram" href="https://instagram.com"><FaInstagram /></a><a aria-label="Twitter" href="https://twitter.com"><FaTwitter /></a><a aria-label="YouTube" href="https://youtube.com"><FaYoutube /></a></div>
      </div>
      <div className="container footer-bottom"><span>© {new Date().getFullYear()} iMovies</span><span>Demo ticketing experience · No real payment is collected</span></div>
    </footer>
  )
}
