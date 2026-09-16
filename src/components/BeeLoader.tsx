import { useEffect, useState } from 'react'
import { Lottie } from 'lottie-react'

interface BeeLoaderProps {
  title?: string
  subtitle?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function BeeLoader({
  title = 'MEL LILIAM',
  subtitle = 'Carregando...',
  size = 'lg',
}: BeeLoaderProps) {
  const [animationData, setAnimationData] = useState<unknown>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/bee.json')
        const data = await res.json()
        setAnimationData(data)
      } catch {
        setAnimationData(null)
      }
    }
    load()
  }, [])

  const sizeMap = {
    sm: { anim: 'w-16 h-16', text: 'text-lg', sub: 'text-xs' },
    md: { anim: 'w-28 h-28', text: 'text-2xl', sub: 'text-sm' },
    lg: { anim: 'w-40 h-40 md:w-48 md:h-48', text: 'text-2xl md:text-3xl', sub: 'text-sm md:text-base' },
  } as const

  const s = sizeMap[size]

  return (
    <div className="fixed inset-0 z-[100] w-screen h-screen bg-cream-50/95 backdrop-blur-sm flex items-center justify-center">
      <div className="text-center px-6">
        <div className={`${s.anim} mx-auto mb-4 drop-shadow-lg flex items-center justify-center`}>
          {animationData ? (
            <Lottie
              src={animationData as never}
              loop={true}
              autoplay={true}
              style={{ width: '100%', height: '100%' }}
            />
          ) : (
            <div className="w-full h-full" />
          )}
        </div>

        <h2 className={`font-display font-bold ${s.text} text-brown-800 mb-2 tracking-wide`}>
          {title}
        </h2>
        {subtitle && (
          <p className={`text-brown-500 ${s.sub}`}>
            {subtitle}
          </p>
        )}

        <div className="flex justify-center gap-1.5 mt-5">
          <span
            className="w-2 h-2 rounded-full bg-honey-400 animate-bounce"
            style={{ animationDelay: '0ms' }}
          />
          <span
            className="w-2 h-2 rounded-full bg-honey-500 animate-bounce"
            style={{ animationDelay: '120ms' }}
          />
          <span
            className="w-2 h-2 rounded-full bg-honey-600 animate-bounce"
            style={{ animationDelay: '240ms' }}
          />
        </div>
      </div>
    </div>
  )
}
