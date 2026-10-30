import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { FaEye, FaEyeSlash, FaFilm } from 'react-icons/fa'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { getApiError } from '../services/api'

export default function AuthForm({ mode }) {
  const isRegister = mode === 'register'
  const [values, setValues] = useState({ name: '', email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const { login, register } = useAuth()
  const { notify } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const change = (event) => setValues((current) => ({ ...current, [event.target.name]: event.target.value }))

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    if (isRegister && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,128}$/.test(values.password)) {
      setError('Use at least 8 characters with uppercase, lowercase, and a number.')
      return
    }
    setSubmitting(true)
    try {
      if (isRegister) await register(values)
      else await login({ email: values.email, password: values.password })
      notify(isRegister ? 'Your iMovies account is ready.' : 'Welcome back to iMovies.')
      navigate(location.state?.from || '/', { replace: true })
    } catch (requestError) {
      setError(getApiError(requestError))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-art">
        <div className="auth-art-mark"><FaFilm /></div>
        <span className="eyebrow">A LITTLE MORE MAGIC</span>
        <h2>Every great night<br />starts with a story.</h2>
        <p>Discover films you’ll love and keep your cinema plans all in one place.</p>
        <div className="auth-art-orbit orbit-one" /><div className="auth-art-orbit orbit-two" />
      </div>
      <section className="auth-panel">
        <Link to="/" className="auth-back">← Back to iMovies</Link>
        <div className="auth-form-wrap">
          <span className="eyebrow">{isRegister ? 'YOUR NEXT CHAPTER' : 'GOOD TO SEE YOU'}</span>
          <h1>{isRegister ? 'Create your account' : 'Welcome back'}</h1>
          <p className="auth-subtitle">{isRegister ? 'Join the audience. Your next favourite is waiting.' : 'Sign in to pick up where the opening credits left off.'}</p>
          {error && <div className="form-alert" role="alert">{error}</div>}
          <form onSubmit={submit} className="auth-form">
            {isRegister && <label>Full name<input name="name" autoComplete="name" value={values.name} onChange={change} minLength="2" maxLength="80" required placeholder="Your name" /></label>}
            <label>Email address<input name="email" type="email" autoComplete="email" value={values.email} onChange={change} required placeholder="you@example.com" /></label>
            <label>Password<div className="password-wrap"><input name="password" type={showPassword ? 'text' : 'password'} autoComplete={isRegister ? 'new-password' : 'current-password'} value={values.password} onChange={change} required minLength={isRegister ? 8 : 1} maxLength="128" placeholder={isRegister ? '8+ characters, mixed case and a number' : 'Your password'} /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <FaEyeSlash /> : <FaEye />}</button></div></label>
            <button className="btn btn-danger btn-lg w-100" disabled={submitting}>{submitting ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}</button>
          </form>
          <p className="auth-switch">{isRegister ? 'Already have an account?' : 'New to iMovies?'} <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Sign in' : 'Create an account'}</Link></p>
          <small className="auth-demo-note">iMovies is a demo booking experience. No real payment is taken.</small>
        </div>
      </section>
    </div>
  )
}
