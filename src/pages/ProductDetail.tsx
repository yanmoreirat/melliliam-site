import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Minus,
  Plus,
  ShoppingCart,
  MessageCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  Package,
  X,
} from 'lucide-react'
import { useProducts } from '@/hooks/useProducts'
import { useCart } from '@/contexts/CartContext'
import { useSiteSettings } from '@/hooks/useSiteSettings'
import ProductCard from '@/components/ProductCard'
import {
  formatCurrency,
  calculateFinalPrice,
  createWhatsAppLink,
} from '@/utils/formatters'
import clsx from 'clsx'

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { products, loading: productsLoading } = useProducts()
  const { addToCart, items, triggerFlyToCart } = useCart()
  const { settings } = useSiteSettings()

  const [quantity, setQuantity] = useState(1)
  const [activeImageIdx, setActiveImageIdx] = useState(0)
  const [addedFlash, setAddedFlash] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [zoomState, setZoomState] = useState<{
    active: boolean
    x: number
    y: number
  }>({ active: false, x: 0, y: 0 })
  const mainImageRef = useRef<HTMLImageElement>(null)
  const touchStartX = useRef<number>(0)
  const touchStartY = useRef<number>(0)
  const touchDeltaX = useRef<number>(0)
  const touchDeltaY = useRef<number>(0)

  const product = useMemo(
    () => products.find((p) => p.slug === slug),
    [products, slug]
  )

  const images = product?.images || []
  const hasDiscount = (product?.discount_percent || 0) > 0
  const finalPrice = product
    ? calculateFinalPrice(product.price, product.discount_percent)
    : 0

  useEffect(() => {
    setActiveImageIdx(0)
    setQuantity(1)
  }, [slug])

  const relatedProducts = useMemo(() => {
    if (!product) return []
    return products
      .filter((p) => p.id !== product.id && p.is_available)
      .slice(0, 4)
  }, [products, product])

  const inCart = product
    ? items.find((i) => i.product_id === product.id)?.quantity || 0
    : 0

  const getStartRect = () => {
    if (mainImageRef.current) {
      return mainImageRef.current.getBoundingClientRect()
    }
    return new DOMRect(0, 0, 100, 100)
  }

  const handleAddToCart = () => {
    if (!product || !product.is_available) return
    const currentImageUrl = images.length > 0 ? images[activeImageIdx].public_url : undefined
    if (currentImageUrl) {
      triggerFlyToCart(getStartRect(), currentImageUrl)
    }
    addToCart(product, quantity)
    setAddedFlash(true)
    setTimeout(() => setAddedFlash(false), 1500)
  }

  const handleImageMouseEnter = () => {
    setZoomState((prev) => ({ ...prev, active: true }))
  }

  const handleImageMouseLeave = () => {
    setZoomState((prev) => ({ ...prev, active: false }))
  }

  const handleImageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!e.currentTarget) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setZoomState({ active: true, x, y })
  }

  const lightboxPrev = useCallback(() => {
    setActiveImageIdx((i) => (i <= 0 ? Math.max(0, images.length - 1) : i - 1))
  }, [images.length])

  const lightboxNext = useCallback(() => {
    setActiveImageIdx((i) => (i >= images.length - 1 ? 0 : i + 1))
  }, [images.length])

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false)
  }, [])

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const t = e.touches[0]
    touchStartX.current = t.clientX
    touchStartY.current = t.clientY
    touchDeltaX.current = 0
    touchDeltaY.current = 0
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const t = e.touches[0]
    touchDeltaX.current = t.clientX - touchStartX.current
    touchDeltaY.current = t.clientY - touchStartY.current
  }

  const handleTouchEnd = () => {
    const absX = Math.abs(touchDeltaX.current)
    const absY = Math.abs(touchDeltaY.current)
    if (absX > 50 && absX > absY && images.length > 1) {
      if (touchDeltaX.current < 0) {
        nextImage()
      } else {
        prevImage()
      }
    }
  }

  useEffect(() => {
    if (!lightboxOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowLeft') lightboxPrev()
      if (e.key === 'ArrowRight') lightboxNext()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [lightboxOpen, closeLightbox, lightboxPrev, lightboxNext])

  if (productsLoading) {
    return (
      <div className="container-page py-12">
        <div className="animate-pulse space-y-8">
          <div className="h-5 bg-cream-200 rounded w-32" />
          <div className="grid lg:grid-cols-2 gap-10">
            <div className="space-y-4">
              <div className="aspect-square bg-cream-200 rounded-2xl" />
              <div className="grid grid-cols-4 gap-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="aspect-square bg-cream-200 rounded-xl" />
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <div className="h-10 bg-cream-200 rounded w-3/4" />
              <div className="h-5 bg-cream-200 rounded w-1/3" />
              <div className="h-16 bg-cream-200 rounded w-1/2" />
              <div className="space-y-3">
                <div className="h-5 bg-cream-200 rounded w-full" />
                <div className="h-5 bg-cream-200 rounded w-5/6" />
                <div className="h-5 bg-cream-200 rounded w-2/3" />
              </div>
              <div className="h-14 bg-cream-200 rounded w-full" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container-page py-16">
        <div className="max-w-xl mx-auto card p-12 text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-cream-100 flex items-center justify-center">
            <Package className="w-10 h-10 text-cream-400" />
          </div>
          <div className="space-y-2">
            <h1 className="font-display text-2xl font-bold">Produto não encontrado</h1>
            <p className="text-brown-500">
              O produto que você procura não existe ou foi removido.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link to="/produtos" className="btn-primary">
              Ver produtos
            </Link>
            <Link to="/" className="btn-outline">
              Voltar ao início
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const prevImage = () => {
    setActiveImageIdx((i) => (i <= 0 ? Math.max(0, images.length - 1) : i - 1))
  }

  const nextImage = () => {
    setActiveImageIdx((i) => (i >= images.length - 1 ? 0 : i + 1))
  }

  return (
    <div className="container-page py-8 lg:py-12">
      <Link
        to="/produtos"
        className="inline-flex items-center gap-1 text-sm text-honey-700 hover:underline mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para produtos
      </Link>

      <div className="grid lg:grid-cols-2 gap-8 lg:gap-14 mb-16">
        <div className="space-y-4">
          <div
            className="relative aspect-square rounded-2xl overflow-hidden bg-cream-100 border border-cream-300 shadow-sm md:cursor-zoom-in group"
            onMouseEnter={handleImageMouseEnter}
            onMouseLeave={handleImageMouseLeave}
            onMouseMove={handleImageMouseMove}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onClick={() => images.length > 0 && setLightboxOpen(true)}
          >
            {images.length > 0 ? (
              <>
                <img
                  ref={mainImageRef}
                  src={images[activeImageIdx].public_url}
                  alt={`${product.name} - Imagem ${activeImageIdx + 1}`}
                  className="w-full h-full object-cover pointer-events-none select-none"
                  draggable={false}
                />
                {zoomState.active && (
                  <div
                    className="absolute inset-0 pointer-events-none select-none rounded-xl hidden md:block"
                    style={{
                      backgroundImage: `url(${images[activeImageIdx].public_url})`,
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '150%',
                      backgroundPosition: `${zoomState.x}% ${zoomState.y}%`,
                      borderRadius: '12px',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
                    }}
                  />
                )}
              </>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-honey-100 via-honey-200 to-honey-100 animate-pulse" />
            )}
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    prevImage()
                  }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow hover:bg-white flex items-center justify-center text-brown-700 transition opacity-100 md:opacity-0 md:group-hover:opacity-100"
                  aria-label="Imagem anterior"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    nextImage()
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow hover:bg-white flex items-center justify-center text-brown-700 transition opacity-100 md:opacity-0 md:group-hover:opacity-100"
                  aria-label="Próxima imagem"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
            {hasDiscount && (
              <span className="badge absolute top-4 left-4 bg-red-500 text-white shadow-lg text-sm px-3 py-1 pointer-events-none">
                -{product.discount_percent}% OFF
              </span>
            )}
            {zoomState.active && (
              <div
                className="absolute w-28 h-28 border-2 border-white/70 rounded pointer-events-none hidden md:block"
                style={{
                  left: `calc(${zoomState.x}% - 56px)`,
                  top: `calc(${zoomState.y}% - 56px)`,
                  boxShadow: '0 0 0 9999px rgba(0,0,0,0) inset',
                }}
              />
            )}
          </div>

          {images.length > 1 && (
            <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 gap-2 lg:gap-3">
              {images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImageIdx(idx)}
                  className={clsx(
                    'aspect-square rounded-xl overflow-hidden border-2 transition-all',
                    idx === activeImageIdx
                      ? 'border-honey-500 ring-2 ring-honey-200 scale-[1.02]'
                      : 'border-cream-200 hover:border-cream-300 opacity-80 hover:opacity-100'
                  )}
                  aria-label={`Ver imagem ${idx + 1}`}
                >
                  <img
                    src={img.public_url}
                    alt={`Miniatura ${idx + 1}`}
                    className="w-full h-full object-cover bg-cream-100"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <h1 className="font-display text-3xl lg:text-4xl font-bold leading-tight">
                {product.name}
              </h1>
            </div>
            {product.size && (
              <p className="text-lg text-brown-600 font-medium">{product.size}</p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {product.is_available ? (
              <span className="badge bg-green-100 text-green-800 !px-3 !py-1 text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-green-600 mr-1.5" />
                Disponível em estoque
              </span>
            ) : (
              <span className="badge bg-red-600 text-white !px-3 !py-1 text-sm !font-bold !uppercase tracking-wider shadow-md">
              ESGOTADO
              </span>
            )}
            {inCart > 0 && (
              <span className="badge bg-honey-100 text-honey-800 !px-3 !py-1 text-sm">
                {inCart} no carrinho
              </span>
            )}
          </div>

          <div className="card p-5 bg-gradient-to-br from-cream-50 to-honey-50 border-honey-200">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                {hasDiscount && (
                  <div className="text-brown-400 line-through text-lg">
                    De {formatCurrency(product.price)}
                  </div>
                )}
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="font-display text-4xl lg:text-5xl font-bold text-honey-700">
                    {formatCurrency(finalPrice)}
                  </span>
                  {hasDiscount && (
                    <span className="badge bg-honey-500 text-white text-sm">
                      Economize {formatCurrency(product.price - finalPrice)}
                    </span>
                  )}
                </div>
                {hasDiscount && (
                  <p className="text-sm text-brown-500 mt-1">
                    em até 12x sem juros
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="font-display text-xl font-bold">Descrição</h2>
            <div className="space-y-3 text-brown-700 leading-relaxed whitespace-pre-wrap">
              {product.description || (
                <p className="text-brown-400 italic">
                  Sem descrição disponível.
                </p>
              )}
            </div>
          </div>

          <div className="card p-5 space-y-5">
            <div>
              <label className="label">Quantidade</label>
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center border border-cream-300 rounded-lg overflow-hidden bg-white">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="w-11 h-11 flex items-center justify-center text-brown-700 hover:bg-cream-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    aria-label="Diminuir quantidade"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(Math.max(1, Number(e.target.value) || 1))
                    }
                    className="w-16 h-11 text-center border-0 border-x border-cream-200 focus:outline-none focus:ring-0 text-lg font-semibold bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-11 h-11 flex items-center justify-center text-brown-700 hover:bg-cream-100 transition"
                    aria-label="Aumentar quantidade"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-sm text-brown-500">
                  Subtotal:{' '}
                  <span className="font-bold text-brown-900">
                    {formatCurrency(finalPrice * quantity)}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <button
                onClick={handleAddToCart}
                disabled={!product.is_available}
                className={clsx(
                  'btn-primary !py-4 text-base relative overflow-hidden transition-all',
                  addedFlash && '!bg-green-600'
                )}
              >
                {addedFlash ? (
                  <>
                    <Check className="w-5 h-5" />
                    Adicionado!
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5" />
                    Adicionar ao carrinho
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  handleAddToCart()
                  navigate('/carrinho')
                }}
                disabled={!product.is_available}
                className="btn-secondary !py-4 text-base"
              >
                Comprar agora
              </button>
            </div>

            {settings.whatsapp && (
              <a
                href={createWhatsAppLink(
                  settings.whatsapp,
                  `Olá! - Tenho interesse no produto "${product.name}"${product.size ? ` (${product.size})` : ''}.`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-whatsapp w-full !py-4 text-base"
              >
                <MessageCircle className="w-5 h-5" />
                Perguntar no WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <section className="py-8 border-t border-cream-300">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-8">
            <div>
              <h2 className="font-display text-2xl lg:text-3xl font-bold">
                Você também pode gostar
              </h2>
              <p className="text-brown-500 mt-1">
                Confira outros produtos selecionados
              </p>
            </div>
            <Link
              to="/produtos"
              className="text-honey-700 font-semibold hover:underline inline-flex items-center gap-1 self-start sm:self-auto"
            >
              Ver todos
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {lightboxOpen && images.length > 0 && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center animate-lightbox-fade-in"
          onClick={closeLightbox}
        >
          <button
            onClick={(e) => {
              e.stopPropagation()
              closeLightbox()
            }}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
            aria-label="Fechar"
          >
            <X className="w-6 h-6" />
          </button>

          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  lightboxPrev()
                }}
                className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
                aria-label="Imagem anterior"
              >
                <ChevronLeft className="w-7 h-7" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  lightboxNext()
                }}
                className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
                aria-label="Próxima imagem"
              >
                <ChevronRight className="w-7 h-7" />
              </button>
            </>
          )}

          <div
            className="relative max-w-[90vw] max-h-[90vh] animate-lightbox-zoom-in"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={images[activeImageIdx].public_url}
              alt={`${product.name} - Imagem ${activeImageIdx + 1}`}
              className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl select-none"
              draggable={false}
            />
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/50 text-white text-sm backdrop-blur-sm">
                {activeImageIdx + 1} / {images.length}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
