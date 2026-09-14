import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ShoppingCart,
  Minus,
  Plus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Tag,
  AlertCircle,
  CheckCircle,
  Package,
  Truck,
} from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { supabase } from '@/lib/supabase'
import type { Coupon } from '@/types'
import { formatCurrency, calculateFinalPrice } from '@/utils/formatters'
import clsx from 'clsx'

export default function Cart() {
  const navigate = useNavigate()
  const {
    items,
    removeFromCart,
    updateQuantity,
    subtotal,
    discountTotal,
    coupon,
    couponDiscount,
    shippingFee,
    shippingCalculated,
    shippingConfig,
    resolvedShipping,
    total,
    applyCoupon,
    clearCart,
  } = useCart()

  const [couponCode, setCouponCode] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState('')
  const [couponSuccess, setCouponSuccess] = useState('')

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault()
    const code = couponCode.trim().toUpperCase()
    if (!code) {
      setCouponError('Informe um código de cupom')
      return
    }
    setCouponError('')
    setCouponSuccess('')
    setCouponLoading(true)
    try {
      const today = new Date().toISOString()
      const { data } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code)
        .eq('active', true)
        .limit(1)
        .maybeSingle()

      const couponData = data as Coupon | null
      if (!couponData) {
        setCouponError('Cupom inválido ou não encontrado')
        applyCoupon(null)
        return
      }
      if (couponData.expires_at && new Date(couponData.expires_at) < new Date(today)) {
        setCouponError('Este cupom já expirou')
        applyCoupon(null)
        return
      }
      applyCoupon(couponData)
      setCouponSuccess(`Cupom "${code}" aplicado com sucesso!`)
      setCouponCode('')
    } catch {
      setCouponError('Erro ao validar cupom. Tente novamente.')
    } finally {
      setCouponLoading(false)
    }
  }

  const handleRemoveCoupon = () => {
    applyCoupon(null)
    setCouponSuccess('')
    setCouponError('')
  }

  if (items.length === 0) {
    return (
      <div className="container-page py-16">
        <div className="max-w-xl mx-auto card p-12 text-center space-y-6">
          <div className="w-24 h-24 mx-auto rounded-full bg-cream-100 flex items-center justify-center">
            <ShoppingCart className="w-12 h-12 text-cream-400" />
          </div>
          <div className="space-y-2">
            <h1 className="font-display text-2xl lg:text-3xl font-bold">
              Seu carrinho está vazio
            </h1>
            <p className="text-brown-500">
              Adicione produtos para continuar com sua compra.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link to="/produtos" className="btn-primary">
              <Package className="w-5 h-5" />
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

  return (
    <div className="container-page py-8 lg:py-12">
      <Link
        to="/produtos"
        className="inline-flex items-center gap-1 text-sm text-honey-700 hover:underline mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Continuar comprando
      </Link>

      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl lg:text-4xl font-bold flex items-center gap-3">
            <ShoppingCart className="w-9 h-9 text-honey-600" />
            Meu carrinho
          </h1>
          <p className="text-brown-600 mt-1">
            {items.length} item{items.length === 1 ? '' : 's'} no carrinho
          </p>
        </div>
        <button
          onClick={clearCart}
          className="text-red-600 hover:text-red-700 text-sm font-semibold self-start lg:self-auto inline-flex items-center gap-1.5 hover:underline"
        >
          <Trash2 className="w-4 h-4" />
          Limpar carrinho
        </button>
      </div>

      <div className="grid lg:grid-cols-[1fr_380px] gap-6 lg:gap-8">
        <div className="card overflow-hidden">
          <div className="hidden sm:grid grid-cols-[1fr_110px_120px_110px_40px] gap-4 px-6 py-4 bg-cream-100 border-b border-cream-300 text-sm font-semibold text-brown-700">
            <div>Produto</div>
            <div className="text-center">Qtd.</div>
            <div className="text-right">Unitário</div>
            <div className="text-right">Subtotal</div>
            <div />
          </div>

          <ul className="divide-y divide-cream-200">
            {items.map((item) => {
              const finalPrice = calculateFinalPrice(
                item.product.price,
                item.product.discount_percent
              )
              const itemSubtotal = finalPrice * item.quantity
              const imageUrl = item.product.images?.[0]?.public_url

              return (
                <li
                  key={item.product_id}
                  className="grid grid-cols-[auto_1fr] sm:grid-cols-[1fr_110px_120px_110px_40px] gap-3 sm:gap-4 px-4 sm:px-6 py-4 sm:py-5 items-center"
                >
                  <div className="col-span-2 sm:col-span-1 flex gap-3 sm:gap-4 items-center">
                    <Link
                      to={`/produto/${item.product.slug}`}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-cream-100 flex-shrink-0 border border-cream-200"
                    >
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-cream-400 text-xs">
                          Sem img
                        </div>
                      )}
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/produto/${item.product.slug}`}
                        className="font-semibold text-brown-900 hover:text-honey-700 line-clamp-2 block"
                      >
                        {item.product.name}
                      </Link>
                      {item.product.size && (
                        <p className="text-xs sm:text-sm text-brown-500 mt-0.5">
                          {item.product.size}
                        </p>
                      )}
                      {item.product.discount_percent > 0 && (
                        <p className="text-xs text-red-600 font-semibold mt-1">
                          -{item.product.discount_percent}%
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="sm:text-center flex sm:block items-center justify-between sm:justify-normal gap-2 col-span-2 sm:col-span-1 sm:mt-0 mt-2">
                    <span className="text-xs sm:hidden font-semibold text-brown-600">
                      Qtd:
                    </span>
                    <div className="inline-flex items-center border border-cream-300 rounded-lg overflow-hidden bg-white">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.product_id, item.quantity - 1)
                        }
                        className="w-8 h-9 sm:w-9 flex items-center justify-center text-brown-700 hover:bg-cream-100 transition"
                        aria-label="Diminuir"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 sm:w-10 text-center text-sm font-semibold bg-transparent border-0">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.product_id, item.quantity + 1)
                        }
                        className="w-8 h-9 sm:w-9 flex items-center justify-center text-brown-700 hover:bg-cream-100 transition"
                        aria-label="Aumentar"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="hidden sm:block text-right">
                    {item.product.discount_percent > 0 && (
                      <div className="text-xs text-brown-400 line-through">
                        {formatCurrency(item.product.price)}
                      </div>
                    )}
                    <div className="font-semibold text-brown-900">
                      {formatCurrency(finalPrice)}
                    </div>
                  </div>

                  <div className="col-span-2 sm:col-span-1 flex sm:block sm:text-right items-center justify-between gap-2 border-t border-cream-100 sm:border-0 pt-3 sm:pt-0">
                    <span className="text-xs sm:hidden font-semibold text-brown-600">
                      Subtotal:
                    </span>
                    <span className="font-bold text-brown-900 text-lg">
                      {formatCurrency(itemSubtotal)}
                    </span>
                  </div>

                  <div className="sm:col-span-1 row-start-4 sm:row-auto flex sm:justify-end pt-1 sm:pt-0">
                    <button
                      onClick={() => removeFromCart(item.product_id)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                      title="Remover item"
                      aria-label="Remover item"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 self-start">
          <div className="card p-5 space-y-4">
            <h3 className="font-display text-xl font-bold flex items-center gap-2">
              <Tag className="w-5 h-5 text-honey-600" />
              Cupom de desconto
            </h3>
            {coupon && (
              <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 px-3 py-2 rounded-lg text-sm">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span className="font-semibold">{coupon.code}</span>
                <span>
                  ({coupon.type === 'percent'
                    ? `${coupon.value}% OFF`
                    : `${formatCurrency(coupon.value)} OFF`})
                </span>
                <button
                  onClick={handleRemoveCoupon}
                  className="ml-2 text-red-600 hover:text-red-800 text-xs font-semibold hover:underline"
                >
                  Remover
                </button>
              </div>
            )}
            {couponSuccess && !coupon && (
              <div className="flex items-start gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{couponSuccess}</span>
              </div>
            )}
            {couponError && (
              <div className="flex items-start gap-2 text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{couponError}</span>
              </div>
            )}
            <form onSubmit={handleApplyCoupon} className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value)
                  if (couponError) setCouponError('')
                }}
                placeholder="Digite o cupom"
                className="input uppercase tracking-wider"
                maxLength={30}
                disabled={couponLoading}
              />
              <button
                type="submit"
                disabled={couponLoading}
                className="btn-secondary !px-4 whitespace-nowrap"
              >
                {couponLoading ? '...' : 'Aplicar'}
              </button>
            </form>
          </div>

          <div className="card p-6 space-y-5">
            <h3 className="font-display text-xl font-bold">Resumo do pedido</h3>

            <dl className="space-y-3 text-sm">
              {discountTotal > 0 && (
                <>
                  <div className="flex justify-between items-center">
                    <dt className="text-brown-600">Subtotal de produtos</dt>
                    <dd className="font-semibold text-brown-900">
                      {formatCurrency(subtotal + discountTotal)}
                    </dd>
                  </div>
                  <div className="flex justify-between items-center text-green-700">
                    <dt>Descontos nos produtos</dt>
                    <dd className="font-semibold">- {formatCurrency(discountTotal)}</dd>
                  </div>
                </>
              )}
              <div className="flex justify-between items-center">
                <dt className="text-brown-600 flex items-center gap-1.5">
                  {discountTotal > 0 ? 'Subtotal' : 'Subtotal de produtos'}
                  {discountTotal > 0 && (
                    <span className="text-xs text-brown-400">(c/ desc. produtos)</span>
                  )}
                </dt>
                <dd className="font-semibold text-brown-900">{formatCurrency(subtotal)}</dd>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between items-center text-green-700">
                  <dt className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" />
                    Cupom {coupon?.code}
                  </dt>
                  <dd className="font-semibold">- {formatCurrency(couponDiscount)}</dd>
                </div>
              )}
              <div className="flex justify-between items-start">
                <dt className="text-brown-600 flex flex-col gap-0.5">
                  <span className="flex items-center gap-1.5">
                    <Truck className="w-4 h-4" />
                    Frete
                  </span>
                  {!shippingCalculated && (
                    <span className="text-[11px] text-brown-500 font-normal leading-snug max-w-[220px]">
                      Será calculado no próximo passo com base no seu CEP.
                    </span>
                  )}
                  {shippingCalculated && resolvedShipping?.delivery_estimate && (
                    <span className="text-[11px] text-brown-500 font-normal leading-snug">
                      Prazo: {resolvedShipping.delivery_estimate}
                    </span>
                  )}
                </dt>
                <dd
                  className={clsx(
                    'font-semibold text-right',
                    !shippingCalculated
                      ? 'text-honey-700'
                      : shippingConfig.type === 'free'
                      ? 'text-green-700'
                      : resolvedShipping?.blocked
                      ? 'text-red-600'
                      : 'text-brown-900',
                  )}
                >
                  {!shippingCalculated
                    ? 'Frete a calcular'
                    : resolvedShipping?.blocked
                    ? 'Não atendido'
                    : shippingConfig.type === 'free' ||
                      (shippingConfig.mode === 'rules' && resolvedShipping && resolvedShipping.value === 0)
                    ? 'Grátis'
                    : formatCurrency(shippingFee)}
                </dd>
              </div>
            </dl>

            <div className="pt-4 border-t border-cream-300">
              <div className="flex justify-between items-end gap-3">
                <span className="font-semibold text-brown-800 leading-tight">
                  {shippingCalculated ? 'Total' : 'Subtotal (sem frete)'}
                </span>
                <div className="text-right min-w-0">
                  <div
                    className={clsx(
                      'font-display font-bold',
                      shippingCalculated
                        ? 'text-3xl text-honey-700'
                        : 'text-2xl text-brown-700',
                    )}
                  >
                    {shippingCalculated
                      ? formatCurrency(total)
                      : formatCurrency(Math.max(0, subtotal - couponDiscount))}
                  </div>
                  {shippingCalculated && shippingConfig.type === 'free' && (
                    <p className="text-xs text-green-700 mt-1 font-semibold">
                      🎉 Frete grátis
                    </p>
                  )}
                  {!shippingCalculated && (
                    <p className="text-[11px] text-honey-700 mt-1 font-medium leading-snug">
                      
                    </p>
                  )}
                  {shippingCalculated && shippingConfig.mode === 'rules' && resolvedShipping && resolvedShipping.value === 0 && shippingConfig.type !== 'free' && (
                    <p className="text-xs text-green-700 mt-1 font-semibold">
                      🎉 Frete grátis para sua cidade
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={() => navigate('/checkout')}
                className="btn-primary w-full !py-4 text-base justify-center"
              >
                {shippingCalculated
                  ? <>
                      Finalizar pedido
                      <ArrowRight className="w-5 h-5" />
                    </>
                  : <>
                      Finalizar compra
                      <ArrowRight className="w-5 h-5" />
                    </>}
              </button>
              <Link
                to="/produtos"
                className="btn-outline w-full !py-3 justify-center"
              >
                Continuar comprando
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
