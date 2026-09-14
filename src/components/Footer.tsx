import { Link, useNavigate } from 'react-router-dom'
import { MessageCircle, ChevronRight, Package } from 'lucide-react'
import { useSiteSettings } from '@/hooks/useSiteSettings'
import { createWhatsAppLink } from '@/utils/formatters'
import BeeHiveDecor from './BeeHiveDecor'

function InstagramIcon({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  )
}

export default function Footer() {
  const { settings } = useSiteSettings()
  const navigate = useNavigate()
  const hasFooterImageDesktop = !!settings.footer_image_url
  const hasFooterImageMobile = !!settings.footer_mobile_image_url
  const hasAnyFooterImage = hasFooterImageDesktop || hasFooterImageMobile

  const quickLinks = [
    { label: 'Início', path: '/' },
    { label: 'Produtos', path: '/produtos' },
    { label: 'Carrinho', path: '/carrinho' },
    { label: 'Acompanhar pedido', path: '/pedido' },
  ]

  return (
    <footer className="bg-brown-800 text-cream-100 mt-16 relative overflow-hidden">
      {!hasAnyFooterImage && (
        <BeeHiveDecor variant="honeycomb" className="absolute -top-10 -right-10 w-64 h-64 text-honey-400 rotate-12" />
      )}
      {!hasAnyFooterImage && (
        <BeeHiveDecor variant="honeycomb" className="absolute -bottom-20 -left-20 w-80 h-80 text-honey-300 -rotate-12" />
      )}
      {hasFooterImageDesktop && (
        <img
          src={settings.footer_image_url}
          alt=""
          className="hidden md:block absolute inset-0 w-full h-full object-cover opacity-25 pointer-events-none"
        />
      )}
      {hasFooterImageMobile && (
        <img
          src={settings.footer_mobile_image_url}
          alt=""
          className="block md:hidden absolute inset-0 w-full h-full object-cover opacity-25 pointer-events-none"
        />
      )}
      {!hasFooterImageMobile && hasFooterImageDesktop && (
        <img
          src={settings.footer_image_url}
          alt=""
          className="block md:hidden absolute inset-0 w-full h-full object-cover opacity-25 pointer-events-none"
          aria-hidden="true"
        />
      )}

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              {settings.site_logo_url ? (
                <img
                  src={settings.site_logo_url}
                  alt={settings.company_name}
                  className="w-14 h-14 lg:w-16 lg:h-16 rounded-xl object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-xl bg-gradient-to-br from-honey-100 via-honey-200 to-honey-100 animate-pulse flex-shrink-0" />
              )}
              <div>
                <h3 className="font-display font-bold text-xl text-honey-300">
                  {settings.company_name}
                </h3>
                <p className="text-xs text-brown-300">Mel Artesanal, Puro e 100% Orgânico</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 mt-6">
              {settings.whatsapp && (
                <a
                  href={createWhatsAppLink(settings.whatsapp, 'Olá! Vim pelo site.')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium text-sm transition-colors shadow-sm"
                >
                  <MessageCircle size={16} />
                  WhatsApp
                </a>
              )}
              {settings.instagram && (
                <a
                  href={settings.instagram.startsWith('http') ? settings.instagram : `https://instagram.com/${settings.instagram.replace(/^@/, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-lg font-medium text-sm transition-all shadow-sm"
                >
                  <InstagramIcon size={16} />
                  Instagram
                </a>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-display font-bold text-honey-300 text-lg mb-4">Links úteis</h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.path}
                    className="inline-flex items-center gap-1 text-brown-200 hover:text-honey-300 text-sm transition-colors group"
                    onClick={(e) => {
                      if (link.label === 'Início') {
                        e.preventDefault()
                        navigate('/')
                        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
                      }
                    }}
                  >
                    <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-bold text-honey-300 text-lg mb-4">Atendimento</h4>
            <ul className="space-y-3 text-sm text-brown-200">
              {settings.whatsapp && (
                <li className="flex items-start gap-2">
                  <MessageCircle size={16} className="text-honey-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-brown-100 font-medium">WhatsApp</p>
                    <a
                      href={createWhatsAppLink(settings.whatsapp)}
                      className="hover:text-honey-300 transition-colors"
                    >
                      {settings.whatsapp}
                    </a>
                  </div>
                </li>
              )}
              {settings.instagram && (
                <li className="flex items-start gap-2">
                  <InstagramIcon size={16} className="text-honey-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-brown-100 font-medium">Instagram</p>
                    <a
                      href={settings.instagram.startsWith('http') ? settings.instagram : `https://instagram.com/${settings.instagram.replace(/^@/, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-honey-300 transition-colors"
                    >
                      {settings.instagram.startsWith('http') || settings.instagram.startsWith('@')
                        ? settings.instagram
                        : `@${settings.instagram}`}
                    </a>
                  </div>
                </li>
              )}
              <li className="flex items-start gap-2">
                <Package size={16} className="text-honey-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-brown-100 font-medium">Pedidos</p>
                  <Link to="/pedido" className="hover:text-honey-300 transition-colors">
                    Acompanhe seu pedido
                  </Link>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-brown-700 mt-10 pt-6 text-center text-brown-300 text-sm">
          <p>{settings.footer_text}</p>
        </div>
      </div>
    </footer>
  )
}
