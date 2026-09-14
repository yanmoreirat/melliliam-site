import { useEffect, useRef, useState, useCallback } from 'react'

interface UseScrollRevealOptions {
  threshold?: number
  rootMargin?: string
  once?: boolean
  triggerOnMountIfAbove?: boolean
  fallbackTimeoutMs?: number | null
}

export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  options: UseScrollRevealOptions = {}
) {
  const {
    threshold = 0.15,
    rootMargin = '0px 0px -40px 0px',
    once = true,
    triggerOnMountIfAbove = true,
    fallbackTimeoutMs = 1500,
  } = options

  const observerRef = useRef<IntersectionObserver | null>(null)
  const [node, setNode] = useState<T | null>(null)
  const [inView, setInView] = useState(false)
  const fallbackRanRef = useRef(false)

  const ref = useCallback((el: T | null) => {
    setNode(el)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('IntersectionObserver' in window)) {
      setInView(true)
      return
    }

    if (observerRef.current) {
      observerRef.current.disconnect()
      observerRef.current = null
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true)
            if (once && entry.target instanceof Element) observer.unobserve(entry.target)
          } else if (!once) {
            setInView(false)
          }
        })
      },
      { threshold, rootMargin }
    )
    observerRef.current = observer

    if (node) {
      observer.observe(node)
      if (triggerOnMountIfAbove) {
        const rect = node.getBoundingClientRect()
        if (rect.top < window.innerHeight + 40) {
          setInView(true)
        }
      }
    }

    let fallbackTimer: ReturnType<typeof setTimeout> | undefined
    if (fallbackTimeoutMs != null && fallbackTimeoutMs > 0) {
      fallbackTimer = setTimeout(() => {
        if (!fallbackRanRef.current) {
          fallbackRanRef.current = true
          setInView(true)
        }
      }, fallbackTimeoutMs)
    }

    return () => {
      observer.disconnect()
      if (fallbackTimer) clearTimeout(fallbackTimer)
    }
  }, [node, threshold, rootMargin, once, triggerOnMountIfAbove, fallbackTimeoutMs])

  return { ref, inView }
}
