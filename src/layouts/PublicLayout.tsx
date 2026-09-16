import { Outlet } from 'react-router-dom'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import FlyingCart from '@/components/FlyingCart'
import BeeLoader from '@/components/BeeLoader'
import { useSiteSettings } from '@/contexts/SiteSettingsContext'
import { useProducts } from '@/contexts/ProductsContext'

export default function PublicLayout() {
  const { loading: settingsLoading } = useSiteSettings()
  const { loading: productsLoading } = useProducts()

  if (settingsLoading || productsLoading) {
    return <BeeLoader title="MEL LILIAM" subtitle="Carregando..." size="lg" />
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
