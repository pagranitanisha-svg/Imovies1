import { FaEnvelope, FaShieldAlt, FaTicketAlt, FaUserCircle } from 'react-icons/fa'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Profile() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  return (
    <div className="container page-container profile-page">
      <div className="page-intro"><span className="eyebrow">YOUR ACCOUNT</span><h1>Good to see you, <em>{user?.name?.split(' ')[0]}.</em></h1><p>Your iMovies profile and booking shortcuts.</p></div>
      <section className="profile-card">
        <div className="profile-avatar"><FaUserCircle /></div>
        <div className="profile-details"><span className="eyebrow">MEMBER PROFILE</span><h2>{user?.name}</h2><p><FaEnvelope /> {user?.email}</p><p><FaShieldAlt /> {user?.role === 'admin' ? 'Administrator' : 'Moviegoer'}</p></div>
        <span className="profile-active">Account active</span>
      </section>
      <div className="profile-links"><Link to="/my-bookings"><FaTicketAlt /> My bookings <span>View your tickets and history →</span></Link>{user?.role === 'admin' && <Link to="/admin"><FaShieldAlt /> Admin dashboard <span>Manage the iMovies catalogue →</span></Link>}</div>
      <button className="btn btn-outline-light mt-4" onClick={() => { logout(); navigate('/') }}>Sign out</button>
    </div>
  )
}
