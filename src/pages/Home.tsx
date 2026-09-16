import { clsx } from 'clsx'
import { useEffect, useState, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  MessageCircle,
  ShoppingBag,
  Sparkles,
  Heart,
  Leaf,
  Award,
  Quote,
  Star,
  ChevronLeft,
  ChevronRight,
  UserRound,
  MessageSquareHeart,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useSiteSettings } from '@/contexts/SiteSettingsContext'
import { useProducts } from '@/contexts/ProductsContext'
import ProductCard from '@/components/ProductCard'
import { createWhatsAppLink } from '@/utils/formatters'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { useScrollY } from '@/hooks/useScrollY'
import type { Testimonial, GalleryImage } from '@/types'

export default function Home() {
  const { settings, loading: settingsLoading } = useSiteSettings()
  const { products, loading: productsLoading } = useProducts()
  const [isLoadedHero, setIsLoadedHero] = useState(false)
  const [isLoadedAbout, setIsLoadedAbout] = useState(false)
  const scrollY = useScrollY(16)

  // ============== Estados Depoimentos + Galeria ==============
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loadingTestimonials, setLoadingTestimonials] = useState(true)
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([])
  const [loadingGallery, setLoadingGallery] = useState(true)
  const [aboutGalleryImages, setAboutGalleryImages] = useState<GalleryImage[]>([])
  const [loadingAboutGallery, setLoadingAboutGallery] = useState(true)

  // Carousel Galeria História
  const [currentSlide, setCurrentSlide] = useState(0)
  const touchStartX = useRef<number>(0)
  const touchStartY = useRef<number>(0)
  const touchDeltaX = useRef<number>(0)
  const carouselPaused = useRef<boolean>(false)

  // Carousel Galeria Sobre
  const [aboutCurrentSlide, setAboutCurrentSlide] = useState(0)
  const aboutTouchStartX = useRef<number>(0)
  const aboutTouchStartY = useRef<number>(0)
  const aboutTouchDeltaX = useRef<number>(0)
  const aboutCarouselPaused = useRef<boolean>(false)

  // Carousel Depoimentos
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const testTouchStartX = useRef<number>(0)
  const testTouchStartY = useRef<number>(0)
  const testTouchDeltaX = useRef<number>(0)
  const testCarouselPaused = useRef<boolean>(false)

  const heroText = useScrollReveal<HTMLDivElement>({ threshold: 0.05, once: true, triggerOnMountIfAbove: true })
  const heroImage = useScrollReveal<HTMLDivElement>({ threshold: 0.05, once: true, triggerOnMountIfAbove: true })
  const featuredSection = useScrollReveal<HTMLElement>({ threshold: 0.1 })
  const testimonialsSection = useScrollReveal<HTMLElement>({ threshold: 0.1 })
  const galleryCarousel = useScrollReveal<HTMLDivElement>({ threshold: 0.1 })
  const aboutCarouselReveal = useScrollReveal<HTMLDivElement>({ threshold: 0.1 })
  const aboutImage = useScrollReveal<HTMLDivElement>({ threshold: 0.12 })
  const aboutText = useScrollReveal<HTMLDivElement>({ threshold: 0.12 })
  const storySection = useScrollReveal<HTMLElement>({ threshold: 0.12 })
  const ctaWhatsapp = useScrollReveal<HTMLElement>({ threshold: 0.12 })
  const finalCta = useScrollReveal<HTMLElement>({ threshold: 0.12 })

  // ============== Load Depoimentos (apenas ativos) ==============
  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        setLoadingTestimonials(true)
        const { data, error } = await supabase
          .from('testimonials')
          .select('*')
          .eq('active', true)
          .order('order_index', { ascending: true })
          .order('created_at', { ascending: false })
        if (error) throw error
        if (active) setTestimonials((data || []) as Testimonial[])
      } catch (err: any) {
        console.warn('[home] testimonials skipped:', err?.message)
        if (active) setTestimonials([])
      } finally {
        if (active) setLoadingTestimonials(false)
      }
    }
    void load()
    return () => { active = false }
  }, [])

  // ============== Load Galeria section='story' ativos ==============
  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        setLoadingGallery(true)
        const { data, error } = await supabase
          .from('gallery')
          .select('*')
          .eq('section', 'story')
          .eq('active', true)
          .order('order_index', { ascending: true })
          .order('created_at', { ascending: false })
        if (error) throw error
        if (active) setGalleryImages((data || []) as GalleryImage[])
      } catch (err: any) {
        console.warn('[home] gallery skipped:', err?.message)
        if (active) setGalleryImages([])
      } finally {
        if (active) setLoadingGallery(false)
      }
    }
    void load()
    return () => { active = false }
  }, [])

  // ============== Load Galeria section='about' ativos (Quem Somos) ==============
  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        setLoadingAboutGallery(true)
        const { data, error } = await supabase
          .from('gallery')
          .select('*')
          .eq('section', 'about')
          .eq('active', true)
          .order('order_index', { ascending: true })
          .order('created_at', { ascending: false })
        if (error) throw error
        if (active) setAboutGalleryImages((data || []) as GalleryImage[])
      } catch (err: any) {
        console.warn('[home] about gallery skipped:', err?.message)
        if (active) setAboutGalleryImages([])
      } finally {
        if (active) setLoadingAboutGallery(false)
      }
    }
    void load()
    return () => { active = false }
  }, [])

  // ============== Carousel História: Autoplay + handlers ==============
  const galleryEnabled = settings.gallery_story_enabled === 'true'
  const autoplayEnabled = settings.gallery_story_autoplay === 'true'
  const autoplayMs = Math.max(1000, Number(settings.gallery_story_interval_ms) || 4500)
  const totalSlides = galleryImages.length

  const nextSlide = useCallback(() => {
    if (totalSlides <= 1) return
    setCurrentSlide((s) => (s + 1) % totalSlides)
  }, [totalSlides])

  const prevSlide = useCallback(() => {
    if (totalSlides <= 1) return
    setCurrentSlide((s) => (s - 1 + totalSlides) % totalSlides)
  }, [totalSlides])

  // Reset slide se total de fotos mudar
  useEffect(() => {
    setCurrentSlide(0)
  }, [totalSlides])

  // Autoplay (pausa no hover, pausa durante swipe)
  useEffect(() => {
    if (!autoplayEnabled || totalSlides < 2 || !galleryEnabled) return
    const id = setInterval(() => {
      if (!carouselPaused.current) nextSlide()
    }, autoplayMs)
    return () => clearInterval(id)
  }, [autoplayEnabled, autoplayMs, totalSlides, nextSlide, galleryEnabled])

  // ============== Carousel Sobre: Autoplay + handlers ==============
  const aboutGalleryEnabled = settings.gallery_about_enabled === 'true'
  const aboutAutoplay = settings.gallery_about_autoplay === 'true'
  const aboutAutoplayMs = Math.max(1000, Number(settings.gallery_about_interval_ms) || 4500)
  const aboutTotalSlides = aboutGalleryImages.length

  const aboutNextSlide = useCallback(() => {
    if (aboutTotalSlides <= 1) return
    setAboutCurrentSlide((s) => (s + 1) % aboutTotalSlides)
  }, [aboutTotalSlides])

  const aboutPrevSlide = useCallback(() => {
    if (aboutTotalSlides <= 1) return
    setAboutCurrentSlide((s) => (s - 1 + aboutTotalSlides) % aboutTotalSlides)
  }, [aboutTotalSlides])

  useEffect(() => { setAboutCurrentSlide(0) }, [aboutTotalSlides])

  useEffect(() => {
    if (!aboutAutoplay || aboutTotalSlides < 2 || !aboutGalleryEnabled) return
    const id = setInterval(() => {
      if (!aboutCarouselPaused.current) aboutNextSlide()
    }, aboutAutoplayMs)
    return () => clearInterval(id)
  }, [aboutAutoplay, aboutAutoplayMs, aboutTotalSlides, aboutNextSlide, aboutGalleryEnabled])

  // ============== Carousel Depoimentos: Autoplay + handlers ==============
  const testEnabled = settings.testimonials_autoplay === 'true'
  const testInterval = Math.max(1500, Number(settings.testimonials_interval_ms) || 5000)
  const totalTestimonials = testimonials.length

  const nextTestimonial = useCallback(() => {
    if (totalTestimonials <= 1) return
    setCurrentTestimonial((s) => (s + 1) % totalTestimonials)
  }, [totalTestimonials])

  const prevTestimonial = useCallback(() => {
    if (totalTestimonials <= 1) return
    setCurrentTestimonial((s) => (s - 1 + totalTestimonials) % totalTestimonials)
  }, [totalTestimonials])

  useEffect(() => { setCurrentTestimonial(0) }, [totalTestimonials])

  useEffect(() => {
    if (!testEnabled || totalTestimonials < 2) return
    const id = setInterval(() => {
      if (!testCarouselPaused.current) nextTestimonial()
    }, testInterval)
    return () => clearInterval(id)
  }, [testEnabled, testInterval, totalTestimonials, nextTestimonial])

  const featuredProducts = products.filter((p) => p.is_available).slice(0, 4)

  const heroImageUrl = settings.hero_image?.startsWith('http')
    ? settings.hero_image
    : settings.hero_image
      ? `https://${settings.hero_image}`
      : ''

  const aboutImageUrl = settings.about_image?.startsWith('http')
    ? settings.about_image
    : settings.about_image
      ? `https://${settings.about_image}`
      : ''

  const hasAboutImage = !!aboutImageUrl

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-honey-50 via-cream-50 to-gold-50">
        <div className="container-page py-12 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div
              ref={heroText.ref}
              className={clsx(
                'space-y-6',
                heroText.inView ? 'reveal-fade-up' : 'reveal-hidden',
              )}
              style={{ animationDelay: heroText.inView ? '80ms' : undefined }}
            >
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-brown-900 leading-tight">
                {settings.home_title || 'Mel Artesanal, Puro e 100% Orgânico'}
              </h1>
              <p className="text-lg lg:text-xl text-brown-700 leading-relaxed max-w-lg">
                {settings.home_subtitle || 'Direto da nossa família para a sua mesa'}
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link to="/produtos" className="btn-primary">
                  <ShoppingBag className="w-5 h-5" />
                  Comprar agora
                </Link>
                <button
                  onClick={() => scrollToSection('historia')}
                  className="btn-outline"
                >
                  Conheça a história
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              {settings.whatsapp && (
                <div
                  className={clsx(
                    'flex items-center gap-2 pt-2 text-sm text-brown-600',
                    heroText.inView ? 'reveal-fade-up' : 'reveal-hidden',
                  )}
                  style={{ animationDelay: heroText.inView ? '380ms' : undefined }}
                >
                   </div>      
              )}
            </div>
            <div
              ref={heroImage.ref}
              className={clsx(
                'relative',
                heroImage.inView ? 'reveal-scale-in' : 'reveal-hidden',
              )}
              style={{ animationDelay: heroImage.inView ? '180ms' : undefined }}
            >
              <div className="absolute -inset-4 bg-gradient-to-tr from-honey-200/50 to-gold-200/50 rounded-3xl blur-2xl" />
              <div
                className="relative aspect-[16/10] rounded-3xl overflow-hidden bg-honey-100 shadow-2xl will-change-transform"
                style={{
                  transform: `translateY(${Math.min(scrollY * 0.04, 40)}px)`,
                }}
              >
                {heroImageUrl ? (
                  <>
                    {!isLoadedHero && (
                      <div className="absolute inset-0 bg-honey-100 animate-pulse" />
                    )}
                    <img
                      src={heroImageUrl}
                      alt={settings.home_title}
                      onLoad={() => setIsLoadedHero(true)}
                      loading="eager"
                      fetchPriority="high"
                      className={`w-full h-full object-cover transition-opacity duration-300 ${isLoadedHero ? 'opacity-100' : 'opacity-0'}`}
                      style={{
                        transform: `translateY(${-Math.min(scrollY * 0.06, 36)}px) scale(${1 + Math.min(scrollY / 5000, 0.05)})`,
                      }}
                    />
                  </>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-honey-100 via-cream-100 to-honey-200 animate-pulse" />
                )}
              </div>
              <div
                className={clsx(
                  'hidden sm:flex absolute -bottom-4 -left-4 card px-4 py-3 items-center gap-3 shadow-lg',
                  heroImage.inView ? 'reveal-fade-up' : 'reveal-hidden',
                )}
                style={{ animationDelay: heroImage.inView ? '520ms' : undefined }}
              >
                <div className="w-10 h-10 rounded-full bg-honey-100 flex items-center justify-center">
                  <Leaf className="w-5 h-5 text-honey-700" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-brown-900">Natural</p>
                  <p className="text-xs text-brown-500">100% orgânico,<br /> sem conservantes</p>
                </div>
              </div>
              <div
                className={clsx(
                  'hidden sm:flex absolute -top-4 -right-4 card px-4 py-3 items-center gap-3 shadow-lg',
                  heroImage.inView ? 'reveal-fade-up' : 'reveal-hidden',
                )}
                style={{ animationDelay: heroImage.inView ? '650ms' : undefined }}
              >
                <div className="w-10 h-10 rounded-full bg-honey-100 flex items-center justify-center">
                  <Award className="w-5 h-5 text-honey-700" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-brown-900">Qualidade</p>
                  <p className="text-xs text-brown-500">Premium</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        ref={featuredSection.ref as any}
        className="py-16 lg:py-20 container-page"
      >
        <div
          className={clsx(
            'flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10',
            featuredSection.inView ? 'reveal-fade-up' : 'reveal-hidden',
          )}
          style={{ animationDelay: featuredSection.inView ? '60ms' : undefined }}
        >
          <div>
            <span className="text-honey-700 font-semibold text-sm uppercase tracking-wider">
              Selecionados para você
            </span>
            <h2 className="font-display text-3xl lg:text-4xl font-bold mt-2">
              Produtos em destaque
            </h2>
          </div>
          <Link to="/produtos" className="text-honey-700 font-semibold hover:underline inline-flex items-center gap-1 self-start sm:self-auto">
            Ver todos
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {productsLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="aspect-square bg-cream-200" />
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-cream-200 rounded w-3/4" />
                  <div className="h-4 bg-cream-200 rounded w-1/2" />
                  <div className="h-7 bg-cream-200 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : featuredProducts.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {featuredProducts.map((product, i) => (
              <div
                key={product.id}
                className={clsx(featuredSection.inView ? 'reveal-fade-up' : 'reveal-hidden')}
                style={{
                  animationDelay: featuredSection.inView
                    ? `${140 + i * 110}ms`
                    : undefined,
                }}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        ) : (
          <div
            className={clsx('card p-12 text-center', featuredSection.inView ? 'reveal-fade-up' : 'reveal-hidden')}
          >
            <ShoppingBag className="w-12 h-12 mx-auto text-cream-300 mb-4" />
            <p className="text-brown-500">Nenhum produto disponível no momento.</p>
          </div>
        )}
      </section>

      {/* ================== SEÇÃO DEPOIMENTOS (CAROUSEL) ================== */}
      {settings.testimonials_enabled === 'true' && !settingsLoading && (testimonials.length > 0 || !loadingTestimonials) && (
        <section
          ref={testimonialsSection.ref as any}
          className="py-16 lg:py-20 bg-gradient-to-br from-cream-100 via-honey-50 to-cream-100"
        >
          <div className="container-page">
            {(testimonials.length > 0 || loadingTestimonials) && (
              <>
                <div
                  className={clsx(
                    'text-center max-w-2xl mx-auto mb-10 lg:mb-14',
                    testimonialsSection.inView ? 'reveal-fade-up' : 'reveal-hidden',
                  )}
                >
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-honey-200/70 text-honey-800 mb-4">
                    <MessageSquareHeart size={14} />
                    <span className="font-semibold uppercase tracking-wider text-xs">Quem já provou, recomenda</span>
                  </div>
                  <h2 className="font-display text-3xl lg:text-4xl font-bold text-brown-900 mb-3">
                    {settings.testimonials_title !== undefined && settings.testimonials_title !== null && settings.testimonials_title !== ''
                      ? settings.testimonials_title
                      : 'O que nossos clientes dizem'}
                  </h2>
                  {(settings.testimonials_subtitle !== undefined && settings.testimonials_subtitle !== null && settings.testimonials_subtitle !== '') && (
                    <p className="text-brown-600 text-base lg:text-lg leading-relaxed">
                      {settings.testimonials_subtitle}
                    </p>
                  )}
                </div>

                {loadingTestimonials ? (
                  <div className="grid grid-cols-1 gap-5 max-w-3xl mx-auto">
                    {[0,1,2].map((i) => (
                      <div key={i} className="card p-6 space-y-4 animate-pulse">
                        <div className="h-8 w-8 bg-cream-200 rounded" />
                        <div className="h-14 w-14 bg-cream-200 rounded-full" />
                        <div className="space-y-2">
                          <div className="h-4 bg-cream-200 rounded w-1/3" />
                          <div className="h-3 bg-cream-200 rounded w-1/2" />
                          <div className="h-3 bg-cream-200 rounded w-full" />
                          <div className="h-3 bg-cream-200 rounded w-5/6" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : testimonials.length > 0 ? (
                  <div
                    className="relative group"
                    onMouseEnter={() => { testCarouselPaused.current = true }}
                    onMouseLeave={() => { testCarouselPaused.current = false }}
                    onTouchStart={() => { testCarouselPaused.current = true }}
                  >
                    {/* Botão anterior (sempre visível mobile, hover desktop) */}
                    <button
                      type="button"
                      onClick={prevTestimonial}
                      aria-label="Depoimento anterior"
                      className={clsx(
                        'absolute left-0 md:left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full bg-cream-50/95 backdrop-blur border border-cream-200 text-brown-700 shadow-lg hover:bg-white flex items-center justify-center transition-opacity',
                        totalTestimonials > 1
                          ? 'opacity-100 md:opacity-0 md:group-hover:opacity-100'
                          : 'opacity-0 pointer-events-none',
                      )}
                    >
                      <ChevronLeft size={20} />
                    </button>
                    {/* Botão próximo */}
                    <button
                      type="button"
                      onClick={nextTestimonial}
                      aria-label="Próximo depoimento"
                      className={clsx(
                        'absolute right-0 md:right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full bg-cream-50/95 backdrop-blur border border-cream-200 text-brown-700 shadow-lg hover:bg-white flex items-center justify-center transition-opacity',
                        totalTestimonials > 1
                          ? 'opacity-100 md:opacity-0 md:group-hover:opacity-100'
                          : 'opacity-0 pointer-events-none',
                      )}
                    >
                      <ChevronRight size={20} />
                    </button>

                    {/* Container swipe */}
                    <div
                      className={clsx(
                        'max-w-3xl mx-auto overflow-hidden rounded-2xl',
                        testimonialsSection.inView ? 'reveal-fade-up' : 'reveal-hidden',
                      )}
                      style={{ animationDelay: testimonialsSection.inView ? '160ms' : undefined }}
                      onTouchStart={(e) => {
                        const t = e.touches[0]
                        testTouchStartX.current = t.clientX
                        testTouchStartY.current = t.clientY
                        testTouchDeltaX.current = 0
                      }}
                      onTouchMove={(e) => {
                        const t = e.touches[0]
                        testTouchDeltaX.current = t.clientX - testTouchStartX.current
                      }}
                      onTouchEnd={(e) => {
                        const dx = testTouchDeltaX.current
                        const tEnd = e.changedTouches[0]
                        const dy = Math.abs(tEnd.clientY - testTouchStartY.current)
                        if (Math.abs(dx) > 50 && Math.abs(dx) > dy) {
                          if (dx < 0) nextTestimonial()
                          else prevTestimonial()
                        }
                        testCarouselPaused.current = false
                      }}
                    >
                      <div
                        className="flex transition-transform duration-700 ease-out"
                        style={{ transform: `translateX(-${currentTestimonial * 100}%)` }}
                      >
                        {testimonials.map((t) => (
                          <article
                            key={t.id}
                            className="w-full flex-shrink-0 p-4 sm:p-6"
                          >
                            <div className="card p-6 sm:p-8 relative overflow-hidden h-full">
                              <Quote
                                size={36}
                                className="absolute top-5 left-5 text-honey-300 opacity-80 -z-0"
                                strokeWidth={1.5}
                              />

                              <div className="relative z-10 space-y-5 pt-2">
                                <div className="flex items-center gap-4">
                                  <div className="w-14 h-14 rounded-full overflow-hidden bg-cream-200 border-2 border-honey-200 flex-shrink-0 flex items-center justify-center text-brown-400">
                                    {t.photo_url ? (
                                      <img src={t.photo_url} alt={t.name} className="w-full h-full object-cover" />
                                    ) : (
                                      <UserRound size={26} />
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <h3 className="font-display font-bold text-lg sm:text-xl text-brown-900 leading-tight truncate">
                                      {t.name}
                                    </h3>
                                    {t.role && (
                                      <p className="text-sm text-brown-500 truncate">{t.role}</p>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-0.5" aria-label={`Nota ${t.rating} de 5`}>
                                  {[1,2,3,4,5].map((n) => (
                                    <Star
                                      key={n}
                                      size={18}
                                      className={
                                        n <= t.rating
                                          ? 'text-honey-500 fill-honey-500'
                                          : 'text-brown-200'
                                      }
                                    />
                                  ))}
                                </div>

                                <p className="text-brown-700 text-[15px] sm:text-base leading-relaxed whitespace-pre-wrap">
                                  "{t.text}"
                                </p>
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                    </div>

                    {/* Dots */}
                    {totalTestimonials > 1 && (
                      <div className="flex items-center justify-center gap-2 pt-6">
                        {testimonials.map((_, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setCurrentTestimonial(i)}
                            aria-label={`Ir para depoimento ${i + 1}`}
                            className={clsx(
                              'h-2 rounded-full transition-all duration-300',
                              i === currentTestimonial
                                ? 'w-6 bg-honey-500'
                                : 'w-2 bg-cream-300 hover:bg-cream-400',
                            )}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ) : null}
              </>
            )}
          </div>
        </section>
      )}

      <section className="bg-brown-900 text-cream-100 py-16 lg:py-20">
        <div className={`container-page gap-12 items-center ${(hasAboutImage || (aboutGalleryEnabled && !loadingAboutGallery && aboutTotalSlides > 0)) ? 'grid lg:grid-cols-2' : 'max-w-3xl mx-auto'}`}>
          {(hasAboutImage || (aboutGalleryEnabled && !loadingAboutGallery && aboutTotalSlides > 0)) && (
            <div
              ref={aboutCarouselReveal.ref as any}
              className={clsx(
                'order-1 lg:order-1 mb-8 lg:mb-0',
                aboutCarouselReveal.inView ? 'reveal-scale-in' : 'reveal-hidden',
              )}
              style={{ animationDelay: aboutCarouselReveal.inView ? '100ms' : undefined }}
            >
              {/* Caso haja galeria Sobre ativa e fotos: mostra CAROUSEL */}
              {aboutGalleryEnabled && !loadingAboutGallery && aboutTotalSlides > 0 ? (
                <div
                  className="relative"
                  onMouseEnter={() => { aboutCarouselPaused.current = true }}
                  onMouseLeave={() => { aboutCarouselPaused.current = false }}
                  onTouchStart={() => { aboutCarouselPaused.current = true }}
                >
                  <div
                    className="aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl relative bg-honey-100"
                    onTouchStart={(e) => {
                      const t = e.touches[0]
                      aboutTouchStartX.current = t.clientX
                      aboutTouchStartY.current = t.clientY
                      aboutTouchDeltaX.current = 0
                    }}
                    onTouchMove={(e) => {
                      const t = e.touches[0]
                      aboutTouchDeltaX.current = t.clientX - aboutTouchStartX.current
                    }}
                    onTouchEnd={(e) => {
                      const dx = aboutTouchDeltaX.current
                      const tEnd = e.changedTouches[0]
                      const dy = Math.abs(tEnd.clientY - aboutTouchStartY.current)
                      if (Math.abs(dx) > 50 && Math.abs(dx) > dy) {
                        if (dx < 0) aboutNextSlide()
                        else aboutPrevSlide()
                      }
                      aboutCarouselPaused.current = false
                    }}
                  >
                    <div
                      className="flex h-full transition-transform duration-700 ease-out"
                      style={{ transform: `translateX(-${aboutCurrentSlide * 100}%)` }}
                    >
                      {aboutGalleryImages.map((g, i) => (
                        <div key={g.id} className="relative w-full h-full flex-shrink-0">
                          {!isLoadedAbout && i === 0 && (
                            <div className="absolute inset-0 bg-honey-100 animate-pulse z-10" />
                          )}
                          <img
                            src={g.image_url}
                            alt={g.title || 'Sobre a empresa'}
                            onLoad={() => setIsLoadedAbout(true)}
                            loading="eager"
                            fetchPriority="high"
                            className="w-full h-full object-cover transition-opacity duration-300 opacity-100"
                          />
                          {(g.title || g.description) && (
                            <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 bg-gradient-to-t from-black/70 via-black/30 to-transparent text-left pointer-events-none">
                              {g.title && (
                                <h4 className="font-display font-bold text-white text-lg leading-tight">
                                  {g.title}
                                </h4>
                              )}
                              {g.description && (
                                <p className="text-white/90 text-sm mt-1 leading-snug max-w-2xl">
                                  {g.description}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dots */}
                  {aboutTotalSlides > 1 && (
                    <div className="flex items-center justify-center gap-2 pt-4">
                      {aboutGalleryImages.map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setAboutCurrentSlide(i)}
                          aria-label={`Ir para foto ${i + 1}`}
                          className={clsx(
                            'h-2 rounded-full transition-all duration-300',
                            i === aboutCurrentSlide
                              ? 'w-6 bg-honey-400'
                              : 'w-2 bg-cream-300/40 hover:bg-cream-200/50',
                          )}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : hasAboutImage ? (
                <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl relative bg-honey-100">
                  {!isLoadedAbout && (
                    <div className="absolute inset-0 bg-honey-100 animate-pulse" />
                  )}
                  <img
                    src={aboutImageUrl}
                    alt="Sobre a empresa"
                    onLoad={() => setIsLoadedAbout(true)}
                    loading="eager"
                    fetchPriority="high"
                    className={`w-full h-full object-cover transition-opacity duration-300 ${isLoadedAbout ? 'opacity-100' : 'opacity-0'}`}
                  />
                </div>
              ) : null}
            </div>
          )}
          <div
            ref={aboutText.ref}
            className={clsx(
              `space-y-4 ${hasAboutImage ? 'order-2 lg:order-2' : ''}`,
              aboutText.inView ? 'reveal-fade-up' : 'reveal-hidden',
            )}
            style={{ animationDelay: aboutText.inView ? '180ms' : undefined }}
          >
            <span className="text-honey-400 font-semibold text-sm uppercase tracking-wider">
              Quem somos
            </span>
            <h2 className="font-display text-3xl lg:text-4xl font-bold text-cream-50">
              Apresentação da empresa
            </h2>
            <div className="space-y-4 text-cream-300 leading-relaxed text-base lg:text-lg whitespace-pre-wrap">
              {settings.home_about ? (
                settings.home_about
              ) : (
                <span className="text-cream-400 italic">
                  [Edite este texto no painel administrativo] A MEL LILIAM é uma pequena empresa familiar com produção artesanal de mel.
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-4 pt-6">
              {[
                { icon: Heart, label: 'Feito com amor', delay: 0 },
                { icon: Leaf, label: '100% Natural', delay: 1 },
                { icon: Award, label: 'Qualidade garantida', delay: 2 },
              ].map(({ icon: Icon, label, delay }) => (
                <div
                  key={label}
                  className={clsx(
                    'flex flex-col items-center text-center p-4 bg-brown-800 rounded-xl',
                    aboutText.inView ? 'reveal-fade-up' : 'reveal-hidden',
                  )}
                  style={{
                    animationDelay: aboutText.inView ? `${360 + delay * 120}ms` : undefined,
                  }}
                >
                  <Icon className="w-7 h-7 text-honey-400 mb-2" />
                  <p className="font-semibold text-sm text-cream-50">{label}</p>
                </div>
              ))}
            </div>
          </div>
          {!hasAboutImage && (
            <div className="mt-10 aspect-[4/3] max-w-md mx-auto rounded-2xl overflow-hidden border-4 border-brown-700 shadow-2xl bg-gradient-to-br from-honey-100 via-cream-100 to-honey-200 animate-pulse" />
          )}
        </div>
      </section>

      <section
        ref={storySection.ref as any}
        id="historia"
        className="py-16 lg:py-20 container-page scroll-mt-20"
      >
        <div
          className={clsx(
            'max-w-4xl mx-auto text-center space-y-6',
            storySection.inView ? 'reveal-fade-up' : 'reveal-hidden',
          )}
        >
          <span className="text-honey-700 font-semibold text-sm uppercase tracking-wider inline-block">
            Nossa trajetória
          </span>
          <h2 className="font-display text-3xl lg:text-4xl font-bold">
            Nossa história
          </h2>
          <div className="relative">
            <div className="absolute left-1/2 -translate-x-1/2 -top-2 w-20 h-1 bg-gradient-to-r from-transparent via-honey-500 to-transparent" />
          </div>
          <div className="card p-8 lg:p-12 text-left space-y-4 text-brown-700 leading-relaxed text-base lg:text-lg whitespace-pre-wrap">
            {settings.home_story ? (
              settings.home_story
            ) : (
              <p className="text-brown-400 italic text-center">
                [Edite este texto no painel administrativo] Conte aqui a história da sua empresa, como tudo começou, os valores, missão e visão.
              </p>
            )}
          </div>

          {/* ========== GALERIA CAROUSEL HISTÓRIA ========== */}
          {galleryEnabled && !settingsLoading && !loadingGallery && totalSlides > 0 && (
            <div
              ref={galleryCarousel.ref}
              className={clsx(
                'mt-6 lg:mt-10',
                galleryCarousel.inView ? 'reveal-fade-up' : 'reveal-hidden',
              )}
              style={{ animationDelay: galleryCarousel.inView ? '120ms' : undefined }}
            >
              <div
                className="group relative rounded-2xl overflow-hidden shadow-xl border border-cream-200 bg-brown-900"
                onMouseEnter={() => { carouselPaused.current = true }}
                onMouseLeave={() => { carouselPaused.current = false }}
                onTouchStart={(e) => {
                  const t = e.touches[0]
                  touchStartX.current = t.clientX
                  touchStartY.current = t.clientY
                  touchDeltaX.current = 0
                  carouselPaused.current = true
                }}
                onTouchMove={(e) => {
                  const t = e.touches[0]
                  touchDeltaX.current = t.clientX - touchStartX.current
                }}
                onTouchEnd={(e) => {
                  const dx = touchDeltaX.current
                  const tEnd = e.changedTouches[0]
                  const dy = Math.abs(tEnd.clientY - touchStartY.current)
                  if (Math.abs(dx) > 50 && Math.abs(dx) > dy) {
                    if (dx < 0) nextSlide()
                    else prevSlide()
                  }
                  carouselPaused.current = false
                }}
              >
                {/* Slides container */}
                <div
                  className="relative w-full"
                  style={{ aspectRatio: totalSlides > 0 ? '21 / 9' : undefined }}
                >
                  {loadingGallery ? (
                    <div className="absolute inset-0 bg-cream-200 animate-pulse" />
                  ) : galleryImages.length === 1 ? (
                    <div className="absolute inset-0">
                      <img
                        src={galleryImages[0].image_url}
                        alt={galleryImages[0].title || 'Foto da galeria'}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {(galleryImages[0].title || galleryImages[0].description) && (
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent pt-16 pb-4 px-5 text-left">
                          {galleryImages[0].title && (
                            <h4 className="font-display font-bold text-lg text-white mb-1">
                              {galleryImages[0].title}
                            </h4>
                          )}
                          {galleryImages[0].description && (
                            <p className="text-white/90 text-sm leading-relaxed">
                              {galleryImages[0].description}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* Slides com translate horizontal */}
                      <div className="absolute inset-0 flex transition-transform duration-700 ease-out will-change-transform"
                        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                      >
                        {galleryImages.map((g) => (
                          <div key={g.id} className="relative flex-shrink-0 w-full h-full">
                            <img
                              src={g.image_url}
                              alt={g.title || 'Foto da galeria'}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              draggable={false}
                            />
                            {(g.title || g.description) && (
                              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/55 to-transparent pt-20 pb-5 px-6 lg:px-8 text-left select-none">
                                {g.title && (
                                  <h4 className="font-display font-bold text-lg lg:text-xl text-white mb-1.5 leading-tight">
                                    {g.title}
                                  </h4>
                                )}
                                {g.description && (
                                  <p className="text-white/90 text-sm lg:text-[15px] leading-relaxed max-w-3xl">
                                    {g.description}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Dots clicáveis */}
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
                        {galleryImages.map((_, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setCurrentSlide(idx)}
                            aria-label={`Ir para foto ${idx + 1}`}
                            className={clsx(
                              'rounded-full transition-all duration-300',
                              idx === currentSlide
                                ? 'w-6 h-2 bg-honey-400 shadow-md'
                                : 'w-2 h-2 bg-white/60 hover:bg-white/90',
                            )}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section
        ref={ctaWhatsapp.ref as any}
        className="bg-gradient-to-br from-green-50 to-honey-50 py-16 lg:py-20"
      >
        <div className="container-page">
          <div
            className={clsx(
              'max-w-4xl mx-auto card p-8 lg:p-12 bg-white relative overflow-hidden',
              ctaWhatsapp.inView ? 'reveal-scale-in' : 'reveal-hidden',
            )}
          >
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-green-100 blur-3xl opacity-60" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-honey-100 blur-3xl opacity-60" />
            <div className="relative grid md:grid-cols-[1fr_auto] gap-6 items-center">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 badge bg-green-100 text-green-800">
                  <MessageCircle className="w-3.5 h-3.5" />
                  Atendimento exclusivo
                </div>
                <h2 className="font-display text-3xl lg:text-4xl font-bold text-brown-900">
                  Fale direto com a gente
                </h2>
                <p className="text-brown-600 text-lg leading-relaxed">
                  {settings.home_cta || 'Tire suas dúvidas, faça um pedido personalizado ou conheça mais sobre nossos produtos pelo WhatsApp. Experimente o sabor autêntico do mel de verdade, entregue com cuidado e carinho.'}
                </p>
              </div>
              <div className="flex flex-col gap-3 md:items-end">
                {settings.whatsapp ? (
                  <a
                    href={createWhatsAppLink(
                      settings.whatsapp,
                      `Olá! Vim do site ${settings.company_name} e gostaria de mais informações.`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-whatsapp text-base !py-4 !px-8 shadow-lg hover:shadow-xl whitespace-nowrap"
                  >
                    <MessageCircle className="w-6 h-6" />
                    Conversar no WhatsApp
                  </a>
                ) : (
                  <div className="badge bg-cream-200 text-brown-600 self-start">
                    Configure o WhatsApp no painel
                  </div>
                )}
                <Link to="/produtos" className="btn-primary text-base !py-4 !px-8 shadow-lg hover:shadow-xl">
                  <ShoppingBag className="w-5 h-5" />
                  Comprar agora
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
