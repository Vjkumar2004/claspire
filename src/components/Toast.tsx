'use client'
import { useEffect, useState } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

export interface ToastProps {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  title: string
  message?: string
  duration?: number
}

interface ToastComponentProps {
  toast: ToastProps
  onRemove: (id: string) => void
}

function ToastComponent({ toast, onRemove }: ToastComponentProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Trigger entrance animation
    setIsVisible(true)

    // Auto remove after duration
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => onRemove(toast.id), 300)
    }, toast.duration || 5000)

    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, onRemove])

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle size={20} className="text-green-500" />
      case 'error':
        return <AlertCircle size={20} className="text-red-500" />
      case 'warning':
        return <AlertTriangle size={20} className="text-yellow-500" />
      case 'info':
        return <Info size={20} className="text-blue-500" />
    }
  }

  const getBgColor = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      case 'info':
        return 'bg-blue-50 border-blue-200'
    }
  }

  return (
    <div
      className={`
        transform transition-all duration-300 ease-in-out
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div className={`
        min-w-[320px] max-w-md p-4 rounded-lg border shadow-lg backdrop-blur-sm
        flex items-start gap-3
        ${getBgColor()}
      `}>
        {getIcon()}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
            {toast.title}
          </h4>
          {toast.message && (
            <p className="text-sm text-gray-600 dark:text-[#B0B7BE] mt-1">
              {toast.message}
            </p>
          )}
        </div>
        <button
          onClick={() => {
            setIsVisible(false)
            setTimeout(() => onRemove(toast.id), 300)
          }}
          className="flex-shrink-0 p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-white dark:text-[#B0B7BE] hover:bg-gray-200/50 dark:hover:bg-[#1D2226]/50 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  const addToast = (toast: Omit<ToastProps, 'id'>) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
    setToasts(prev => [...prev, { ...toast, id }])
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  // Make addToast available globally
  useEffect(() => {
    ;(window as any).toast = addToast
    return () => {
      ;(window as any).toast = undefined
    }
  }, [])

  return (
    <div className="fixed top-20 right-4 z-[9999] space-y-3 pointer-events-none">
      {toasts.map(toast => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastComponent toast={toast} onRemove={removeToast} />
        </div>
      ))}
    </div>
  )
}

// Helper function to show toasts from anywhere
export const showToast = (toast: Omit<ToastProps, 'id'>) => {
  if (typeof window !== 'undefined' && (window as any).toast) {
    (window as any).toast(toast)
  }
}
