import { Outlet } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import FlyingCart from '@/components/FlyingCart'
import { useSiteSettings } from '@/hooks/useSiteSettings'
import { useProducts } from '@/hooks/useProducts'

export default function PublicLayout() {
  const { loading: settingsLoading } = useSiteSettings()
  const { loading: productsLoading } = useProducts()

  if (settingsLoading || productsLoading) {
    return (
      <div className="fixed inset-0 z-50 w-screen h-screen bg-cream-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-honey-600 animate-spin mx-auto mb-4" />
          <h2 className="font-display font-bold text-2xl text-brown-800 mb-2">
            MEL LILIAM
          </h2>
          <p className="text-brown-500 text-sm">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-cream-50">
      <Header />
      <FlyingCart />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
