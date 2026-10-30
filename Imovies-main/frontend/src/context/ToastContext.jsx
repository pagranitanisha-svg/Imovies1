import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes } from 'react-icons/fa'

const ToastContext = createContext(null)
const icons = { success: FaCheckCircle, error: FaExclamationCircle, info: FaInfoCircle }

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const notify = useCallback((message, type = 'success') => {
    const id = `${Date.now()}-${Math.random()}`
    setToasts((current) => [...current, { id, message, type }])
    window.setTimeout(() => dismiss(id), 4500)
  }, [dismiss])

  const value = useMemo(() => ({ notify }), [notify])
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite" aria-atomic="false">
        {toasts.map(({ id, message, type }) => {
          const Icon = icons[type] || icons.info
          return (
            <div className={`app-toast toast-${type}`} role="status" key={id}>
              <Icon aria-hidden="true" />
              <span>{message}</span>
              <button type="button" aria-label="Dismiss notification" onClick={() => dismiss(id)}><FaTimes /></button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}
