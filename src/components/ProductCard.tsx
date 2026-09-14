import { useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingCart, ChevronRight } from 'lucide-react'
import clsx from 'clsx'
import type { Product } from '@/types'
import { useCart } from '@/contexts/CartContext'
import { formatCurrency, calculateFinalPrice } from '@/utils/formatters'

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const navigate = useNavigate()
  const { addToCart, triggerFlyToCart } = useCart()
  const imageRef = useRef<HTMLImageElement>(null)

  const finalPrice = calculateFinalPrice(product.price, product.discount_percent)
  const hasDiscount = product.discount_percent != null && product.discount_percent > 0
  const hasImage = product.images && product.images.length > 0
  const imageUrl = hasImage ? product.images![0].public_url : undefined

  const getStartRect = () => {
    if (imageRef.current) {
      return imageRef.current.getBoundingClientRect()
    }
    return new DOMRect(0, 0, 100, 100)
  }

  const handleBuy = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!product.is_available) return
    if (imageUrl) {
      triggerFlyToCart(getStartRect(), imageUrl)
    }
    addToCart(product, 1)
    navigate('/carrinho')
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!product.is_available) return
    if (imageUrl) {
      triggerFlyToCart(getStartRect(), imageUrl)
    }
    addToCart(product, 1)
  }

  return (
    <Link
      to={`/produto/${product.slug}`}
      className={clsx(
        'group flex flex-col bg-white rounded-2xl overflow-hidden border border-honey-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1',
        !product.is_available && 'opacity-60 grayscale'
      )}
    >
      <div className="relative aspect-square overflow-hidden bg-cream-100">
        {imageUrl ? (
          <img
            ref={imageRef}
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-honey-100 via-honey-200 to-honey-100 animate-pulse" />
        )}

        {hasDiscount && product.is_available && (
          <div className="absolute top-3 left-3 bg-honey-600 text-white px-2.5 py-1 rounded-full text-xs font-bold shadow-md">
            -{product.discount_percent}%
          </div>
        )}

        {!product.is_available && (
          <div className="absolute inset-0 bg-brown-900/50 flex items-center justify-center">
            <span className="bg-cream-100 text-brown-800 px-4 py-2 rounded-full font-bold text-sm shadow-lg">
              Indisponível
            </span>
          </div>
        )}

        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-2">
          <button
            onClick={handleAddToCart}
            disabled={!product.is_available}
            className="w-10 h-10 rounded-full bg-white text-brown-700 shadow-md hover:bg-honey-50 hover:text-honey-700 flex items-center justify-center transition-colors disabled:cursor-not-allowed"
            aria-label="Adicionar ao carrinho"
          >
            <ShoppingCart size={18} />
          </button>
        </div>
      </div>

      <div className="flex flex-col flex-1 p-4 sm:p-5">
        <h3 className="font-display font-bold text-brown-800 text-lg mb-1 line-clamp-1 group-hover:text-honey-700 transition-colors">
          {product.name}
        </h3>

        {product.size && (
          <p className="text-sm text-brown-500 mb-3">{product.size}</p>
        )}

        <div className="mt-auto">
          <div className="flex items-end justify-between mb-4">
            <div>
              {hasDiscount && (
                <p className="text-sm text-brown-400 line-through">
                  {formatCurrency(product.price)}
                </p>
              )}
              <p className="text-xl sm:text-2xl font-bold text-honey-700">
                {formatCurrency(finalPrice)}
              </p>
              {hasDiscount && (
                <p className="text-xs text-green-600 font-medium">
                  Economize {formatCurrency(product.price - finalPrice)}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleBuy}
              disabled={!product.is_available}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-honey-500 hover:bg-honey-600 text-white rounded-xl font-medium text-sm transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingCart size={16} />
              Comprar
            </button>
            <div className="w-10 h-10 rounded-xl bg-honey-100 text-honey-700 flex items-center justify-center group-hover:bg-honey-200 transition-colors">
              <ChevronRight size={18} />
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
