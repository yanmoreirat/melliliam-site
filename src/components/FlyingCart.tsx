import { useEffect, useState } from 'react'
import { useCart } from '@/contexts/CartContext'

const FLY_DURATION = 700
const CART_ICON_ID = 'header-cart-icon'

export default function FlyingCart() {
  const { flyingImage, clearFlyingImage } = useCart()
  const [endRect, setEndRect] = useState<DOMRect | null>(null)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    if (!flyingImage) {
      setAnimating(false)
      setEndRect(null)
      return
    }

    const cartEl = document.getElementById(CART_ICON_ID)
    if (!cartEl) {
      clearFlyingImage()
      return
    }

    const cartRect = cartEl.getBoundingClientRect()
    setEndRect(cartRect)
    setAnimating(false)

    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setAnimating(true)
      })
    })

    const timeoutId = setTimeout(() => {
      clearFlyingImage()
    }, FLY_DURATION + 50)

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(timeoutId)
    }
  }, [flyingImage, clearFlyingImage])

  if (!flyingImage || !endRect) return null

  const { imageUrl, startRect } = flyingImage

  const startStyle: React.CSSProperties = {
    position: 'fixed',
    left: startRect.left,
    top: startRect.top,
    width: startRect.width,
    height: startRect.height,
    zIndex: 9999,
    pointerEvents: 'none',
    borderRadius: '12px',
    objectFit: 'cover',
    boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
  }

  const endStyle: React.CSSProperties = animating
    ? {
        left: endRect.left + endRect.width / 2 - 30,
        top: endRect.top + endRect.height / 2 - 30,
        width: 60,
        height: 60,
        opacity: 0.6,
        borderRadius: '50%',
        transform: 'rotate(15deg)',
      }
    : {}

  return (
    <img
      src={imageUrl}
      alt=""
      className={animating ? 'fly-to-cart-img' : ''}
      style={{ ...startStyle, ...endStyle }}
    />
  )
}
