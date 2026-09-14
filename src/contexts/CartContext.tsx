import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type {
  CartItem,
  Product,
  Coupon,
  ShippingConfig,
  ResolvedShipping,
  ShippingRule,
  ShippingMode,
  ShippingOutsideBehavior,
} from '@/types'
import { calculateFinalPrice } from '@/utils/formatters'
import { supabase } from '@/lib/supabase'

interface FlyingImageData {
  imageUrl: string
  startRect: DOMRect
  startTimestamp: number
}

interface CartContextData {
  items: CartItem[]
  coupon: Coupon | null
  shippingConfig: ShippingConfig
  shippingRules: ShippingRule[]
  resolvedShipping: ResolvedShipping | null
  flyingImage: FlyingImageData | null
  cartBounce: boolean
  addToCart: (product: Product, quantity?: number) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  applyCoupon: (coupon: Coupon | null) => void
  setShippingConfig: (config: Partial<ShippingConfig> & Pick<ShippingConfig, 'type' | 'value'>) => void
  setShippingSettings: (opts: {
    mode: ShippingMode
    outside_behavior: ShippingOutsideBehavior
    blocked_message: string
    fixed_value: number
    fixed_type: 'free' | 'fixed'
  }) => void
  calculateShipping: (city: string, state: string, zipcode?: string) => Promise<ResolvedShipping>
  triggerFlyToCart: (startRect: DOMRect, imageUrl: string) => void
  clearFlyingImage: () => void
  subtotal: number
  discountTotal: number
  couponDiscount: number
  shippingFee: number
  shippingCalculated: boolean
  total: number
  itemCount: number
}

const CartContext = createContext<CartContextData | undefined>(undefined)

const CART_STORAGE_KEY = 'melliliam_cart'
const COUPON_STORAGE_KEY = 'melliliam_coupon'
const SHIPPING_STORAGE_KEY = 'melliliam_shipping'

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [coupon, setCoupon] = useState<Coupon | null>(null)
  const [shippingConfig, setShippingConfigState] = useState<ShippingConfig>({
    type: 'fixed',
    value: 0,
    mode: 'fixed',
    outside_behavior: 'block',
    blocked_message:
      'No momento não entregamos em sua cidade. Consulte a opção de retirada na loja ou entre em contato pelo WhatsApp.',
    resolved: null,
  })
  const [shippingRules, setShippingRules] = useState<ShippingRule[]>([])
  const [resolvedShipping, setResolvedShipping] = useState<ResolvedShipping | null>(null)
  const [flyingImage, setFlyingImage] = useState<FlyingImageData | null>(null)
  const [cartBounce, setCartBounce] = useState(false)

  useEffect(() => {
    const storedCart = localStorage.getItem(CART_STORAGE_KEY)
    if (storedCart) {
      try {
        const parsed = JSON.parse(storedCart)
        setItems(parsed)
      } catch {
        setItems([])
      }
    }
    const storedCoupon = localStorage.getItem(COUPON_STORAGE_KEY)
    if (storedCoupon) {
      try {
        setCoupon(JSON.parse(storedCoupon))
      } catch {
        setCoupon(null)
      }
    }
    const storedShipping = localStorage.getItem(SHIPPING_STORAGE_KEY)
    if (storedShipping) {
      try {
        const parsed = JSON.parse(storedShipping)
        setShippingConfigState({
          type: parsed.type || 'fixed',
          value: Number(parsed.value) || 0,
          mode: parsed.mode || 'fixed',
          outside_behavior: parsed.outside_behavior || 'block',
          blocked_message:
            parsed.blocked_message ||
            'No momento não entregamos em sua cidade. Consulte a opção de retirada na loja ou entre em contato pelo WhatsApp.',
          resolved: null,
        })
        setResolvedShipping(parsed.resolved || null)
      } catch {
        setShippingConfigState((prev) => ({ ...prev, resolved: null }))
        setResolvedShipping(null)
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
  }, [items])

  useEffect(() => {
    if (coupon) {
      localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(coupon))
    } else {
      localStorage.removeItem(COUPON_STORAGE_KEY)
    }
  }, [coupon])

  useEffect(() => {
    localStorage.setItem(SHIPPING_STORAGE_KEY, JSON.stringify(shippingConfig))
  }, [shippingConfig])

  const addToCart = (product: Product, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product_id === product.id)
      if (existing) {
        return prev.map((i) =>
          i.product_id === product.id
            ? { ...i, quantity: i.quantity + quantity }
            : i
        )
      }
      return [...prev, { product_id: product.id, product, quantity }]
    })
  }

  const removeFromCart = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.product_id !== productId))
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }
    setItems((prev) =>
      prev.map((i) => (i.product_id === productId ? { ...i, quantity } : i))
    )
  }

  const clearCart = () => {
    setItems([])
    setCoupon(null)
  }

  const applyCoupon = (c: Coupon | null) => {
    setCoupon(c)
  }

  const setShippingConfig = (
    config: Partial<ShippingConfig> & Pick<ShippingConfig, 'type' | 'value'>
  ) => {
    setShippingConfigState((prev) => {
      const next: ShippingConfig = { ...prev, ...config }
      return next
    })
  }

  const setShippingSettings = (opts: {
    mode: ShippingMode
    outside_behavior: ShippingOutsideBehavior
    blocked_message: string
    fixed_value: number
    fixed_type: 'free' | 'fixed'
  }) => {
    setShippingConfigState((prev) => ({
      ...prev,
      mode: opts.mode,
      outside_behavior: opts.outside_behavior,
      blocked_message: opts.blocked_message,
      type: opts.fixed_type,
      value: opts.fixed_value,
      resolved: null,
    }))
    setResolvedShipping(null)
  }

  const calculateShipping = async (
    city: string,
    state: string,
    _zipcode?: string
  ): Promise<ResolvedShipping> => {
    try {
      const mode = shippingConfig.mode
      if (mode === 'fixed') {
        const result: ResolvedShipping = {
          found: true,
          mode: 'fixed',
          value: shippingConfig.type === 'free' ? 0 : shippingConfig.value,
          delivery_estimate: '',
          blocked: false,
          blocked_message: '',
        }
        setResolvedShipping(result)
        setShippingConfigState((prev) => ({
          ...prev,
          value: result.value,
          type: result.value === 0 ? 'free' : 'fixed',
          resolved: result,
        }))
        return result
      }

      // MODO REGRAS: busca na tabela shipping_rules (1º por cidade+UF, depois cidade com UF vazio)
      const cityTrim = (city || '').trim()
      const stateTrim = (state || '').trim().toUpperCase()

      if (!cityTrim) {
        const emptyResult: ResolvedShipping = {
          found: false,
          mode: 'rules',
          value: 0,
          delivery_estimate: '',
          blocked: false,
          blocked_message: '',
        }
        setResolvedShipping(emptyResult)
        setShippingConfigState((prev) => ({ ...prev, resolved: emptyResult, value: 0 }))
        return emptyResult
      }

      const { data } = await supabase
        .from('shipping_rules')
        .select('*')
        .eq('active', true)
        .ilike('city', cityTrim)

      const rules = (data || []) as ShippingRule[]
      let matched: ShippingRule | null = null
      if (rules.length > 0) {
        matched = rules.find(
          (r) => (r.state || '').toUpperCase() === stateTrim && (r.state || '').trim() !== ''
        ) || rules.find((r) => !r.state || (r.state || '').trim() === '') || rules[0]
      }

      if (matched) {
        const result: ResolvedShipping = {
          found: true,
          mode: 'rules',
          value: Number(matched.value) || 0,
          delivery_estimate: matched.delivery_estimate || '',
          blocked: false,
          blocked_message: '',
          rule: matched,
        }
        setResolvedShipping(result)
        setShippingConfigState((prev) => ({
          ...prev,
          value: result.value,
          type: result.value === 0 ? 'free' : 'fixed',
          resolved: result,
        }))
        return result
      }

      // Sem regra encontrada → usa outside behavior
      if (shippingConfig.outside_behavior === 'block') {
        const result: ResolvedShipping = {
          found: false,
          mode: 'rules',
          value: 0,
          delivery_estimate: '',
          blocked: true,
          blocked_message:
            shippingConfig.blocked_message ||
            'No momento não entregamos em sua cidade. Consulte a opção de retirada na loja.',
        }
        setResolvedShipping(result)
        setShippingConfigState((prev) => ({ ...prev, resolved: result, value: 0 }))
        return result
      }

      // outside = fixed_default (fallback para valor fixo geral)
      const fallbackValue = shippingConfig.type === 'free' ? 0 : shippingConfig.value
      const result: ResolvedShipping = {
        found: false,
        mode: 'rules_default',
        value: fallbackValue,
        delivery_estimate: '',
        blocked: false,
        blocked_message: '',
      }
      setResolvedShipping(result)
      setShippingConfigState((prev) => ({
        ...prev,
        value: result.value,
        type: result.value === 0 ? 'free' : 'fixed',
        resolved: result,
      }))
      return result
    } catch (err) {
      console.error('[calculateShipping] error:', err)
      const fallback: ResolvedShipping = {
        found: true,
        mode: 'fixed',
        value: shippingConfig.type === 'free' ? 0 : shippingConfig.value,
        delivery_estimate: '',
        blocked: false,
        blocked_message: '',
      }
      setResolvedShipping(fallback)
      return fallback
    }
  }

  const triggerFlyToCart = (startRect: DOMRect, imageUrl: string) => {
    setFlyingImage({
      imageUrl,
      startRect,
      startTimestamp: Date.now(),
    })
  }

  const clearFlyingImage = () => {
    setFlyingImage(null)
    setCartBounce(true)
    setTimeout(() => setCartBounce(false), 600)
  }

  const subtotal = items.reduce((sum, item) => {
    const finalPrice = calculateFinalPrice(item.product.price, item.product.discount_percent)
    return sum + finalPrice * item.quantity
  }, 0)

  const discountTotal = items.reduce((sum, item) => {
    const finalPrice = calculateFinalPrice(item.product.price, item.product.discount_percent)
    return sum + (item.product.price - finalPrice) * item.quantity
  }, 0)

  let couponDiscount = 0
  if (coupon && items.length > 0) {
    if (coupon.type === 'percent') {
      couponDiscount = Math.round((subtotal * (coupon.value / 100)) * 100) / 100
    } else {
      couponDiscount = Math.min(subtotal, coupon.value)
    }
  }

  const shippingFee = (() => {
    if (shippingConfig.mode === 'rules') {
      // Modo Tabela por Cidade: só usa o valor se realmente resolveu a regra via CEP/cidade calculada
      if (resolvedShipping && !resolvedShipping.blocked) {
        return Math.round((resolvedShipping.value || 0) * 100) / 100
      }
      return 0
    }
    // Modo Geral (fixed/free): usa o valor do config geral normalmente
    return shippingConfig.type === 'free' ? 0 : (shippingConfig.value || 0)
  })()

  // Flag que indica se o frete REALMENTE foi calculado (e pode ser exibido como Grátis / R$X).
  // - Modo Tabela por cidade: NÃO está calculado enquanto não vier CEP => resolvedShipping null
  // - Modo Geral Grátis: SEMPRE está calculado, é uma decisão administrativa
  // - Modo Geral Fixo: SEMPRE está calculado, valor vem do config
  const shippingCalculated =
    shippingConfig.mode !== 'rules' ||
    (resolvedShipping !== null && !resolvedShipping.blocked)

  const total = Math.max(0, subtotal - couponDiscount + shippingFee)

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data } = await supabase.from('site_settings').select('*')
        const rows = (data || []) as Array<{ key: string; value: string }>
        if (rows.length > 0) {
          const settingsMap: Record<string, string> = {}
          rows.forEach((s) => (settingsMap[s.key] = s.value))
          const newType = (settingsMap.shipping_type as 'free' | 'fixed') || 'fixed'
          const newValue = settingsMap.shipping_value ? Number(settingsMap.shipping_value) : 0
          const newMode = (settingsMap.shipping_mode as ShippingMode) || 'fixed'
          const newOutside = (settingsMap.shipping_outside_rules_behavior as ShippingOutsideBehavior) || 'block'
          const newBlockedMsg =
            settingsMap.shipping_blocked_message ||
            'No momento não entregamos em sua cidade. Consulte a opção de retirada na loja ou entre em contato pelo WhatsApp.'
          setShippingConfigState((prev) => ({
            ...prev,
            type: newType,
            value: newValue,
            mode: newMode,
            outside_behavior: newOutside,
            blocked_message: newBlockedMsg,
            resolved: prev.resolved,
          }))
        }
      } catch {
        // ignore
      }
    }
    loadSettings()
  }, [])

  return (
    <CartContext.Provider
      value={{
        items,
        coupon,
        shippingConfig,
        shippingRules,
        resolvedShipping,
        flyingImage,
        cartBounce,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        applyCoupon,
        setShippingConfig,
        setShippingSettings,
        calculateShipping,
        triggerFlyToCart,
        clearFlyingImage,
        subtotal,
        discountTotal,
        couponDiscount,
        shippingFee,
        shippingCalculated,
        total,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
