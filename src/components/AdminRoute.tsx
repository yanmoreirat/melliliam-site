import { type ReactNode, useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import BeeLoader from '@/components/BeeLoader'

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
      <BeeLoader
        title="MEL LILIAM"
        subtitle="Verificando acesso..."
        size="md"
      />
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
