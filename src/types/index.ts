export interface Product {
  id: string
  name: string
  slug: string
  description: string
  size: string
  price: number
  discount_percent: number
  is_available: boolean
  display_order: number
  created_at: string
  updated_at: string
  images?: ProductImage[]
}

export interface ProductImage {
  id: string
  product_id: string
  storage_path: string
  display_order: number
  created_at: string
  public_url?: string
}

export interface CartItem {
  product_id: string
  product: Product
  quantity: number
}

export type CouponType = 'percent' | 'fixed'

export interface Coupon {
  id: string
  code: string
  type: CouponType
  value: number
  active: boolean
  expires_at: string | null
  created_at: string
}

export type PaymentStatus =
  | 'awaiting_payment'
  | 'payment_informed'
  | 'payment_confirmed'
  | 'refunded'
  | 'cancelled'

export type OrderStatus =
  | 'awaiting_confirmation'
  | 'in_preparation'
  | 'pronto_para_retirada'
  | 'shipped'
  | 'delivered'
  | 'cancelled'

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  awaiting_payment: 'Aguardando Pagamento',
  payment_informed: 'Pagamento Informado',
  payment_confirmed: 'Pagamento Confirmado',
  refunded: 'Pagamento Reembolsado',
  cancelled: 'Pagamento Cancelado',
}

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  awaiting_payment: 'bg-yellow-100 text-yellow-800',
  payment_informed: 'bg-blue-100 text-blue-800',
  payment_confirmed: 'bg-green-100 text-green-800',
  refunded: 'bg-purple-100 text-purple-800',
  cancelled: 'bg-red-100 text-red-800',
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  awaiting_confirmation: 'Aguardando confirmação do pagamento',
  in_preparation: 'Em Preparação',
  pronto_para_retirada: 'Pronto para Retirada',
  shipped: 'Saiu para Entrega',
  delivered: 'Entregue / Retirado',
  cancelled: 'Cancelado',
}

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  awaiting_confirmation: 'bg-yellow-100 text-yellow-800',
  in_preparation: 'bg-orange-100 text-orange-800',
  pronto_para_retirada: 'bg-emerald-100 text-emerald-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

export const ORDER_STATUS_TIMELINE_ORDER: OrderStatus[] = [
  'awaiting_confirmation',
  'in_preparation',
  'shipped',
  'delivered',
]

export const PICKUP_TIMELINE_ORDER: OrderStatus[] = [
  'awaiting_confirmation',
  'in_preparation',
  'pronto_para_retirada',
  'delivered',
]

export function getTimelineOrder(isPickup: boolean): OrderStatus[] {
  return isPickup ? PICKUP_TIMELINE_ORDER : ORDER_STATUS_TIMELINE_ORDER
}

export function getStatusLabel(status: OrderStatus, isPickup: boolean): string {
  if (status === 'delivered' && isPickup) {
    return 'Retirado'
  }
  return ORDER_STATUS_LABELS[status]
}

/**
 * Retorna o label de QUALQUER status (tanto de pagamento quanto de pedido).
 * Usado no histórico de status, onde podem aparecer ambos misturados.
 * Nunca retorna vazio — fallback capitaliza o status.
 */
export function getAnyStatusLabel(status: string, isPickup?: boolean): string {
  if (!status) return '-'
  // 1) Order status (logística)
  const orderLabel = ORDER_STATUS_LABELS[status as OrderStatus]
  if (orderLabel) {
    if (status === 'delivered' && isPickup) return 'Retirado'
    return orderLabel
  }
  // 2) Payment status (dinheiro)
  const payLabel = PAYMENT_STATUS_LABELS[status as PaymentStatus]
  if (payLabel) return payLabel
  // 3) Fallback (segurança, nunca fica vazio)
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * Retorna a classe de cor (badge) para QUALQUER status do histórico.
 */
export function getAnyStatusColor(status: string): string {
  if (!status) return 'bg-gray-100 text-gray-700'
  const orderColor = ORDER_STATUS_COLORS[status as OrderStatus]
  if (orderColor) return orderColor
  const payColor = PAYMENT_STATUS_COLORS[status as PaymentStatus]
  if (payColor) return payColor
  return 'bg-gray-100 text-gray-700'
}

export function isOrderPickup(order: { address_type?: string; notes?: string | null }): boolean {
  if (order.address_type === 'pickup') return true
  if (order.notes?.includes('[Retirada na loja]')) return true
  return false
}

export interface Order {
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
  payment_status: PaymentStatus
  order_status: OrderStatus
  coupon_code: string | null
  notes: string | null
  created_at: string
  updated_at: string
  address_type?: string
  items?: OrderItem[]
  status_history?: OrderStatusHistory[]
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string | null
  product_name_snapshot: string
  unit_price_snapshot: number
  discount_percent_snapshot: number
  quantity: number
  subtotal: number
}

export interface OrderStatusHistory {
  id: string
  order_id: string
  status: OrderStatus | PaymentStatus | string
  created_at: string
}

export interface SiteSettings {
  [key: string]: string
}

export type ShippingMode = 'fixed' | 'rules'
export type ShippingOutsideBehavior = 'block' | 'fixed_default'

export interface ShippingRule {
  id: string
  city: string
  state: string
  value: number
  delivery_estimate: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface ResolvedShipping {
  found: boolean
  mode: ShippingMode | 'rules_default'
  value: number
  delivery_estimate: string
  blocked: boolean
  blocked_message: string
  rule?: ShippingRule | null
}

export interface ShippingConfig {
  type: 'free' | 'fixed'
  value: number
  mode: ShippingMode
  outside_behavior: ShippingOutsideBehavior
  blocked_message: string
  resolved?: ResolvedShipping | null
}

export type GallerySection = 'story' | 'about' | 'hero' | 'custom'

export interface Testimonial {
  id: string
  name: string
  role: string
  text: string
  rating: number
  photo_url: string
  active: boolean
  order_index: number
  created_at: string
  updated_at: string
}

export interface GalleryImage {
  id: string
  section: GallerySection
  title: string
  description: string
  image_url: string
  active: boolean
  order_index: number
  created_at: string
  updated_at: string
}

