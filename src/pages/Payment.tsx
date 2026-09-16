import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import {
  Copy,
  CheckCircle,
  QrCode,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Package,
  MessageCircle,
  Phone,
  ChevronRight,
  MapPin,
} from 'lucide-react'
import * as qrcode from 'qrcode'
import { useSiteSettings } from '@/contexts/SiteSettingsContext'
import { supabase } from '@/lib/supabase'
import { generatePixPayload } from '@/utils/pix'
import {
  formatCurrency,
  formatShortDate,
  createWhatsAppLink,
} from '@/utils/formatters'
import {
  PAYMENT_STATUS_LABELS,
} from '@/types'
import type { Order, OrderItem, OrderStatusHistory } from '@/types'
import clsx from 'clsx'

interface RawOrder {
  id: string
  order_number: string
  customer_name: string
  customer_phone: string
  customer_email: string | null
  zipcode: string
  street: string
  number: string
  complement: string | null
  neighborhood: string
  city: string
  state: string
  subtotal: number
  discount_total: number
  coupon_discount: number
  shipping_fee: number
  total: number
  payment_status: string
  order_status: string
  coupon_code: string | null
  notes: string | null
  created_at: string
  updated_at: string
  items: OrderItem[]
  status_history: OrderStatusHistory[]
}

export default function Payment() {
  const paramsOrderNumber = useParams().orderNumber
  const storedOrder = (() => {
    try {
      const raw = sessionStorage.getItem('melliliam_last_order')
      return raw ? JSON.parse(raw) : null
    } catch { return null }
  })()
  const orderNumber = paramsOrderNumber || storedOrder?.orderNumber
  const initialPhone = storedOrder?.phone || ''
  const navigate = useNavigate()
  const { settings, loading: settingsLoading } = useSiteSettings()

  const [customerPhone, setCustomerPhone] = useState(initialPhone)

  const [phoneForm, setPhoneForm] = useState('')
  const [needPhone, setNeedPhone] = useState(!customerPhone)
  const [validatingPhone, setValidatingPhone] = useState(false)

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [pixCode, setPixCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [informingPayment, setInformingPayment] = useState(false)
  const [paymentInformed, setPaymentInformed] = useState(false)
  const [globalError, setGlobalError] = useState('')

  const loadOrderByPhone = async (phone: string) => {
    if (!orderNumber) {
      return
    }
    try {
      setLoading(true)
      setError('')
      const digits = phone.replace(/\D/g, '')

      const { data, error: rpcError } = await (supabase.rpc as any)(
        'get_order_by_number_and_phone',
        {
          p_order_number: orderNumber,
          p_customer_phone: digits,
        }
      )

      if (rpcError) {
        console.error('rpc order error:', rpcError)
        setError('Erro ao buscar os dados do pedido. Tente novamente.')
        return
      }

      if (!data || (typeof data === 'object' && Object.keys(data as object).length === 0)) {
        setError('Pedido não encontrado. Verifique os dados informados.')
        return
      }

      const raw = data as RawOrder
      const items = Array.isArray(raw.items) ? raw.items : []
      const history = Array.isArray(raw.status_history) ? raw.status_history : []

      setOrder({
        id: raw.id,
        order_number: raw.order_number,
        customer_name: raw.customer_name,
        customer_phone: raw.customer_phone,
        customer_email: raw.customer_email,
        zipcode: raw.zipcode,
        street: raw.street,
        number: raw.number,
        complement: raw.complement,
        neighborhood: raw.neighborhood,
        city: raw.city,
        state: raw.state,
        subtotal: raw.subtotal,
        discount_total: raw.discount_total,
        coupon_discount: raw.coupon_discount,
        shipping_fee: raw.shipping_fee,
        total: raw.total,
        payment_status: raw.payment_status as Order['payment_status'],
        order_status: raw.order_status as Order['order_status'],
        coupon_code: raw.coupon_code,
        notes: raw.notes,
        created_at: raw.created_at,
        updated_at: raw.updated_at,
        items,
        status_history: history,
      })
      setCustomerPhone(digits)
      setNeedPhone(false)
    } catch (err: any) {
      console.error('load order catch:', err)
      setError('Erro inesperado ao carregar o pedido.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!orderNumber || !customerPhone) {
      return
    }
    loadOrderByPhone(customerPhone)
  }, [customerPhone, orderNumber])

  useEffect(() => {
    const generateQr = async () => {
      if (!order || settingsLoading) return
      if (!settings.pix_key || !settings.pix_recipient_name || !settings.pix_city) {
        return
      }
      try {
        const payload = generatePixPayload(
          {
            key: settings.pix_key,
            keyType: (settings.pix_key_type || '') as any,
            recipientName: settings.pix_recipient_name,
            recipientCity: settings.pix_city,
          },
          order.total,
          order.order_number
        )
        setPixCode(payload.raw)
        const dataUrl = await qrcode.toDataURL(payload.qrValue, {
          width: 320,
          margin: 2,
          color: { dark: '#3f2a14', light: '#ffffff' },
        })
        setQrDataUrl(dataUrl)
      } catch (err) {
        console.error('generate qr error:', err)
      }
    }
    generateQr()
  }, [order, settings, settingsLoading])

  const handleCopyPix = async () => {
    if (!pixCode) return
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(pixCode)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = pixCode
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch (err) {
      console.error('copy pix error:', err)
      alert('Não foi possível copiar o código. Copie manualmente.')
    }
  }

  const handleInformPayment = async () => {
    if (!order || !customerPhone) return
    try {
      setInformingPayment(true)
      setGlobalError('')

      const { data, error: rpcError } = await (supabase.rpc as any)('mark_payment_informed', {
        p_order_number: order.order_number,
        p_customer_phone: customerPhone,
      })

      if (rpcError) {
        console.error('mark payment rpc error:', rpcError)
        setGlobalError(rpcError.message || 'Erro ao informar pagamento. Tente novamente.')
        return
      }
      if (data !== true) {
        setGlobalError('Não foi possível atualizar o status. Tente novamente ou entre em contato.')
        return
      }

      setPaymentInformed(true)
      setOrder((prev) =>
        prev
          ? {
              ...prev,
              payment_status: 'payment_informed',
            }
          : prev
      )
      try {
        sessionStorage.removeItem('melliliam_last_order')
      } catch {
        // ignore
      }
    } catch (err: any) {
      console.error('inform payment catch:', err)
      setGlobalError(err?.message || 'Erro inesperado. Tente novamente.')
    } finally {
      setInformingPayment(false)
    }
  }

  const maskPhone = (value: string): string => {
    const d = value.replace(/\D/g, '').slice(0, 11)
    if (d.length <= 2) return d ? `(${d}` : ''
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  }

  const handleValidatePhone = (e: React.FormEvent) => {
    e.preventDefault()
    const digits = phoneForm.replace(/\D/g, '')
    if (digits.length < 10) {
      alert('Informe o WhatsApp corretamente com DDD.')
      return
    }
    loadOrderByPhone(digits)
  }

  if (settingsLoading) {
    return (
      <div className="container-page py-16 text-center">
        <Loader2 className="w-10 h-10 animate-spin text-honey-600 mx-auto mb-4" />
        <p className="text-brown-600">Carregando...</p>
      </div>
    )
  }

  if (!orderNumber) {
    return (
      <div className="container-page py-12 lg:py-16">
        <div className="max-w-md mx-auto card p-6 lg:p-8 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-honey-100 flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-honey-700" />
          </div>
          <h1 className="font-display text-2xl lg:text-3xl font-bold mb-3">Nenhum pedido encontrado</h1>
          <p className="text-brown-600 text-sm mb-6">
            Não foi possível localizar os dados do seu pedido. Você pode voltar para os produtos ou acompanhar seu pedido informando os dados.
          </p>
          <div className="space-y-3">
            <Link to="/produtos" className="btn-primary w-full">
              Ir para produtos
            </Link>
            <Link to="/pedido" className="btn-outline w-full">
              <Package className="w-5 h-5" /> Acompanhar pedido
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (needPhone) {
    return (
      <div className="container-page py-12 lg:py-16">
        <div className="max-w-md mx-auto card p-6 lg:p-8">
          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-honey-100 flex items-center justify-center">
              <Phone className="w-7 h-7 text-honey-700" />
            </div>
            <h1 className="font-display text-2xl lg:text-3xl font-bold mb-2">Validar pedido</h1>
            <p className="text-brown-600 text-sm">
              Informe o WhatsApp utilizado na compra para visualizar os dados do pagamento.
            </p>
            {orderNumber && (
              <p className="mt-2 text-xs text-brown-500">
                Pedido: <span className="font-semibold">#{orderNumber}</span>
              </p>
            )}
          </div>
          <form onSubmit={handleValidatePhone} className="space-y-4">
            <div>
              <label className="label">WhatsApp utilizado no pedido</label>
              <input
                type="tel"
                className="input"
                placeholder="(00) 00000-0000"
                value={phoneForm}
                onChange={(e) => setPhoneForm(maskPhone(e.target.value))}
                required
              />
            </div>
            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Validando...
                </>
              ) : (
                <>
                  Continuar <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
            <Link
              to="/"
              className="flex items-center justify-center gap-1 text-sm text-brown-600 hover:text-honey-700"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar para a página inicial
            </Link>
          </form>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container-page py-16 text-center">
        <Loader2 className="w-10 h-10 animate-spin text-honey-600 mx-auto mb-4" />
        <p className="text-brown-600">Carregando dados do pagamento...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container-page py-12">
        <div className="max-w-xl mx-auto card p-8 text-center">
          <AlertCircle className="w-14 h-14 text-red-500 mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold mb-3">Ops!</h1>
          <p className="text-brown-700 mb-6">{error}</p>
          <Link to="/" className="btn-primary">
            Voltar para a página inicial
          </Link>
        </div>
      </div>
    )
  }

  const pixSettingsMissing =
    !settings.pix_key || !settings.pix_recipient_name || !settings.pix_city

  const whatsgroupMsg =
    settings.whatsapp
      ? `Olá! - Realizei o pagamento do pedido ${order?.order_number} no valor de ${formatCurrency(order?.total ?? 0)}.`
      : ''

  return (
    <div className="container-page py-8 lg:py-12">
      <Link
        to="/produtos"
        className="inline-flex items-center gap-1 text-sm text-honey-700 hover:underline mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para produtos
      </Link>

      <div className="max-w-2xl mx-auto space-y-6">
        {globalError && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Erro</p>
              <p className="text-sm mt-0.5">{globalError}</p>
            </div>
          </div>
        )}

        {paymentInformed && (
          <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl p-4 text-green-800">
            <CheckCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Pagamento informado com sucesso!</p>
              <p className="text-sm mt-0.5">
                O administrador verificará o recebimento e atualizará seu pedido. Em breve entraremos em contato.
              </p>
            </div>
          </div>
        )}

        <div className="card p-5 lg:p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-honey-100 flex items-center justify-center">
              <QrCode className="w-8 h-8 text-honey-700" />
            </div>
            <h1 className="font-display text-3xl lg:text-4xl font-bold mb-2">Pagamento PIX</h1>
            <p className="text-brown-600 text-sm lg:text-base">
              Pedido: <span className="font-semibold text-brown-900">#{order?.order_number}</span>
              {order?.created_at && (
                <>
                  {' · '}
                  <span>{formatShortDate(order.created_at)}</span>
                </>
              )}
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <span className={clsx('badge border', order?.payment_status === 'awaiting_payment' ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-honey-100 text-honey-800 border-honey-200')}>
                {order ? PAYMENT_STATUS_LABELS[order.payment_status] : ''}
              </span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-cream-100 to-cream-50 rounded-xl p-5 lg:p-6 mb-6 text-center border border-cream-200">
            <p className="text-sm text-brown-600 mb-1">Valor total</p>
            <p className="font-display text-3xl lg:text-4xl font-bold text-honey-700">
              {formatCurrency(order?.total ?? 0)}
            </p>
          </div>

          {order?.notes?.includes('[Retirada na loja]') ? (
            <div className="mb-6 rounded-xl p-5 border-2 border-green-400 bg-green-50/60">
              <h3 className="font-display text-lg font-bold mb-3 flex items-center gap-2 text-green-800">
                📍 Retirada na loja
              </h3>
              <div className="space-y-3 text-sm">
                {settings.pickup_address && (
                  <div>
                    <p className="text-xs font-medium text-green-800 uppercase tracking-wide mb-0.5">Endereço</p>
                    <p className="text-brown-900 whitespace-pre-wrap">{settings.pickup_address}</p>
                  </div>
                )}
                {settings.pickup_city_state && (
                  <div>
                    <p className="text-xs font-medium text-green-800 uppercase tracking-wide mb-0.5">Cidade/UF</p>
                    <p className="text-brown-900">{settings.pickup_city_state}</p>
                  </div>
                )}
                {settings.pickup_hours && (
                  <div>
                    <p className="text-xs font-medium text-green-800 uppercase tracking-wide mb-0.5">Quando disponível</p>
                    <p className="text-brown-900 whitespace-pre-wrap">{settings.pickup_hours}</p>
                  </div>
                )}
                <div className="mt-3 p-3 rounded-lg bg-green-100/80 border border-green-200">
                  <p className="text-sm text-green-900">
                    ✅ Você receberá um WhatsApp quando seu pedido estiver pronto para retirada.
                  </p>
                </div>
              </div>
            </div>
          ) : order && (order.street || order.city) ? (
            <div className="mb-6 rounded-xl p-5 border border-cream-200 bg-white">
              <h3 className="font-display text-lg font-bold mb-3 flex items-center gap-2 text-brown-900">
                <MapPin className="w-5 h-5 text-honey-600" />
                Endereço de entrega
              </h3>
              <div className="space-y-1 text-sm text-brown-800">
                {order.street && order.number && (
                  <p>{order.street}, {order.number}</p>
                )}
                {order.complement && <p>{order.complement}</p>}
                {order.neighborhood && <p>{order.neighborhood}</p>}
                {(order.city || order.state) && (
                  <p>{[order.city, order.state].filter(Boolean).join(' - ')}</p>
                )}
                {order.zipcode && <p>CEP: {order.zipcode.replace(/^(\d{5})(\d{3})$/, '$1-$2')}</p>}
              </div>
            </div>
          ) : null}

          {pixSettingsMissing ? (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Configurações de PIX não definidas</p>
                <p className="text-sm mt-0.5">
                  Entre em contato com o atendente para concluir o pagamento.
                </p>
                {settings.whatsapp && (
                  <a
                    href={createWhatsAppLink(settings.whatsapp, whatsgroupMsg)}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-whatsapp mt-3 text-sm"
                  >
                    <MessageCircle className="w-4 h-4" /> Falar no WhatsApp
                  </a>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center mb-6">
                {qrDataUrl ? (
                  <div className="p-3 bg-white border-4 border-honey-500 rounded-2xl shadow-md">
                    <img
                      src={qrDataUrl}
                      alt="QR Code PIX"
                      className="w-56 h-56 lg:w-64 lg:h-64"
                    />
                  </div>
                ) : (
                  <div className="w-56 h-56 lg:w-64 lg:h-64 rounded-2xl bg-cream-100 flex items-center justify-center border border-cream-200">
                    <Loader2 className="w-8 h-8 animate-spin text-brown-400" />
                  </div>
                )}
                <p className="text-xs text-brown-500 mt-3 text-center max-w-xs">
                  Abra o app do seu banco, escolha a opção PIX e escaneie o QR Code
                </p>
              </div>

              <div className="mb-6">
                <label className="label text-xs">PIX copia e cola</label>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={pixCode}
                    className="input font-mono text-xs bg-cream-50 pr-3"
                  />
                  <button
                    type="button"
                    onClick={handleCopyPix}
                    className={clsx(
                      'btn whitespace-nowrap',
                      copied
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-honey-500 hover:bg-honey-600 text-white'
                    )}
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="w-4 h-4" /> Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" /> Copiar PIX
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-cream-50 border border-cream-200 rounded-xl p-4 mb-6">
                <h3 className="font-semibold text-brown-800 mb-2 flex items-center gap-2">
                  <Package className="w-4 h-4 text-honey-700" />
                  Instruções de pagamento
                </h3>
                <ol className="space-y-1.5 text-sm text-brown-700 list-decimal list-inside">
                  <li>Abra o aplicativo do seu banco e acesse a área PIX</li>
                  <li>Escaneie o QR Code ou use a opção "PIX copia e cola"</li>
                  <li>Confira o valor total de {formatCurrency(order?.total ?? 0)}</li>
                  <li>Confirme o pagamento</li>
                  <li>Volte aqui e clique em <b>"Já paguei"</b></li>
                </ol>
              </div>

              {order?.payment_status !== 'payment_informed' &&
               order?.payment_status !== 'payment_confirmed' ? (
                <button
                  type="button"
                  onClick={handleInformPayment}
                  disabled={informingPayment || pixSettingsMissing}
                  className="btn-secondary w-full"
                >
                  {informingPayment ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Salvando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" /> Já paguei
                    </>
                  )}
                </button>
              ) : (
                <div className="text-center py-2">
                  <p className="text-sm text-green-700 font-semibold">
                    Seu pagamento já foi informado! Em breve iremos confirmá-lo! <br /> 
                    Você pode acompanhar o status do pedido clicando abaixo!
                  </p>
                </div>
              )}
            </>
          )}

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              to={`/pedido/${order?.order_number}`}
              state={{ prefilledPhone: customerPhone }}
              className="btn-outline w-full"
            >
              <Package className="w-5 h-5" /> Acompanhar pedido
            </Link>
            {settings.whatsapp && (
              <a
                href={createWhatsAppLink(settings.whatsapp, whatsgroupMsg)}
                target="_blank"
                rel="noreferrer"
                className="btn-whatsapp w-full"
              >
                <MessageCircle className="w-5 h-5" /> Falar no WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
