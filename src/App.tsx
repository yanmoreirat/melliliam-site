import { Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { AuthProvider } from '@/contexts/AuthContext'
import { CartProvider } from '@/contexts/CartContext'
import { useSiteSettings } from '@/hooks/useSiteSettings'
import PublicLayout from '@/layouts/PublicLayout'
import AdminLayout from '@/layouts/AdminLayout'
import Home from '@/pages/Home'
import ProductsPage from '@/pages/Products'
import ProductDetail from '@/pages/ProductDetail'
import Cart from '@/pages/Cart'
import Checkout from '@/pages/Checkout'
import Payment from '@/pages/Payment'
import OrderTracking from '@/pages/OrderTracking'
import AdminLogin from '@/pages/admin/Login'
import AdminDashboard from '@/pages/admin/Dashboard'
import AdminOrders from '@/pages/admin/Orders'
import AdminOrderDetail from '@/pages/admin/OrderDetail'
import AdminProducts from '@/pages/admin/Products'
import AdminProductForm from '@/pages/admin/ProductForm'
import AdminCoupons from '@/pages/admin/Coupons'
import AdminSettings from '@/pages/admin/Settings'
import AdminContent from '@/pages/admin/Content'
import AdminRoute from '@/components/AdminRoute'

function FaviconUpdater() {
  const { settings } = useSiteSettings()

  useEffect(() => {
    const faviconUrl = settings.site_favicon_url || settings.site_logo_url || '/favicon.ico'

    let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement | null
    if (!link) {
      link = document.createElement('link')
      link.type = 'image/x-icon'
      link.rel = 'shortcut icon'
      document.getElementsByTagName('head')[0].appendChild(link)
    }
    link.href = faviconUrl

    let apple = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement | null
    if (!apple) {
      apple = document.createElement('link')
      apple.rel = 'apple-touch-icon'
      document.head.appendChild(apple)
    }
    apple.href = faviconUrl
  }, [settings.site_favicon_url, settings.site_logo_url])

  return null
}

function AppContent() {
  return (
    <>
      <FaviconUpdater />
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/produtos" element={<ProductsPage />} />
          <Route path="/produto/:slug" element={<ProductDetail />} />
          <Route path="/carrinho" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/pagamento" element={<Payment />} />
          <Route path="/pagamento/:orderNumber" element={<Payment />} />
          <Route path="/pedido" element={<OrderTracking />} />
          <Route path="/pedido/:orderNumber" element={<OrderTracking />} />
        </Route>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/pedidos" element={<AdminOrders />} />
          <Route path="/admin/pedidos/:orderNumber" element={<AdminOrderDetail />} />
          <Route path="/admin/produtos" element={<AdminProducts />} />
          <Route path="/admin/produtos/novo" element={<AdminProductForm />} />
          <Route path="/admin/produtos/:id" element={<AdminProductForm />} />
          <Route path="/admin/cupons" element={<AdminCoupons />} />
          <Route path="/admin/configuracoes" element={<AdminSettings />} />
          <Route path="/admin/conteudo" element={<AdminContent />} />
        </Route>
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </AuthProvider>
  )
}
