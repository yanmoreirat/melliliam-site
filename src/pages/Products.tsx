import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Filter,
  ArrowUpDown,
  ShoppingBag,
  Package,
  ArrowLeft,
} from 'lucide-react'
import { useProducts } from '@/hooks/useProducts'
import ProductCard from '@/components/ProductCard'
import clsx from 'clsx'

type SortOption =
  | 'order'
  | 'name-asc'
  | 'name-desc'
  | 'price-asc'
  | 'price-desc'
  | 'discount-desc'

type AvailabilityFilter = 'all' | 'available'

export default function Products() {
  const { products, loading } = useProducts()
  const [availability, setAvailability] = useState<AvailabilityFilter>('all')
  const [sortBy, setSortBy] = useState<SortOption>('order')
  const [showFilters, setShowFilters] = useState(false)

  const filteredProducts = useMemo(() => {
    let list = [...products]

    if (availability === 'available') {
      list = list.filter((p) => p.is_available)
    }

    switch (sortBy) {
      case 'name-asc':
        list.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'name-desc':
        list.sort((a, b) => b.name.localeCompare(a.name))
        break
      case 'price-asc':
        list.sort((a, b) => {
          const pa = a.discount_percent > 0
            ? a.price * (1 - a.discount_percent / 100)
            : a.price
          const pb = b.discount_percent > 0
            ? b.price * (1 - b.discount_percent / 100)
            : b.price
          return pa - pb
        })
        break
      case 'price-desc':
        list.sort((a, b) => {
          const pa = a.discount_percent > 0
            ? a.price * (1 - a.discount_percent / 100)
            : a.price
          const pb = b.discount_percent > 0
            ? b.price * (1 - b.discount_percent / 100)
            : b.price
          return pb - pa
        })
        break
      case 'discount-desc':
        list.sort((a, b) => b.discount_percent - a.discount_percent)
        break
      case 'order':
      default:
        list.sort((a, b) => a.display_order - b.display_order)
    }

    return list
  }, [products, availability, sortBy])

  const availabilityOptions: { value: AvailabilityFilter; label: string }[] = [
    { value: 'all', label: 'Todos os produtos' },
    { value: 'available', label: 'Somente disponíveis' },
  ]

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'order', label: 'Padrão' },
    { value: 'name-asc', label: 'Nome: A → Z' },
    { value: 'name-desc', label: 'Nome: Z → A' },
    { value: 'price-asc', label: 'Menor preço' },
    { value: 'price-desc', label: 'Maior preço' },
    { value: 'discount-desc', label: 'Maiores descontos' },
  ]

  return (
    <div className="container-page py-8 lg:py-12">
      <div className="space-y-3 mb-8">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-honey-700 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para o início
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl lg:text-4xl font-bold">
              Nossos produtos
            </h1>
            <p className="text-brown-600 mt-1">
              {loading
                ? 'Carregando...'
                : `${filteredProducts.length} produto${filteredProducts.length === 1 ? '' : 's'} encontrado${filteredProducts.length === 1 ? '' : 's'}`}
            </p>
          </div>
          <Link to="/carrinho" className="btn-outline self-start sm:self-auto">
            <ShoppingBag className="w-4 h-4" />
            Ir para o carrinho
          </Link>
        </div>
      </div>

      <div className="mb-6 lg:mb-8">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="lg:hidden btn-ghost gap-2 mb-3"
        >
          <Filter className="w-4 h-4" />
          Filtros e ordenação
        </button>

        <div
          className={clsx(
            'card p-4 lg:p-5 space-y-4',
            'lg:space-y-0 lg:flex lg:items-center lg:justify-between lg:gap-6',
            !showFilters && 'hidden lg:block'
          )}
        >
          <div className="space-y-3 lg:space-y-0 lg:flex lg:items-center lg:gap-6">
            <div className="lg:min-w-[220px]">
              <label className="label">Disponibilidade</label>
              <select
                className="input"
                value={availability}
                onChange={(e) => setAvailability(e.target.value as AvailabilityFilter)}
              >
                {availabilityOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="lg:min-w-[220px]">
              <label className="label">
                <span className="inline-flex items-center gap-1.5">
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  Ordenar por
                </span>
              </label>
              <select
                className="input"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="pt-2 border-t border-cream-200 lg:border-t-0 lg:pt-0 text-sm text-brown-500 flex items-center gap-2 lg:justify-end">
            <Package className="w-4 h-4" />
            Mostrando {filteredProducts.length} de {products.length}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="aspect-square bg-cream-200" />
              <div className="p-4 space-y-3">
                <div className="h-5 bg-cream-200 rounded w-3/4" />
                <div className="h-4 bg-cream-200 rounded w-1/2" />
                <div className="h-7 bg-cream-200 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="card p-16 text-center space-y-4">
          <div className="w-20 h-20 mx-auto rounded-full bg-cream-100 flex items-center justify-center">
            <Package className="w-10 h-10 text-cream-400" />
          </div>
          <div className="space-y-2">
            <h3 className="font-display text-xl font-bold">Nenhum produto encontrado</h3>
            <p className="text-brown-500 max-w-sm mx-auto">
              Nenhum produto corresponde aos filtros selecionados. Tente alterar os critérios de busca.
            </p>
          </div>
          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => {
                setAvailability('all')
                setSortBy('order')
              }}
              className="btn-ghost"
            >
              Limpar filtros
            </button>
            <Link to="/" className="btn-primary">
              Voltar ao início
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
