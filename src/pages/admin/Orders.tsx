import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Search, MessageCircle, Eye } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import {
  formatCurrency,
  formatDate,
  formatPhone,
  createWhatsAppLink,
} from '@/utils/formatters'
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
  type Order,
  type OrderStatus,
  type PaymentStatus,
} from '@/types'

const paymentStatusColors: Record<PaymentStatus, string> = PAYMENT_STATUS_COLORS

const orderStatusColors: Record<OrderStatus, string> = ORDER_STATUS_COLORS

interface Toast {
  type: 'success' | 'error'
  message: string
}

export default function AdminOrders() {
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<Order[]>([])
  const [toast, setToast] = useState<Toast | null>(null)
  const [search, setSearch] = useState('')
  const [filterOrderStatus, setFilterOrderStatus] = useState<string>('')
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>('')

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  const loadOrders = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      setOrders((data || []) as Order[])
    } catch (err: any) {
      showToast('error', err.message || 'Erro ao carregar pedidos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (filterOrderStatus && o.order_status !== filterOrderStatus) {
        return false
      }
      if (filterPaymentStatus && o.payment_status !== filterPaymentStatus) {
        return false
      }
      if (search) {
        const s = search.toLowerCase().trim()
        const phoneDigits = o.customer_phone.replace(/\D/g, '')
        const searchDigits = search.replace(/\D/g, '')
        return (
          o.order_number.toLowerCase().includes(s) ||
          o.customer_name.toLowerCase().includes(s) ||
          (searchDigits && phoneDigits.includes(searchDigits)) ||
          (searchDigits && phoneDigits === searchDigits)
        )
      }
      return true
    })
  }, [orders, search, filterOrderStatus, filterPaymentStatus])

  return (
    <div className="space-y-5">
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg font-medium ${
            toast.type === 'success'
              ? 'bg-green-500 text-white'
              : 'bg-red-500 text-white'
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="font-display text-2xl font-bold">Pedidos</h2>
        <button onClick={loadOrders} className="btn-outline text-sm py-2 px-4">
          Atualizar
        </button>
      </div>

      <div className="card p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="flex items-stretch rounded-xl border-2 border-honey-200 focus-within:border-honey-400 transition-colors bg-white overflow-hidden">
              <div className="flex items-center justify-center pl-4 pr-3 bg-honey-50 text-brown-500">
                <Search className="w-5 h-5 flex-shrink-0" />
              </div>
              <input
                type="text"
                placeholder="Nº pedido, nome ou whatsapp..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 px-2 py-3 pr-4 outline-none text-brown-800 placeholder:text-brown-400 bg-transparent"
              />
            </div>
          </div>
          <div>
            <label className="label">Status do Pedido</label>
            <select
              value={filterOrderStatus}
              onChange={(e) => setFilterOrderStatus(e.target.value)}
              className="input"
            >
              <option value="">Todos</option>
              {(Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]).map(
                (status) => (
                  <option key={status} value={status}>
                    {ORDER_STATUS_LABELS[status]}
                  </option>
                )
              )}
            </select>
          </div>
          <div>
            <label className="label">Pagamento</label>
            <select
              value={filterPaymentStatus}
              onChange={(e) => setFilterPaymentStatus(e.target.value)}
              className="input"
            >
              <option value="">Todos</option>
              {(Object.keys(PAYMENT_STATUS_LABELS) as PaymentStatus[]).map(
                (status) => (
                  <option key={status} value={status}>
                    {PAYMENT_STATUS_LABELS[status]}
                  </option>
                )
              )}
            </select>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-brown-500">Carregando...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-brown-500">
            Nenhum pedido encontrado com os filtros selecionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-cream-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-brown-600 uppercase tracking-wider">
                    Nº
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-brown-600 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-brown-600 uppercase tracking-wider">
                    WhatsApp
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-brown-600 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-brown-600 uppercase tracking-wider">
                    Pagamento
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-brown-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-brown-600 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-brown-600 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-200">
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-cream-50 transition-colors"
                  >
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="font-semibold text-brown-900">
                        #{order.order_number}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <p className="font-medium text-brown-900">
                        {order.customer_name}
                      </p>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-brown-700">
                      {formatPhone(order.customer_phone)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-brown-600">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span
                        className={`badge ${
                          paymentStatusColors[
                            order.payment_status as PaymentStatus
                          ]
                        }`}
                      >
                        {PAYMENT_STATUS_LABELS[order.payment_status as PaymentStatus]}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span
                        className={`badge ${
                          orderStatusColors[order.order_status as OrderStatus]
                        }`}
                      >
                        {ORDER_STATUS_LABELS[order.order_status as OrderStatus]}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right font-semibold text-brown-900">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={createWhatsAppLink(
                            order.customer_phone,
                            `Olá ${order.customer_name}! Sobre o pedido #${order.order_number}`
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Abrir WhatsApp"
                          className="p-2 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                        >
                          <MessageCircle size={16} />
                        </a>
                        <Link
                          to={`/admin/pedidos/${order.order_number}`}
                          title="Ver detalhes"
                          className="p-2 rounded-lg bg-honey-50 text-honey-700 hover:bg-honey-100 transition-colors"
                        >
                          <Eye size={16} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
