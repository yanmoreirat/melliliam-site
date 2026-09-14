import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, Menu, X, MessageCircle } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { useSiteSettings } from '@/hooks/useSiteSettings'
import { createWhatsAppLink } from '@/utils/formatters'
import { useScrollY } from '@/hooks/useScrollY'
import clsx from 'clsx'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { itemCount, cartBounce } = useCart()
  const { settings } = useSiteSettings()
  const navigate = useNavigate()
  const scrollY = useScrollY(16)
  const scrolled = scrollY > 18

  const navLinks = [
    { label: 'Início', path: '/' },
    { label: 'Produtos', path: '/produtos' },
    { label: 'Acompanhar pedido', path: '/pedido', isExternal: false },
  ]

  return (
    <header
      className={clsx(
        'sticky top-0 z-50 border-b transition-all duration-300',
        scrolled
          ? 'bg-cream-50/90 backdrop-blur-md border-honey-200 shadow-md'
          : 'bg-cream-100 border-honey-200/70 shadow-sm',
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between h-20">
        <Link
          to="/"
          className="flex items-center gap-2 group"
          onClick={(e) => {
            e.preventDefault()
            navigate('/')
            window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
          }}
        >
          {settings.site_logo_url ? (
            <img
              src={settings.site_logo_url}
              alt={settings.company_name}
              className="w-14 h-14 lg:w-16 lg:h-16 rounded-xl object-cover flex-shrink-0 group-hover:shadow-md transition-shadow"
            />
          ) : (
            <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-xl bg-gradient-to-br from-honey-100 via-honey-200 to-honey-100 animate-pulse flex-shrink-0" />
          )}
          <div>
            <h1 className="font-display font-bold text-brown-800 text-xl sm:text-2xl leading-tight">
              {settings.company_name}
            </h1>
            <p className="text-xs text-brown-500">Mel Artesanal</p>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.path}
              onClick={(e) => {
                if (link.label === 'Início') {
                  e.preventDefault()
                  navigate('/')
                  window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
                }
              }}
              className="text-brown-700 hover:text-honey-700 font-medium transition-colors relative group"
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-honey-500 group-hover:w-full transition-all duration-300" />
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-4">
          {settings.whatsapp && (
            <a
              href={createWhatsAppLink(settings.whatsapp, 'Olá! - Tenho uma duvida sobre os produtos.')}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium text-sm transition-colors shadow-sm"
            >
              <MessageCircle size={18} />
              <span>WhatsApp</span>
            </a>
          )}

          <button
            id="header-cart-icon"
            onClick={() => navigate('/carrinho')}
            className={clsx(
              'relative p-2 rounded-full text-brown-700 hover:bg-honey-100 transition-colors',
              cartBounce && 'cart-bounce'
            )}
            aria-label="Carrinho"
          >
            <ShoppingCart size={22} />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-honey-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow">
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-full text-brown-700 hover:bg-honey-100 transition-colors"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
      </div>

      <div
        className={clsx(
          'md:hidden overflow-hidden transition-all duration-300 ease-in-out',
          mobileMenuOpen ? 'max-h-96 border-t border-honey-200' : 'max-h-0'
        )}
      >
        <div className="px-4 py-4 space-y-2 bg-cream-50">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.path}
              onClick={(e) => {
                setMobileMenuOpen(false)
                if (link.label === 'Início') {
                  e.preventDefault()
                  navigate('/')
                  window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
                }
              }}
              className="block px-4 py-3 rounded-lg text-brown-700 hover:bg-honey-100 hover:text-honey-800 font-medium transition-colors"
            >
              {link.label}
            </Link>
          ))}
          {settings.whatsapp && (
            <a
              href={createWhatsAppLink(settings.whatsapp, 'Olá! - Tenho uma duvida sobre os produtos.')}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
            >
              <MessageCircle size={18} />
              WhatsApp
            </a>
          )}
        </div>
      </div>
    </header>
  )
}
