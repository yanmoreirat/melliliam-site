import { useEffect, useState } from 'react'

export function useScrollY(throttleMs = 16) {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    if (typeof window === 'undefined') return
    let last = 0
    let raf = 0

    const update = () => {
      const now = performance.now()
      if (now - last < throttleMs) {
        raf = requestAnimationFrame(update)
        return
      }
      last = now
      setScrollY(window.scrollY || window.pageYOffset || 0)
    }

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    setScrollY(window.scrollY || 0)

    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [throttleMs])

  return scrollY
}
