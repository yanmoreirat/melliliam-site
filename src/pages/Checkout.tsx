import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ShoppingBag,
  MapPin,
  User,
  CreditCard,
  AlertCircle,
  Truck,
  Tag,
  ChevronRight,
  Loader2,
  Package,
} from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { useSiteSettings } from '@/contexts/SiteSettingsContext'
import { supabase } from '@/lib/supabase'
import { formatCurrency, calculateFinalPrice } from '@/utils/formatters'
import clsx from 'clsx'

interface CheckoutForm {
  customer_name: string
  customer_phone: string
  customer_email: string
  zipcode: string
  street: string
  number: string
  complement: string
  neighborhood: string
  city: string
  state: string
  notes: string
  address_type: 'delivery' | 'pickup'
}

const UF_LIST = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
]

const STORAGE_KEY = 'melliliam_checkout_form'

const defaultForm: CheckoutForm = {
  customer_name: '',
  customer_phone: '',
  customer_email: '',
  zipcode: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
  notes: '',
  address_type: 'delivery',
}

export default function Checkout() {
  const navigate = useNavigate()
  const {
    items,
    subtotal,
    discountTotal,
    coupon,
    couponDiscount,
    shippingFee,
    shippingConfig,
    resolvedShipping,
    total,
    clearCart,
    calculateShipping,
  } = useCart()
  const { settings } = useSiteSettings()

  const [form, setForm] = useState<CheckoutForm>(defaultForm)
  const [errors, setErrors] = useState<Partial<Record<keyof CheckoutForm, string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [globalError, setGlobalError] = useState('')
  const [justCreatedOrder, setJustCreatedOrder] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setForm({ ...defaultForm, ...JSON.parse(stored) })
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(form))
    } catch {
      // ignore
    }
  }, [form])

  useEffect(() => {
    if (items.length === 0 && !submitting && !justCreatedOrder) {
      navigate('/carrinho', { replace: true })
    }
  }, [items.length, navigate, submitting, justCreatedOrder])

  useEffect(() => {
    if (form.address_type === 'pickup') return
    if (form.city && form.state) {
      calculateShipping(form.city, form.state, form.zipcode.replace(/\D/g, '')).catch(() => {})
    }
  }, [form.address_type])

  const updateField = <K extends keyof CheckoutForm>(field: K, value: CheckoutForm[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
    if (globalError) setGlobalError('')
  }

  const maskPhone = (value: string): string => {
    const d = value.replace(/\D/g, '').slice(0, 11)
    if (d.length <= 2) return d ? `(${d}` : ''
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  }

  const maskZip = (value: string): string => {
    const d = value.replace(/\D/g, '').slice(0, 8)
    if (d.length <= 5) return d
    return `${d.slice(0, 5)}-${d.slice(5)}`
  }

  const lookupCep = async () => {
    const cep = form.zipcode.replace(/\D/g, '')
    if (cep.length !== 8) return
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      if (!res.ok) return
      const data = await res.json()
      if (data && !data.erro) {
        const nextCity = data.localidade || form.city
        const nextState = data.uf || form.state
        setForm((prev) => ({
          ...prev,
          street: data.logradouro || prev.street,
          neighborhood: data.bairro || prev.neighborhood,
          city: nextCity,
          state: nextState,
        }))
        if (form.address_type === 'delivery' && nextCity && nextState) {
          await calculateShipping(nextCity, nextState, cep)
        }
      }
    } catch {
      // ignore
    }
  }

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof CheckoutForm, string>> = {}
    if (!form.customer_name.trim()) newErrors.customer_name = 'Informe seu nome'
    else if (form.customer_name.trim().split(' ').length < 2) newErrors.customer_name = 'Informe nome e sobrenome'

    const phoneDigits = form.customer_phone.replace(/\D/g, '')
    if (!phoneDigits) newErrors.customer_phone = 'Informe seu WhatsApp'
    else if (phoneDigits.length < 10) newErrors.customer_phone = 'WhatsApp inválido'

    if (form.customer_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customer_email)) {
      newErrors.customer_email = 'E-mail inválido'
    }

    if (form.address_type === 'delivery') {
      const zip = form.zipcode.replace(/\D/g, '')
      if (!zip) newErrors.zipcode = 'Informe o CEP'
      else if (zip.length !== 8) newErrors.zipcode = 'CEP inválido'

      if (!form.street.trim()) newErrors.street = 'Informe a rua'
      if (!form.number.trim()) newErrors.number = 'Informe o número'
      if (!form.neighborhood.trim()) newErrors.neighborhood = 'Informe o bairro'
      if (!form.city.trim()) newErrors.city = 'Informe a cidade'
      if (!form.state) newErrors.state = 'Selecione o estado'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const isDeliveryBlocked =
    form.address_type === 'delivery' && resolvedShipping?.blocked === true

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setGlobalError('')
    if (isDeliveryBlocked) {
      setGlobalError(resolvedShipping?.blocked_message || 'Entrega não disponível para sua cidade.')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    if (!validate()) {
      const firstError = Object.values(errors)[0]
      if (firstError) {
        alert(`Verifique o formulário: ${firstError}`)
      }
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    if (items.length === 0) {
      setGlobalError('Seu carrinho está vazio.')
      return
    }
    const customerPhone = form.customer_phone.replace(/\D/g, '')
    const generatedOrderNumber =
      String(Date.now()).slice(-8) + String(Math.floor(Math.random() * 1000)).padStart(3, '0')
    setSubmitting(true)
    try {
      const orderItemsPayload = items.map((i) => {
        const unitFinal = calculateFinalPrice(i.product.price, i.product.discount_percent)
        return {
          product_id: i.product.id,
          product_name_snapshot: i.product.name,
          unit_price_snapshot: unitFinal,
          discount_percent_snapshot: i.product.discount_percent,
          quantity: i.quantity,
          subtotal: Math.round(unitFinal * i.quantity * 100) / 100,
        }
      })

      const isPickup = form.address_type === 'pickup'
      let finalNotes = form.notes.trim()
      if (isPickup) {
        finalNotes = finalNotes ? `[Retirada na loja]\n${finalNotes}` : '[Retirada na loja]'
      }

      const rpcArgs = {
        p_order_number: generatedOrderNumber,
        p_customer_name: form.customer_name.trim(),
        p_customer_phone: customerPhone,
        p_customer_email: form.customer_email.trim() || null,
        p_zipcode: isPickup ? '' : form.zipcode.replace(/\D/g, ''),
        p_street: isPickup ? '' : form.street.trim(),
        p_number: isPickup ? '' : form.number.trim(),
        p_complement: isPickup ? null : (form.complement.trim() || null),
        p_neighborhood: isPickup ? '' : form.neighborhood.trim(),
        p_city: isPickup ? '' : form.city.trim(),
        p_state: isPickup ? '' : form.state,
        p_items: orderItemsPayload as any,
        p_coupon_code: coupon?.code || null,
        p_shipping_fee: isPickup ? 0 : Math.round(shippingFee * 100) / 100,
        p_notes: finalNotes || null,
        p_address_type: isPickup ? 'pickup' : 'delivery',
      }

      const { data, error } = await supabase.rpc('create_order', rpcArgs as any)

      if (error) {
        console.error('create_order error:', error)
        const msg = error.message || 'Erro ao criar pedido. Tente novamente.'
        setGlobalError(msg)
        setJustCreatedOrder(false)
        alert(msg)
        return
      }

      console.log('create_order raw response:', JSON.stringify(data, null, 2))

      const rawData = data as any
      let orderNumber: string | undefined

      try {
        if (rawData && typeof rawData === 'object' && rawData.order_number) {
          orderNumber = rawData.order_number
        } else if (typeof rawData === 'string') {
          orderNumber = rawData
        } else if (rawData && typeof rawData === 'object') {
          orderNumber = rawData.order_number || rawData.orderNumber || rawData[0]?.order_number || rawData[0]?.orderNumber || undefined
        } else if (Array.isArray(rawData) && rawData.length > 0) {
          const first = rawData[0]
          if (typeof first === 'string') {
            orderNumber = first
          } else if (first && typeof first === 'object') {
            orderNumber = first.order_number || first.orderNumber || undefined
          }
        }
        if (rawData && typeof rawData === 'object' && !orderNumber) {
          const keys = Object.keys(rawData)
          for (const k of keys) {
            const val = (rawData as any)[k]
            if (typeof val === 'string' && val.length >= 6 && /\d/.test(val)) {
              orderNumber = val
              break
            }
          }
        }
      } catch (parseErr: any) {
        console.error('Error parsing orderNumber:', parseErr)
      }

      if (!orderNumber) {
        orderNumber = generatedOrderNumber
        console.warn('orderNumber not found in RPC response, using generatedOrderNumber fallback:', orderNumber)
      }

      try {
        localStorage.removeItem(STORAGE_KEY)
      } catch {
      }
      try {
        sessionStorage.setItem(
          'melliliam_last_order',
          JSON.stringify({ orderNumber, phone: customerPhone })
        )
      } catch {
      }
      setJustCreatedOrder(true)
      clearCart()
      const target = `/pagamento/${encodeURIComponent(orderNumber)}`
      setTimeout(() => { window.location.href = target }, 150)
    } catch (err: any) {
      console.error('checkout error:', err)
      const msg = err?.message || 'Erro inesperado. Tente novamente.'
      setGlobalError(msg)
      setJustCreatedOrder(false)
      alert(msg)
      try {
        sessionStorage.setItem(
          'melliliam_last_order',
          JSON.stringify({ orderNumber: generatedOrderNumber, phone: customerPhone })
        )
      } catch {
      }
      setJustCreatedOrder(true)
      clearCart()
      const target = `/pagamento/${encodeURIComponent(generatedOrderNumber)}`
      setTimeout(() => { window.location.href = target }, 150)
    } finally {
      setSubmitting(false)
    }
  }

  if (justCreatedOrder) {
    return (
      <div className="fixed inset-0 z-50 bg-cream-100/95 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-honey-600 mx-auto mb-4" />
          <p className="font-display text-xl font-bold text-brown-800">Processando...</p>
          <p className="text-sm text-brown-600 mt-2">Redirecionando para a tela de pagamento</p>
        </div>
      </div>
    )
  }

  if (items.length === 0 && !justCreatedOrder) {
    return (
      <div className="container-page py-16 text-center">
        <p className="text-brown-600 mb-4">Redirecionando para o carrinho...</p>
        <Link to="/carrinho" className="btn-primary">Ir para o carrinho</Link>
      </div>
    )
  }

  return (
    <div className="container-page py-8 lg:py-12">
      <Link
        to="/carrinho"
        className="inline-flex items-center gap-1 text-sm text-honey-700 hover:underline mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para o carrinho
      </Link>

      <div className="space-y-2 mb-8">
        <h1 className="font-display text-3xl lg:text-4xl font-bold flex items-center gap-3">
          <CreditCard className="w-9 h-9 text-honey-600" />
          Finalizar compra
        </h1>
        <p className="text-brown-600">
          Preencha os dados abaixo para concluir seu pedido
        </p>
      </div>

      {globalError && (
        <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-red-800">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Não foi possível finalizar o pedido</p>
            <p className="text-sm mt-0.5">{globalError}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-[1fr_400px] gap-6 lg:gap-8">
        <div className="space-y-6">
          <section className="card p-5 lg:p-6 space-y-5">
            <h2 className="font-display text-xl font-bold flex items-center gap-2 pb-2 border-b border-cream-200">
              <User className="w-5 h-5 text-honey-600" />
              Seus dados
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="label">
                  Nome completo <span className="text-red-600">*</span>
                </label>
                <input
                  className={clsx('input', errors.customer_name && 'border-red-400 focus:ring-red-300 focus:border-red-400')}
                  value={form.customer_name}
                  onChange={(e) => updateField('customer_name', e.target.value)}
                  placeholder="Ex: Maria da Silva"
                  autoComplete="name"
                />
                {errors.customer_name && <p className="text-xs text-red-600 mt-1">{errors.customer_name}</p>}
              </div>
              <div>
                <label className="label">
                  WhatsApp <span className="text-red-600">*</span>
                </label>
                <input
                  className={clsx('input', errors.customer_phone && 'border-red-400 focus:ring-red-300 focus:border-red-400')}
                  value={form.customer_phone}
                  onChange={(e) => updateField('customer_phone', maskPhone(e.target.value))}
                  placeholder="(00) 00000-0000"
                  inputMode="tel"
                  autoComplete="tel"
                />
                {errors.customer_phone && <p className="text-xs text-red-600 mt-1">{errors.customer_phone}</p>}
              </div>
              <div>
                <label className="label">E-mail (opcional)</label>
                <input
                  type="email"
                  className={clsx('input', errors.customer_email && 'border-red-400 focus:ring-red-300 focus:border-red-400')}
                  value={form.customer_email}
                  onChange={(e) => updateField('customer_email', e.target.value)}
                  placeholder="voce@email.com"
                  autoComplete="email"
                />
                {errors.customer_email && <p className="text-xs text-red-600 mt-1">{errors.customer_email}</p>}
              </div>
            </div>
          </section>

          {settings.enable_pickup === 'true' && (
            <section className="card p-5 lg:p-6 space-y-4">
              <h2 className="font-display text-xl font-bold flex items-center gap-2 pb-2 border-b border-cream-200">
                <Truck className="w-5 h-5 text-honey-600" />
                Forma de recebimento
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    form.address_type === 'delivery'
                      ? 'border-honey-500 bg-honey-50'
                      : 'border-cream-200 bg-white hover:border-cream-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="address_type"
                    value="delivery"
                    checked={form.address_type === 'delivery'}
                    onChange={(e) =>
                      updateField('address_type', e.target.value as 'delivery' | 'pickup')
                    }
                    className="mt-1 accent-honey-500"
                  />
                  <div>
                    <p className="font-semibold text-brown-900">Receber em casa</p>
                    <p className="text-sm text-brown-500 mt-0.5">
                      Entregamos no endereço informado
                    </p>
                  </div>
                </label>
                <label
                  className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    form.address_type === 'pickup'
                      ? 'border-honey-500 bg-honey-50'
                      : 'border-cream-200 bg-white hover:border-cream-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="address_type"
                    value="pickup"
                    checked={form.address_type === 'pickup'}
                    onChange={(e) =>
                      updateField('address_type', e.target.value as 'delivery' | 'pickup')
                    }
                    className="mt-1 accent-honey-500"
                  />
                  <div>
                    <p className="font-semibold text-brown-900">Retirar na loja</p>
                    <p className="text-sm text-brown-500 mt-0.5">
                      Sem frete, você retira pessoalmente
                    </p>
                  </div>
                </label>
              </div>
            </section>
          )}

          {form.address_type === 'pickup' ? (
            <section className="card p-5 lg:p-6 space-y-4 border-green-400 bg-green-50/50">
              <h2 className="font-display text-xl font-bold flex items-center gap-2 pb-2 border-b border-green-200">
                <Package className="w-5 h-5 text-green-700" />
                📍 Retirada na loja
              </h2>
              {settings.pickup_address && (
                <div>
                  <p className="text-xs font-medium text-green-800 uppercase tracking-wide mb-1">Endereço</p>
                  <p className="text-brown-900 whitespace-pre-wrap">{settings.pickup_address}</p>
                </div>
              )}
              {settings.pickup_city_state && (
                <div>
                  <p className="text-xs font-medium text-green-800 uppercase tracking-wide mb-1">Cidade/UF</p>
                  <p className="text-brown-900">{settings.pickup_city_state}</p>
                </div>
              )}
              {settings.pickup_hours && (
                <div>
                  <p className="text-xs font-medium text-green-800 uppercase tracking-wide mb-1">Quando disponível</p>
                  <p className="text-brown-900 whitespace-pre-wrap">{settings.pickup_hours}</p>
                </div>
              )}
              <div className="mt-2 p-3 rounded-lg bg-green-100/70 border border-green-200">
                <p className="text-sm text-green-900">
                  ✅ Você receberá um WhatsApp quando seu pedido estiver pronto para retirada.
                </p>
              </div>
              <div className="sm:col-span-3">
                <label className="label">Observações (opcional)</label>
                <textarea
                  className="input min-h-[90px] resize-y"
                  value={form.notes}
                  onChange={(e) => updateField('notes', e.target.value)}
                  placeholder="Alguma observação para o seu pedido?"
                  maxLength={500}
                />
                <p className="text-[11px] text-brown-400 mt-1 text-right">
                  {form.notes.length}/500
                </p>
              </div>
            </section>
          ) : (
            <section className="card p-5 lg:p-6 space-y-5">
              <h2 className="font-display text-xl font-bold flex items-center gap-2 pb-2 border-b border-cream-200">
                <MapPin className="w-5 h-5 text-honey-600" />
                Endereço de entrega
              </h2>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1">
                  <label className="label">
                    CEP <span className="text-red-600">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      className={clsx('input', errors.zipcode && 'border-red-400 focus:ring-red-300 focus:border-red-400')}
                      value={form.zipcode}
                      onChange={(e) => updateField('zipcode', maskZip(e.target.value))}
                      onBlur={lookupCep}
                      placeholder="00000-000"
                      inputMode="numeric"
                      autoComplete="postal-code"
                    />
                  </div>
                  {errors.zipcode && <p className="text-xs text-red-600 mt-1">{errors.zipcode}</p>}
                  <p className="text-[11px] text-brown-400 mt-1">Preencha o CEP para auto-completar</p>
                </div>
                <div className="sm:col-span-2">
                  <label className="label">
                    Rua / Avenida <span className="text-red-600">*</span>
                  </label>
                  <input
                    className={clsx('input', errors.street && 'border-red-400 focus:ring-red-300 focus:border-red-400')}
                    value={form.street}
                    onChange={(e) => updateField('street', e.target.value)}
                    placeholder="Nome da rua"
                    autoComplete="street-address"
                  />
                  {errors.street && <p className="text-xs text-red-600 mt-1">{errors.street}</p>}
                </div>
                <div className="sm:col-span-1">
                  <label className="label">
                    Número <span className="text-red-600">*</span>
                  </label>
                  <input
                    className={clsx('input', errors.number && 'border-red-400 focus:ring-red-300 focus:border-red-400')}
                    value={form.number}
                    onChange={(e) => updateField('number', e.target.value)}
                    placeholder="123"
                    autoComplete="address-line2"
                  />
                  {errors.number && <p className="text-xs text-red-600 mt-1">{errors.number}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Complemento (opcional)</label>
                  <input
                    className="input"
                    value={form.complement}
                    onChange={(e) => updateField('complement', e.target.value)}
                    placeholder="Apto, bloco, referência..."
                  />
                </div>
                <div className="sm:col-span-1">
                  <label className="label">
                    Bairro <span className="text-red-600">*</span>
                  </label>
                  <input
                    className={clsx('input', errors.neighborhood && 'border-red-400 focus:ring-red-300 focus:border-red-400')}
                    value={form.neighborhood}
                    onChange={(e) => updateField('neighborhood', e.target.value)}
                    placeholder="Seu bairro"
                    autoComplete="address-level2"
                  />
                  {errors.neighborhood && <p className="text-xs text-red-600 mt-1">{errors.neighborhood}</p>}
                </div>
                <div className="sm:col-span-1">
                  <label className="label">
                    Cidade <span className="text-red-600">*</span>
                  </label>
                  <input
                    className={clsx('input', errors.city && 'border-red-400 focus:ring-red-300 focus:border-red-400')}
                    value={form.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    placeholder="Sua cidade"
                    autoComplete="address-level2"
                  />
                  {errors.city && <p className="text-xs text-red-600 mt-1">{errors.city}</p>}
                </div>
                <div className="sm:col-span-1">
                  <label className="label">
                    Estado <span className="text-red-600">*</span>
                  </label>
                  <select
                    className={clsx('input', errors.state && 'border-red-400 focus:ring-red-300 focus:border-red-400')}
                    value={form.state}
                    onChange={(e) => updateField('state', e.target.value)}
                    autoComplete="address-level1"
                  >
                    <option value="">UF</option>
                    {UF_LIST.map((uf) => (
                      <option key={uf} value={uf}>{uf}</option>
                    ))}
                  </select>
                  {errors.state && <p className="text-xs text-red-600 mt-1">{errors.state}</p>}
                </div>
                <div className="sm:col-span-3">
                  <label className="label">Observações (opcional)</label>
                  <textarea
                    className="input min-h-[90px] resize-y"
                    value={form.notes}
                    onChange={(e) => updateField('notes', e.target.value)}
                    placeholder="Instruções para entrega, preferências, etc."
                    maxLength={500}
                  />
                  <p className="text-[11px] text-brown-400 mt-1 text-right">
                    {form.notes.length}/500
                  </p>
                </div>
              </div>
            </section>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 self-start space-y-6">
          <div className="card p-5 lg:p-6 space-y-4">
            <h3 className="font-display text-xl font-bold flex items-center gap-2 pb-2 border-b border-cream-200">
              <ShoppingBag className="w-5 h-5 text-honey-600" />
              Resumo do pedido
            </h3>

            <ul className="space-y-3 max-h-64 lg:max-h-80 overflow-auto pr-1">
              {items.map((i) => {
                const finalPrice = calculateFinalPrice(i.product.price, i.product.discount_percent)
                const imgUrl = i.product.images?.[0]?.public_url
                return (
                  <li key={i.product_id} className="flex gap-3">
                    <div className="w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-cream-100 border border-cream-200">
                      {imgUrl ? (
                        <img src={imgUrl} alt={i.product.name} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-cream-400 text-[10px]">
                          Sem img
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-brown-900 line-clamp-2">{i.product.name}</p>
                      <p className="text-xs text-brown-500 mt-0.5">
                        {i.quantity}x {formatCurrency(finalPrice)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-brown-900">
                        {formatCurrency(finalPrice * i.quantity)}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>

            <dl className="space-y-2.5 text-sm pt-3 border-t border-cream-200">
              <div className="flex justify-between items-center">
                <dt className="text-brown-600">Subtotal produtos</dt>
                <dd className="font-semibold">{formatCurrency(subtotal + discountTotal)}</dd>
              </div>
              {discountTotal > 0 && (
                <div className="flex justify-between items-center text-green-700">
                  <dt>Descontos produtos</dt>
                  <dd className="font-semibold">- {formatCurrency(discountTotal)}</dd>
                </div>
              )}
              {couponDiscount > 0 && (
                <div className="flex justify-between items-center text-green-700">
                  <dt className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" /> Cupom {coupon?.code}
                  </dt>
                  <dd className="font-semibold">- {formatCurrency(couponDiscount)}</dd>
                </div>
              )}
              <div className="flex justify-between items-start">
                <dt className="flex flex-col items-start gap-1 text-brown-600">
                  <span className="flex items-center gap-1.5">
                    <Truck className="w-4 h-4" /> Frete
                  </span>
                  {form.address_type === 'delivery' &&
                    resolvedShipping?.found &&
                    resolvedShipping.delivery_estimate && (
                      <span className="text-xs text-brown-500 normal-case font-normal">
                        Prazo: {resolvedShipping.delivery_estimate}
                      </span>
                    )}
                </dt>
                <dd
                  className={clsx(
                    'font-semibold',
                    isDeliveryBlocked ? 'text-red-600' : shippingConfig.type === 'free' ? 'text-green-700' : ''
                  )}
                >
                  {isDeliveryBlocked
                    ? 'Não atendido'
                    : shippingConfig.type === 'free'
                    ? 'Grátis'
                    : formatCurrency(shippingFee)}
                </dd>
              </div>
            </dl>

            {isDeliveryBlocked && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 text-red-800 text-sm p-4 flex gap-3">
                <svg
                  className="w-5 h-5 flex-shrink-0 text-red-600 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.008v.008H12v-.008zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="space-y-2 flex-1">
                  <p className="font-semibold">Entrega não disponível para sua região</p>
                  <p>{resolvedShipping?.blocked_message}</p>
                  {settings.enable_pickup === 'true' && (
                    <p className="text-red-900">
                      💡 <strong>Dica:</strong> Você pode selecionar a opção{' '}
                      <strong>"Retirada na loja"</strong> acima e finalizar a compra.
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-cream-300">
              <div className="flex justify-between items-end">
                <span className="font-semibold text-brown-800">Total a pagar</span>
                <span className="font-display text-3xl font-bold text-honey-700">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || isDeliveryBlocked}
              className={clsx(
                'btn-primary w-full !py-4 text-base justify-center mt-2',
                isDeliveryBlocked && 'opacity-60 cursor-not-allowed !bg-gray-400 !border-gray-400'
              )}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processando...
                </>
              ) : isDeliveryBlocked ? (
                <>
                  Entrega indisponível para sua cidade
                </>
              ) : (
                <>
                  Finalizar compra
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>

            <p className="text-xs text-brown-500 text-center pt-2">
              Ao finalizar, você concorda com nossos termos. Dados seguros.
            </p>
          </div>
        </aside>
      </form>
    </div>
  )
}
