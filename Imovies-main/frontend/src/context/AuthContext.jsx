import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)
const TOKEN_KEY = 'imovies_token'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
  }, [])

  useEffect(() => {
    const handleExpiredSession = () => {
      localStorage.removeItem(TOKEN_KEY)
      setUser(null)
    }
    window.addEventListener('imovies:session-expired', handleExpiredSession)

    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      setLoading(false)
      return () => window.removeEventListener('imovies:session-expired', handleExpiredSession)
    }

    api.get('/auth/me')
      .then(({ data }) => setUser(data.user))
      .catch((error) => {
        if (error.response?.status === 401) localStorage.removeItem(TOKEN_KEY)
        setUser(null)
      })
      .finally(() => setLoading(false))
    return () => window.removeEventListener('imovies:session-expired', handleExpiredSession)
  }, [])

  const authenticate = useCallback(async (path, credentials) => {
    const { data } = await api.post(path, credentials)
    localStorage.setItem(TOKEN_KEY, data.token)
    setUser(data.user)
    return data.user
  }, [])

  const value = useMemo(() => ({
    user,
    loading,
    login: (credentials) => authenticate('/auth/login', credentials),
    register: (credentials) => authenticate('/auth/register', credentials),
    logout,
  }), [user, loading, authenticate, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
