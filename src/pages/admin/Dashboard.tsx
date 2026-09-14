import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { DollarSign, Package, Clock, CheckCircle, Truck, Eye } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import {
  formatCurrency,
  formatDate,
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

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [counts, setCounts] = useState({
    awaiting_payment: 0,
    payment_informed: 0,
    preparing: 0,
    pronto_para_retirada: 0,
    delivered: 0,
  })
  const [revenue, setRevenue] = useState(0)
  const [orders, setOrders] = useState<Order[]>([])
  const [toast, setToast] = useState<Toast | null>(null)

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  const loadData = async () => {
    try {
      setLoading(true)

      const { data: ordersData, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      const allOrders = (ordersData || []) as Order[]

      setCounts({
        awaiting_payment: allOrders.filter(
          (o) => o.payment_status === 'awaiting_payment'
        ).length,
        payment_informed: allOrders.filter(
          (o) => o.payment_status === 'payment_informed'
        ).length,
        preparing: allOrders.filter((o) => o.order_status === 'in_preparation').length,
        pronto_para_retirada: allOrders.filter((o) => o.order_status === 'pronto_para_retirada').length,
        delivered: allOrders.filter((o) => o.order_status === 'delivered').length,
      })

      const revenueOrders = allOrders.filter((o) =>
        [
          'in_preparation',
          'pronto_para_retirada',
          'shipped',
          'delivered',
        ].includes(o.order_status) || o.payment_status === 'payment_confirmed'
      )
      setRevenue(revenueOrders.reduce((acc, o) => acc + (o.total || 0), 0))

      setOrders(allOrders.slice(0, 10))
    } catch (err: any) {
      showToast('error', err.message || 'Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const stats = [
    {
      label: 'Aguardando Pagamento',
      value: counts.awaiting_payment,
      icon: Clock,
      color: 'bg-yellow-500',
      lightColor: 'bg-yellow-50 text-yellow-700',
    },
    {
      label: 'Pagamento Informado',
      value: counts.payment_informed,
      icon: Eye,
      color: 'bg-blue-500',
      lightColor: 'bg-blue-50 text-blue-700',
    },
    {
      label: 'Em Preparação',
      value: counts.preparing,
      icon: Package,
      color: 'bg-orange-500',
      lightColor: 'bg-orange-50 text-orange-700',
    },
    {
      label: 'Pronto p/ Retirada',
      value: counts.pronto_para_retirada,
      icon: Package,
      color: 'bg-emerald-500',
      lightColor: 'bg-emerald-50 text-emerald-700',
    },
    {
      label: 'Entregues',
      value: counts.delivered,
      icon: CheckCircle,
      color: 'bg-green-500',
      lightColor: 'bg-green-50 text-green-700',
    },
    {
      label: 'Faturamento',
      value: formatCurrency(revenue),
      icon: DollarSign,
      color: 'bg-honey-500',
      lightColor: 'bg-honey-50 text-honey-700',
    },
  ]

  return (
    <div className="space-y-6">
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
        <h2 className="font-display text-2xl font-bold">Dashboard</h2>
        <button onClick={loadData} className="btn-outline text-sm py-2 px-4">
          Atualizar
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="card p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-brown-500 uppercase tracking-wide">
                    {stat.label}
                  </p>
                  <p className="font-display text-2xl font-bold mt-2 text-brown-900 break-all">
                    {loading ? '...' : stat.value}
                  </p>
                </div>
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ml-3 ${stat.lightColor}`}
                >
                  <Icon size={20} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-cream-200">
          <div>
            <h3 className="font-display text-lg font-semibold">
              Últimos Pedidos
            </h3>
            <p className="text-sm text-brown-500 mt-0.5">
              Os 10 pedidos mais recentes
            </p>
          </div>
          <Link to="/admin/pedidos" className="btn-outline text-sm py-2 px-4">
            Ver todos
          </Link>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-brown-500">
              Carregando...
            </div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center text-brown-500">
              Nenhum pedido encontrado.
            </div>
          ) : (
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
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-200">
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-cream-50 transition-colors"
                  >
                    <td className="px-5 py-4 whitespace-nowrap">
                      <Link
                        to={`/admin/pedidos/${order.order_number}`}
                        className="font-semibold text-honey-700 hover:text-honey-800"
                      >
                        #{order.order_number}
                      </Link>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div>
                        <p className="font-medium text-brown-900">
                          {order.customer_name}
                        </p>
                        <a
                          href={createWhatsAppLink(order.customer_phone)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-green-600 hover:underline"
                        >
                          {order.customer_phone}
                        </a>
                      </div>
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
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
