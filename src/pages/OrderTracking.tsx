import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom'
import {
  CheckCircle,
  Clock,
  Package,
  Truck,
  Check,
  AlertCircle,
  MessageCircle,
  Search,
  Loader2,
  ArrowLeft,
  MapPin,
} from 'lucide-react'
import { useSiteSettings } from '@/hooks/useSiteSettings'
import { supabase } from '@/lib/supabase'
import {
  formatCurrency,
  formatDate,
  formatShortDate,
  createWhatsAppLink,
} from '@/utils/formatters'
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  PAYMENT_STATUS_LABELS,
  getTimelineOrder,
  getStatusLabel,
  getAnyStatusColor,
  isOrderPickup,
  getAnyStatusLabel,
} from '@/types'
import type { Order, OrderStatus, OrderStatusHistory } from '@/types'
import clsx from 'clsx'

const STATUS_ICONS: Record<OrderStatus, React.ElementType> = {
  awaiting_confirmation: Clock,
  in_preparation: Package,
  pronto_para_retirada: Package,
  shipped: Truck,
  delivered: Check,
  cancelled: AlertCircle,
}

const STATUS_BADGE_STYLES: Record<OrderStatus, string> = {
  awaiting_confirmation: ORDER_STATUS_COLORS.awaiting_confirmation + ' border border-amber-200',
  in_preparation: ORDER_STATUS_COLORS.in_preparation + ' border border-orange-200',
  pronto_para_retirada: ORDER_STATUS_COLORS.pronto_para_retirada + ' border border-emerald-200',
  shipped: ORDER_STATUS_COLORS.shipped + ' border border-indigo-200',
  delivered: ORDER_STATUS_COLORS.delivered + ' border border-green-200',
  cancelled: ORDER_STATUS_COLORS.cancelled + ' border border-red-200',
}

export default function OrderTracking() {
  const { orderNumber: urlOrderNumber } = useParams()
  const navigate = useNavigate()
  const location = useLocation() as { state?: { prefilledPhone?: string } }
  const { settings } = useSiteSettings()

  const initialPhone = location.state?.prefilledPhone || ''
  const [formOrderNumber, setFormOrderNumber] = useState(urlOrderNumber || '')
  const [formPhone, setFormPhone] = useState(() => {
    if (!initialPhone) return ''
    const d = initialPhone.replace(/\D/g, '').slice(0, 11)
    if (d.length <= 2) return d ? `(${d}` : ''
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  })
  const [formErrors, setFormErrors] = useState<{ order_number?: string; customer_phone?: string }>({})
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')

  const [order, setOrder] = useState<Order | null>(null)

  useEffect(() => {
    if (urlOrderNumber) {
      setFormOrderNumber(urlOrderNumber.replace('#', '').trim())
    }
  }, [urlOrderNumber])

  const maskPhone = (value: string): string => {
    const d = value.replace(/\D/g, '').slice(0, 11)
    if (d.length <= 2) return d ? `(${d}` : ''
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  }

  const validateForm = (): boolean => {
    const errors: { order_number?: string; customer_phone?: string } = {}
    if (!formOrderNumber.trim()) {
      errors.order_number = 'Informe o número do pedido'
    }
    const phoneDigits = formPhone.replace(/\D/g, '')
    if (!phoneDigits) {
      errors.customer_phone = 'Informe seu WhatsApp'
    } else if (phoneDigits.length < 10) {
      errors.customer_phone = 'WhatsApp inválido'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!validateForm()) return
    try {
      setSearching(true)
      setSearchError('')
      setOrder(null)

      const searchOrder = formOrderNumber.replace('#', '').trim()
      const phoneDigits = formPhone.replace(/\D/g, '')
      const rpcArgs = {
        p_order_number: searchOrder,
        p_customer_phone: phoneDigits,
      }
      const { data, error } = await supabase.rpc('get_order_by_number_and_phone', rpcArgs as any)

      if (error) {
        console.error('rpc search error:', error)
        setSearchError(error.message || 'Erro ao buscar o pedido. Tente novamente.')
        return
      }

      const raw = data as any
      if (!raw || Object.keys(raw).length === 0 || !raw.order_number) {
        setSearchError(
          'Pedido não encontrado. Verifique o número do pedido e o WhatsApp informados.'
        )
        return
      }

      setOrder(raw as Order)
      if (urlOrderNumber && urlOrderNumber.replace('#', '').trim() !== searchOrder) {
        navigate(`/pedido/${searchOrder}`, { replace: true })
      }
    } catch (err: any) {
      console.error('search catch:', err)
      setSearchError(err?.message || 'Erro inesperado. Tente novamente.')
    } finally {
      setSearching(false)
    }
  }

  const isPickup = order ? isOrderPickup(order) : false
  const timelineOrder = order ? getTimelineOrder(isPickup) : []
  const currentStatusIndex = order
    ? timelineOrder.indexOf(order.order_status)
    : -1

  const buildWhatsAppMessage = (): string => {
    if (!order) return ''
    const lines = [
      `Olá! Tenho dúvidas sobre o meu pedido feito pelo site.`,
      '',
      `- Pedido: ${order.order_number}`,
      `- Cliente: ${order.customer_name}`,
      `- Data: ${formatShortDate(order.created_at)}`,
      `- Total: ${formatCurrency(order.total)}`,
      `- Status: ${getStatusLabel(order.order_status, isPickup)}`,
    ]
    return lines.join('\n')
  }

  const getWhatsAppLink = (): string => {
    if (!settings.whatsapp) return ''
    return createWhatsAppLink(settings.whatsapp, buildWhatsAppMessage())
  }

  const formatAddress = (o: Order): string => {
    const parts: string[] = []
    if (o.street && o.number) parts.push(`${o.street}, ${o.number}`)
    else if (o.street) parts.push(o.street)
    if (o.complement) parts.push(o.complement)
    if (o.neighborhood) parts.push(o.neighborhood)
    if (o.city && o.state) parts.push(`${o.city}/${o.state}`)
    else if (o.city) parts.push(o.city)
    if (o.zipcode) parts.push(`CEP: ${o.zipcode}`)
    return parts.join(', ')
  }

  const hasPickupSettings = settings.pickup_address || settings.pickup_city_state || settings.pickup_hours

  return (
    <div className="container-page py-8 lg:py-12">
      <Link
        to="/produtos"
        className="inline-flex items-center gap-1 text-sm text-honey-700 hover:underline mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para produtos
      </Link>

      <div className="max-w-3xl mx-auto space-y-6">
        <div className="card p-5 lg:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-honey-100 flex items-center justify-center flex-shrink-0">
              <Search className="w-6 h-6 text-honey-700" />
            </div>
            <div>
              <h1 className="font-display text-2xl lg:text-3xl font-bold">
                Acompanhamento de Pedido
              </h1>
              <p className="text-brown-600 text-sm">
                Consulte o status do seu pedido em tempo real
              </p>
            </div>
          </div>

          <form onSubmit={handleSearch} className="grid sm:grid-cols-2 gap-4 mb-4">
            <div className="sm:col-span-1">
              <label className="label">
                Número do pedido
              </label>
              <input
                className={clsx(
                  'input',
                  formErrors.order_number &&
                    'border-red-400 focus:ring-red-300 focus:border-red-400'
                )}
                value={formOrderNumber}
                onChange={(e) => {
                  setFormOrderNumber(e.target.value.replace('#', '').trim())
                  if (formErrors.order_number)
                    setFormErrors((p) => ({ ...p, order_number: undefined }))
                  if (searchError) setSearchError('')
                }}
                placeholder="Ex: ML-20260914-001"
                autoComplete="off"
              />
              {formErrors.order_number && (
                <p className="text-xs text-red-600 mt-1">{formErrors.order_number}</p>
              )}
            </div>
            <div className="sm:col-span-1">
              <label className="label">
                WhatsApp
              </label>
              <input
                className={clsx(
                  'input',
                  formErrors.customer_phone &&
                    'border-red-400 focus:ring-red-300 focus:border-red-400'
                )}
                value={formPhone}
                onChange={(e) => {
                  setFormPhone(maskPhone(e.target.value))
                  if (formErrors.customer_phone)
                    setFormErrors((p) => ({ ...p, customer_phone: undefined }))
                  if (searchError) setSearchError('')
                }}
                placeholder="(00) 00000-0000"
                inputMode="tel"
                autoComplete="tel"
              />
              {formErrors.customer_phone && (
                <p className="text-xs text-red-600 mt-1">{formErrors.customer_phone}</p>
              )}
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={searching}
                className="btn-primary w-full !py-3"
              >
                {searching ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Buscando...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    Buscar pedido
                  </>
                )}
              </button>
            </div>
          </form>

          {searchError && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-red-800">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Não foi possível encontrar o pedido</p>
                <p className="text-sm mt-0.5">{searchError}</p>
              </div>
            </div>
          )}
        </div>

        {order && (
          <>
            <div className="card p-5 lg:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 pb-5 border-b border-cream-200">
                <div>
                  <p className="text-xs text-brown-500 uppercase tracking-wide font-semibold">
                    Pedido
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <h2 className="font-display text-xl font-bold">#{order.order_number}</h2>
                    <span
                      className={clsx(
                        'badge border',
                        STATUS_BADGE_STYLES[order.order_status]
                      )}
                    >
                      {getStatusLabel(order.order_status, isPickup)}
                    </span>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-xs text-brown-500">Total do pedido</p>
                  <p className="font-display text-2xl font-bold text-honey-700">
                    {formatCurrency(order.total)}
                  </p>
                  <p className="text-xs text-brown-500 mt-1">
                    {formatDate(order.created_at)}
                  </p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mb-5 text-sm">
                <div>
                  <p className="text-brown-500 text-xs font-semibold uppercase tracking-wide mb-1">
                    Cliente
                  </p>
                  <p className="font-semibold text-brown-900">{order.customer_name}</p>
                </div>
                <div>
                  <p className="text-brown-500 text-xs font-semibold uppercase tracking-wide mb-1">
                    Pagamento
                  </p>
                  <p className="font-semibold text-brown-900">
                    {PAYMENT_STATUS_LABELS[order.payment_status]}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  {isPickup ? (
                    <>
                      <p className="text-brown-500 text-xs font-semibold uppercase tracking-wide mb-1">
                        Retirada na Loja
                      </p>
                      {hasPickupSettings ? (
                        <div className="rounded-xl p-4 border-2 border-green-400 bg-green-50/60 space-y-2">
                          {settings.pickup_address && (
                            <div className="flex items-start gap-2">
                              <MapPin className="w-4 h-4 text-green-700 mt-0.5 flex-shrink-0" />
                              <p className="text-brown-800">{settings.pickup_address}</p>
                            </div>
                          )}
                          {settings.pickup_city_state && (
                            <p className="text-brown-800 ml-6">{settings.pickup_city_state}</p>
                          )}
                          {settings.pickup_hours && (
                            <p className="text-sm text-brown-700 ml-6 whitespace-pre-wrap">
                              Horários: {settings.pickup_hours}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="rounded-xl p-4 border-2 border-green-400 bg-green-50/60">
                          <p className="text-green-800 font-semibold">
                            Pedido para retirada na loja. Acompanhe o status para saber quando estará pronto.
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-brown-500 text-xs font-semibold uppercase tracking-wide mb-1">
                        Endereço de entrega
                      </p>
                      <p className="text-brown-800">
                        {formatAddress(order) || '-'}
                      </p>
                    </>
                  )}
                </div>
              </div>

              {order.items && order.items.length > 0 && (
                <div className="mb-5">
                  <p className="text-brown-500 text-xs font-semibold uppercase tracking-wide mb-2">
                    Itens do pedido
                  </p>
                  <ul className="space-y-2 border border-cream-200 rounded-xl overflow-hidden">
                    {order.items.map((item, idx) => (
                      <li
                        key={item.id || idx}
                        className={clsx(
                          'flex items-center justify-between px-4 py-3',
                          idx !== order.items!.length - 1 && 'border-b border-cream-100'
                        )}
                      >
                        <div className="flex-1 min-w-0 pr-3">
                          <p className="font-semibold text-sm text-brown-900 line-clamp-1">
                            {item.product_name_snapshot}
                          </p>
                          <p className="text-xs text-brown-500">
                            {item.quantity}x {formatCurrency(item.unit_price_snapshot)}
                          </p>
                        </div>
                        <p className="text-sm font-bold text-brown-900 flex-shrink-0">
                          {formatCurrency(item.subtotal)}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="card p-5 lg:p-6">
              <h3 className="font-display text-xl font-bold mb-5">Histórico do pedido</h3>
              <ol className="relative">
                {timelineOrder.map((status, idx) => {
                  const Icon = STATUS_ICONS[status]
                  const isDone =
                    order.order_status === 'cancelled'
                      ? false
                      : currentStatusIndex !== -1 && idx <= currentStatusIndex
                  const isCurrent = idx === currentStatusIndex
                  const isLast = idx === timelineOrder.length - 1

                  const historyEntry = order.status_history?.find((h) => h.status === status)

                  return (
                    <li
                      key={status}
                      className={clsx('flex gap-4', !isLast && 'pb-6')}
                    >
                      <div className="relative flex flex-col items-center">
                        <div
                          className={clsx(
                            'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ring-4 transition-all',
                            isDone && !isCurrent
                              ? 'bg-green-500 text-white ring-green-100'
                              : isCurrent
                              ? 'bg-honey-500 text-white ring-honey-100 animate-pulse'
                              : 'bg-cream-100 text-brown-400 ring-cream-50 border border-cream-200'
                          )}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        {!isLast && (
                          <span
                            className={clsx(
                              'w-0.5 flex-1 mt-2',
                              isDone ? 'bg-green-400' : 'bg-cream-200'
                            )}
                          />
                        )}
                      </div>
                      <div className="flex-1 pt-1 pb-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p
                            className={clsx(
                              'font-semibold',
                              isDone || isCurrent ? 'text-brown-900' : 'text-brown-400'
                            )}
                          >
                            {getStatusLabel(status, isPickup)}
                          </p>
                          {isCurrent && (
                            <span className="badge bg-honey-100 text-honey-800 border border-honey-200">
                              Atual
                            </span>
                          )}
                        </div>
                        {historyEntry ? (
                          <p className="text-xs text-brown-500 mt-0.5">
                            {formatDate(historyEntry.created_at)}
                          </p>
                        ) : isDone ? null : (
                          <p className="text-xs text-brown-400 mt-0.5">
                            Aguardando...
                          </p>
                        )}
                      </div>
                    </li>
                  )
                })}

                {order.order_status === 'cancelled' && (
                  <li className="flex gap-4">
                    <div className="relative flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ring-4 bg-red-500 text-white ring-red-100">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="flex-1 pt-1 pb-2">
                      <p className="font-semibold text-red-800">
                        {ORDER_STATUS_LABELS.cancelled}
                      </p>
                    </div>
                  </li>
                )}
              </ol>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <Link
                to={`/pagamento/${order.order_number}`}
                className="btn-outline w-full !py-3.5"
              >
                Ver pagamento
              </Link>
              {settings.whatsapp ? (
                <a
                  href={getWhatsAppLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-whatsapp w-full !py-3.5"
                >
                  <MessageCircle className="w-5 h-5" />
                  Falar no WhatsApp
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  className="btn w-full !py-3.5 bg-gray-200 text-gray-500 cursor-not-allowed"
                >
                  <MessageCircle className="w-5 h-5" />
                  WhatsApp indisponível
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
