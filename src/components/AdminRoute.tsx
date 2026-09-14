import { type ReactNode, useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

interface AdminRouteProps {
  children: ReactNode
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const { user, isAdmin, isLoading } = useAuth()
  const location = useLocation()

  useEffect(() => {
    // Evita problemas de scroll em páginas internas
    window.scrollTo(0, 0)
  }, [location.pathname])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center relative overflow-hidden">
        <div className="relative z-10 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-honey-500 flex items-center justify-center shadow-lg animate-bounce">
            <span className="text-cream-50 font-display font-bold text-3xl">M</span>
          </div>
          <h2 className="font-display font-bold text-2xl text-brown-800 mb-2">
            Verificando acesso...
          </h2>
          <p className="text-brown-500 mb-6">Aguarde um momento</p>

          <div className="flex justify-center gap-2">
            <span className="w-3 h-3 rounded-full bg-honey-400 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-3 h-3 rounded-full bg-honey-500 animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-3 h-3 rounded-full bg-honey-600 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{ from: location.pathname + location.search + location.hash }}
      />
    )
  }

  if (!isAdmin) {
    return (
      <Navigate
        to="/"
        replace
      />
    )
  }

  return <>{children}</>
}
