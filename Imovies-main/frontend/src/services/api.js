import axios from 'axios'

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim()
const apiBaseUrl = configuredApiUrl || (import.meta.env.DEV ? 'http://localhost:5000/api' : '')

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  if (!config.baseURL && !import.meta.env.DEV) {
    const error = new Error('VITE_API_URL is not configured for this deployment. Set it to the Render API base URL and redeploy.')
    error.code = 'API_URL_NOT_CONFIGURED'
    return Promise.reject(error)
  }

  const token = localStorage.getItem('imovies_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && localStorage.getItem('imovies_token')) {
      window.dispatchEvent(new Event('imovies:session-expired'))
    }
    return Promise.reject(error)
  },
)

export const getApiError = (error) => {
  if (error.code === 'API_URL_NOT_CONFIGURED') return error.message
  if (error.response?.data?.message) return error.response.data.message
  if (error.response?.data?.errors?.length) {
    return error.response.data.errors.map((item) => item.message).join('. ')
  }
  if (error.code === 'ECONNABORTED') return 'The server took too long to respond. Please try again.'
  if (!error.response) return 'Cannot reach the iMovies server. Check that the backend is running.'
  return 'Something went wrong. Please try again.'
}

export default api
