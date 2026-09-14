import { useState } from 'react'
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  Tag,
  Settings,
  FileText,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Loader2,
} from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '@/contexts/AuthContext'
import { useSiteSettings } from '@/hooks/useSiteSettings'

const menuItems = [
  {
    label: 'Dashboard',
    path: '/admin',
    icon: LayoutDashboard,
    end: true,
  },
  {
    label: 'Pedidos',
    path: '/admin/pedidos',
    icon: Package,
  },
  {
    label: 'Produtos',
    path: '/admin/produtos',
    icon: Tag,
  },
  {
    label: 'Cupons',
    path: '/admin/cupons',
    icon: Tag,
  },
  {
    label: 'Configurações',
    path: '/admin/configuracoes',
    icon: Settings,
  },
  {
    label: 'Conteúdo',
    path: '/admin/conteudo',
    icon: FileText,
  },
]

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout, isLoading: authLoading } = useAuth()
  const { settings, loading: settingsLoading } = useSiteSettings()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/admin/login', { replace: true })
    } catch {
      // ignore
    }
  }

  if (authLoading || settingsLoading) {
    return (
<div className="fixed inset-0 z-50 bg-brown-800 text-cream-100 flex flex-col items-center justify-center gap-4 h-screen w-screen">
  <Loader2 className="w-12 h-12 animate-spin text-honey-500" />
  <h1 className="font-display font-bold text-2xl text-brown-300">MEL LILIAM</h1>
  <p className="text-sm text-brown-300">Carregando painel administrativo...</p>
</div>
    )
  }

  return (
    <div className="min-h-screen bg-cream-100 flex">
      {/* Sidebar Desktop */}
      <aside
        className={clsx(
          'fixed lg:static inset-y-0 left-0 z-40 w-72 bg-brown-800 text-cream-100 flex flex-col transform transition-transform duration-300 ease-in-out',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="relative flex-1 flex flex-col overflow-hidden">
          <div className="relative p-6 border-b border-brown-700">
            <Link to="/" className="flex items-center gap-3 group">
              {settings.site_logo_url ? (
                <img
                  src={settings.site_logo_url}
                  alt={settings.company_name}
                  className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-honey-500 flex items-center justify-center shadow-md group-hover:bg-honey-600 transition-colors flex-shrink-0">
                  <span className="text-cream-50 font-display font-bold text-xl">M</span>
                </div>
              )}
              <div className="min-w-0">
                <h1 className="font-display font-bold text-lg text-honey-300 leading-tight truncate">
                  {settings.company_name}
                </h1>
                <p className="text-xs text-brown-300">Painel Admin</p>
              </div>
            </Link>
          </div>

          <nav className="relative flex-1 p-4 space-y-1 overflow-y-auto">
            <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-brown-400">
              Navegação
            </p>
            {menuItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    clsx(
                      'group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-honey-500 text-white shadow-lg shadow-honey-500/30'
                        : 'text-brown-200 hover:bg-brown-700/50 hover:text-honey-300'
                    )
                  }
                >
                  <Icon size={20} className={clsx(
                    'flex-shrink-0 transition-colors',
                  )} />
                  <span className="flex-1">{item.label}</span>
                  <ChevronRight
                    size={16}
                    className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all"
                  />
                </NavLink>
              )
            })}
          </nav>

          <div className="relative flex items-center justify-center py-3 px-4">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-brown-600 to-transparent" />
            <svg
              viewBox="0 0 64 64"
              width="32"
              height="32"
              className="mx-3 flex-shrink-0"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="beeBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#D97706" />
                </linearGradient>
                <radialGradient id="wingGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FEF3C7" stopOpacity="0.55" />
                  <stop offset="100%" stopColor="#FDE68A" stopOpacity="0.2" />
                </radialGradient>
              </defs>
              <ellipse cx="45" cy="32" rx="7" ry="6" fill="#1C1917" />
              <circle cx="42.5" cy="29.5" r="1.6" fill="#FEF3C7" />
              <circle cx="42.3" cy="29.7" r="0.8" fill="#1C1917" />
              <circle cx="47.2" cy="29.5" r="1.4" fill="#FEF3C7" />
              <circle cx="47" cy="29.7" r="0.7" fill="#1C1917" />
              <path d="M48.5 27.5 Q51 25.5 52.5 26.5" stroke="#1C1917" strokeWidth="0.9" fill="none" strokeLinecap="round" />
              <path d="M50 27 Q53 25.2 54.8 26" stroke="#1C1917" strokeWidth="0.9" fill="none" strokeLinecap="round" />
              <ellipse cx="28" cy="32" rx="17" ry="12.5" fill="url(#beeBodyGrad)" />
              <rect x="14.5" y="23.5" width="5.5" height="17" rx="1.5" fill="#1C1917" opacity="0.85" />
              <rect x="23.5" y="23.5" width="5.5" height="17" rx="1.5" fill="#1C1917" opacity="0.85" />
              <rect x="32.5" y="23.5" width="5.5" height="17" rx="1.5" fill="#1C1917" opacity="0.85" />
              <path d="M14 29 Q8 23 6 18 Q14 15 21 22" fill="url(#wingGrad)" stroke="#B45309" strokeWidth="0.4" />
              <path d="M17 35 Q11 44 10 48 Q18 47 24 40" fill="url(#wingGrad)" stroke="#B45309" strokeWidth="0.4" />
              <line x1="20" y1="44.5" x2="17" y2="50" stroke="#1C1917" strokeWidth="1" strokeLinecap="round" />
              <line x1="17" y1="50" x2="14.5" y2="49.5" stroke="#1C1917" strokeWidth="1" strokeLinecap="round" />
              <line x1="28" y1="45" x2="28" y2="51" stroke="#1C1917" strokeWidth="1" strokeLinecap="round" />
              <line x1="28" y1="51" x2="25.5" y2="51.5" stroke="#1C1917" strokeWidth="1" strokeLinecap="round" />
              <line x1="36" y1="44.5" x2="39" y2="50" stroke="#1C1917" strokeWidth="1" strokeLinecap="round" />
              <line x1="39" y1="50" x2="41.5" y2="49" stroke="#1C1917" strokeWidth="1" strokeLinecap="round" />
              <line x1="20" y1="19.5" x2="17" y2="14" stroke="#1C1917" strokeWidth="1" strokeLinecap="round" />
              <line x1="17" y1="14" x2="14.5" y2="14.5" stroke="#1C1917" strokeWidth="1" strokeLinecap="round" />
              <line x1="36" y1="19.5" x2="39" y2="14" stroke="#1C1917" strokeWidth="1" strokeLinecap="round" />
              <line x1="39" y1="14" x2="41.5" y2="15" stroke="#1C1917" strokeWidth="1" strokeLinecap="round" />
            </svg>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-brown-600 to-transparent" />
          </div>

          <div className="relative p-4 border-t border-brown-700 space-y-3">
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-brown-700/40">
              <div className="w-10 h-10 rounded-full bg-honey-500 flex items-center justify-center flex-shrink-0">
                <span className="text-cream-50 font-bold text-sm">
                  {user?.email?.charAt(0).toUpperCase() || 'A'}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-cream-100 truncate">
                  {user?.email || 'Administrador'}
                </p>
                <p className="text-xs text-brown-400">Admin</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-300 hover:bg-red-500/10 hover:text-red-200 transition-colors"
            >
              <LogOut size={20} />
              <span>Sair</span>
            </button>

            <Link
              to="/"
              className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-xs text-brown-400 hover:text-honey-300 transition-colors"
            >
              ← Voltar ao site
            </Link>
          </div>
        </div>
      </aside>

      {/* Overlay Mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-brown-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Conteúdo Principal */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header Mobile */}
        <header className="lg:hidden sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-honey-200">
          <div className="flex items-center justify-between px-4 h-16">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg text-brown-700 hover:bg-honey-100 transition-colors"
              aria-label="Abrir menu"
            >
              <Menu size={24} />
            </button>

            <div className="flex items-center gap-2">
              {settings.site_logo_url ? (
                <img
                  src={settings.site_logo_url}
                  alt={settings.company_name}
                  className="w-9 h-9 object-contain"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-honey-500 flex items-center justify-center">
                  <span className="text-cream-50 font-display font-bold text-sm">M</span>
                </div>
              )}
              <span className="font-display font-bold text-brown-800">
                Admin
              </span>
            </div>

            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-lg text-brown-700 hover:bg-honey-100 transition-colors lg:hidden"
              aria-label="Fechar menu"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} className="opacity-0" />}
            </button>
          </div>
        </header>

        {/* Conteúdo */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
