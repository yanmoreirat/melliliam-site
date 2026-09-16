import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Save,
  MessageCircle,
  MapPin,
  User,
  Phone,
  Mail,
  Hash,
  Calendar,
  StickyNote,
  Trash2,
  X,
  Package,
  Truck,
  CheckCircle,
  Clock,
  AlertCircle,
  Check,
} from 'lucide-react'
import clsx from 'clsx'
import { supabase } from '@/lib/supabase'
import { useSiteSettings } from '@/contexts/SiteSettingsContext'
import {
  formatCurrency,
  formatDate,
  formatPhone,
  formatShortDate,
  createWhatsAppLink,
} from '@/utils/formatters'
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
  getTimelineOrder,
  getStatusLabel,
  getAnyStatusLabel,
  getAnyStatusColor,
  isOrderPickup,
  type Order,
  type OrderItem,
  type OrderStatus,
  type OrderStatusHistory,
  type PaymentStatus,
} from '@/types'

interface Toast {
  type: 'success' | 'error'
  message: string
}

const paymentStatusColors: Record<PaymentStatus, string> = PAYMENT_STATUS_COLORS

const orderStatusColors: Record<OrderStatus, string> = ORDER_STATUS_COLORS

const STATUS_ICONS: Record<OrderStatus, React.ElementType> = {
  awaiting_confirmation: Clock,
  in_preparation: Package,
  pronto_para_retirada: Package,
  shipped: Truck,
  delivered: Check,
  cancelled: AlertCircle,
}

export default function AdminOrderDetail() {
  const { orderNumber } = useParams<{ orderNumber: string }>()
  const navigate = useNavigate()
  const { settings } = useSiteSettings()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [order, setOrder] = useState<Order | null>(null)
  const [items, setItems] = useState<OrderItem[]>([])
  const [history, setHistory] = useState<OrderStatusHistory[]>([])
  const [toast, setToast] = useState<Toast | null>(null)

  const [orderStatus, setOrderStatus] = useState<OrderStatus>('awaiting_confirmation')
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('awaiting_payment')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  const loadOrder = async () => {
    if (!orderNumber) return
    try {
      setLoading(true)

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('order_number', orderNumber)
        .limit(1)
        .maybeSingle()

      if (orderError) throw orderError
      if (!orderData) {
        setOrder(null)
        return
      }

      const loadedOrder = orderData as Order
      setOrder(loadedOrder)
      setOrderStatus((loadedOrder.order_status as OrderStatus) || 'awaiting_confirmation')
      setPaymentStatus((loadedOrder.payment_status as PaymentStatus) || 'awaiting_payment')

      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', loadedOrder.id)
      if (itemsError) throw itemsError
      setItems((itemsData || []) as OrderItem[])

      const { data: historyData, error: historyError } = await supabase
        .from('order_status_history')
        .select('*')
        .eq('order_id', loadedOrder.id)
        .order('created_at', { ascending: true })
      if (historyError) throw historyError
      setHistory((historyData || []) as OrderStatusHistory[])
    } catch (err: any) {
      showToast('error', err.message || 'Erro ao carregar pedido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrder()
  }, [orderNumber])

  const handleSave = async () => {
    if (!order) return
    try {
      setSaving(true)

      const orderStatusChanged = orderStatus !== order.order_status
      const paymentStatusChanged = paymentStatus !== order.payment_status

      const updateData: Record<string, string> = {
        updated_at: new Date().toISOString(),
      }
      if (orderStatusChanged) updateData.order_status = orderStatus
      if (paymentStatusChanged) updateData.payment_status = paymentStatus

      const { error } = await (supabase
        .from('orders') as any)
        .update(updateData)
        .eq('id', order.id)
      if (error) throw error

      const historyInserts: any[] = []
      if (orderStatusChanged) {
        historyInserts.push({
          order_id: order.id,
          status: orderStatus,
        })
      }
      if (paymentStatusChanged) {
        historyInserts.push({
          order_id: order.id,
          status: paymentStatus,
        })
      }
      if (historyInserts.length > 0) {
        const { error: historyError } = await (supabase
          .from('order_status_history') as any)
          .insert(historyInserts)
        if (historyError) throw historyError
      }

      showToast('success', 'Pedido atualizado com sucesso!')
      await loadOrder()
    } catch (err: any) {
      showToast('error', err.message || 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!order) return
    try {
      setDeleting(true)
      const orderId = order.id

      const { error: itemsError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', orderId)
      if (itemsError) throw itemsError

      const { error: historyError } = await supabase
        .from('order_status_history')
        .delete()
        .eq('order_id', orderId)
      if (historyError) throw historyError

      const { error: orderError } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId)
      if (orderError) throw orderError

      showToast('success', 'Pedido excluído com sucesso')
      setShowDeleteModal(false)
      setTimeout(() => navigate('/admin/pedidos'), 500)
    } catch (err: any) {
      showToast('error', err.message || 'Erro ao excluir pedido')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {toast && (
          <div
            className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg font-medium ${
              toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
            }`}
          >
            {toast.message}
          </div>
        )}
        <div className="card p-12 text-center text-brown-500">Carregando...</div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate('/admin/pedidos')}
          className="btn-ghost text-sm py-2 px-4"
        >
          <ArrowLeft size={16} /> Voltar para pedidos
        </button>
        <div className="card p-12 text-center">
          <p className="text-brown-500 mb-4">Pedido não encontrado.</p>
          <Link to="/admin/pedidos" className="btn-primary">
            Ver todos os pedidos
          </Link>
        </div>
      </div>
    )
  }

  const isPickup = isOrderPickup(order)
  const timelineOrder = getTimelineOrder(isPickup)
  const currentStatusIndex = timelineOrder.indexOf(order.order_status)

  const formatAddress = (): string => {
    const parts: string[] = []
    if (order.street && order.number) parts.push(`${order.street}, ${order.number}`)
    else if (order.street) parts.push(order.street)
    if (order.complement) parts.push(order.complement)
    if (order.neighborhood) parts.push(order.neighborhood)
    if (order.city && order.state) parts.push(`${order.city}/${order.state}`)
    else if (order.city) parts.push(order.city)
    if (order.zipcode) parts.push(`CEP: ${order.zipcode}`)
    return parts.join(', ')
  }

  const hasPickupSettings = settings.pickup_address || settings.pickup_city_state || settings.pickup_hours

  const buildWhatsAppCustomerMessage = (): string => {
    return `Olá ${order.customer_name}! - Sobre o pedido ${order.order_number}`
  }

  return (
    <div className="space-y-5">
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg font-medium ${
            toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => navigate('/admin/pedidos')}
            className="p-2 rounded-lg bg-white border border-cream-300 text-brown-700 hover:bg-cream-50 transition-colors"
            title="Voltar"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="font-display text-2xl font-bold">
              Pedido #{order.order_number}
            </h2>
            <p className="text-sm text-brown-500 mt-0.5 flex items-center gap-1.5">
              <Calendar size={14} /> {formatDate(order.created_at)}
            </p>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4 flex-wrap flex-1">
            <div className="flex-1 min-w-[220px]">
              <label className="label">💳 Status do Pagamento</label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                className="input"
              >
                {(['awaiting_payment', 'payment_informed', 'payment_confirmed'] as PaymentStatus[]).map(
                  (status) => (
                    <option key={status} value={status}>
                      {PAYMENT_STATUS_LABELS[status]}
                    </option>
                  )
                )}
              </select>
              <div className="mt-2">
                <span className={`badge ${paymentStatusColors[paymentStatus]}`}>
                  Atual: {PAYMENT_STATUS_LABELS[paymentStatus]}
                </span>
              </div>
            </div>

            <div className="flex-1 min-w-[220px]">
              <label className="label">📦 Status do Pedido</label>
              <select
                value={orderStatus}
                onChange={(e) => setOrderStatus(e.target.value as OrderStatus)}
                className="input"
              >
                {(['awaiting_confirmation', 'in_preparation', 'pronto_para_retirada', 'shipped', 'delivered', 'cancelled'] as OrderStatus[]).map(
                  (status) => (
                    <option key={status} value={status}>
                      {ORDER_STATUS_LABELS[status]}
                    </option>
                  )
                )}
              </select>
              <div className="mt-2">
                <span className={`badge ${orderStatusColors[orderStatus]}`}>
                  Atual: {getStatusLabel(orderStatus, isPickup)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto justify-end flex-wrap">
            <a
              href={createWhatsAppLink(
                order.customer_phone,
                buildWhatsAppCustomerMessage()
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-whatsapp py-2.5 px-4 h-[42px] inline-flex items-center flex-shrink-0"
            >
              <MessageCircle size={16} /> WhatsApp
            </a>

            <button
              onClick={() => {
                setShowDeleteModal(true)
                setDeleteConfirmText('')
              }}
              className="bg-red-600 hover:bg-red-700 text-white py-2.5 px-4 rounded-lg font-medium inline-flex items-center gap-2 transition-colors h-[42px] flex-shrink-0"
            >
              <Trash2 size={16} /> Excluir
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary py-2.5 px-6 h-[42px] inline-flex items-center flex-shrink-0"
            >
              <Save size={16} /> {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="card p-5">
            <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
              <User size={18} /> Dados do Cliente
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-brown-500 uppercase tracking-wide mb-1">
                  Nome
                </p>
                <p className="font-medium text-brown-900">{order.customer_name}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-brown-500 uppercase tracking-wide mb-1">
                  WhatsApp
                </p>
                <a
                  href={createWhatsAppLink(order.customer_phone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-green-700 hover:underline flex items-center gap-1.5"
                >
                  <Phone size={14} /> {formatPhone(order.customer_phone)}
                </a>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs font-medium text-brown-500 uppercase tracking-wide mb-1">
                  Email
                </p>
                <p className="font-medium text-brown-900 flex items-center gap-1.5">
                  <Mail size={14} />
                  {order.customer_email || 'Não informado'}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
              <MapPin size={18} />
              {isPickup ? 'Retirada na Loja' : 'Endereço de Entrega'}
            </h3>
            {isPickup ? (
              hasPickupSettings ? (
                <div className="space-y-2">
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
              )
            ) : (
              <div className="text-brown-800">
                {formatAddress() || '-'}
              </div>
            )}
          </div>

          <div className="card overflow-hidden">
            <div className="p-5 border-b border-cream-200">
              <h3 className="font-display text-lg font-semibold">
                Itens do Pedido
              </h3>
              <p className="text-sm text-brown-500 mt-0.5">
                {items.length} {items.length === 1 ? 'item' : 'itens'}
              </p>
            </div>
            <div className="divide-y divide-cream-200">
              {items.map((item) => {
                const unitFinal =
                  item.unit_price_snapshot *
                  (1 - (item.discount_percent_snapshot || 0) / 100)
                return (
                  <div key={item.id} className="p-5 flex items-start gap-4">
                    <div className="w-14 h-14 rounded-lg bg-cream-100 flex items-center justify-center flex-shrink-0">
                      <Hash size={20} className="text-brown-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-brown-900">
                        {item.product_name_snapshot}
                      </p>
                      <p className="text-sm text-brown-600 mt-1">
                        Quantidade:{' '}
                        <span className="font-semibold">{item.quantity}</span>
                      </p>
                      {item.discount_percent_snapshot > 0 && (
                        <p className="text-xs text-brown-500 mt-1">
                          Desconto de {item.discount_percent_snapshot}%
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-sm">
                        <span className="text-brown-500 line-through">
                          {formatCurrency(item.unit_price_snapshot)}
                        </span>
                        <span className="font-semibold text-brown-900">
                          {formatCurrency(unitFinal)} cada
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-brown-500">Subtotal</p>
                      <p className="font-bold text-brown-900 text-lg">
                        {formatCurrency(item.subtotal)}
                      </p>
                    </div>
                  </div>
                )
              })}
              {items.length === 0 && (
                <div className="p-8 text-center text-brown-500">
                  Nenhum item encontrado.
                </div>
              )}
            </div>
          </div>

          {history.length > 0 && (
            <div className="card p-5">
              <h3 className="font-display text-lg font-semibold mb-4">
                Histórico de Status
              </h3>
              <ol className="space-y-3 border-l-2 border-cream-200 ml-2">
                {history.map((h) => (
                  <li key={h.id} className="pl-5 -ml-[5px] relative">
                    <span className="absolute -left-[7px] top-1.5 w-4 h-4 rounded-full bg-honey-500 border-2 border-white"></span>
                    <div className="flex items-start justify-between flex-wrap gap-2">
                      <span className={`badge ${getAnyStatusColor(h.status as string)}`}>
                        {getAnyStatusLabel(h.status as string, isPickup)}
                      </span>
                      <span className="text-xs text-brown-500">
                        {formatShortDate(h.created_at)} -{' '}
                        {new Date(h.created_at).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}

          <div className="card p-5 lg:p-6">
            <h3 className="font-display text-xl font-bold mb-5">Timeline do Pedido</h3>
            <ol className="relative">
              {timelineOrder.map((status, idx) => {
                const Icon = STATUS_ICONS[status]
                const isDone =
                  order.order_status === 'cancelled'
                    ? false
                    : currentStatusIndex !== -1 && idx <= currentStatusIndex
                const isCurrent = idx === currentStatusIndex
                const isLast = idx === timelineOrder.length - 1

                const historyEntry = history.find((h) => h.status === status)

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

          {order.notes && (
            <div className="card p-5">
              <h3 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
                <StickyNote size={18} /> Observação
              </h3>
              <p className="text-brown-800 whitespace-pre-wrap bg-cream-50 rounded-lg p-4 border border-cream-200">
                {order.notes}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="card p-5 space-y-4">
            <h3 className="font-display text-lg font-semibold">Resumo</h3>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-brown-500">Subtotal</p>
                <p className="font-semibold text-brown-900">
                  {formatCurrency(order.subtotal)}
                </p>
              </div>
              <div>
                <p className="text-brown-500">Descontos</p>
                <p className="font-semibold text-red-600">
                  - {formatCurrency(order.discount_total + order.coupon_discount)}
                </p>
              </div>
              <div>
                <p className="text-brown-500">Frete</p>
                <p className="font-semibold text-brown-900">
                  {order.shipping_fee === 0
                    ? 'Grátis'
                    : formatCurrency(order.shipping_fee)}
                </p>
              </div>
              <div>
                <p className="text-brown-500">Cupom</p>
                <p className="font-semibold text-brown-900">
                  {order.coupon_code || '-'}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-cream-200">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-brown-900">Total</p>
                <p className="font-display text-2xl font-bold text-honey-700">
                  {formatCurrency(order.total)}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-5 space-y-3 text-sm">
            <h3 className="font-display text-lg font-semibold mb-2">
              Números do Pedido
            </h3>
            <div className="flex justify-between">
              <span className="text-brown-500">ID</span>
              <span className="font-mono text-xs text-brown-700">
                {order.id.slice(0, 12)}...
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-brown-500">Número</span>
              <span className="font-mono font-semibold text-brown-900">
                #{order.order_number}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-brown-500">Criado em</span>
              <span className="font-medium text-brown-700">
                {formatShortDate(order.created_at)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-brown-500">Atualizado</span>
              <span className="font-medium text-brown-700">
                {formatShortDate(order.updated_at)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-cream-200">
              <h3 className="font-display text-xl font-bold text-brown-900">
                Deseja mesmo excluir este pedido?
              </h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="p-2 rounded-lg hover:bg-cream-100 text-brown-500 transition-colors"
                disabled={deleting}
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-brown-700">
                Essa ação é irreversível e excluirá o pedido, seus itens e o histórico de status do banco de dados.
              </p>
              <div>
                <label className="label">
                  Digite <span className="font-bold text-red-600">EXCLUIR</span> para confirmar
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="Digite EXCLUIR para confirmar"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  disabled={deleting}
                />
              </div>
            </div>
            <div className="flex items-center gap-3 p-5 border-t border-cream-200 bg-cream-50">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="btn-outline flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteConfirmText !== 'EXCLUIR' || deleting}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed text-white py-2.5 px-4 rounded-lg font-medium inline-flex items-center justify-center gap-2 transition-colors"
              >
                {deleting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Excluir permanentemente
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
